package com.fleetmanagement.kitchencrmbackend.modules.project.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Request DTO for updating project cash calculation
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProjectCashCalculationRequest {
    // Project-level tax percentages (for backward compatibility and single-kitchen mode)
    private BigDecimal accessoriesTaxPercentage;
    private BigDecimal cabinetsTaxPercentage;
    private BigDecimal doorsTaxPercentage;
    private BigDecimal lightingTaxPercentage;
    
    // Per-kitchen tax percentages (Map<kitchenId, KitchenTaxPercentages>)
    private Map<Long, KitchenTaxPercentages> kitchenTaxPercentages;
}




