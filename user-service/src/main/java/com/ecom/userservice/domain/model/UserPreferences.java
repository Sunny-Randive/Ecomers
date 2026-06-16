package com.ecom.userservice.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "user_preferences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferences {
    @Id
    private UUID userId;

    @Column(name = "preferred_currency", length = 10)
    @Builder.Default
    private String preferredCurrency = "USD";

    @Column(name = "preferred_language", length = 10)
    @Builder.Default
    private String preferredLanguage = "en";
}
