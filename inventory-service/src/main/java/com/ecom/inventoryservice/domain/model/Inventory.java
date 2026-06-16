package com.ecom.inventoryservice.domain.model;

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
@Table(name = "inventories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Inventory {
    @Id
    private UUID productId;

    @Column(nullable = false, name = "available_quantity")
    private Integer availableQuantity;

    @Column(nullable = false, name = "reserved_quantity")
    @Builder.Default
    private Integer reservedQuantity = 0;
}
