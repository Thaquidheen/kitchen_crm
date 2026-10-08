package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

/**
 * What the person asking may see, and set, of a quotation's prices.
 *
 * <p>It travels through the quotation service in the {@code userRole} argument that was already
 * there: the administrator's role means everything, and for anyone else the role is followed by
 * what the administrator allowed their staff type on the Permissions page. A bare role — which is
 * what the PDF and the other internal callers pass — means the customer-facing figures only, as
 * it always did.
 *
 * <p>Two things are kept apart, because a quotation shows them apart: the <b>rates</b> (each
 * line's unit price and each category's total before margin) and the <b>margins</b> (percentage
 * and amount). Whatever is not shown is not accepted back either: nobody sets a margin they
 * cannot see, and rates are set by the administrator alone — for everyone else the server works
 * them out, whatever their screen sends.
 */
public final class PricingView {

    /** The administrator: sees and sets everything. */
    public static final String FULL = "ROLE_SUPER_ADMIN";

    private static final String RATES = "+rates";
    private static final String MARGINS = "+margins";
    private static final String SET_MARGINS = "+setmargins";

    private PricingView() {
    }

    public static String of(String role, boolean seesRates, boolean seesMargins, boolean setsMargins) {
        if (FULL.equals(role)) {
            return FULL;
        }
        StringBuilder view = new StringBuilder(role == null ? "" : role);
        if (seesRates) {
            view.append(RATES);
        }
        if (seesMargins) {
            view.append(MARGINS);
            if (setsMargins) {
                view.append(SET_MARGINS);
            }
        }
        return view.toString();
    }

    /** Unit prices, and totals before margin. */
    public static boolean seesRates(String view) {
        return FULL.equals(view) || has(view, RATES);
    }

    /** Margin percentages and margin amounts. */
    public static boolean seesMargins(String view) {
        return FULL.equals(view) || has(view, MARGINS);
    }

    public static boolean setsMargins(String view) {
        return FULL.equals(view) || has(view, SET_MARGINS);
    }

    /** A price sent for a line is taken from the administrator only. */
    public static boolean setsRates(String view) {
        return FULL.equals(view);
    }

    private static boolean has(String view, String flag) {
        return view != null && view.contains(flag);
    }
}
