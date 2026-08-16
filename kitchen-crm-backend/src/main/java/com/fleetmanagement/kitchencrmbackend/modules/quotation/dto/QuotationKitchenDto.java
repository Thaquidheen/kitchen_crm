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
    // Withheld-for-staff pricing fields carry NO default. A ZERO initialiser made a
    // withheld field serialise as 0 — indistinguishable from real data, and the same
    // artefact class that let a staff save wipe stored prices. Absent must mean null.
    private BigDecimal accessoriesBaseTotal;
    private BigDecimal accessoriesMarginAmount;
    private BigDecimal accessoriesTaxAmount = BigDecimal.ZERO;
    private BigDecimal accessoriesFinalTotal = BigDecimal.ZERO;

    private BigDecimal cabinetsBaseTotal;
    private BigDecimal cabinetsMarginAmount;
    private BigDecimal cabinetsTaxAmount = BigDecimal.ZERO;
    private BigDecimal cabinetsFinalTotal = BigDecimal.ZERO;

    private BigDecimal doorsBaseTotal;
    private BigDecimal doorsMarginAmount;
    private BigDecimal doorsTaxAmount = BigDecimal.ZERO;
    private BigDecimal doorsFinalTotal = BigDecimal.ZERO;

    private BigDecimal lightingBaseTotal;
    private BigDecimal lightingMarginAmount;
    private BigDecimal lightingTaxAmount = BigDecimal.ZERO;
    private BigDecimal lightingFinalTotal = BigDecimal.ZERO;

    // Kitchen totals
    private BigDecimal subtotal;
    private BigDecimal marginAmount;
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


