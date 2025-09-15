package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

public interface PricingService {
    BigDecimal calculateMarginAmount(BigDecimal baseAmount, BigDecimal marginPercentage);
    BigDecimal calculateTaxAmount(BigDecimal baseAmount, BigDecimal taxPercentage);
    void calculateQuotationTotals(Quotation quotation);
    void applyMarginToLineItems(Quotation quotation, BigDecimal marginPercentage, String userRole);
    BigDecimal calculateDimensionBasedPrice(Integer widthMm, Integer heightMm, BigDecimal unitRate);
}
