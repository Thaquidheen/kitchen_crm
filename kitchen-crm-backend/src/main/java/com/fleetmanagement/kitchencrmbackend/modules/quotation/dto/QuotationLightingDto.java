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
public class QuotationLightingDto {
    private Long id;
    private String itemType;
    private Long itemId;
    private String itemName;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal unitPrice;
    private BigDecimal marginAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalPrice;
    private String specifications;
    private String description;
    private Integer wattage;
    private String profileType;
    private String sensorType;
    private String connectorType;
}
