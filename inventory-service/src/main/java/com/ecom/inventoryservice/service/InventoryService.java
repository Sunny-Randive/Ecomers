package com.ecom.inventoryservice.service;

import com.ecom.inventoryservice.domain.model.Inventory;
import com.ecom.inventoryservice.domain.model.StockReservation;
import com.ecom.inventoryservice.dto.StockReservationRequest;
import com.ecom.inventoryservice.repository.InventoryRepository;
import com.ecom.inventoryservice.repository.StockReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final StockReservationRepository stockReservationRepository;

    @Transactional(readOnly = true)
    public Inventory getInventory(UUID productId) {
        return inventoryRepository.findById(productId)
                .orElseGet(() -> inventoryRepository.save(
                        Inventory.builder()
                                .productId(productId)
                                .availableQuantity(0)
                                .reservedQuantity(0)
                                .build()
                ));
    }

    @Transactional
    public Inventory updateInventory(UUID productId, Integer availableQuantity) {
        Inventory inventory = getInventory(productId);
        inventory.setAvailableQuantity(availableQuantity);
        return inventoryRepository.save(inventory);
    }

    @Transactional
    public void reserveStock(StockReservationRequest request) {
        log.info("Processing stock reservation for order {}", request.getOrderId());
        
        // First check availability for all items to ensure atomic commit (all or nothing)
        for (StockReservationRequest.ReservationItem item : request.getItems()) {
            Inventory inventory = inventoryRepository.findByProductIdWithWriteLock(item.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product inventory not initialized: " + item.getProductId()));
            
            if (inventory.getAvailableQuantity() < item.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for product: " + item.getProductId() 
                        + ". Requested: " + item.getQuantity() + ", Available: " + inventory.getAvailableQuantity());
            }
        }

        // Apply reservations
        for (StockReservationRequest.ReservationItem item : request.getItems()) {
            Inventory inventory = inventoryRepository.findByProductIdWithWriteLock(item.getProductId()).get();
            
            // Adjust quantities
            inventory.setAvailableQuantity(inventory.getAvailableQuantity() - item.getQuantity());
            inventory.setReservedQuantity(inventory.getReservedQuantity() + item.getQuantity());
            inventoryRepository.save(inventory);

            // Record reservation
            StockReservation reservation = StockReservation.builder()
                    .orderId(request.getOrderId())
                    .productId(item.getProductId())
                    .quantity(item.getQuantity())
                    .status("PENDING")
                    .build();
            stockReservationRepository.save(reservation);
        }
        
        log.info("Successfully reserved stock for order {}", request.getOrderId());
    }

    @Transactional
    public void confirmReservation(UUID orderId) {
        log.info("Confirming stock reservation for order {}", orderId);
        List<StockReservation> reservations = stockReservationRepository.findByOrderIdAndStatus(orderId, "PENDING");
        
        if (reservations.isEmpty()) {
            log.warn("No pending stock reservations found for order {}", orderId);
            return;
        }

        for (StockReservation reservation : reservations) {
            Inventory inventory = inventoryRepository.findByProductIdWithWriteLock(reservation.getProductId())
                    .orElseThrow(() -> new IllegalStateException("Inventory missing during confirmation for product: " + reservation.getProductId()));

            // Subtract from reserved pool since order is completed
            inventory.setReservedQuantity(inventory.getReservedQuantity() - reservation.getQuantity());
            inventoryRepository.save(inventory);

            reservation.setStatus("CONFIRMED");
            stockReservationRepository.save(reservation);
        }
        log.info("Confirmed reservations for order {}", orderId);
    }

    @Transactional
    public void releaseReservation(UUID orderId) {
        log.info("Releasing stock reservation for order {}", orderId);
        List<StockReservation> reservations = stockReservationRepository.findByOrderIdAndStatus(orderId, "PENDING");

        if (reservations.isEmpty()) {
            log.warn("No pending stock reservations found to release for order {}", orderId);
            return;
        }

        for (StockReservation reservation : reservations) {
            Inventory inventory = inventoryRepository.findByProductIdWithWriteLock(reservation.getProductId())
                    .orElseThrow(() -> new IllegalStateException("Inventory missing during release for product: " + reservation.getProductId()));

            // Return reserved quantity back to available pool
            inventory.setAvailableQuantity(inventory.getAvailableQuantity() + reservation.getQuantity());
            inventory.setReservedQuantity(inventory.getReservedQuantity() - reservation.getQuantity());
            inventoryRepository.save(inventory);

            reservation.setStatus("RELEASED");
            stockReservationRepository.save(reservation);
        }
        log.info("Released reservations for order {}", orderId);
    }
}
