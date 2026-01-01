package com.fleetmanagement.kitchencrmbackend.modules.project.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * DTO for kitchen-specific cash calculation
 * Contains kitchen category data and edited tax percentages
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KitchenCashCalculationDto {

    // Kitchen identification
    private Long kitchenId;
    private String kitchenName;
    private Integer kitchenOrder;

    // Category base amounts from kitchen (without tax)
    private BigDecimal accessoriesBaseTotal;
    private BigDecimal cabinetsBaseTotal;
    private BigDecimal doorsBaseTotal;
    private BigDecimal lightingBaseTotal;

    // Category margin amounts from kitchen
    private BigDecimal accessoriesMarginAmount;
    private BigDecimal cabinetsMarginAmount;
    private BigDecimal doorsMarginAmount;
    private BigDecimal lightingMarginAmount;

    // Original tax percentages from quotation (used for all kitchens)
    private BigDecimal accessoriesTaxPercentage;
    private BigDecimal cabinetsTaxPercentage;
    private BigDecimal doorsTaxPercentage;
    private BigDecimal lightingTaxPercentage;

    // Edited tax percentages (user input) - can be per kitchen or quotation-level
    private BigDecimal editedAccessoriesTaxPercentage;
    private BigDecimal editedCabinetsTaxPercentage;
    private BigDecimal editedDoorsTaxPercentage;
    private BigDecimal editedLightingTaxPercentage;

    // Calculated results for this kitchen
    private BigDecimal cashInHand;
    private BigDecimal cashInAccount;
}







