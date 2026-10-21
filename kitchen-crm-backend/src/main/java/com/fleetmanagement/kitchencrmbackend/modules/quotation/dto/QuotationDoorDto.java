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
public class QuotationDoorDto {
    private Long id;
    private Long doorTypeId;
    private String doorTypeName;
    private String brandName;
    private String material;
    private Integer quantity;
    private Integer widthMm;
    private Integer heightMm;
    private BigDecimal calculatedSqft;
    private BigDecimal unitPrice;
    private BigDecimal marginAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalPrice;

    /** The rate with the category's margin (per sq ft for a door), before GST. Sent to everyone who sees the quotation. */
    private BigDecimal rateWithMargin;
    /** The line's amount with the category's margin, before GST. */
    private BigDecimal amountWithMargin;
    private String doorFinish;
    private String doorStyle;
    private String description;
    private Boolean customDimensions = false;
    
    private Long kitchenId;           // Reference to quotation_kitchens (nullable for backward compatibility)

    // Elevation reference
    private Long elevationId;
    private String elevationName;
}