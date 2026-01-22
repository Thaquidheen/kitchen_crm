package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationCabinetDto {
    private Long id;
    private Long cabinetTypeId;
    private String cabinetTypeName;
    private String brandName;
    private String materialName;
    private Integer quantity;
    private Integer widthMm;
    private Integer heightMm;
    private Integer depthMm;
    private BigDecimal calculatedSqft;
    private BigDecimal unitPrice;
    private BigDecimal marginAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalPrice;
    private String cabinetFinish;
    private String description;
    private Boolean customDimensions = false;

    private Long kitchenId;           // Reference to quotation_kitchens (nullable for backward compatibility)

    // Material selection for sqft-based pricing
    private Long materialId;
    private BigDecimal materialRate;

    // Lighting cost = Width (mm) x 2
    private BigDecimal lightingCost;

    // Accessories cost (BLUM standard accessories)
    private BigDecimal accessoriesCost;

    // Elevation reference
    private Long elevationId;
    private String elevationName;
}