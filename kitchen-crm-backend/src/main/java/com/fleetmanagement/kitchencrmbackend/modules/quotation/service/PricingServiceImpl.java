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
    private QuotationKitchenRepository kitchenRepository;

    /**
     * Calculate cabinet surface area using Excel formula
     * Conversion: 304mm = 1 foot
     * Surface Area = [((W/304)+(H/304))×2×(D/304)] + [(W/304)×(H/304)]
     */
    private BigDecimal calculateCabinetSurfaceArea(Integer widthMm, Integer heightMm, Integer depthMm) {
        if (widthMm == null || heightMm == null || depthMm == null) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal width = BigDecimal.valueOf(widthMm).divide(BigDecimal.valueOf(304), 4, RoundingMode.HALF_UP);
        BigDecimal height = BigDecimal.valueOf(heightMm).divide(BigDecimal.valueOf(304), 4, RoundingMode.HALF_UP);
        BigDecimal depth = BigDecimal.valueOf(depthMm).divide(BigDecimal.valueOf(304), 4, RoundingMode.HALF_UP);
        
        // [((W/304)+(H/304))×2×(D/304)]
        BigDecimal sidePanels = width.add(height).multiply(BigDecimal.valueOf(2)).multiply(depth);
        
        // [(W/304)×(H/304)]
        BigDecimal backPanel = width.multiply(height);
        
        return sidePanels.add(backPanel);
    }

    /**
     * Calculate door face area using Excel formula
     * Conversion: 304mm = 1 foot
     * Door Area = (W/304) × (H/304)
     */
    private BigDecimal calculateDoorFaceArea(Integer widthMm, Integer heightMm) {
        if (widthMm == null || heightMm == null) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal width = BigDecimal.valueOf(widthMm).divide(BigDecimal.valueOf(304), 4, RoundingMode.HALF_UP);
        BigDecimal height = BigDecimal.valueOf(heightMm).divide(BigDecimal.valueOf(304), 4, RoundingMode.HALF_UP);
        
        return width.multiply(height);
    }

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
        // Apply category-specific margin to accessories
        List<QuotationAccessory> accessories = accessoryRepository.findByQuotationId(quotation.getId());
        for (QuotationAccessory accessory : accessories) {
            calculateAccessoryLineTotal(
                accessory, 
                quotation.getAccessoriesMarginPercentage(), 
                quotation.getAccessoriesTaxPercentage()
            );
            accessoryRepository.save(accessory);
        }

        // Apply category-specific margin to cabinets
        List<QuotationCabinet> cabinets = cabinetRepository.findByQuotationId(quotation.getId());
        for (QuotationCabinet cabinet : cabinets) {
            calculateCabinetLineTotal(
                cabinet, 
                quotation.getCabinetsMarginPercentage(), 
                quotation.getCabinetsTaxPercentage()
            );
            cabinetRepository.save(cabinet);
        }

        // Apply category-specific margin to doors
        List<QuotationDoor> doors = doorRepository.findByQuotationId(quotation.getId());
        for (QuotationDoor door : doors) {
            calculateDoorLineTotal(
                door, 
                quotation.getDoorsMarginPercentage(), 
                quotation.getDoorsTaxPercentage()
            );
            doorRepository.save(door);
        }

        // Apply category-specific margin to lighting
        List<QuotationLighting> lighting = lightingRepository.findByQuotationId(quotation.getId());
        for (QuotationLighting lightingItem : lighting) {
            calculateLightingLineTotal(
                lightingItem, 
                quotation.getLightingMarginPercentage(), 
                quotation.getLightingTaxPercentage()
            );
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
        // Calculate surface area from dimensions using Excel formula
        BigDecimal surfaceArea = calculateCabinetSurfaceArea(
            cabinet.getWidthMm(), 
            cabinet.getHeightMm(), 
            cabinet.getDepthMm()
        );
        
        // Store calculated square footage
        cabinet.setCalculatedSqft(surfaceArea);
        
        // Get base price from cabinet type (₹ per sqft)
        BigDecimal basePrice = BigDecimal.ZERO;
        if (cabinet.getCabinetType() != null && cabinet.getCabinetType().getBasePrice() != null) {
            basePrice = cabinet.getCabinetType().getBasePrice();
        }
        
        // Calculate base amount: surfaceArea × basePrice × quantity
        BigDecimal baseAmount = surfaceArea
            .multiply(basePrice)
            .multiply(BigDecimal.valueOf(cabinet.getQuantity() != null ? cabinet.getQuantity() : 1));
        
        // Calculate margin
        BigDecimal marginAmount = calculateMarginAmount(baseAmount, marginPercentage);
        
        // Calculate amount with margin
        BigDecimal amountWithMargin = baseAmount.add(marginAmount);
        
        // Calculate tax on amount with margin
        BigDecimal taxAmount = calculateTaxAmount(amountWithMargin, taxPercentage);
        
        // Calculate final total
        BigDecimal totalPrice = amountWithMargin.add(taxAmount);
        
        // Set unit price and total price
        cabinet.setUnitPrice(basePrice);
        cabinet.setTotalPrice(totalPrice);
    }
    @Override
    public void calculateQuotationTotals(Quotation quotation) {
        // Check if quotation has kitchens
        List<QuotationKitchen> kitchens = kitchenRepository.findByQuotationIdOrderByKitchenOrderAsc(quotation.getId());
        
        if (kitchens != null && !kitchens.isEmpty()) {
            // Multi-kitchen mode: Calculate totals from kitchens
            BigDecimal grandTotal = BigDecimal.ZERO;
            BigDecimal totalMargin = BigDecimal.ZERO;
            BigDecimal totalTax = BigDecimal.ZERO;
            
            // Calculate totals for each kitchen
            for (QuotationKitchen kitchen : kitchens) {
                calculateKitchenTotals(kitchen, quotation);
                grandTotal = grandTotal.add(kitchen.getTotalAmount());
                totalMargin = totalMargin.add(kitchen.getMarginAmount());
                totalTax = totalTax.add(kitchen.getTaxAmount());
            }
            
            // Add quotation-level transportation/installation (if any)
            grandTotal = grandTotal
                    .add(quotation.getTransportationPrice() != null ? quotation.getTransportationPrice() : BigDecimal.ZERO)
                    .add(quotation.getInstallationPrice() != null ? quotation.getInstallationPrice() : BigDecimal.ZERO);
            
            // Set quotation totals
            quotation.setSubtotal(grandTotal.subtract(totalMargin).subtract(totalTax));
            quotation.setMarginAmount(totalMargin);
            quotation.setTaxAmount(totalTax);
            quotation.setTotalAmount(grandTotal);
            
            // Also calculate category totals for backward compatibility (sum from kitchens)
            BigDecimal accessoriesBase = kitchens.stream()
                    .map(QuotationKitchen::getAccessoriesBaseTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal accessoriesMargin = kitchens.stream()
                    .map(QuotationKitchen::getAccessoriesMarginAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal accessoriesTax = kitchens.stream()
                    .map(QuotationKitchen::getAccessoriesTaxAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal accessoriesTotal = kitchens.stream()
                    .map(QuotationKitchen::getAccessoriesFinalTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            quotation.setAccessoriesBaseTotal(accessoriesBase);
            quotation.setAccessoriesMarginAmount(accessoriesMargin);
            quotation.setAccessoriesTaxAmount(accessoriesTax);
            quotation.setAccessoriesFinalTotal(accessoriesTotal);
            
            // Repeat for other categories
            quotation.setCabinetsBaseTotal(kitchens.stream().map(QuotationKitchen::getCabinetsBaseTotal).reduce(BigDecimal.ZERO, BigDecimal::add));
            quotation.setCabinetsMarginAmount(kitchens.stream().map(QuotationKitchen::getCabinetsMarginAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            quotation.setCabinetsTaxAmount(kitchens.stream().map(QuotationKitchen::getCabinetsTaxAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            quotation.setCabinetsFinalTotal(kitchens.stream().map(QuotationKitchen::getCabinetsFinalTotal).reduce(BigDecimal.ZERO, BigDecimal::add));
            
            quotation.setDoorsBaseTotal(kitchens.stream().map(QuotationKitchen::getDoorsBaseTotal).reduce(BigDecimal.ZERO, BigDecimal::add));
            quotation.setDoorsMarginAmount(kitchens.stream().map(QuotationKitchen::getDoorsMarginAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            quotation.setDoorsTaxAmount(kitchens.stream().map(QuotationKitchen::getDoorsTaxAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            quotation.setDoorsFinalTotal(kitchens.stream().map(QuotationKitchen::getDoorsFinalTotal).reduce(BigDecimal.ZERO, BigDecimal::add));
            
            quotation.setLightingBaseTotal(kitchens.stream().map(QuotationKitchen::getLightingBaseTotal).reduce(BigDecimal.ZERO, BigDecimal::add));
            quotation.setLightingMarginAmount(kitchens.stream().map(QuotationKitchen::getLightingMarginAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            quotation.setLightingTaxAmount(kitchens.stream().map(QuotationKitchen::getLightingTaxAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            quotation.setLightingFinalTotal(kitchens.stream().map(QuotationKitchen::getLightingFinalTotal).reduce(BigDecimal.ZERO, BigDecimal::add));
        } else {
            // Backward compatibility: No kitchens, use existing logic
            // First calculate category-wise totals
            calculateCategoryTotals(quotation);

            // Calculate overall totals
            BigDecimal totalCategoriesAmount = quotation.getAccessoriesFinalTotal()
                    .add(quotation.getCabinetsFinalTotal())
                    .add(quotation.getDoorsFinalTotal())
                    .add(quotation.getLightingFinalTotal());

            BigDecimal totalWithServices = totalCategoriesAmount
                    .add(quotation.getTransportationPrice() != null ? quotation.getTransportationPrice() : BigDecimal.ZERO)
                    .add(quotation.getInstallationPrice() != null ? quotation.getInstallationPrice() : BigDecimal.ZERO);

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
    }

    @Override
    public void calculateDoorLineTotal(QuotationDoor door, BigDecimal marginPercentage, BigDecimal taxPercentage) {
        // Calculate face area from dimensions using Excel formula
        BigDecimal faceArea = calculateDoorFaceArea(door.getWidthMm(), door.getHeightMm());
        
        // Store calculated square footage
        door.setCalculatedSqft(faceArea);
        
        // Get price from door type (₹ per sqft)
        BigDecimal doorPrice = BigDecimal.ZERO;
        if (door.getDoorType() != null && door.getDoorType().getCompanyPrice() != null) {
            doorPrice = door.getDoorType().getCompanyPrice();
        }
        
        // Calculate base amount: faceArea × doorPrice × quantity
        BigDecimal baseAmount = faceArea
            .multiply(doorPrice)
            .multiply(BigDecimal.valueOf(door.getQuantity() != null ? door.getQuantity() : 1));
        
        // Calculate margin
        BigDecimal marginAmount = calculateMarginAmount(baseAmount, marginPercentage);
        
        // Calculate amount with margin
        BigDecimal amountWithMargin = baseAmount.add(marginAmount);
        
        // Calculate tax on amount with margin
        BigDecimal taxAmount = calculateTaxAmount(amountWithMargin, taxPercentage);
        
        // Calculate final total
        BigDecimal totalPrice = amountWithMargin.add(taxAmount);
        
        // Set unit price and total price
        door.setUnitPrice(doorPrice);
        door.setTotalPrice(totalPrice);
    }

    @Override
    public void calculateCategoryTotals(Quotation quotation) {

        // 1. ACCESSORIES CATEGORY CALCULATION (use category-specific margin/tax)
        List<QuotationAccessory> accessories = accessoryRepository.findByQuotationId(quotation.getId());
        BigDecimal accessoriesBase = accessories.stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal accessoriesMargin = calculateMarginAmount(accessoriesBase, quotation.getAccessoriesMarginPercentage());
        BigDecimal accessoriesWithMargin = accessoriesBase.add(accessoriesMargin);
        BigDecimal accessoriesTax = calculateTaxAmount(accessoriesWithMargin, quotation.getAccessoriesTaxPercentage());
        BigDecimal accessoriesTotal = accessoriesWithMargin.add(accessoriesTax);

        quotation.setAccessoriesBaseTotal(accessoriesBase);
        quotation.setAccessoriesMarginAmount(accessoriesMargin);
        quotation.setAccessoriesTaxAmount(accessoriesTax);
        quotation.setAccessoriesFinalTotal(accessoriesTotal);

        // 2. CABINETS CATEGORY CALCULATION (use category-specific margin/tax)
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

        BigDecimal cabinetsMargin = calculateMarginAmount(cabinetsBase, quotation.getCabinetsMarginPercentage());
        BigDecimal cabinetsWithMargin = cabinetsBase.add(cabinetsMargin);
        BigDecimal cabinetsTax = calculateTaxAmount(cabinetsWithMargin, quotation.getCabinetsTaxPercentage());
        BigDecimal cabinetsTotal = cabinetsWithMargin.add(cabinetsTax);

        quotation.setCabinetsBaseTotal(cabinetsBase);
        quotation.setCabinetsMarginAmount(cabinetsMargin);
        quotation.setCabinetsTaxAmount(cabinetsTax);
        quotation.setCabinetsFinalTotal(cabinetsTotal);

        // 3. DOORS CATEGORY CALCULATION (use category-specific margin/tax)
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

        BigDecimal doorsMargin = calculateMarginAmount(doorsBase, quotation.getDoorsMarginPercentage());
        BigDecimal doorsWithMargin = doorsBase.add(doorsMargin);
        BigDecimal doorsTax = calculateTaxAmount(doorsWithMargin, quotation.getDoorsTaxPercentage());
        BigDecimal doorsTotal = doorsWithMargin.add(doorsTax);

        quotation.setDoorsBaseTotal(doorsBase);
        quotation.setDoorsMarginAmount(doorsMargin);
        quotation.setDoorsTaxAmount(doorsTax);
        quotation.setDoorsFinalTotal(doorsTotal);

        // 4. LIGHTING CATEGORY CALCULATION (use category-specific margin/tax)
        List<QuotationLighting> lighting = lightingRepository.findByQuotationId(quotation.getId());
        BigDecimal lightingBase = lighting.stream()
                .map(item -> item.getUnitPrice().multiply(item.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal lightingMargin = calculateMarginAmount(lightingBase, quotation.getLightingMarginPercentage());
        BigDecimal lightingWithMargin = lightingBase.add(lightingMargin);
        BigDecimal lightingTax = calculateTaxAmount(lightingWithMargin, quotation.getLightingTaxPercentage());
        BigDecimal lightingTotal = lightingWithMargin.add(lightingTax);

        quotation.setLightingBaseTotal(lightingBase);
        quotation.setLightingMarginAmount(lightingMargin);
        quotation.setLightingTaxAmount(lightingTax);
        quotation.setLightingFinalTotal(lightingTotal);
    }

    @Override
    public void calculateKitchenTotals(QuotationKitchen kitchen, Quotation quotation) {
        // 1. ACCESSORIES CATEGORY CALCULATION (use category-specific margin/tax from quotation)
        List<QuotationAccessory> accessories = accessoryRepository.findByKitchenId(kitchen.getId());
        BigDecimal accessoriesBase = accessories.stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal accessoriesMargin = calculateMarginAmount(accessoriesBase, quotation.getAccessoriesMarginPercentage());
        BigDecimal accessoriesWithMargin = accessoriesBase.add(accessoriesMargin);
        BigDecimal accessoriesTax = calculateTaxAmount(accessoriesWithMargin, quotation.getAccessoriesTaxPercentage());
        BigDecimal accessoriesTotal = accessoriesWithMargin.add(accessoriesTax);

        kitchen.setAccessoriesBaseTotal(accessoriesBase);
        kitchen.setAccessoriesMarginAmount(accessoriesMargin);
        kitchen.setAccessoriesTaxAmount(accessoriesTax);
        kitchen.setAccessoriesFinalTotal(accessoriesTotal);

        // 2. CABINETS CATEGORY CALCULATION
        List<QuotationCabinet> cabinets = cabinetRepository.findByKitchenId(kitchen.getId());
        BigDecimal cabinetsBase = cabinets.stream()
                .map(item -> {
                    if (item.getCalculatedSqft() != null) {
                        return item.getUnitPrice().multiply(item.getCalculatedSqft()).multiply(BigDecimal.valueOf(item.getQuantity()));
                    } else {
                        return item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    }
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cabinetsMargin = calculateMarginAmount(cabinetsBase, quotation.getCabinetsMarginPercentage());
        BigDecimal cabinetsWithMargin = cabinetsBase.add(cabinetsMargin);
        BigDecimal cabinetsTax = calculateTaxAmount(cabinetsWithMargin, quotation.getCabinetsTaxPercentage());
        BigDecimal cabinetsTotal = cabinetsWithMargin.add(cabinetsTax);

        kitchen.setCabinetsBaseTotal(cabinetsBase);
        kitchen.setCabinetsMarginAmount(cabinetsMargin);
        kitchen.setCabinetsTaxAmount(cabinetsTax);
        kitchen.setCabinetsFinalTotal(cabinetsTotal);

        // 3. DOORS CATEGORY CALCULATION
        List<QuotationDoor> doors = doorRepository.findByKitchenId(kitchen.getId());
        BigDecimal doorsBase = doors.stream()
                .map(item -> {
                    if (item.getCalculatedSqft() != null) {
                        return item.getUnitPrice().multiply(item.getCalculatedSqft()).multiply(BigDecimal.valueOf(item.getQuantity()));
                    } else {
                        return item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    }
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal doorsMargin = calculateMarginAmount(doorsBase, quotation.getDoorsMarginPercentage());
        BigDecimal doorsWithMargin = doorsBase.add(doorsMargin);
        BigDecimal doorsTax = calculateTaxAmount(doorsWithMargin, quotation.getDoorsTaxPercentage());
        BigDecimal doorsTotal = doorsWithMargin.add(doorsTax);

        kitchen.setDoorsBaseTotal(doorsBase);
        kitchen.setDoorsMarginAmount(doorsMargin);
        kitchen.setDoorsTaxAmount(doorsTax);
        kitchen.setDoorsFinalTotal(doorsTotal);

        // 4. LIGHTING CATEGORY CALCULATION
        List<QuotationLighting> lighting = lightingRepository.findByKitchenId(kitchen.getId());
        BigDecimal lightingBase = lighting.stream()
                .map(item -> item.getUnitPrice().multiply(item.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal lightingMargin = calculateMarginAmount(lightingBase, quotation.getLightingMarginPercentage());
        BigDecimal lightingWithMargin = lightingBase.add(lightingMargin);
        BigDecimal lightingTax = calculateTaxAmount(lightingWithMargin, quotation.getLightingTaxPercentage());
        BigDecimal lightingTotal = lightingWithMargin.add(lightingTax);

        kitchen.setLightingBaseTotal(lightingBase);
        kitchen.setLightingMarginAmount(lightingMargin);
        kitchen.setLightingTaxAmount(lightingTax);
        kitchen.setLightingFinalTotal(lightingTotal);

        // Calculate kitchen subtotal (sum of category totals only - transportation/installation are at quotation level)
        BigDecimal kitchenSubtotal = accessoriesTotal
                .add(cabinetsTotal)
                .add(doorsTotal)
                .add(lightingTotal);

        // Kitchen margin and tax are sums of category margins/taxes
        BigDecimal kitchenMargin = accessoriesMargin.add(cabinetsMargin).add(doorsMargin).add(lightingMargin);
        BigDecimal kitchenTax = accessoriesTax.add(cabinetsTax).add(doorsTax).add(lightingTax);

        kitchen.setSubtotal(kitchenSubtotal);
        kitchen.setMarginAmount(kitchenMargin);
        kitchen.setTaxAmount(kitchenTax);
        kitchen.setTotalAmount(kitchenSubtotal);
    }
}