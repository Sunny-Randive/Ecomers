package com.ecom.inventoryservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryDto {
    @NotNull(message = "Product ID is required")
    private UUID productId;

    @NotNull(message = "Available quantity is required")
    @Min(value = 0, message = "Available quantity must be greater than or equal to 0")
    private Integer availableQuantity;

    private Integer reservedQuantity;
}
