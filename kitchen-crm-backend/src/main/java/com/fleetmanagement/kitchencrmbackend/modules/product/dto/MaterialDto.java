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
public class MaterialDto {
    private Long id;

    @NotBlank(message = "Material name is required")
    private String name;

    @NotNull(message = "Unit rate per sqft is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Unit rate must be greater than 0")
    private BigDecimal unitRatePerSqft;

    private String description;
    private Boolean active = true;
}