package com.fleetmanagement.kitchencrmbackend.modules.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class InnerPanelTypeDto {
    private Long id;

    @NotBlank(message = "Inner panel type name is required")
    private String name;

    @NotNull(message = "Rate per sqft is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Rate must be greater than 0")
    private BigDecimal ratePerSqft;

    @NotNull(message = "Multiplier is required")
    @DecimalMin(value = "0.1", message = "Multiplier must be at least 0.1")
    private BigDecimal multiplier = BigDecimal.ONE;

    private String description;
    private Boolean active = true;
}
