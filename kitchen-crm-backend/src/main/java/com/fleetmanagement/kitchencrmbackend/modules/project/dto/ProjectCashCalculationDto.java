package com.fleetmanagement.kitchencrmbackend.modules.project.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO for project cash calculation
 * Contains quotation category data and edited tax percentages
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectCashCalculationDto {

    // Category base amounts from quotation (without tax)
    private BigDecimal accessoriesBaseTotal;
    private BigDecimal cabinetsBaseTotal;
    private BigDecimal doorsBaseTotal;
    private BigDecimal lightingBaseTotal;

    // Category margin amounts from quotation
    private BigDecimal accessoriesMarginAmount;
    private BigDecimal cabinetsMarginAmount;
    private BigDecimal doorsMarginAmount;
    private BigDecimal lightingMarginAmount;

    // Original tax percentages from quotation
    private BigDecimal accessoriesTaxPercentage;
    private BigDecimal cabinetsTaxPercentage;
    private BigDecimal doorsTaxPercentage;
    private BigDecimal lightingTaxPercentage;

    // Edited tax percentages (user input)
    private BigDecimal editedAccessoriesTaxPercentage;
    private BigDecimal editedCabinetsTaxPercentage;
    private BigDecimal editedDoorsTaxPercentage;
    private BigDecimal editedLightingTaxPercentage;

    // Transportation and installation costs from quotation
    private BigDecimal transportationPrice;
    private BigDecimal installationPrice;

    // Calculated results (aggregated totals for backward compatibility)
    private BigDecimal cashInHand;
    private BigDecimal cashInAccount;

    // Multi-kitchen support
    private Boolean isMultiKitchen = false;
    private List<KitchenCashCalculationDto> kitchens = new ArrayList<>();
}




