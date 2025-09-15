package com.fleetmanagement.kitchencrmbackend.modules.quotation.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "quotation_lighting")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationLighting extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id", nullable = false)
    private Quotation quotation;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false)
    private LightingItemType itemType;

    @Column(name = "item_id", nullable = false)
    private Long itemId; // References respective table based on item_type

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "quantity", precision = 10, scale = 2, nullable = false)
    private BigDecimal quantity; // Can be meters for profiles, pieces for others

    @Column(name = "unit", nullable = false)
    private String unit; // "meters", "pieces", etc.

    @Column(name = "unit_price", precision = 10, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "margin_amount", precision = 10, scale = 2)
    private BigDecimal marginAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 10, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_price", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalPrice;

    @Column(name = "specifications", columnDefinition = "TEXT")
    private String specifications;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "wattage")
    private Integer wattage; // For drivers

    @Column(name = "profile_type")
    private String profileType; // For light profiles: A, B, C, D

    @Column(name = "sensor_type")
    private String sensorType; // For sensors: NORMAL_SENSOR, DRAWER_SENSOR

    @Column(name = "connector_type")
    private String connectorType; // For connectors: DRIVER_CONNECTOR, STRIP_CONNECTOR

    public enum LightingItemType {
        LIGHT_PROFILE, DRIVER, CONNECTOR, SENSOR
    }

    // Calculate total price before saving
    @PrePersist
    @PreUpdate
    public void calculateTotalPrice() {
        if (unitPrice != null && quantity != null) {
            BigDecimal baseAmount = unitPrice.multiply(quantity);
            BigDecimal totalWithMargin = baseAmount.add(marginAmount != null ? marginAmount : BigDecimal.ZERO);
            this.totalPrice = totalWithMargin.add(taxAmount != null ? taxAmount : BigDecimal.ZERO);
        }
    }
}