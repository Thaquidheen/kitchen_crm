import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.service.PricingService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
class PricingServiceImpl implements PricingService {

    private static final BigDecimal MM_TO_SQFT_CONVERSION = BigDecimal.valueOf(0.0000107639);

    @Override
    public BigDecimal calculateMarginAmount(BigDecimal baseAmount, BigDecimal marginPercentage) {
        if (baseAmount == null || marginPercentage == null) {
            return BigDecimal.ZERO;
        }
        return baseAmount.multiply(marginPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    @Override
    public BigDecimal calculateTaxAmount(BigDecimal baseAmount, BigDecimal taxPercentage) {
        if (baseAmount == null || taxPercentage == null) {
            return BigDecimal.ZERO;
        }
        return baseAmount.multiply(taxPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    @Override
    public void calculateQuotationTotals(Quotation quotation) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalMarginAmount = BigDecimal.ZERO;
        BigDecimal totalTaxAmount = BigDecimal.ZERO;

        // Calculate totals from all line items
        // Note: In a real implementation, you would fetch these from repositories
        // subtotal = accessories total + cabinets total + doors total + lighting total

        // Add transportation and installation
        subtotal = subtotal.add(quotation.getTransportationPrice())
                .add(quotation.getInstallationPrice());

        // Calculate margin and tax
        totalMarginAmount = calculateMarginAmount(subtotal, quotation.getMarginPercentage());
        totalTaxAmount = calculateTaxAmount(subtotal.add(totalMarginAmount), quotation.getTaxPercentage());

        // Set calculated values
        quotation.setSubtotal(subtotal);
        quotation.setMarginAmount(totalMarginAmount);
        quotation.setTaxAmount(totalTaxAmount);
        quotation.setTotalAmount(subtotal.add(totalMarginAmount).add(totalTaxAmount));
    }

    @Override
    public void applyMarginToLineItems(Quotation quotation, BigDecimal marginPercentage, String userRole) {
        // Only show margin to SUPER_ADMIN role
        if (!"ROLE_SUPER_ADMIN".equals(userRole)) {
            marginPercentage = BigDecimal.ZERO;
        }

        // Apply margin to accessories
        // Note: In real implementation, fetch from repositories and update
        // For each line item:
        // item.setMarginAmount(calculateMarginAmount(item.getBaseAmount(), marginPercentage));
        // item.calculateTotalPrice();
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

    // Helper method to calculate line item totals
    public void calculateAccessoryLineTotal(QuotationAccessory accessory, BigDecimal marginPercentage, BigDecimal taxPercentage) {
        BigDecimal baseAmount = accessory.getUnitPrice().multiply(BigDecimal.valueOf(accessory.getQuantity()));
        BigDecimal marginAmount = calculateMarginAmount(baseAmount, marginPercentage);
        BigDecimal taxAmount = calculateTaxAmount(baseAmount.add(marginAmount), taxPercentage);

        accessory.setMarginAmount(marginAmount);
        accessory.setTaxAmount(taxAmount);
        accessory.setTotalPrice(baseAmount.add(marginAmount).add(taxAmount));
    }

    public void calculateCabinetLineTotal(QuotationCabinet cabinet, BigDecimal marginPercentage, BigDecimal taxPercentage) {
        BigDecimal baseAmount;

        if (cabinet.getCalculatedSqft() != null) {
            baseAmount = cabinet.getUnitPrice().multiply(cabinet.getCalculatedSqft()).multiply(BigDecimal.valueOf(cabinet.getQuantity()));
        } else {
            baseAmount = cabinet.getUnitPrice().multiply(BigDecimal.valueOf(cabinet.getQuantity()));
        }

        BigDecimal marginAmount = calculateMarginAmount(baseAmount, marginPercentage);
        BigDecimal taxAmount = calculateTaxAmount(baseAmount.add(marginAmount), taxPercentage);

        cabinet.setMarginAmount(marginAmount);
        cabinet.setTaxAmount(taxAmount);
        cabinet.setTotalPrice(baseAmount.add(marginAmount).add(taxAmount));
    }

    public void calculateDoorLineTotal(QuotationDoor door, BigDecimal marginPercentage, BigDecimal taxPercentage) {
        BigDecimal baseAmount;

        if (door.getCalculatedSqft() != null) {
            baseAmount = door.getUnitPrice().multiply(door.getCalculatedSqft()).multiply(BigDecimal.valueOf(door.getQuantity()));
        } else {
            baseAmount = door.getUnitPrice().multiply(BigDecimal.valueOf(door.getQuantity()));
        }

        BigDecimal marginAmount = calculateMarginAmount(baseAmount, marginPercentage);
        BigDecimal taxAmount = calculateTaxAmount(baseAmount.add(marginAmount), taxPercentage);

        door.setMarginAmount(marginAmount);
        door.setTaxAmount(taxAmount);
        door.setTotalPrice(baseAmount.add(marginAmount).add(taxAmount));
    }

    public void calculateLightingLineTotal(QuotationLighting lighting, BigDecimal marginPercentage, BigDecimal taxPercentage) {
        BigDecimal baseAmount = lighting.getUnitPrice().multiply(lighting.getQuantity());
        BigDecimal marginAmount = calculateMarginAmount(baseAmount, marginPercentage);
        BigDecimal taxAmount = calculateTaxAmount(baseAmount.add(marginAmount), taxPercentage);

        lighting.setMarginAmount(marginAmount);
        lighting.setTaxAmount(taxAmount);
        lighting.setTotalPrice(baseAmount.add(marginAmount).add(taxAmount));
    }
}