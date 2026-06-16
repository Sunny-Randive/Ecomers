package com.ecom.cartservice.controller;

import com.ecom.cartservice.dto.CartDto;
import com.ecom.cartservice.dto.CartItemDto;
import com.ecom.cartservice.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartDto> getCart(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(cartService.getCart(UUID.fromString(userId)));
    }

    @PostMapping
    public ResponseEntity<CartDto> addItemToCart(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CartItemDto dto) {
        return ResponseEntity.ok(cartService.addItemToCart(UUID.fromString(userId), dto));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<CartDto> updateItemQuantity(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable("itemId") UUID itemId,
            @RequestParam("quantity") Integer quantity) {
        return ResponseEntity.ok(cartService.updateQuantity(UUID.fromString(userId), itemId, quantity));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<CartDto> removeItemFromCart(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable("itemId") UUID itemId) {
        return ResponseEntity.ok(cartService.removeItemFromCart(UUID.fromString(userId), itemId));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<String> clearCart(@RequestHeader("X-User-Id") String userId) {
        cartService.clearCart(UUID.fromString(userId));
        return ResponseEntity.ok("Cart cleared successfully");
    }
}
