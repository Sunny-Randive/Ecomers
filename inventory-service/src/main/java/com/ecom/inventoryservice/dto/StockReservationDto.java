package com.ecom.inventoryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReservationDto {
    private UUID id;
    private UUID orderId;
    private UUID productId;
    private Integer quantity;
    private String status;
}
