package com.ecom.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {
    private UUID id;
    private UUID userId;

    @NotBlank(message = "Street is required")
    @Size(max = 100)
    private String street;

    @NotBlank(message = "City is required")
    @Size(max = 50)
    private String city;

    @NotBlank(message = "State is required")
    @Size(max = 50)
    private String state;

    @NotBlank(message = "Zip code is required")
    @Size(max = 20)
    private String zipCode;

    @NotBlank(message = "Country is required")
    @Size(max = 50)
    private String country;

    private boolean isDefault;
}
