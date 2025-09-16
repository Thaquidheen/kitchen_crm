package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.*;

import java.math.BigDecimal;

public interface PricingService {
    BigDecimal calculateMarginAmount(BigDecimal baseAmount, BigDecimal marginPercentage);
    BigDecimal calculateTaxAmount(BigDecimal baseAmount, BigDecimal taxPercentage);
    void calculateQuotationTotals(Quotation quotation);
    void applyMarginToLineItems(Quotation quotation, BigDecimal marginPercentage, String userRole);
    BigDecimal calculateDimensionBasedPrice(Integer widthMm, Integer heightMm, BigDecimal unitRate);
    void calculateCategoryTotals(Quotation quotation);
    void calculateLightingLineTotal(QuotationLighting lighting, BigDecimal marginPercentage, BigDecimal taxPercentage);
    // Line item calculation methods
    void calculateAccessoryLineTotal(QuotationAccessory accessory, BigDecimal marginPercentage, BigDecimal taxPercentage);
    void calculateCabinetLineTotal(QuotationCabinet cabinet, BigDecimal marginPercentage, BigDecimal taxPercentage);
    void calculateDoorLineTotal(QuotationDoor door, BigDecimal marginPercentage, BigDecimal taxPercentage);

}