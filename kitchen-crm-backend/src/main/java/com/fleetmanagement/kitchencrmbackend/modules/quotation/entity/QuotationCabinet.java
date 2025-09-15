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

    @Column(name = "margin_amount", precision = 10, scale = 2)
    private BigDecimal marginAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 10, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_price", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalPrice;

    @Column(name = "cabinet_finish")
    private String cabinetFinish;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "custom_dimensions")
    private Boolean customDimensions = false;

    // Calculate square footage and total price
    @PrePersist
    @PreUpdate
    public void calculateValues() {
        // Calculate square footage if dimensions provided
        if (widthMm != null && heightMm != null) {
            // Convert mm to sqft: (width * height) / (25.4 * 25.4 * 144)
            BigDecimal widthInches = BigDecimal.valueOf(widthMm).divide(BigDecimal.valueOf(25.4), 4, BigDecimal.ROUND_HALF_UP);
            BigDecimal heightInches = BigDecimal.valueOf(heightMm).divide(BigDecimal.valueOf(25.4), 4, BigDecimal.ROUND_HALF_UP);
            this.calculatedSqft = widthInches.multiply(heightInches).divide(BigDecimal.valueOf(144), 4, BigDecimal.ROUND_HALF_UP);
        }

        // Calculate total price
        if (unitPrice != null && quantity != null) {
            BigDecimal baseAmount;
            if (calculatedSqft != null) {
                baseAmount = unitPrice.multiply(calculatedSqft).multiply(BigDecimal.valueOf(quantity));
            } else {
                baseAmount = unitPrice.multiply(BigDecimal.valueOf(quantity));
            }
            BigDecimal totalWithMargin = baseAmount.add(marginAmount != null ? marginAmount : BigDecimal.ZERO);
            this.totalPrice = totalWithMargin.add(taxAmount != null ? taxAmount : BigDecimal.ZERO);
        }
    }
}