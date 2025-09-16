package com.fleetmanagement.kitchencrmbackend.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DoorTypeDto {
    private Long id;
    private String name;
    private Long brandId;
    private String brandName;
    private String material;
    private BigDecimal mrp;
    private BigDecimal discountPercentage;
    private BigDecimal companyPrice;
    private Boolean active;
}