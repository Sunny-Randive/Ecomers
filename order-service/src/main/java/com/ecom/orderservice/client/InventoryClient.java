package com.ecom.orderservice.client;

import com.ecom.orderservice.dto.client.InventoryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "inventory-service")
public interface InventoryClient {

    @GetMapping("/api/v1/inventory/{productId}")
    InventoryDto getInventoryByProductId(@PathVariable("productId") UUID productId);
}
