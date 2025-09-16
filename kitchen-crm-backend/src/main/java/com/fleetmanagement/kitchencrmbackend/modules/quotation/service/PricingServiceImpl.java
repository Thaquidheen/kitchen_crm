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


    @Override
    public BigDecimal calculateMarginAmount(BigDecimal baseAmount, BigDecimal marginPercentage) {
        if (baseAmount == null || marginPercentage == null) {
            return BigDecimal.ZERO;
        }
        return baseAmount.multiply(marginPercentage.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
    }

    @Override
    public void calculateLightingLineTotal(QuotationLighting lighting, BigDecimal marginPercentage, BigDecimal taxPercentage) {
        if (lighting.getUnitPrice() == null || lighting.getQuantity() == null) {
            lighting.setTotalPrice(BigDecimal.ZERO);
            return;
        }

        // Calculate base amount
        BigDecimal baseAmount = lighting.getUnitPrice().multiply(lighting.getQuantity());

        // Calculate margin
        BigDecimal marginAmount = calculateMarginAmount(baseAmount, marginPercentage);

        // Calculate amount with margin
        BigDecimal amountWithMargin = baseAmount.add(marginAmount);

        // Calculate tax on amount with margin
        BigDecimal taxAmount = calculateTaxAmount(amountWithMargin, taxPercentage);

        // Calculate final total
        BigDecimal totalPrice = amountWithMargin.add(taxAmount);

        // Set final total
        lighting.setTotalPrice(totalPrice);
    }
    @Override
    public BigDecimal calculateTaxAmount(BigDecimal baseAmount, BigDecimal taxPercentage) {
        if (baseAmount == null || taxPercentage == null) {
            return BigDecimal.ZERO;
        }
        return baseAmount.multiply(taxPercentage.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
    }

    @Override
    public void applyMarginToLineItems(Quotation quotation, BigDecimal marginPercentage, String userRole) {
        // Apply margin to accessories
        List<QuotationAccessory> accessories = accessoryRepository.findByQuotationId(quotation.getId());
        for (QuotationAccessory accessory : accessories) {
            calculateAccessoryLineTotal(accessory, marginPercentage, quotation.getTaxPercentage());
            accessoryRepository.save(accessory);
        }

        // Apply margin to cabinets
        List<QuotationCabinet> cabinets = cabinetRepository.findByQuotationId(quotation.getId());
        for (QuotationCabinet cabinet : cabinets) {
            calculateCabinetLineTotal(cabinet, marginPercentage, quotation.getTaxPercentage());
            cabinetRepository.save(cabinet);
        }

        // Apply margin to doors
        List<QuotationDoor> doors = doorRepository.findByQuotationId(quotation.getId());
        for (QuotationDoor door : doors) {
            calculateDoorLineTotal(door, marginPercentage, quotation.getTaxPercentage());
            doorRepository.save(door);
        }

        // Apply margin to lighting
        List<QuotationLighting> lighting = lightingRepository.findByQuotationId(quotation.getId());
        for (QuotationLighting lightingItem : lighting) {
            calculateLightingLineTotal(lightingItem, marginPercentage, quotation.getTaxPercentage());
            lightingRepository.save(lightingItem);
        }

        // After updating all line items, recalculate quotation totals
        calculateCategoryTotals(quotation);
        calculateQuotationTotals(quotation);
    }
    @Override
    public void calculateAccessoryLineTotal(QuotationAccessory accessory, BigDecimal marginPercentage, BigDecimal taxPercentage) {
        if (accessory.getUnitPrice() == null || accessory.getQuantity() == null) {
            accessory.setTotalPrice(BigDecimal.ZERO);
            return;
        }

        // Calculate base amount (accessories use simple quantity-based pricing)
        BigDecimal baseAmount = accessory.getUnitPrice().multiply(BigDecimal.valueOf(accessory.getQuantity()));

        // Calculate margin
        BigDecimal marginAmount = calculateMarginAmount(baseAmount, marginPercentage);

        // Calculate amount with margin
        BigDecimal amountWithMargin = baseAmount.add(marginAmount);

        // Calculate tax on amount with margin
        BigDecimal taxAmount = calculateTaxAmount(amountWithMargin, taxPercentage);

        // Calculate final total
        BigDecimal totalPrice = amountWithMargin.add(taxAmount);

        // Set final total price
        accessory.setTotalPrice(totalPrice);
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
    public void calculateCabinetLineTotal(QuotationCabinet cabinet, BigDecimal marginPercentage, BigDecimal taxPercentage) {
        if (cabinet.getUnitPrice() == null || cabinet.getQuantity() == null) {
            cabinet.setTotalPrice(BigDecimal.ZERO);
            return;
        }

        // Calculate base amount
        BigDecimal baseAmount;
        if (cabinet.getCalculatedSqft() != null) {
            // For cabinets with calculated square footage
            baseAmount = cabinet.getUnitPrice().multiply(cabinet.getCalculatedSqft()).multiply(BigDecimal.valueOf(cabinet.getQuantity()));
        } else {
            // For cabinets with simple quantity-based pricing
            baseAmount = cabinet.getUnitPrice().multiply(BigDecimal.valueOf(cabinet.getQuantity()));
        }

        // Calculate margin
        BigDecimal marginAmount = calculateMarginAmount(baseAmount, marginPercentage);

        // Calculate amount with margin
        BigDecimal amountWithMargin = baseAmount.add(marginAmount);

        // Calculate tax on amount with margin
        BigDecimal taxAmount = calculateTaxAmount(amountWithMargin, taxPercentage);

        // Calculate final total
        BigDecimal totalPrice = amountWithMargin.add(taxAmount);

        // Set final total price
        cabinet.setTotalPrice(totalPrice);
    }
    @Override
    public void calculateQuotationTotals(Quotation quotation) {
        // First calculate category-wise totals
        calculateCategoryTotals(quotation);



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
    public void calculateDoorLineTotal(QuotationDoor door, BigDecimal marginPercentage, BigDecimal taxPercentage) {
        if (door.getUnitPrice() == null || door.getQuantity() == null) {
            door.setTotalPrice(BigDecimal.ZERO);
            return;
        }

        // Calculate base amount
        BigDecimal baseAmount;
        if (door.getCalculatedSqft() != null) {
            // For doors with calculated square footage
            baseAmount = door.getUnitPrice().multiply(door.getCalculatedSqft()).multiply(BigDecimal.valueOf(door.getQuantity()));
        } else {
            // For doors with simple quantity-based pricing
            baseAmount = door.getUnitPrice().multiply(BigDecimal.valueOf(door.getQuantity()));
        }

        // Calculate margin
        BigDecimal marginAmount = calculateMarginAmount(baseAmount, marginPercentage);

        // Calculate amount with margin
        BigDecimal amountWithMargin = baseAmount.add(marginAmount);

        // Calculate tax on amount with margin
        BigDecimal taxAmount = calculateTaxAmount(amountWithMargin, taxPercentage);

        // Calculate final total
        BigDecimal totalPrice = amountWithMargin.add(taxAmount);

        // Set final total price
        door.setTotalPrice(totalPrice);
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