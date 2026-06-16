package com.ecom.userservice.dto;

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
public class UserPreferencesDto {
    private UUID userId;

    @Size(max = 10)
    private String preferredCurrency;

    @Size(max = 10)
    private String preferredLanguage;
}
