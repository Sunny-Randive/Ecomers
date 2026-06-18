package com.ecom.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponseDto {
    private UUID id;
    private UUID userId;
    private BigDecimal totalAmount;
    private String status;
    private List<OrderItemResponseDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime deliveredAt;


    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponseDto {
        private UUID id;
        private UUID productId;
        private Integer quantity;
        private BigDecimal price;
    }
}
