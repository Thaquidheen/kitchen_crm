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

    // Linked door type
    private Long linkedDoorTypeId;
    private String linkedDoorTypeName;

    private Long kitchenId;           // Reference to quotation_kitchens (nullable for backward compatibility)

    // Material selection for sqft-based pricing
    private Long materialId;
    private BigDecimal materialRate;
    private String materialCalculationType; // BOX_AREA or FACE_AREA

    // Lighting cost = Width (mm) x 2. Legacy: the checkbox that set this was replaced by
    // powder coating, but stored values are kept so existing quotations price unchanged.
    private BigDecimal lightingCost;

    // Accessories cost (BLUM standard accessories)
    private BigDecimal accessoriesCost;

    // Powder coating: the client sends the choice, the server derives the cost from the
    // cabinet type's per-sqft rate so it cannot be tampered with or drift out of date.
    private Boolean powderCoating;
    private BigDecimal powderCoatingCost;
    /** Read-only echo of the catalog rate, so the UI can show the breakdown. */
    private BigDecimal powderCoatingRatePerSqft;

    // Inner panel fields
    private Long innerPanelTypeId;
    private String innerPanelTypeName;
    private BigDecimal innerPanelRate;
    private BigDecimal innerPanelMultiplier;
    private BigDecimal innerPanelCost;
    private Integer innerPanelQuantity;

    // Elevation reference
    private Long elevationId;
    private String elevationName;
}