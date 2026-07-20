package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationCreateDto {
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private String projectName;

    // "Save as New": id of the quotation this one is a new version of — the new quotation
    // joins the source's folder as the next version. Null for a brand-new quotation.
    private Long sourceQuotationId;

    private BigDecimal transportationPrice = BigDecimal.ZERO;
    private BigDecimal installationPrice = BigDecimal.ZERO;
    private BigDecimal marginPercentage = BigDecimal.ZERO;
    private BigDecimal taxPercentage = BigDecimal.ZERO;
    
    // Category-specific margin percentages
    private BigDecimal accessoriesMarginPercentage = BigDecimal.valueOf(20.00);
    private BigDecimal cabinetsMarginPercentage = BigDecimal.valueOf(20.00);
    private BigDecimal doorsMarginPercentage = BigDecimal.valueOf(20.00);
    private BigDecimal lightingMarginPercentage = BigDecimal.valueOf(20.00);
    
    // Category-specific tax percentages
    private BigDecimal accessoriesTaxPercentage = BigDecimal.valueOf(18.00);
    private BigDecimal cabinetsTaxPercentage = BigDecimal.valueOf(18.00);
    private BigDecimal doorsTaxPercentage = BigDecimal.valueOf(18.00);
    private BigDecimal lightingTaxPercentage = BigDecimal.valueOf(18.00);

    // Miscellaneous (Other Expenses) margin & tax
    private BigDecimal miscellaneousMarginPercentage = BigDecimal.ZERO;
    private BigDecimal miscellaneousTaxPercentage = BigDecimal.valueOf(18.00);

    // Per-category MRP (list price) margin percentages
    private BigDecimal accessoriesMrpMarginPercentage = BigDecimal.valueOf(20.00);
    private BigDecimal cabinetsMrpMarginPercentage = BigDecimal.valueOf(20.00);
    private BigDecimal doorsMrpMarginPercentage = BigDecimal.valueOf(20.00);
    private BigDecimal lightingMrpMarginPercentage = BigDecimal.valueOf(20.00);
    // Per-category MRP (list price) tax percentages
    private BigDecimal accessoriesMrpTaxPercentage = BigDecimal.valueOf(18.00);
    private BigDecimal cabinetsMrpTaxPercentage = BigDecimal.valueOf(18.00);
    private BigDecimal doorsMrpTaxPercentage = BigDecimal.valueOf(18.00);
    private BigDecimal lightingMrpTaxPercentage = BigDecimal.valueOf(18.00);
    // Miscellaneous (services) MRP margin & tax
    private BigDecimal miscellaneousMrpMarginPercentage = BigDecimal.ZERO;
    private BigDecimal miscellaneousMrpTaxPercentage = BigDecimal.valueOf(18.00);

    private LocalDate validUntil;
    private String notes;
    private String termsConditions;
    private String warrantyAndService;

    // Line items
    private List<QuotationAccessoryDto> accessories;
    private List<QuotationCabinetDto> cabinets;
    private List<QuotationDoorDto> doors;
    private List<QuotationLightingDto> lighting;
    private List<QuotationOtherExpenseDto> otherExpenses;

    // Kitchens (multi-kitchen support)
    private List<QuotationKitchenCreateDto> kitchens;

    // Important Note & Payment Terms
    private String importantNote;
    private BigDecimal paymentAcceptancePct;
    private BigDecimal paymentDeliveryPct;
    private BigDecimal paymentInstallationPct;
}