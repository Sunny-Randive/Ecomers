package com.ecom.inventoryservice.messaging;

import com.ecom.common.event.OrderCancelledEvent;
import com.ecom.common.event.OrderCreatedEvent;
import com.ecom.common.event.PaymentCompletedEvent;
import com.ecom.common.event.PaymentFailedEvent;
import com.ecom.common.event.StockReservationFailedEvent;
import com.ecom.common.event.StockReservedEvent;
import com.ecom.inventoryservice.dto.StockReservationRequest;
import com.ecom.inventoryservice.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryEventListener {

    private final InventoryService inventoryService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @KafkaListener(topics = "order-created-topic", groupId = "inventory-group")
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("Received OrderCreatedEvent for order {}", event.getOrderId());
        try {
            // Map items
            List<StockReservationRequest.ReservationItem> reservationItems = event.getItems().stream()
                    .map(item -> StockReservationRequest.ReservationItem.builder()
                            .productId(item.getProductId())
                            .quantity(item.getQuantity())
                            .build())
                    .collect(Collectors.toList());

            StockReservationRequest request = StockReservationRequest.builder()
                    .orderId(event.getOrderId())
                    .items(reservationItems)
                    .build();

            // Perform stock reservation
            inventoryService.reserveStock(request);

            // Publish success event
            StockReservedEvent reservedEvent = StockReservedEvent.builder()
                    .orderId(event.getOrderId())
                    .userId(event.getUserId())
                    .build();
            kafkaTemplate.send("stock-reserved-topic", event.getOrderId().toString(), reservedEvent);
            log.info("Published StockReservedEvent for order {}", event.getOrderId());

        } catch (Exception e) {
            log.error("Failed to reserve stock for order {}: {}", event.getOrderId(), e.getMessage());
            
            // Publish failure event to trigger compensation rollback
            StockReservationFailedEvent failedEvent = StockReservationFailedEvent.builder()
                    .orderId(event.getOrderId())
                    .reason(e.getMessage())
                    .build();
            kafkaTemplate.send("stock-failed-topic", event.getOrderId().toString(), failedEvent);
            log.info("Published StockReservationFailedEvent for order {}", event.getOrderId());
        }
    }

    @KafkaListener(topics = "payment-completed-topic", groupId = "inventory-group")
    public void handlePaymentCompleted(PaymentCompletedEvent event) {
        log.info("Received PaymentCompletedEvent. Finalizing inventory for order {}", event.getOrderId());
        inventoryService.confirmReservation(event.getOrderId());
    }

    @KafkaListener(topics = "payment-failed-topic", groupId = "inventory-group")
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.info("Received PaymentFailedEvent. Releasing stock for order {}", event.getOrderId());
        inventoryService.releaseReservation(event.getOrderId());
    }

    @KafkaListener(topics = "order-cancelled-topic", groupId = "inventory-group")
    public void handleOrderCancelled(OrderCancelledEvent event) {
        log.info("Received OrderCancelledEvent. Releasing stock for order {}", event.getOrderId());
        inventoryService.releaseReservation(event.getOrderId());
    }
}
