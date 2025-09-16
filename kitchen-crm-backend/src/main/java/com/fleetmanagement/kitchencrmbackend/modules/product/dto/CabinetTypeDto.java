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

    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Base price must be greater than 0")
    private BigDecimal basePrice;

    @NotNull(message = "MRP is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "MRP must be greater than 0")
    private BigDecimal mrp;

    @DecimalMin(value = "0.0", message = "Discount percentage cannot be negative")
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    private BigDecimal companyPrice;

    private Boolean active = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}