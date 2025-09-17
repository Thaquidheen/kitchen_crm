package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;



import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationLightingDto {
    private Long id;

    @NotNull(message = "Item type is required")
    private String itemType; // LIGHT_PROFILE, DRIVER, CONNECTOR, SENSOR

    @NotNull(message = "Item ID is required")
    private Long itemId;

    private String itemName; // This will be populated from the entity

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.1", message = "Quantity must be greater than 0")
    private BigDecimal quantity;

    // ADDED: Unit field to prevent null constraint violation
    private String unit = "Pieces"; // Default value

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Unit price must be greater than 0")
    private BigDecimal unitPrice;

    private BigDecimal totalPrice; // Calculated field
    private String specifications;
    private String description;

    // Additional fields populated from entities
    private Integer wattage; // For drivers
    private String profileType; // For light profiles
    private String sensorType; // For sensors
    private String connectorType; // For connectors

    // Margin and tax (only for super admin)
    private BigDecimal marginAmount;
    private BigDecimal taxAmount;
}

