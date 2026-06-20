package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.QuotationDto;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.QuotationKitchenDto;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.QuotationOtherExpenseDto;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Computes the MRP ("list price") for a quotation: the sum of all BASE prices
 * (accessories + cabinets + doors + lighting + installation + custom other-expenses +
 * common transportation, before per-category margin/tax) with ONE common margin% and
 * tax% applied. A single figure for the whole quotation (common across kitchens).
 *
 * Single source of truth shared by the quotation DTO mapping (QuotationServiceImpl) and
 * PDF generation (JasperPdfGenerationServiceImpl) so the saved-quotation view and the PDF
 * always show the same MRP value.
 */
public final class QuotationMrpCalculator {

    private QuotationMrpCalculator() {}

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    /** Uses the DTO's own marginPercentage/taxPercentage. */
    public static BigDecimal computeMrpFinal(QuotationDto quotation) {
        if (quotation == null) {
            return BigDecimal.ZERO;
        }
        return computeMrpFinal(quotation, quotation.getMarginPercentage(), quotation.getTaxPercentage());
    }

    /**
     * Uses explicit margin/tax — needed when the DTO hides marginPercentage from non-admin roles,
     * so callers can pass the real (entity) values to keep the MRP correct for everyone.
     */
    public static BigDecimal computeMrpFinal(QuotationDto quotation, BigDecimal marginPct, BigDecimal taxPct) {
        if (quotation == null) {
            return BigDecimal.ZERO;
        }

        boolean isMultiKitchen = quotation.getKitchens() != null && !quotation.getKitchens().isEmpty();

        BigDecimal categoryBase = nz(quotation.getAccessoriesBaseTotal())
                .add(nz(quotation.getCabinetsBaseTotal()))
                .add(nz(quotation.getDoorsBaseTotal()))
                .add(nz(quotation.getLightingBaseTotal()));

        BigDecimal servicesBase = BigDecimal.ZERO;
        if (isMultiKitchen) {
            // Each kitchen's other-expenses (installation + custom; for 2+ kitchens this
            // excludes transportation, for a single kitchen it includes it).
            for (QuotationKitchenDto k : quotation.getKitchens()) {
                if (k.getOtherExpenses() != null) {
                    for (QuotationOtherExpenseDto e : k.getOtherExpenses()) {
                        servicesBase = servicesBase.add(nz(e.getAmount()));
                    }
                }
            }
            // Add the single common transportation once (0 for a single kitchen, where it is
            // already inside that kitchen's other-expenses).
            servicesBase = servicesBase.add(nz(quotation.getTransportationPrice()));
        } else {
            // No kitchens (legacy): quotation-level other-expenses already include
            // transportation + installation.
            if (quotation.getOtherExpenses() != null) {
                for (QuotationOtherExpenseDto e : quotation.getOtherExpenses()) {
                    servicesBase = servicesBase.add(nz(e.getAmount()));
                }
            }
        }

        BigDecimal base = categoryBase.add(servicesBase);
        BigDecimal m = nz(marginPct);
        BigDecimal t = nz(taxPct);
        BigDecimal withMargin = base.add(base.multiply(m).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        return withMargin.add(withMargin.multiply(t).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
    }
}
