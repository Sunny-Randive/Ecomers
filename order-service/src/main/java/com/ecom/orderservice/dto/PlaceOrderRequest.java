package com.ecom.orderservice.dto;

import jakarta.validation.constraints.NotBlank;
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
public class PlaceOrderRequest {
    @NotNull(message = "Shipping address ID is required")
    private UUID shippingAddressId;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;
}
