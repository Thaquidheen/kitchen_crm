package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationAccessoryDto {
    private Long id;
    private Long accessoryId;
    private String accessoryName;
    private String brandName;
    private String categoryName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal marginAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalPrice;
    private String description;
    private Boolean customItem = false;
    private String customItemName;
}