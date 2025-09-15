package com.fleetmanagement.kitchencrmbackend.modules.quotation.entity;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.CabinetType;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "quotation_cabinets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationCabinet extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id", nullable = false)
    private Quotation quotation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cabinet_type_id", nullable = false)
    private CabinetType cabinetType;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "width_mm")
    private Integer widthMm;

    @Column(name = "height_mm")
    private Integer heightMm;

    @Column(name = "depth_mm")
    private Integer depthMm;

    @Column(name = "calculated_sqft", precision = 10, scale = 4)
    private BigDecimal calculatedSqft;

    @Column(name = "unit_price", precision = 10, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "total_price", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalPrice;

    @Column(name = "custom_specifications", columnDefinition = "TEXT")
    private String customSpecifications;

    @Column(name = "custom_dimensions")
    private String customDimensions;

    // Calculate base total price (without margin/tax)
    @PrePersist
    @PreUpdate
    public void calculateTotalPrice() {
        if (unitPrice != null && quantity != null) {
            if (calculatedSqft != null) {
                this.totalPrice = unitPrice.multiply(calculatedSqft).multiply(BigDecimal.valueOf(quantity));
            } else {
                this.totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
            }
        }
    }
}