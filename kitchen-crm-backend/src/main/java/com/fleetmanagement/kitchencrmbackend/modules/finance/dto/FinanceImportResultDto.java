package com.fleetmanagement.kitchencrmbackend.modules.finance.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * What an uploaded sheet would add (a check) or did add (an import) to one customer's finance.
 * Nothing is saved unless every row is valid; {@link #imported} says whether it was.
 */
@Data
public class FinanceImportResultDto {
    /** True only when the rows were saved. A check, or a file with any error, saves nothing. */
    private boolean imported;
    private int payments;
    private int expenses;
    private int releases;
    private int errorCount;
    private int warningCount;
    /** About the file rather than a row: columns that are not read, a column given twice. */
    private List<String> fileNotes = new ArrayList<>();
    private List<Row> rows = new ArrayList<>();
    private Totals before;
    /** The totals once these rows are in. Null when there are errors. */
    private Totals after;

    @Data
    public static class Row {
        /** As the spreadsheet numbers it, header included. */
        private int rowNumber;
        /** PAYMENT, EXPENSE or RELEASE; null when the type could not be read. */
        private String type;
        private LocalDate date;
        private String expenseName;
        private String vendorName;
        private BigDecimal amount;
        /** CASH_IN_HAND or CASH_IN_ACCOUNT, for payments and releases. */
        private String mode;
        /** For expenses: the split as it will be saved. */
        private BigDecimal cashInHandAmount;
        private BigDecimal cashInAccountAmount;
        private String quotationNumber;
        private String note;
        private List<String> errors = new ArrayList<>();
        private List<String> warnings = new ArrayList<>();
    }

    @Data
    public static class Totals {
        private BigDecimal receivedTotal;
        private BigDecimal expenseTotal;
        private BigDecimal releasedTotal;
        private BigDecimal outstandingTotal;
        private BigDecimal extraTotal;
        private BigDecimal totalMargin;
        private BigDecimal netMargin;
    }
}
