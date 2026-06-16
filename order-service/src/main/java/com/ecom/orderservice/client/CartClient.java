package com.ecom.orderservice.client;

import com.ecom.orderservice.dto.client.CartDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "cart-service")
public interface CartClient {

    @GetMapping("/api/v1/cart")
    CartDto getCart(@RequestHeader("X-User-Id") String userId);

    @DeleteMapping("/api/v1/cart/clear")
    String clearCart(@RequestHeader("X-User-Id") String userId);
}
