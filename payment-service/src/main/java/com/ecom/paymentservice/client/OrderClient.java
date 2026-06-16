package com.ecom.paymentservice.client;

import com.ecom.paymentservice.dto.client.OrderDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@FeignClient(name = "order-service")
public interface OrderClient {

    @GetMapping("/api/v1/orders/{id}")
    OrderDto getOrderById(@PathVariable("id") UUID id, @RequestHeader("X-User-Id") String userId);
}
