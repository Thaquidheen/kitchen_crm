package com.fleetmanagement.kitchencrmbackend.modules.finance.importer;

import com.fleetmanagement.kitchencrmbackend.modules.finance.entity.FinanceIncomePayment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * What the finance import's columns are called and how their values are read. Headers and words
 * are matched loosely (case, spaces and punctuation ignored) so a sheet the owner already keeps
 * can be uploaded without renaming every column.
 */
public final class FinanceImportColumns {

    public enum Kind { PAYMENT, EXPENSE, RELEASE }

    public static final String TYPE = "Type";
    public static final String DATE = "Date";
    public static final String EXPENSE = "Expense Name";
    public static final String VENDOR = "Vendor";
    public static final String AMOUNT = "Amount";
    public static final String MODE = "Mode";
    public static final String CH_AMOUNT = "Cash in Hand Amount";
    public static final String CH_PCT = "Cash in Hand %";
    /** Not in the template: read when a sheet has them instead of the cash in hand columns. */
    public static final String CA_AMOUNT = "Cash in Account Amount";
    public static final String CA_PCT = "Cash in Account %";
    /** A bare "Cash in Hand" column: rupees, or a percentage when the value ends in %. */
    public static final String CH_EITHER = "Cash in Hand";
    public static final String CA_EITHER = "Cash in Account";
    public static final String QUOTATION = "Quotation No";
    public static final String NOTE = "Note";
    public static final String COMMENT = "Comment";

    /** The template's columns, in order. */
    public static final List<String> ALL = List.of(TYPE, DATE, EXPENSE, VENDOR, AMOUNT, MODE, CH_AMOUNT, CH_PCT, QUOTATION, NOTE, COMMENT);

    /** What the template's Type drop-down offers. */
    public static final String PAYMENT_WORD = "Payment received";
    public static final String EXPENSE_WORD = "Expense";
    public static final String RELEASE_WORD = "Vendor release";
    public static final String CH_WORD = "Cash in Hand";
    public static final String CA_WORD = "Cash in Account";

    private static final Map<String, String> HEADER_ALIASES = new LinkedHashMap<>();
    private static final Map<String, Kind> KIND_WORDS = new LinkedHashMap<>();
    private static final Map<String, FinanceIncomePayment.PaymentMode> MODE_WORDS = new LinkedHashMap<>();

    static {
        alias(TYPE, "type", "entry", "entrytype", "kind", "category");
        alias(DATE, "date", "paymentdate", "expensedate", "releasedate", "paiddate", "day");
        alias(EXPENSE, "expensename", "expense", "title", "item", "description", "particulars", "expenseline", "line", "work");
        alias(VENDOR, "vendor", "vendorname", "supplier", "paidto", "party");
        alias(AMOUNT, "amount", "amt", "amountrs", "amountinr", "rs", "inr", "total", "value");
        alias(MODE, "mode", "paymentmode", "paidby", "paidvia", "cashorbank", "bucket", "method", "chca");
        alias(CH_AMOUNT, "cashinhandamount", "chamount", "cashamount", "cashinhandrs", "cashpart", "cashinhandamt");
        alias(CH_PCT, "cashinhandpct", "cashinhandpercent", "cashinhandpercentage", "chpct", "chpercent", "cashpct", "cashpercent");
        alias(CH_EITHER, "cashinhand", "ch", "cash");
        alias(CA_AMOUNT, "cashinaccountamount", "caamount", "bankamount", "cashinaccountrs", "cashinaccountamt");
        alias(CA_PCT, "cashinaccountpct", "cashinaccountpercent", "cashinaccountpercentage", "capct", "capercent", "bankpct", "bankpercent");
        alias(QUOTATION, "quotationno", "quotationnumber", "quotation", "quoteno", "quotenumber", "quote");
        alias(NOTE, "note", "notes", "remark", "remarks", "narration");
        alias(COMMENT, "comment", "comments");

        kind(Kind.PAYMENT, "paymentreceived", "payment", "received", "receipt", "income", "customerpayment", "fromcustomer");
        kind(Kind.EXPENSE, "expense", "expenseline", "expenses", "cost", "bill");
        kind(Kind.RELEASE, "vendorrelease", "release", "released", "vendorpayment", "paymentreleased", "paidtovendor");

        mode(FinanceIncomePayment.PaymentMode.CASH_IN_HAND, "cashinhand", "ch", "cash", "hand", "incash");
        mode(FinanceIncomePayment.PaymentMode.CASH_IN_ACCOUNT, "cashinaccount", "ca", "account", "bank", "banktransfer",
                "upi", "neft", "rtgs", "imps", "cheque", "check", "online", "transfer", "card", "gpay", "phonepe");
    }

    private static void alias(String column, String... words) {
        for (String w : words) {
            HEADER_ALIASES.put(w, column);
        }
    }

    private static void kind(Kind k, String... words) {
        for (String w : words) {
            KIND_WORDS.put(w, k);
        }
    }

    private static void mode(FinanceIncomePayment.PaymentMode m, String... words) {
        for (String w : words) {
            MODE_WORDS.put(w, m);
        }
    }

    private FinanceImportColumns() {
    }

    /** Lower case letters and digits only: "Cash in Hand %" and "cash-in-hand" both become "cashinhand". */
    public static String squash(String s) {
        return s == null ? "" : s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    /**
     * The column a header means, or null when it is not one the import reads. A "%" in the header
     * is meaningful ("Cash in Hand %" is not "Cash in Hand"), so it is looked at before squashing.
     */
    public static String columnOf(String header) {
        String key = squash(header);
        if (header != null && header.contains("%")) {
            if (key.equals("cashinhand") || key.equals("ch") || key.equals("cash")) {
                return CH_PCT;
            }
            if (key.equals("cashinaccount") || key.equals("ca") || key.equals("bank")) {
                return CA_PCT;
            }
        }
        if (key.equals("cashinaccount") || key.equals("bank")) {
            return CA_EITHER;
        }
        return HEADER_ALIASES.get(key);
    }

    public static Kind kindOf(String value) {
        return KIND_WORDS.get(squash(value));
    }

    public static FinanceIncomePayment.PaymentMode modeOf(String value) {
        return MODE_WORDS.get(squash(value));
    }

    /** Rupees as written: "₹1,00,000.50", "Rs. 2000", "15000/-". Null when not a number. */
    public static BigDecimal amountOf(String value) {
        if (value == null) {
            return null;
        }
        String s = value.replaceAll("(?i)(rs\\.?|inr|₹|/-|,|\\s)", "");
        if (s.isEmpty()) {
            return null;
        }
        try {
            return new BigDecimal(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** A percentage: "40", "40%", "40.5 %". Null when not a number. */
    public static BigDecimal pctOf(String value) {
        if (value == null) {
            return null;
        }
        String s = value.replace("%", "").trim();
        if (s.isEmpty()) {
            return null;
        }
        try {
            return new BigDecimal(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            fmt("uuuu-M-d"), fmt("d-M-uuuu"), fmt("d/M/uuuu"), fmt("d.M.uuuu"),
            fmt("d-MMM-uuuu"), fmt("d MMM uuuu"), fmt("d/MMM/uuuu"), fmt("d-MMMM-uuuu"), fmt("d MMMM uuuu"),
            fmt("d-M-uu"), fmt("d/M/uu"), fmt("d.M.uu"), fmt("d-MMM-uu"), fmt("d MMM uu"));

    private static DateTimeFormatter fmt(String pattern) {
        return new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern(pattern)
                .toFormatter(Locale.ENGLISH).withResolverStyle(java.time.format.ResolverStyle.STRICT);
    }

    /**
     * A date as written. Day comes before month (as in India): 05/10/2026 is 5 October. A bare
     * number between 20000 and 80000 is an Excel date serial that lost its date format.
     * Null when it is not a date.
     */
    public static LocalDate dateOf(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String s = value.trim();
        // "2026-10-05 00:00:00" or "2026-10-05T00:00" from some exports
        if (s.length() > 10 && s.matches("\\d{4}-\\d{1,2}-\\d{1,2}[ T].*")) {
            s = s.substring(0, s.indexOf(s.contains("T") ? 'T' : ' '));
        }
        if (s.matches("\\d{5}(\\.0+)?")) {
            int serial = Integer.parseInt(s.replaceAll("\\..*", ""));
            if (serial > 20000 && serial < 80000) {
                return LocalDate.of(1899, 12, 30).plusDays(serial);
            }
        }
        for (DateTimeFormatter f : DATE_FORMATS) {
            try {
                return LocalDate.parse(s, f);
            } catch (DateTimeParseException ignored) {
                // try the next pattern
            }
        }
        return null;
    }

    /** "Cash in Hand" / "Cash in Account" for a mode, as the sheet and the screen say it. */
    public static String modeWord(FinanceIncomePayment.PaymentMode m) {
        return m == FinanceIncomePayment.PaymentMode.CASH_IN_HAND ? CH_WORD : CA_WORD;
    }
}
