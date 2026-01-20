package com.fleetmanagement.kitchencrmbackend.modules.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CabinetTypeDto {

    private Long id;

    @NotBlank(message = "Cabinet name is required")
    private String name;

    private Long categoryId;
    private String categoryName;

    private Long brandId;
    private String brandName;

    private Long materialId;
    private String materialName;

    @NotNull(message = "Fixed price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Fixed price cannot be negative")
    private BigDecimal fixedPrice;

    private Boolean active = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}