package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.QuotationDto;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.QuotationKitchenDto;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.QuotationOtherExpenseDto;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Computes the MRP ("list price") for a quotation using PER-CATEGORY MRP margin% / tax%
 * (mirroring the per-category Offer pricing). Each product category and the miscellaneous
 * (services) group has its own MRP margin/tax. The result is a breakdown so the PDF can show
 * an MRP-based per-category split-up; mrpGrandTotal is the MRP figure shown on screen/saved.
 *
 * Single source of truth shared by the quotation DTO mapping (QuotationServiceImpl) and PDF
 * generation (JasperPdfGenerationServiceImpl). Rates are taken from the entity (always available)
 * because the DTO may hide margin percentages from non-admin roles.
 */
public final class QuotationMrpCalculator {

    private QuotationMrpCalculator() {}

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private static BigDecimal applyMarginTax(BigDecimal base, BigDecimal marginPct, BigDecimal taxPct) {
        BigDecimal b = nz(base);
        BigDecimal withMargin = b.add(b.multiply(nz(marginPct)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        return withMargin.add(withMargin.multiply(nz(taxPct)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
    }

    /** The 10 per-category + miscellaneous MRP margin/tax percentages. */
    public static final class MrpRates {
        public final BigDecimal accMargin, cabMargin, doorMargin, lightMargin;
        public final BigDecimal accTax, cabTax, doorTax, lightTax;
        public final BigDecimal miscMargin, miscTax;

        public MrpRates(BigDecimal accMargin, BigDecimal cabMargin, BigDecimal doorMargin, BigDecimal lightMargin,
                        BigDecimal accTax, BigDecimal cabTax, BigDecimal doorTax, BigDecimal lightTax,
                        BigDecimal miscMargin, BigDecimal miscTax) {
            this.accMargin = accMargin; this.cabMargin = cabMargin; this.doorMargin = doorMargin; this.lightMargin = lightMargin;
            this.accTax = accTax; this.cabTax = cabTax; this.doorTax = doorTax; this.lightTax = lightTax;
            this.miscMargin = miscMargin; this.miscTax = miscTax;
        }

        public static MrpRates from(Quotation q) {
            return new MrpRates(
                q.getAccessoriesMrpMarginPercentage(), q.getCabinetsMrpMarginPercentage(),
                q.getDoorsMrpMarginPercentage(), q.getLightingMrpMarginPercentage(),
                q.getAccessoriesMrpTaxPercentage(), q.getCabinetsMrpTaxPercentage(),
                q.getDoorsMrpTaxPercentage(), q.getLightingMrpTaxPercentage(),
                q.getMiscellaneousMrpMarginPercentage(), q.getMiscellaneousMrpTaxPercentage());
        }
    }

    /** Per-category MRP totals plus the grand total. */
    public static final class MrpBreakdown {
        public final BigDecimal accessories, cabinets, doors, lighting, misc, total;

        public MrpBreakdown(BigDecimal accessories, BigDecimal cabinets, BigDecimal doors,
                            BigDecimal lighting, BigDecimal misc) {
            this.accessories = accessories; this.cabinets = cabinets; this.doors = doors;
            this.lighting = lighting; this.misc = misc;
            this.total = accessories.add(cabinets).add(doors).add(lighting).add(misc);
        }
    }

    private static BigDecimal sumOtherExpenses(List<QuotationOtherExpenseDto> items) {
        BigDecimal sum = BigDecimal.ZERO;
        if (items != null) {
            for (QuotationOtherExpenseDto e : items) {
                sum = sum.add(nz(e.getAmount()));
            }
        }
        return sum;
    }

    /**
     * MRP breakdown for a single kitchen: per-category base x per-category MRP margin/tax, plus the
     * kitchen's own other-expenses (installation + custom; for a single kitchen this also includes
     * its transportation). The common (multi-kitchen) transportation is added at the quotation level.
     */
    public static MrpBreakdown computeKitchenMrp(QuotationKitchenDto k, MrpRates r) {
        BigDecimal acc = applyMarginTax(k.getAccessoriesBaseTotal(), r.accMargin, r.accTax);
        BigDecimal cab = applyMarginTax(k.getCabinetsBaseTotal(), r.cabMargin, r.cabTax);
        BigDecimal door = applyMarginTax(k.getDoorsBaseTotal(), r.doorMargin, r.doorTax);
        BigDecimal light = applyMarginTax(k.getLightingBaseTotal(), r.lightMargin, r.lightTax);
        BigDecimal misc = applyMarginTax(sumOtherExpenses(k.getOtherExpenses()), r.miscMargin, r.miscTax);
        return new MrpBreakdown(acc, cab, door, light, misc);
    }

    /** Quotation-level MRP breakdown (sum across kitchens + common transportation, or legacy single). */
    public static MrpBreakdown computeQuotationMrp(QuotationDto q, MrpRates r) {
        boolean isMultiKitchen = q.getKitchens() != null && !q.getKitchens().isEmpty();
        if (isMultiKitchen) {
            BigDecimal acc = BigDecimal.ZERO, cab = BigDecimal.ZERO, door = BigDecimal.ZERO,
                       light = BigDecimal.ZERO, misc = BigDecimal.ZERO;
            for (QuotationKitchenDto k : q.getKitchens()) {
                MrpBreakdown kb = computeKitchenMrp(k, r);
                acc = acc.add(kb.accessories);
                cab = cab.add(kb.cabinets);
                door = door.add(kb.doors);
                light = light.add(kb.lighting);
                misc = misc.add(kb.misc);
            }
            // Common transportation (quotation-level) priced with the miscellaneous MRP margin/tax.
            misc = misc.add(applyMarginTax(q.getTransportationPrice(), r.miscMargin, r.miscTax));
            return new MrpBreakdown(acc, cab, door, light, misc);
        }
        // No kitchens (legacy): quotation-level base totals + quotation-level other-expenses.
        BigDecimal acc = applyMarginTax(q.getAccessoriesBaseTotal(), r.accMargin, r.accTax);
        BigDecimal cab = applyMarginTax(q.getCabinetsBaseTotal(), r.cabMargin, r.cabTax);
        BigDecimal door = applyMarginTax(q.getDoorsBaseTotal(), r.doorMargin, r.doorTax);
        BigDecimal light = applyMarginTax(q.getLightingBaseTotal(), r.lightMargin, r.lightTax);
        BigDecimal misc = applyMarginTax(sumOtherExpenses(q.getOtherExpenses()), r.miscMargin, r.miscTax);
        return new MrpBreakdown(acc, cab, door, light, misc);
    }

    /** Convenience: the MRP grand total for the quotation. */
    public static BigDecimal computeMrpFinal(QuotationDto q, MrpRates r) {
        if (q == null) {
            return BigDecimal.ZERO;
        }
        return computeQuotationMrp(q, r).total;
    }
}
