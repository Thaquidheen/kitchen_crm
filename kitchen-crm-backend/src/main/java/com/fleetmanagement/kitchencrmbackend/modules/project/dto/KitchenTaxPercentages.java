package com.fleetmanagement.kitchencrmbackend.modules.project.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Represents tax percentages for a single kitchen
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KitchenTaxPercentages {
    private BigDecimal accessoriesTaxPercentage;
    private BigDecimal cabinetsTaxPercentage;
    private BigDecimal doorsTaxPercentage;
    private BigDecimal lightingTaxPercentage;

    /**
     * Convert to Map for JSON serialization
     */
    public Map<String, BigDecimal> toMap() {
        Map<String, BigDecimal> map = new HashMap<>();
        map.put("accessoriesTaxPercentage", accessoriesTaxPercentage);
        map.put("cabinetsTaxPercentage", cabinetsTaxPercentage);
        map.put("doorsTaxPercentage", doorsTaxPercentage);
        map.put("lightingTaxPercentage", lightingTaxPercentage);
        return map;
    }

    /**
     * Create from Map (for JSON deserialization)
     */
    public static KitchenTaxPercentages fromMap(Map<String, Object> map) {
        KitchenTaxPercentages ktp = new KitchenTaxPercentages();
        if (map != null) {
            ktp.setAccessoriesTaxPercentage(map.get("accessoriesTaxPercentage") != null ? 
                new BigDecimal(map.get("accessoriesTaxPercentage").toString()) : null);
            ktp.setCabinetsTaxPercentage(map.get("cabinetsTaxPercentage") != null ? 
                new BigDecimal(map.get("cabinetsTaxPercentage").toString()) : null);
            ktp.setDoorsTaxPercentage(map.get("doorsTaxPercentage") != null ? 
                new BigDecimal(map.get("doorsTaxPercentage").toString()) : null);
            ktp.setLightingTaxPercentage(map.get("lightingTaxPercentage") != null ? 
                new BigDecimal(map.get("lightingTaxPercentage").toString()) : null);
        }
        return ktp;
    }
}







