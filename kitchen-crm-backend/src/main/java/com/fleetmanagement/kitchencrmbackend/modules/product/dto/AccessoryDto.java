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
public class AccessoryDto {
    private Long id;

    @NotBlank(message = "Accessory name is required")
    private String name;

    private Long categoryId;
    private String categoryName;

    private Long brandId;
    private String brandName;

    private String materialCode;
    private Integer widthMm;
    private Integer heightMm;
    private Integer depthMm;
    private String imageUrl;
    private String color;

    @NotNull(message = "MRP is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "MRP must be greater than 0")
    private BigDecimal mrp;

    private BigDecimal discountPercentage = BigDecimal.ZERO;
    private BigDecimal companyPrice;
    private Boolean active = true;
}