package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class PricingServiceImpl implements PricingService {

    @Autowired
    private QuotationAccessoryRepository accessoryRepository;

    @Autowired
    private QuotationCabinetRepository cabinetRepository;

    @Autowired
    private QuotationDoorRepository doorRepository;

    @Autowired
    private QuotationLightingRepository lightingRepository;
    @Autowired
    private PricingService pricingService;

    @Override
    public BigDecimal calculateMarginAmount(BigDecimal baseAmount, BigDecimal marginPercentage) {
        if (baseAmount == null || marginPercentage == null) {
            return BigDecimal.ZERO;
        }
        return baseAmount.multiply(marginPercentage.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
    }

    @Override
    public BigDecimal calculateTaxAmount(BigDecimal baseAmount, BigDecimal taxPercentage) {
        if (baseAmount == null || taxPercentage == null) {
            return BigDecimal.ZERO;
        }
        return baseAmount.multiply(taxPercentage.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
    }

    @Override
    public BigDecimal calculateDimensionBasedPrice(Integer widthMm, Integer heightMm, BigDecimal unitRate) {
        if (widthMm == null || heightMm == null || unitRate == null) {
            return BigDecimal.ZERO;
        }

        // Convert mm to sqft and calculate price
        BigDecimal widthInches = BigDecimal.valueOf(widthMm).divide(BigDecimal.valueOf(25.4), 4, RoundingMode.HALF_UP);
        BigDecimal heightInches = BigDecimal.valueOf(heightMm).divide(BigDecimal.valueOf(25.4), 4, RoundingMode.HALF_UP);
        BigDecimal sqft = widthInches.multiply(heightInches).divide(BigDecimal.valueOf(144), 4, RoundingMode.HALF_UP);

        return sqft.multiply(unitRate);
    }

    @Override
    public void calculateQuotationTotals(Quotation quotation) {
        // First calculate category-wise totals
        calculateCategoryTotals(quotation);
        pricingService.calculateQuotationTotals(quotation);


        // Calculate overall totals
        BigDecimal totalCategoriesAmount = quotation.getAccessoriesFinalTotal()
                .add(quotation.getCabinetsFinalTotal())
                .add(quotation.getDoorsFinalTotal())
                .add(quotation.getLightingFinalTotal());

        BigDecimal totalWithServices = totalCategoriesAmount
                .add(quotation.getTransportationPrice())
                .add(quotation.getInstallationPrice());

        BigDecimal totalMargin = quotation.getAccessoriesMarginAmount()
                .add(quotation.getCabinetsMarginAmount())
                .add(quotation.getDoorsMarginAmount())
                .add(quotation.getLightingMarginAmount());

        BigDecimal totalTax = quotation.getAccessoriesTaxAmount()
                .add(quotation.getCabinetsTaxAmount())
                .add(quotation.getDoorsTaxAmount())
                .add(quotation.getLightingTaxAmount());

        quotation.setSubtotal(totalWithServices);
        quotation.setMarginAmount(totalMargin);
        quotation.setTaxAmount(totalTax);
        quotation.setTotalAmount(totalWithServices);
    }

    @Override
    public void calculateCategoryTotals(Quotation quotation) {

        // 1. ACCESSORIES CATEGORY CALCULATION
        List<QuotationAccessory> accessories = accessoryRepository.findByQuotationId(quotation.getId());
        BigDecimal accessoriesBase = accessories.stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal accessoriesMargin = calculateMarginAmount(accessoriesBase, quotation.getMarginPercentage());
        BigDecimal accessoriesWithMargin = accessoriesBase.add(accessoriesMargin);
        BigDecimal accessoriesTax = calculateTaxAmount(accessoriesWithMargin, quotation.getTaxPercentage());
        BigDecimal accessoriesTotal = accessoriesWithMargin.add(accessoriesTax);

        quotation.setAccessoriesBaseTotal(accessoriesBase);
        quotation.setAccessoriesMarginAmount(accessoriesMargin);
        quotation.setAccessoriesTaxAmount(accessoriesTax);
        quotation.setAccessoriesFinalTotal(accessoriesTotal);

        // 2. CABINETS CATEGORY CALCULATION
        List<QuotationCabinet> cabinets = cabinetRepository.findByQuotationId(quotation.getId());
        BigDecimal cabinetsBase = cabinets.stream()
                .map(item -> {
                    if (item.getCalculatedSqft() != null) {
                        return item.getUnitPrice().multiply(item.getCalculatedSqft()).multiply(BigDecimal.valueOf(item.getQuantity()));
                    } else {
                        return item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    }
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cabinetsMargin = calculateMarginAmount(cabinetsBase, quotation.getMarginPercentage());
        BigDecimal cabinetsWithMargin = cabinetsBase.add(cabinetsMargin);
        BigDecimal cabinetsTax = calculateTaxAmount(cabinetsWithMargin, quotation.getTaxPercentage());
        BigDecimal cabinetsTotal = cabinetsWithMargin.add(cabinetsTax);

        quotation.setCabinetsBaseTotal(cabinetsBase);
        quotation.setCabinetsMarginAmount(cabinetsMargin);
        quotation.setCabinetsTaxAmount(cabinetsTax);
        quotation.setCabinetsFinalTotal(cabinetsTotal);

        // 3. DOORS CATEGORY CALCULATION
        List<QuotationDoor> doors = doorRepository.findByQuotationId(quotation.getId());
        BigDecimal doorsBase = doors.stream()
                .map(item -> {
                    if (item.getCalculatedSqft() != null) {
                        return item.getUnitPrice().multiply(item.getCalculatedSqft()).multiply(BigDecimal.valueOf(item.getQuantity()));
                    } else {
                        return item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    }
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal doorsMargin = calculateMarginAmount(doorsBase, quotation.getMarginPercentage());
        BigDecimal doorsWithMargin = doorsBase.add(doorsMargin);
        BigDecimal doorsTax = calculateTaxAmount(doorsWithMargin, quotation.getTaxPercentage());
        BigDecimal doorsTotal = doorsWithMargin.add(doorsTax);

        quotation.setDoorsBaseTotal(doorsBase);
        quotation.setDoorsMarginAmount(doorsMargin);
        quotation.setDoorsTaxAmount(doorsTax);
        quotation.setDoorsFinalTotal(doorsTotal);

        // 4. LIGHTING CATEGORY CALCULATION
        List<QuotationLighting> lighting = lightingRepository.findByQuotationId(quotation.getId());
        BigDecimal lightingBase = lighting.stream()
                .map(item -> item.getUnitPrice().multiply(item.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal lightingMargin = calculateMarginAmount(lightingBase, quotation.getMarginPercentage());
        BigDecimal lightingWithMargin = lightingBase.add(lightingMargin);
        BigDecimal lightingTax = calculateTaxAmount(lightingWithMargin, quotation.getTaxPercentage());
        BigDecimal lightingTotal = lightingWithMargin.add(lightingTax);

        quotation.setLightingBaseTotal(lightingBase);
        quotation.setLightingMarginAmount(lightingMargin);
        quotation.setLightingTaxAmount(lightingTax);
        quotation.setLightingFinalTotal(lightingTotal);
    }
}