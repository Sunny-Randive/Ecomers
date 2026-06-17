package com.ecom.productservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private UUID id;
    private UUID productId;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    private boolean isPrimary;
}
