package com.ecom.orderservice.controller;

import com.ecom.orderservice.dto.OrderResponseDto;
import com.ecom.orderservice.dto.PlaceOrderRequest;
import com.ecom.orderservice.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public ResponseEntity<OrderResponseDto> checkout(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody PlaceOrderRequest request) {
        return ResponseEntity.ok(orderService.checkout(UUID.fromString(userId), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDto> getOrderDetails(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable("id") UUID orderId) {
        return ResponseEntity.ok(orderService.getOrderDetails(UUID.fromString(userId), orderId));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponseDto>> getUserOrders(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(orderService.getUserOrders(UUID.fromString(userId)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderResponseDto> cancelOrder(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable("id") UUID orderId) {
        return ResponseEntity.ok(orderService.cancelOrder(UUID.fromString(userId), orderId));
    }
}
