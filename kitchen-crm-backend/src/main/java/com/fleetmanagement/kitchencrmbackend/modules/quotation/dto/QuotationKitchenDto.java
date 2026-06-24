package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationKitchenDto {
    private Long id;
    private Long quotationId;
    private String kitchenName;
    private Integer kitchenOrder;

    // Category totals
    private BigDecimal accessoriesBaseTotal = BigDecimal.ZERO;
    private BigDecimal accessoriesMarginAmount = BigDecimal.ZERO;
    private BigDecimal accessoriesTaxAmount = BigDecimal.ZERO;
    private BigDecimal accessoriesFinalTotal = BigDecimal.ZERO;

    private BigDecimal cabinetsBaseTotal = BigDecimal.ZERO;
    private BigDecimal cabinetsMarginAmount = BigDecimal.ZERO;
    private BigDecimal cabinetsTaxAmount = BigDecimal.ZERO;
    private BigDecimal cabinetsFinalTotal = BigDecimal.ZERO;

    private BigDecimal doorsBaseTotal = BigDecimal.ZERO;
    private BigDecimal doorsMarginAmount = BigDecimal.ZERO;
    private BigDecimal doorsTaxAmount = BigDecimal.ZERO;
    private BigDecimal doorsFinalTotal = BigDecimal.ZERO;

    private BigDecimal lightingBaseTotal = BigDecimal.ZERO;
    private BigDecimal lightingMarginAmount = BigDecimal.ZERO;
    private BigDecimal lightingTaxAmount = BigDecimal.ZERO;
    private BigDecimal lightingFinalTotal = BigDecimal.ZERO;

    // Kitchen totals
    private BigDecimal subtotal = BigDecimal.ZERO;
    private BigDecimal marginAmount = BigDecimal.ZERO;
    private BigDecimal taxAmount = BigDecimal.ZERO;
    private BigDecimal totalAmount = BigDecimal.ZERO;

    // Per-category MRP (list price) totals for this kitchen (for the PDF MRP split-up)
    private BigDecimal accessoriesMrpTotal = BigDecimal.ZERO;
    private BigDecimal cabinetsMrpTotal = BigDecimal.ZERO;
    private BigDecimal doorsMrpTotal = BigDecimal.ZERO;
    private BigDecimal lightingMrpTotal = BigDecimal.ZERO;
    private BigDecimal miscMrpTotal = BigDecimal.ZERO;
    private BigDecimal mrpTotal = BigDecimal.ZERO;

    private BigDecimal transportationPrice = BigDecimal.ZERO;
    private BigDecimal installationPrice = BigDecimal.ZERO;

    // Related data
    private List<QuotationKitchenPlanImageDto> planImages;
    private List<QuotationKitchenScopeDetailDto> scopeDetails;
    private List<QuotationElevationDto> elevations;
    private List<QuotationAccessoryDto> accessories;
    private List<QuotationCabinetDto> cabinets;
    private List<QuotationDoorDto> doors;
    private List<QuotationLightingDto> lighting;
    private List<QuotationOtherExpenseDto> otherExpenses;
}


