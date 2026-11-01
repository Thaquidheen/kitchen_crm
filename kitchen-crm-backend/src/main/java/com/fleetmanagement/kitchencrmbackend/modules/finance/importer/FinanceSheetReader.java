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
    public static final int MAX_ROWS = 2000;
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
            for (int r = 0; r <= last; r++) {
                Row row = sheet.getRow(r);
                List<String> cells = new ArrayList<>();
                if (row != null) {
                    for (int c = 0; c < Math.max(0, row.getLastCellNum()); c++) {
                        cells.add(cellText(row.getCell(c), formatter));
                    }
                }
                lines.add(cells);
                if (lines.size() > MAX_ROWS + 50) {
                    break;
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
     * Text of one cell. Dates become yyyy-MM-dd and numbers their plain value, whatever the cell's
     * display format, so "₹1,00,000" formatting or a dd/MM display never changes what is read.
     */
    private static String cellText(Cell cell, DataFormatter formatter) {
        if (cell == null) {
            return "";
        }
        CellType type = cell.getCellType() == CellType.FORMULA ? cell.getCachedFormulaResultType() : cell.getCellType();
        switch (type) {
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                return BigDecimal.valueOf(cell.getNumericCellValue()).stripTrailingZeros().toPlainString();
            case STRING:
                return cell.getStringCellValue().trim();
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case BLANK:
            case ERROR:
                return "";
            default:
                return formatter.formatCellValue(cell).trim();
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
                lines.add(cells);
                cells = new ArrayList<>();
                if (lines.size() > MAX_ROWS + 50) {
                    return lines;
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
                cells.put(header, c < line.size() && line.get(c) != null ? line.get(c).trim() : "");
            }
            rows.add(new RawRow(i + 1, cells));
        }
        return new Table(headers, rows);
    }

    private static boolean blank(List<String> line) {
        return line == null || line.stream().allMatch(s -> s == null || s.isBlank());
    }
}
