package com.fleetmanagement.kitchencrmbackend.modules.finance.importer;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Reads an uploaded .xlsx, .xls or .csv into header-keyed text rows for the finance import.
 * Nothing here knows what the columns mean; the import in FinanceServiceImpl does. Problems with the
 * file itself (wrong type, unreadable, too big, no header) come back as a ReadProblem
 * ({@link ReadProblem}) with a message meant for the person who uploaded it.
 */
public final class FinanceSheetReader {

    public static final long MAX_BYTES = 5L * 1024 * 1024;
    /** An .xlsx is a zip; what it unpacks to is what POI holds in memory. */
    private static final long MAX_UNZIPPED_BYTES = 60L * 1024 * 1024;
    public static final int MAX_ROWS = 2000;
    /** Lines read at all, blank ones included: a file of nothing but blank lines stops here. */
    private static final int MAX_LINES = 100_000;
    /** Shared by every blank line, so blank lines cost no memory of their own. */
    private static final List<String> BLANK = List.of();
    /** Starts the text a broken formula cell is read as; the import flags any cell that has it. */
    public static final String FORMULA_MARK = "(formula ";
    /** The template's data sheet; any other workbook is read from its first sheet. */
    public static final String ENTRIES_SHEET = "Entries";

    /** A problem with the file itself, worded for the person who uploaded it. */
    public static class ReadProblem extends IllegalArgumentException {
        public ReadProblem(String message) {
            super(message);
        }
    }

    /** One data row: its number as the spreadsheet shows it, and its cells by header. */
    public record RawRow(int rowNumber, Map<String, String> cells) {
    }

    /** The header cells as written, and the non-blank data rows under them. */
    public record Table(List<String> headers, List<RawRow> rows) {
    }

    private FinanceSheetReader() {
    }

    public static Table read(String fileName, byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new ReadProblem("The file is empty");
        }
        if (bytes.length > MAX_BYTES) {
            throw new ReadProblem("The file is larger than 5 MB");
        }
        String name = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT).trim();
        if (name.endsWith(".csv") || name.endsWith(".txt")) {
            return fromLines(parseCsv(decode(bytes)));
        }
        if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
            return fromLines(readWorkbook(bytes));
        }
        throw new ReadProblem("Upload an Excel file (.xlsx or .xls) or a CSV file (.csv)");
    }

    // ------------------------------------------------------------------ Excel

    private static List<List<String>> readWorkbook(byte[] bytes) {
        checkUnzippedSize(bytes);
        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheet(ENTRIES_SHEET);
            if (sheet == null) {
                sheet = wb.getNumberOfSheets() > 0 ? wb.getSheetAt(0) : null;
            }
            if (sheet == null) {
                throw new ReadProblem("The workbook has no sheets");
            }
            DataFormatter formatter = new DataFormatter(Locale.ENGLISH);
            List<List<String>> lines = new ArrayList<>();
            int last = sheet.getLastRowNum();
            int filled = 0;
            for (int r = 0; r <= last; r++) {
                Row row = sheet.getRow(r);
                List<String> cells = new ArrayList<>();
                if (row != null) {
                    for (int c = 0; c < Math.max(0, row.getLastCellNum()); c++) {
                        cells.add(cellText(row.getCell(c), formatter));
                    }
                }
                // Blank lines are kept (row numbers stay right) but only filled ones count
                // towards the stop, so blank rows can never push real rows past it unseen.
                lines.add(blank(cells) ? BLANK : cells);
                if (!blank(cells) && ++filled > MAX_ROWS + 1) {
                    break;
                }
                if (lines.size() > MAX_LINES) {
                    throw new ReadProblem("The sheet has more than " + MAX_LINES + " lines. Delete the empty rows and retry");
                }
            }
            return lines;
        } catch (ReadProblem e) {
            throw e;
        } catch (org.apache.poi.EncryptedDocumentException e) {
            throw new ReadProblem("The Excel file is password-protected. Remove the password and retry");
        } catch (IOException | RuntimeException e) {
            throw new ReadProblem("The Excel file could not be read. Save it again as .xlsx and retry");
        }
    }

    /**
     * Text of one cell. Dates become yyyy-MM-dd and numbers their plain value whatever the
     * display format, so "₹1,00,000" formatting or a dd/MM display never changes what is read.
     * The exception is a percent format: Excel stores 40% as 0.4, so it is given back as "40%".
     * A formula error, or a formula Excel never calculated, comes back as text that no number
     * or date reader accepts, so the row is flagged instead of read as empty.
     */
    private static String cellText(Cell cell, DataFormatter formatter) {
        if (cell == null) {
            return "";
        }
        boolean formula = cell.getCellType() == CellType.FORMULA;
        // POI reports a never-calculated .xlsx formula as NUMERIC 0; look for the missing value.
        if (formula && cell instanceof org.apache.poi.xssf.usermodel.XSSFCell x
                && (!x.getCTCell().isSetV() || x.getCTCell().getV() == null || x.getCTCell().getV().isEmpty())) {
            return FORMULA_MARK + "with no value: " + cell.getCellFormula() + ")";
        }
        CellType type = formula ? cell.getCachedFormulaResultType() : cell.getCellType();
        switch (type) {
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                BigDecimal value = BigDecimal.valueOf(cell.getNumericCellValue());
                String format = cell.getCellStyle() == null ? null : cell.getCellStyle().getDataFormatString();
                if (format != null && format.replaceAll("\"[^\"]*\"|\\\\.", "").contains("%")) {
                    return value.movePointRight(2).stripTrailingZeros().toPlainString() + "%";
                }
                return value.stripTrailingZeros().toPlainString();
            case STRING:
                return cell.getStringCellValue().trim();
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case ERROR:
                return formula ? FORMULA_MARK + "error: " + cell.getCellFormula() + ")" : FORMULA_MARK + "error)";
            case BLANK:
                return formula ? FORMULA_MARK + "with no value: " + cell.getCellFormula() + ")" : "";
            default:
                return formatter.formatCellValue(cell).trim();
        }
    }

    /** Refuses an .xlsx that unpacks to far more than any finance sheet could need (a zip bomb). */
    private static void checkUnzippedSize(byte[] bytes) {
        if (bytes.length < 4 || bytes[0] != 'P' || bytes[1] != 'K') {
            return; // not a zip: an .xls, or not a workbook at all (POI says so below)
        }
        long total = 0;
        byte[] buf = new byte[64 * 1024];
        try (java.util.zip.ZipInputStream zip = new java.util.zip.ZipInputStream(new ByteArrayInputStream(bytes))) {
            while (zip.getNextEntry() != null) {
                int n;
                while ((n = zip.read(buf)) > 0) {
                    total += n;
                    if (total > MAX_UNZIPPED_BYTES) {
                        throw new ReadProblem("The Excel file is too large once opened. Keep only the entries sheet and retry");
                    }
                }
            }
        } catch (IOException e) {
            throw new ReadProblem("The Excel file could not be read. Save it again as .xlsx and retry");
        }
    }

    // ------------------------------------------------------------------ CSV

    /** UTF-8 (with or without BOM); a file that is not valid UTF-8 is read as Windows-1252. */
    private static String decode(byte[] bytes) {
        int start = bytes.length >= 3 && (bytes[0] & 0xFF) == 0xEF && (bytes[1] & 0xFF) == 0xBB && (bytes[2] & 0xFF) == 0xBF ? 3 : 0;
        ByteBuffer buf = ByteBuffer.wrap(bytes, start, bytes.length - start);
        try {
            return StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(buf).toString();
        } catch (CharacterCodingException e) {
            return new String(bytes, start, bytes.length - start, Charset.forName("windows-1252"));
        }
    }

    /** RFC 4180 with the separator guessed from the header line: comma, semicolon or tab. */
    static List<List<String>> parseCsv(String text) {
        char sep = guessSeparator(text);
        List<List<String>> lines = new ArrayList<>();
        List<String> cells = new ArrayList<>();
        StringBuilder cell = new StringBuilder();
        boolean quoted = false;
        int filled = 0;
        for (int i = 0; i < text.length(); i++) {
            char ch = text.charAt(i);
            if (quoted) {
                if (ch == '"') {
                    if (i + 1 < text.length() && text.charAt(i + 1) == '"') {
                        cell.append('"');
                        i++;
                    } else {
                        quoted = false;
                    }
                } else {
                    cell.append(ch);
                }
            } else if (ch == '"' && cell.toString().isBlank()) {
                cell.setLength(0);
                quoted = true;
            } else if (ch == sep) {
                cells.add(cell.toString().trim());
                cell.setLength(0);
            } else if (ch == '\n' || ch == '\r') {
                if (ch == '\r' && i + 1 < text.length() && text.charAt(i + 1) == '\n') {
                    i++;
                }
                cells.add(cell.toString().trim());
                cell.setLength(0);
                if (blank(cells)) {
                    lines.add(BLANK);
                    cells.clear();
                } else {
                    lines.add(cells);
                    if (++filled > MAX_ROWS + 1) {
                        return lines;
                    }
                    cells = new ArrayList<>();
                }
                if (lines.size() > MAX_LINES) {
                    throw new ReadProblem("The file has more than " + MAX_LINES + " lines. Delete the empty lines and retry");
                }
            } else {
                cell.append(ch);
            }
        }
        if (cell.length() > 0 || !cells.isEmpty()) {
            cells.add(cell.toString().trim());
            lines.add(cells);
        }
        return lines;
    }

    private static char guessSeparator(String text) {
        int end = text.indexOf('\n');
        String first = end < 0 ? text : text.substring(0, end);
        int commas = 0, semis = 0, tabs = 0;
        boolean quoted = false;
        for (char ch : first.toCharArray()) {
            if (ch == '"') {
                quoted = !quoted;
            } else if (!quoted) {
                if (ch == ',') commas++;
                else if (ch == ';') semis++;
                else if (ch == '\t') tabs++;
            }
        }
        if (tabs > commas && tabs >= semis) return '\t';
        if (semis > commas) return ';';
        return ',';
    }

    // ------------------------------------------------------------------ shared

    /**
     * The first non-blank line is the header; every later non-blank line is a row. Row numbers
     * are 1-based as the spreadsheet shows them, so an error can point at the right line.
     */
    private static Table fromLines(List<List<String>> lines) {
        int headerAt = -1;
        for (int i = 0; i < lines.size(); i++) {
            if (!blank(lines.get(i))) {
                headerAt = i;
                break;
            }
        }
        if (headerAt < 0) {
            throw new ReadProblem("The file has no rows");
        }
        List<String> headers = new ArrayList<>(lines.get(headerAt));
        List<RawRow> rows = new ArrayList<>();
        for (int i = headerAt + 1; i < lines.size(); i++) {
            List<String> line = lines.get(i);
            if (blank(line)) {
                continue;
            }
            if (rows.size() >= MAX_ROWS) {
                throw new ReadProblem("The file has more than " + MAX_ROWS + " rows. Split it into smaller files");
            }
            Map<String, String> cells = new LinkedHashMap<>();
            for (int c = 0; c < headers.size(); c++) {
                String header = headers.get(c) == null ? "" : headers.get(c).trim();
                if (header.isEmpty()) {
                    continue;
                }
                // A repeated header keeps its FIRST column, as the file notes say.
                cells.putIfAbsent(header, c < line.size() && line.get(c) != null ? line.get(c).trim() : "");
            }
            rows.add(new RawRow(i + 1, cells));
        }
        return new Table(headers, rows);
    }

    private static boolean blank(List<String> line) {
        return line == null || line.stream().allMatch(s -> s == null || s.isBlank());
    }
}
