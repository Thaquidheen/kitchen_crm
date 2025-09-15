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
public class QuotationCabinetDto {
    private Long id;
    private Long cabinetTypeId;
    private String cabinetTypeName;
    private String brandName;
    private String materialName;
    private Integer quantity;
    private Integer widthMm;
    private Integer heightMm;
    private Integer depthMm;
    private BigDecimal calculatedSqft;
    private BigDecimal unitPrice;
    private BigDecimal marginAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalPrice;
    private String cabinetFinish;
    private String description;
    private Boolean customDimensions = false;
}