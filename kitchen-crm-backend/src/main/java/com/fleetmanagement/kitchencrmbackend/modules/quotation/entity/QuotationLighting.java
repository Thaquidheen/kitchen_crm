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
    private Long itemId;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "quantity", precision = 10, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(name = "unit", nullable = false)
    private String unit;

    @Column(name = "unit_price", precision = 10, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "total_price", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalPrice;

    @Column(name = "specifications", columnDefinition = "TEXT")
    private String specifications;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "wattage")
    private Integer wattage;

    @Column(name = "profile_type")
    private String profileType;

    @Column(name = "sensor_type")
    private String sensorType;

    @Column(name = "connector_type")
    private String connectorType;

    public enum LightingItemType {
        LIGHT_PROFILE, DRIVER, CONNECTOR, SENSOR
    }

    // Calculate base total price (without margin/tax)
    @PrePersist
    @PreUpdate
    public void calculateTotalPrice() {
        if (unitPrice != null && quantity != null) {
            this.totalPrice = unitPrice.multiply(quantity);
        }
    }
}