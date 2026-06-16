package com.ecom.inventoryservice.controller;

import com.ecom.inventoryservice.domain.model.Inventory;
import com.ecom.inventoryservice.dto.StockReservationRequest;
import com.ecom.inventoryservice.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/{productId}")
    public ResponseEntity<Inventory> getInventory(@PathVariable("productId") UUID productId) {
        return ResponseEntity.ok(inventoryService.getInventory(productId));
    }

    @PutMapping("/{productId}")
    public ResponseEntity<Inventory> updateInventory(
            @PathVariable("productId") UUID productId,
            @RequestParam("quantity") Integer quantity) {
        return ResponseEntity.ok(inventoryService.updateInventory(productId, quantity));
    }

    @PostMapping("/reserve")
    public ResponseEntity<String> reserveStock(@Valid @RequestBody StockReservationRequest request) {
        inventoryService.reserveStock(request);
        return ResponseEntity.ok("Stock reserved successfully");
    }

    @PostMapping("/confirm/{orderId}")
    public ResponseEntity<String> confirmReservation(@PathVariable("orderId") UUID orderId) {
        inventoryService.confirmReservation(orderId);
        return ResponseEntity.ok("Stock reservation confirmed successfully");
    }

    @PostMapping("/release/{orderId}")
    public ResponseEntity<String> releaseReservation(@PathVariable("orderId") UUID orderId) {
        inventoryService.releaseReservation(orderId);
        return ResponseEntity.ok("Stock reservation released successfully");
    }
}
