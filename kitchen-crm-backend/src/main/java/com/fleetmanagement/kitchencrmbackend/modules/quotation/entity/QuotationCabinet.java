package com.fleetmanagement.kitchencrmbackend.modules.quotation.entity;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.CabinetType;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.DoorType;
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
    @JoinColumn(name = "kitchen_id", nullable = true)
    private QuotationKitchen kitchen;

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

    // Material selection for sqft-based pricing
    @Column(name = "material_id")
    private Long materialId;

    @Column(name = "material_rate", precision = 10, scale = 2)
    private BigDecimal materialRate;

    // BOX_AREA = full cabinet surface, FACE_AREA = front face only (W×H)
    @Column(name = "material_calculation_type", length = 20)
    private String materialCalculationType;

    // Lighting cost = Width (mm) x 2
    @Column(name = "lighting_cost", precision = 10, scale = 2)
    private BigDecimal lightingCost;

    // Accessories cost (BLUM standard accessories)
    @Column(name = "accessories_cost", precision = 10, scale = 2)
    private BigDecimal accessoriesCost;

    // Inner panel fields
    @Column(name = "inner_panel_type_id")
    private Long innerPanelTypeId;

    @Column(name = "inner_panel_rate", precision = 10, scale = 2)
    private BigDecimal innerPanelRate;

    @Column(name = "inner_panel_multiplier", precision = 5, scale = 2)
    private BigDecimal innerPanelMultiplier;

    @Column(name = "inner_panel_cost", precision = 10, scale = 2)
    private BigDecimal innerPanelCost;

    @Column(name = "inner_panel_quantity")
    private Integer innerPanelQuantity;

    // Linked door type (optional — set when "Add matching door" is checked)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_door_type_id")
    private DoorType linkedDoorType;

    // Elevation reference
    @Column(name = "elevation_id")
    private Long elevationId;

    @Column(name = "elevation_name", length = 100)
    private String elevationName;

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