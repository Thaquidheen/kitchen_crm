package com.fleetmanagement.kitchencrmbackend.modules.finance.importer;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;

import static com.fleetmanagement.kitchencrmbackend.modules.finance.importer.FinanceImportColumns.*;

/**
 * The Excel template for the finance import: an "Entries" sheet to fill (drop-downs for Type,
 * Mode and the active vendors), a filled-in "Example" sheet and a "How to fill" sheet. Only
 * "Entries" is read back, so the example rows can never be imported by accident.
 */
public final class FinanceImportTemplate {

    private static final int ROWS = 2000;

    private FinanceImportTemplate() {
    }

    public static byte[] build(List<String> vendorNames) {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            CellStyle head = wb.createCellStyle();
            Font bold = wb.createFont();
            bold.setBold(true);
            head.setFont(bold);
            head.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            head.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            head.setBorderBottom(BorderStyle.THIN);
            // Text, not a date format: Excel would re-read a typed 05-10-2026 with the PC's locale
            // (month first on many PCs) before the import ever saw it. As text it reaches the
            // import as typed, and the import reads it day first.
            CellStyle date = wb.createCellStyle();
            date.setDataFormat(wb.createDataFormat().getFormat("@"));
            CellStyle money = wb.createCellStyle();
            money.setDataFormat(wb.createDataFormat().getFormat("#,##0.00"));
            CellStyle wrap = wb.createCellStyle();
            wrap.setWrapText(true);

            Sheet entries = wb.createSheet(FinanceSheetReader.ENTRIES_SHEET);
            header(entries, head);
            entries.setDefaultColumnStyle(1, date);
            entries.setDefaultColumnStyle(4, money);
            entries.setDefaultColumnStyle(6, money);
            entries.createFreezePane(0, 1);

            Sheet example = wb.createSheet("Example");
            header(example, head);
            Object[][] rows = {
                    {PAYMENT_WORD, "01-10-2026", "", "", 200000, CA_WORD, "", "", "", "Advance", "Paid by bank transfer"},
                    {PAYMENT_WORD, "15-10-2026", "", "", 50000, CH_WORD, "", "", "", "Second instalment", ""},
                    {EXPENSE_WORD, "05-10-2026", "Installation", "Example Vendor", 219800, "", 20000, "", "", "Agreed 20,000 cash", ""},
                    {EXPENSE_WORD, "06-10-2026", "Ss Cabinet", "Example Steel", 111500, "", "", 40, "", "", ""},
                    {EXPENSE_WORD, "07-10-2026", "Transportation", "", 6000, CH_WORD, "", "", "", "All cash", ""},
                    {RELEASE_WORD, "20-10-2026", "Installation", "Example Vendor", 20000, CH_WORD, "", "", "", "", ""},
                    {RELEASE_WORD, "25-10-2026", "", "Example Steel", 50000, CA_WORD, "", "", "", "Part payment", ""},
            };
            for (int r = 0; r < rows.length; r++) {
                Row row = example.createRow(r + 1);
                for (int c = 0; c < rows[r].length; c++) {
                    Object v = rows[r][c];
                    if (v instanceof Number n) {
                        row.createCell(c).setCellValue(n.doubleValue());
                    } else if (!"".equals(v)) {
                        row.createCell(c).setCellValue((String) v);
                    }
                }
            }

            Sheet how = wb.createSheet("How to fill");
            String[][] help = {
                    {"Column", "What to write"},
                    {TYPE, PAYMENT_WORD + " (money from the customer), " + EXPENSE_WORD + " (an expense line) or "
                            + RELEASE_WORD + " (money paid to a vendor). Needed on every row."},
                    {DATE, "Like 05-10-2026 (day first). Needed for payments and releases."},
                    {EXPENSE, "Expenses: the line's name (needed). Releases: optional, the expense line this payment is for"
                            + " (a line already saved or one in this file)."},
                    {VENDOR, "Expenses: optional. Releases: needed. Must be an active vendor, spelled as in Vendors."},
                    {AMOUNT, "In rupees, more than zero. Expenses may leave it empty and price the line later."},
                    {MODE, CH_WORD + " or " + CA_WORD + ". Needed for payments and releases. On an expense with no split"
                            + " columns it puts the whole line in that one."},
                    {CH_AMOUNT, "Expenses only: the rupees paid in cash; the rest is cash in account."},
                    {CH_PCT, "Expenses only, instead of the amount: the cash share in percent (for example 40)."
                            + " With neither, the line is all cash in hand."},
                    {QUOTATION, "Expenses only, optional: one of this customer's quotation numbers."},
                    {NOTE, "Optional, any row."},
                    {COMMENT, "Optional, payments received only."},
                    {"", ""},
                    {"Rules", "Only the \"" + FinanceSheetReader.ENTRIES_SHEET + "\" sheet is read. Fill one row per entry."
                            + " The file is checked first and nothing is saved until every row is right;"
                            + " then all rows are saved together. A CSV with the same columns works too."},
            };
            for (int r = 0; r < help.length; r++) {
                Row row = how.createRow(r);
                for (int c = 0; c < 2; c++) {
                    row.createCell(c).setCellValue(help[r][c]);
                    row.getCell(c).setCellStyle(r == 0 ? head : wrap);
                }
            }
            how.setColumnWidth(0, 24 * 256);
            how.setColumnWidth(1, 100 * 256);

            DataValidationHelper dv = entries.getDataValidationHelper();
            addList(entries, dv, dv.createExplicitListConstraint(new String[]{PAYMENT_WORD, EXPENSE_WORD, RELEASE_WORD}), 0);
            addList(entries, dv, dv.createExplicitListConstraint(new String[]{CH_WORD, CA_WORD}), 5);
            if (!vendorNames.isEmpty()) {
                Sheet lists = wb.createSheet("Lists");
                for (int i = 0; i < vendorNames.size(); i++) {
                    lists.createRow(i).createCell(0).setCellValue(vendorNames.get(i));
                }
                wb.setSheetHidden(wb.getSheetIndex(lists), true);
                addList(entries, dv, dv.createFormulaListConstraint("Lists!$A$1:$A$" + vendorNames.size()), 3);
            }
            wb.setActiveSheet(0);
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static void header(Sheet sheet, CellStyle style) {
        Row row = sheet.createRow(0);
        for (int c = 0; c < ALL.size(); c++) {
            row.createCell(c).setCellValue(ALL.get(c));
            row.getCell(c).setCellStyle(style);
            sheet.setColumnWidth(c, (c == 2 || c == 3 || c == 9 || c == 10 ? 22 : 16) * 256);
        }
    }

    private static void addList(Sheet sheet, DataValidationHelper dv, DataValidationConstraint constraint, int column) {
        DataValidation v = dv.createValidation(constraint, new CellRangeAddressList(1, ROWS, column, column));
        v.setShowErrorBox(true);
        v.setSuppressDropDownArrow(true);
        sheet.addValidationData(v);
    }
}
