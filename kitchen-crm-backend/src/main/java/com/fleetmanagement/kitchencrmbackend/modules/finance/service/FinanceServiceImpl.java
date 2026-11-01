package com.fleetmanagement.kitchencrmbackend.modules.finance.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.finance.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.finance.entity.*;
import com.fleetmanagement.kitchencrmbackend.modules.finance.importer.FinanceImportColumns;
import com.fleetmanagement.kitchencrmbackend.modules.finance.importer.FinanceImportColumns.Kind;
import com.fleetmanagement.kitchencrmbackend.modules.finance.importer.FinanceSheetReader;
import com.fleetmanagement.kitchencrmbackend.modules.finance.repository.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.entity.Vendor;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.repository.VendorRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Income & Expenses per customer. Every balance and margin is derived here, never stored:
 * received sums come from finance_income_payments, released sums from finance_vendor_releases,
 * totalMargin = totalAmount - SUM(expenses), collectedMargin = SUM(payments) - SUM(releases),
 * netMargin = totalMargin - extraTotal (extra = released beyond expensed, per vendor).
 * Over-collection is allowed and flagged, not blocked, so real money can always be recorded.
 */
@Slf4j
@Service
@Transactional
public class FinanceServiceImpl implements FinanceService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "pdf");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/png", "application/pdf");
    private static final long MAX_FILE_BYTES = 20L * 1024 * 1024;
    private static final int MAX_BATCH_FILES = 10;

    @Value("${app.finance-receipt-upload-dir:uploads/finance-receipts}")
    private String receiptUploadDir;

    @Autowired
    private CustomerFinanceRepository financeRepository;
    @Autowired
    private FinanceIncomePaymentRepository paymentRepository;
    @Autowired
    private FinanceExpenseRepository expenseRepository;
    @Autowired
    private FinanceVendorReleaseRepository releaseRepository;
    @Autowired
    private FinanceReceiptFileRepository receiptRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private QuotationRepository quotationRepository;
    @Autowired
    private VendorRepository vendorRepository;

    // ------------------------------------------------------------------ list & create

    @Override
    public ApiResponse<Page<FinanceListRowDto>> getList(String search, Pageable pageable) {
        String q = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<CustomerFinance> page = financeRepository.search(q, pageable);

        List<Long> ids = page.getContent().stream().map(CustomerFinance::getId).toList();
        Map<Long, BigDecimal> received = sumsToMap(ids.isEmpty() ? List.of() : paymentRepository.sumByFinanceIds(ids));
        Map<Long, BigDecimal> expenses = sumsToMap(ids.isEmpty() ? List.of() : expenseRepository.sumByFinanceIds(ids));
        Map<Long, Long> payCounts = new HashMap<>();
        if (!ids.isEmpty()) {
            for (Object[] row : paymentRepository.countByFinanceIds(ids)) {
                payCounts.put((Long) row[0], (Long) row[1]);
            }
        }

        Page<FinanceListRowDto> rows = page.map(f -> {
            BigDecimal rec = received.getOrDefault(f.getId(), BigDecimal.ZERO);
            BigDecimal exp = expenses.getOrDefault(f.getId(), BigDecimal.ZERO);
            FinanceListRowDto row = new FinanceListRowDto();
            row.setFinanceId(f.getId());
            row.setCustomerId(f.getCustomer().getId());
            row.setCustomerName(f.getCustomer().getName());
            row.setCustomerContact(f.getCustomer().getContact());
            row.setCustomerPlace(f.getCustomer().getPlace());
            row.setTotalAmount(nz(f.getTotalAmount()));
            row.setReceivedTotal(rec);
            row.setTotalBalance(nz(f.getTotalAmount()).subtract(rec));
            row.setExpenseTotal(exp);
            row.setTotalMargin(nz(f.getTotalAmount()).subtract(exp));
            row.setPaymentCount(payCounts.getOrDefault(f.getId(), 0L));
            return row;
        });
        return ApiResponse.success(rows);
    }

    @Override
    public ApiResponse<List<Map<String, Object>>> getEligibleCustomers(String search) {
        String q = (search != null && !search.isBlank()) ? search.trim() : null;
        List<Customer> customers = financeRepository.findEligibleCustomers(q, PageRequest.of(0, 10));
        List<Map<String, Object>> out = new ArrayList<>();
        for (Customer c : customers) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("name", c.getName());
            m.put("contact", c.getContact());
            m.put("place", c.getPlace());
            out.add(m);
        }
        return ApiResponse.success(out);
    }

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> create(FinanceCreateDto dto, String createdBy) {
        Customer customer = customerRepository.findById(dto.getCustomerId()).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }
        if (financeRepository.existsByCustomerId(dto.getCustomerId())) {
            return ApiResponse.error("Finance tracking already exists for this customer");
        }
        CustomerFinance finance = new CustomerFinance();
        finance.setCustomer(customer);
        finance.setTotalAmount(nz(dto.getTotalAmount()));
        finance.setCommittedCashInHand(nz(dto.getCommittedCashInHand()));
        finance.setCommittedCashInAccount(nz(dto.getCommittedCashInAccount()));
        finance.setNotes(dto.getNotes());
        finance.setCreatedBy(createdBy);
        finance = financeRepository.save(finance);
        return ApiResponse.success("Finance tracking started", buildSummary(finance));
    }

    // ------------------------------------------------------------------ summary & header

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> getSummary(Long financeId) {
        CustomerFinance finance = financeRepository.findById(financeId).orElse(null);
        if (finance == null) {
            return ApiResponse.error("Finance record not found");
        }
        return ApiResponse.success(buildSummary(finance));
    }

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> getSummaryByCustomer(Long customerId) {
        CustomerFinance finance = financeRepository.findByCustomerId(customerId).orElse(null);
        if (finance == null) {
            return ApiResponse.error("No finance tracking for this customer yet");
        }
        return ApiResponse.success(buildSummary(finance));
    }

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> updateHeader(Long financeId, FinanceHeaderUpdateDto dto) {
        CustomerFinance finance = financeRepository.findById(financeId).orElse(null);
        if (finance == null) {
            return ApiResponse.error("Finance record not found");
        }
        finance.setTotalAmount(nz(dto.getTotalAmount()));
        finance.setCommittedCashInHand(nz(dto.getCommittedCashInHand()));
        finance.setCommittedCashInAccount(nz(dto.getCommittedCashInAccount()));
        finance.setNotes(dto.getNotes());
        return ApiResponse.success("Finance header updated", buildSummary(financeRepository.save(finance)));
    }

    @Override
    public ApiResponse<String> delete(Long financeId) {
        CustomerFinance finance = financeRepository.findById(financeId).orElse(null);
        if (finance == null) {
            return ApiResponse.error("Finance record not found");
        }
        List<FinanceIncomePayment> payments = paymentRepository.findByFinanceIdOrderByPaymentDateAscIdAsc(financeId);
        List<FinanceExpense> expenses = expenseRepository.findByFinanceIdOrderByIdAsc(financeId);
        List<FinanceVendorRelease> releases = releaseRepository.findByFinanceIdOrderByReleaseDateAscIdAsc(financeId);
        List<FinanceReceiptFile> receipts = new ArrayList<>();
        if (!payments.isEmpty()) {
            receipts.addAll(receiptRepository.findByPaymentIdIn(payments.stream().map(FinanceIncomePayment::getId).toList()));
        }
        if (!expenses.isEmpty()) {
            receipts.addAll(receiptRepository.findByExpenseIdIn(expenses.stream().map(FinanceExpense::getId).toList()));
        }
        if (!releases.isEmpty()) {
            receipts.addAll(receiptRepository.findByReleaseIdIn(releases.stream().map(FinanceVendorRelease::getId).toList()));
        }
        List<String> fileUrls = receipts.stream().map(FinanceReceiptFile::getFileUrl).toList();
        // These rows are loaded (managed) to find their receipt files, so they are removed explicitly,
        // leaves first. Leaving them to the DB cascade failed every delete of a record with payments:
        // at flush a managed payment still pointing at the removed finance row is a
        // TransientObjectException, and the whole delete rolled back.
        receiptRepository.deleteAll(receipts);
        releaseRepository.deleteAll(releases);
        paymentRepository.deleteAll(payments);
        expenseRepository.deleteAll(expenses);
        financeRepository.delete(finance);
        deleteStoredFilesAfterCommit(fileUrls);
        return ApiResponse.success("Finance record deleted");
    }

    // ------------------------------------------------------------------ payments

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> addPayment(Long financeId, PaymentRequestDto dto, String createdBy) {
        CustomerFinance finance = financeRepository.findById(financeId).orElse(null);
        if (finance == null) {
            return ApiResponse.error("Finance record not found");
        }
        FinanceIncomePayment payment = new FinanceIncomePayment();
        payment.setFinance(finance);
        applyPayment(payment, dto);
        payment.setCreatedBy(createdBy);
        paymentRepository.save(payment);
        return ApiResponse.success("Payment recorded", buildSummary(finance));
    }

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> updatePayment(Long paymentId, PaymentRequestDto dto) {
        FinanceIncomePayment payment = paymentRepository.findById(paymentId).orElse(null);
        if (payment == null) {
            return ApiResponse.error("Payment not found");
        }
        applyPayment(payment, dto);
        paymentRepository.save(payment);
        return ApiResponse.success("Payment updated", buildSummary(payment.getFinance()));
    }

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> deletePayment(Long paymentId) {
        FinanceIncomePayment payment = paymentRepository.findById(paymentId).orElse(null);
        if (payment == null) {
            return ApiResponse.error("Payment not found");
        }
        CustomerFinance finance = payment.getFinance();
        // Receipts first: a loaded receipt still pointing at the removed payment fails the flush.
        List<FinanceReceiptFile> receipts = receiptRepository.findByPaymentId(paymentId);
        List<String> fileUrls = receipts.stream().map(FinanceReceiptFile::getFileUrl).toList();
        receiptRepository.deleteAll(receipts);
        paymentRepository.delete(payment);
        deleteStoredFilesAfterCommit(fileUrls);
        return ApiResponse.success("Payment deleted", buildSummary(finance));
    }

    private void applyPayment(FinanceIncomePayment payment, PaymentRequestDto dto) {
        payment.setAmount(dto.getAmount());
        payment.setMode(dto.getMode());
        payment.setPaymentDate(dto.getPaymentDate());
        payment.setNote(dto.getNote());
        payment.setComment(dto.getComment());
    }

    // ------------------------------------------------------------------ expenses

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> addExpense(Long financeId, ExpenseRequestDto dto, String createdBy) {
        CustomerFinance finance = financeRepository.findById(financeId).orElse(null);
        if (finance == null) {
            return ApiResponse.error("Finance record not found");
        }
        FinanceExpense expense = new FinanceExpense();
        expense.setFinance(finance);
        String error = applyExpense(expense, dto, finance);
        if (error != null) {
            return ApiResponse.error(error);
        }
        expense.setCreatedBy(createdBy);
        expenseRepository.save(expense);
        return ApiResponse.success("Expense added", buildSummary(finance));
    }

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> updateExpense(Long expenseId, ExpenseRequestDto dto) {
        FinanceExpense expense = expenseRepository.findById(expenseId).orElse(null);
        if (expense == null) {
            return ApiResponse.error("Expense not found");
        }
        String error = applyExpense(expense, dto, expense.getFinance());
        if (error != null) {
            return ApiResponse.error(error);
        }
        expenseRepository.save(expense);
        return ApiResponse.success("Expense updated", buildSummary(expense.getFinance()));
    }

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> deleteExpense(Long expenseId) {
        FinanceExpense expense = expenseRepository.findById(expenseId).orElse(null);
        if (expense == null) {
            return ApiResponse.error("Expense not found");
        }
        CustomerFinance finance = expense.getFinance();
        // Receipts first: a loaded receipt still pointing at the removed expense fails the flush.
        List<FinanceReceiptFile> receipts = receiptRepository.findByExpenseId(expenseId);
        List<String> fileUrls = receipts.stream().map(FinanceReceiptFile::getFileUrl).toList();
        receiptRepository.deleteAll(receipts);
        expenseRepository.delete(expense);
        deleteStoredFilesAfterCommit(fileUrls);
        return ApiResponse.success("Expense deleted", buildSummary(finance));
    }

    /** Returns an error message, or null when the dto was applied cleanly. */
    private String applyExpense(FinanceExpense expense, ExpenseRequestDto dto, CustomerFinance finance) {
        // The amount is optional: a line can be written down first and priced later (zero until then).
        BigDecimal amount = nz(dto.getAmount());
        boolean priced = amount.signum() > 0;
        BigDecimal exactCashInHand = null;
        BigDecimal cashInHandPct;
        BigDecimal cashInAccountPct;
        if (dto.getCashInHandAmount() != null && priced) {
            // Split entered in rupees: that amount is stored as-is and the percentages are only
            // its 2dp echo, kept so the % columns (and the previous jar) still have a value.
            exactCashInHand = dto.getCashInHandAmount().setScale(2, RoundingMode.HALF_UP);
            if (exactCashInHand.compareTo(amount) > 0) {
                return "Cash in hand cannot be more than the expense amount";
            }
            cashInHandPct = exactCashInHand.multiply(BigDecimal.valueOf(100))
                    .divide(amount, 2, RoundingMode.HALF_UP);
            cashInAccountPct = BigDecimal.valueOf(100).subtract(cashInHandPct);
        } else if (dto.getCashInHandAmount() != null && dto.getCashInHandAmount().signum() > 0) {
            return "Enter the expense amount before splitting it into cash in hand and cash in account";
        } else if (dto.getCashInHandPct() == null && dto.getCashInAccountPct() == null) {
            // Nothing said about the split (typical for a line with no amount yet): all cash in hand.
            cashInHandPct = BigDecimal.valueOf(100);
            cashInAccountPct = BigDecimal.ZERO;
        } else {
            BigDecimal pctSum = nz(dto.getCashInHandPct()).add(nz(dto.getCashInAccountPct()));
            if (pctSum.subtract(BigDecimal.valueOf(100)).abs().compareTo(BigDecimal.valueOf(0.01)) > 0) {
                return "Cash in hand % and cash in account % must add up to 100";
            }
            cashInHandPct = nz(dto.getCashInHandPct());
            cashInAccountPct = nz(dto.getCashInAccountPct());
        }
        if (dto.getQuotationId() != null) {
            Quotation quotation = quotationRepository.findById(dto.getQuotationId()).orElse(null);
            if (quotation == null) {
                return "Linked quotation not found";
            }
            if (quotation.getCustomer() == null
                    || !quotation.getCustomer().getId().equals(finance.getCustomer().getId())) {
                return "The linked quotation belongs to a different customer";
            }
            expense.setQuotation(quotation);
        } else {
            expense.setQuotation(null);
        }
        if (dto.getVendorId() != null) {
            Vendor vendor = vendorRepository.findById(dto.getVendorId()).orElse(null);
            if (vendor == null || !Boolean.TRUE.equals(vendor.getActive())) {
                return "Vendor not found or inactive";
            }
            expense.setVendor(vendor);
        } else {
            expense.setVendor(null);
        }
        expense.setTitle(dto.getTitle().trim());
        expense.setAmount(amount);
        expense.setCashInHandPct(cashInHandPct);
        expense.setCashInAccountPct(cashInAccountPct);
        expense.setCashInHandAmount(exactCashInHand);
        expense.setExpenseDate(dto.getExpenseDate());
        expense.setNote(dto.getNote());
        return null;
    }

    // ------------------------------------------------------------------ vendor releases

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> addRelease(Long financeId, ReleaseRequestDto dto, String createdBy) {
        CustomerFinance finance = financeRepository.findById(financeId).orElse(null);
        if (finance == null) {
            return ApiResponse.error("Finance record not found");
        }
        FinanceVendorRelease release = new FinanceVendorRelease();
        release.setFinance(finance);
        String error = applyRelease(release, dto, finance);
        if (error != null) {
            return ApiResponse.error(error);
        }
        release.setCreatedBy(createdBy);
        releaseRepository.save(release);
        return ApiResponse.success("Payment released", buildSummary(finance));
    }

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> updateRelease(Long releaseId, ReleaseRequestDto dto) {
        FinanceVendorRelease release = releaseRepository.findById(releaseId).orElse(null);
        if (release == null) {
            return ApiResponse.error("Release not found");
        }
        String error = applyRelease(release, dto, release.getFinance());
        if (error != null) {
            return ApiResponse.error(error);
        }
        releaseRepository.save(release);
        return ApiResponse.success("Release updated", buildSummary(release.getFinance()));
    }

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> deleteRelease(Long releaseId) {
        FinanceVendorRelease release = releaseRepository.findById(releaseId).orElse(null);
        if (release == null) {
            return ApiResponse.error("Release not found");
        }
        CustomerFinance finance = release.getFinance();
        // Receipts first: a loaded receipt still pointing at the removed release fails the flush.
        List<FinanceReceiptFile> receipts = receiptRepository.findByReleaseId(releaseId);
        List<String> fileUrls = receipts.stream().map(FinanceReceiptFile::getFileUrl).toList();
        receiptRepository.deleteAll(receipts);
        releaseRepository.delete(release);
        deleteStoredFilesAfterCommit(fileUrls);
        return ApiResponse.success("Release deleted", buildSummary(finance));
    }

    private String applyRelease(FinanceVendorRelease release, ReleaseRequestDto dto, CustomerFinance finance) {
        Vendor vendor = vendorRepository.findById(dto.getVendorId()).orElse(null);
        if (vendor == null || !Boolean.TRUE.equals(vendor.getActive())) {
            return "Vendor not found or inactive";
        }
        if (dto.getExpenseId() != null) {
            FinanceExpense expense = expenseRepository.findById(dto.getExpenseId()).orElse(null);
            if (expense == null || !expense.getFinance().getId().equals(finance.getId())) {
                return "A release can only be linked to an expense of the same customer";
            }
            release.setExpense(expense);
        } else {
            release.setExpense(null);
        }
        release.setVendor(vendor);
        release.setAmount(dto.getAmount());
        release.setMode(dto.getMode());
        release.setReleaseDate(dto.getReleaseDate());
        release.setNote(dto.getNote());
        return null;
    }

    // ------------------------------------------------------------------ import from a spreadsheet

    /**
     * Reads an uploaded sheet of payments, expense lines and vendor releases into this customer's
     * finance. Every row goes through the same checks as the forms (applyPayment / applyExpense /
     * applyRelease) inside this transaction, and the transaction is rolled back unless every row
     * is valid AND {@code save} is set. So a check shows exactly what an import would do, and an
     * import is all or nothing: a half-imported file can never happen.
     */
    @Override
    public ApiResponse<FinanceImportResultDto> importSheet(Long financeId, String fileName, byte[] bytes,
                                                           boolean save, String createdBy) {
        CustomerFinance finance = financeRepository.findById(financeId).orElse(null);
        if (finance == null) {
            return ApiResponse.error("Finance record not found");
        }
        FinanceSheetReader.Table table;
        try {
            table = FinanceSheetReader.read(fileName, bytes);
        } catch (FinanceSheetReader.ReadProblem e) {
            return ApiResponse.error(e.getMessage());
        }

        FinanceImportResultDto result = new FinanceImportResultDto();
        Map<String, String> headerOf = new LinkedHashMap<>();
        for (String h : table.headers()) {
            if (h == null || h.isBlank()) {
                continue;
            }
            String column = FinanceImportColumns.columnOf(h);
            if (column == null) {
                result.getFileNotes().add("Column \"" + h.trim() + "\" is not read");
            } else if (headerOf.containsKey(column)) {
                result.getFileNotes().add("Column \"" + h.trim() + "\" is not read: \"" + headerOf.get(column)
                        + "\" already gives the " + column);
            } else {
                headerOf.put(column, h.trim());
            }
        }
        if (!headerOf.containsKey(FinanceImportColumns.TYPE) || !headerOf.containsKey(FinanceImportColumns.AMOUNT)) {
            return ApiResponse.error("The first row must be the column names, with at least \"Type\" and \"Amount\". "
                    + "Download the template to see them all");
        }
        if (table.rows().isEmpty()) {
            return ApiResponse.error("The file has column names but no rows under them");
        }
        result.setBefore(totalsOf(buildSummary(finance)));

        Map<String, List<Vendor>> vendorsByName = new HashMap<>();
        for (Vendor v : vendorRepository.findByActiveTrue()) {
            vendorsByName.computeIfAbsent(FinanceImportColumns.squash(v.getVendorName()), k -> new ArrayList<>()).add(v);
        }
        Map<String, Quotation> quotationsByNumber = new HashMap<>();
        for (Quotation q : quotationRepository.findByCustomerId(finance.getCustomer().getId())) {
            if (q.getQuotationNumber() != null) {
                quotationsByNumber.put(FinanceImportColumns.squash(q.getQuotationNumber()), q);
            }
        }
        // What is already saved, to flag a row that looks like it was imported before.
        Set<String> saved = new HashSet<>();
        for (FinanceIncomePayment p : paymentRepository.findByFinanceIdOrderByPaymentDateAscIdAsc(financeId)) {
            saved.add(paymentKey(p.getPaymentDate(), p.getAmount(), p.getMode()));
        }
        for (FinanceExpense e : expenseRepository.findByFinanceIdOrderByIdAsc(financeId)) {
            saved.add(expenseKey(e.getTitle(), e.getAmount()));
        }
        for (FinanceVendorRelease r : releaseRepository.findByFinanceIdOrderByReleaseDateAscIdAsc(financeId)) {
            saved.add(releaseKey(r.getVendor().getId(), r.getReleaseDate(), r.getAmount(), r.getMode()));
        }
        Map<String, Integer> firstRowWith = new HashMap<>();

        List<ImportRow> ready = new ArrayList<>();
        for (FinanceSheetReader.RawRow raw : table.rows()) {
            FinanceImportResultDto.Row row = new FinanceImportResultDto.Row();
            row.setRowNumber(raw.rowNumber());
            result.getRows().add(row);
            ImportRow parsed = parseImportRow(raw, headerOf, row, vendorsByName, quotationsByNumber);
            if (parsed == null) {
                continue;
            }
            String key = switch (parsed.kind) {
                case PAYMENT -> paymentKey(parsed.date, parsed.amount, parsed.mode);
                case EXPENSE -> expenseKey(parsed.expenseName, parsed.amount);
                case RELEASE -> releaseKey(parsed.vendor.getId(), parsed.date, parsed.amount, parsed.mode);
            };
            if (saved.contains(key)) {
                row.getWarnings().add("Looks like one already saved for this customer (same "
                        + (parsed.kind == Kind.EXPENSE ? "name and amount" : "date, amount and mode") + ")");
            }
            Integer first = firstRowWith.putIfAbsent(key, raw.rowNumber());
            if (first != null) {
                row.getWarnings().add("Same as row " + first + " of this file");
            }
            ready.add(parsed);
        }

        // Payments and expense lines first, then releases, so a release can name a line that is
        // further down the same file. A release naming a line looks in this file first, then at
        // the saved lines, so importing a file twice does not make its own names ambiguous.
        Map<String, List<FinanceExpense>> fileLines = new HashMap<>();
        for (ImportRow r : ready) {
            if (r.kind == Kind.PAYMENT) {
                PaymentRequestDto dto = new PaymentRequestDto(r.amount, r.mode, r.date, r.note, r.comment);
                FinanceIncomePayment payment = new FinanceIncomePayment();
                payment.setFinance(finance);
                applyPayment(payment, dto);
                payment.setCreatedBy(createdBy);
                paymentRepository.save(payment);
            } else if (r.kind == Kind.EXPENSE) {
                FinanceExpense expense = new FinanceExpense();
                expense.setFinance(finance);
                String error = applyExpense(expense, r.expenseDto, finance);
                if (error != null) {
                    r.row.getErrors().add(error);
                    continue;
                }
                expense.setCreatedBy(createdBy);
                expenseRepository.save(expense);
                fileLines.computeIfAbsent(FinanceImportColumns.squash(expense.getTitle()), k -> new ArrayList<>()).add(expense);
                BigDecimal ch = expense.getCashInHandAmount() != null ? expense.getCashInHandAmount()
                        : nz(expense.getAmount()).multiply(nz(expense.getCashInHandPct()))
                                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                r.row.setCashInHandAmount(ch);
                r.row.setCashInAccountAmount(nz(expense.getAmount()).subtract(ch));
            }
        }
        Map<String, List<FinanceExpense>> linesByName = new HashMap<>();
        for (FinanceExpense e : expenseRepository.findByFinanceIdOrderByIdAsc(financeId)) {
            linesByName.computeIfAbsent(FinanceImportColumns.squash(e.getTitle()), k -> new ArrayList<>()).add(e);
        }
        for (ImportRow r : ready) {
            if (r.kind != Kind.RELEASE) {
                continue;
            }
            Long lineId = null;
            if (r.expenseName != null) {
                String name = FinanceImportColumns.squash(r.expenseName);
                List<FinanceExpense> lines = fileLines.containsKey(name) ? fileLines.get(name)
                        : linesByName.getOrDefault(name, List.of());
                List<FinanceExpense> vendors = lines.stream()
                        .filter(e -> e.getVendor() != null && e.getVendor().getId().equals(r.vendor.getId())).toList();
                List<FinanceExpense> pick = lines.size() > 1 && !vendors.isEmpty() ? vendors : lines;
                if (pick.isEmpty()) {
                    r.row.getErrors().add("No expense line called \"" + r.expenseName
                            + "\" for this customer, saved or in this file. Leave Expense Name empty to release without linking a line");
                    continue;
                }
                if (pick.size() > 1) {
                    r.row.getErrors().add("More than one expense line is called \"" + r.expenseName
                            + "\". Leave Expense Name empty, or give the lines different names");
                    continue;
                }
                lineId = pick.get(0).getId();
            }
            ReleaseRequestDto dto = new ReleaseRequestDto(r.vendor.getId(), r.amount, r.mode, r.date, lineId, r.note);
            FinanceVendorRelease release = new FinanceVendorRelease();
            release.setFinance(finance);
            String error = applyRelease(release, dto, finance);
            if (error != null) {
                r.row.getErrors().add(error);
                continue;
            }
            release.setCreatedBy(createdBy);
            releaseRepository.save(release);
        }

        int errors = 0;
        int warnings = 0;
        for (FinanceImportResultDto.Row row : result.getRows()) {
            errors += row.getErrors().size();
            warnings += row.getWarnings().size();
            if (row.getErrors().isEmpty() && row.getType() != null) {
                switch (Kind.valueOf(row.getType())) {
                    case PAYMENT -> result.setPayments(result.getPayments() + 1);
                    case EXPENSE -> result.setExpenses(result.getExpenses() + 1);
                    case RELEASE -> result.setReleases(result.getReleases() + 1);
                }
            }
        }
        result.setErrorCount(errors);
        result.setWarningCount(warnings);
        if (errors == 0) {
            result.setAfter(totalsOf(buildSummary(finance)));
        }
        boolean keep = save && errors == 0;
        if (!keep) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        }
        result.setImported(keep);
        int rows = result.getRows().size();
        String message = errors > 0
                ? (errors == 1 ? "1 problem to fix" : errors + " problems to fix") + " before anything can be imported"
                : keep ? (rows == 1 ? "1 row imported" : rows + " rows imported")
                : (rows == 1 ? "1 row ready to import" : rows + " rows ready to import");
        if (keep) {
            log.info("Finance {}: imported {} payments, {} expense lines, {} releases from {}",
                    financeId, result.getPayments(), result.getExpenses(), result.getReleases(), fileName);
        }
        return ApiResponse.success(message, result);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] importTemplate() {
        List<String> names = vendorRepository.findByActiveTrue().stream()
                .map(Vendor::getVendorName).filter(Objects::nonNull).sorted(String.CASE_INSENSITIVE_ORDER).toList();
        return com.fleetmanagement.kitchencrmbackend.modules.finance.importer.FinanceImportTemplate.build(names);
    }

    /** One readable row of an import, before it is saved. */
    private static class ImportRow {
        FinanceImportResultDto.Row row;
        Kind kind;
        LocalDate date;
        BigDecimal amount;
        FinanceIncomePayment.PaymentMode mode;
        Vendor vendor;
        String expenseName;
        String note;
        String comment;
        ExpenseRequestDto expenseDto;
    }

    /**
     * Reads one row into {@code row} (what the screen shows) and returns it ready to save, or null
     * when it has errors (they are on {@code row}). Only checks that need the sheet itself happen
     * here; the forms' own checks run when it is applied.
     */
    private ImportRow parseImportRow(FinanceSheetReader.RawRow raw, Map<String, String> headerOf,
                                     FinanceImportResultDto.Row row, Map<String, List<Vendor>> vendorsByName,
                                     Map<String, Quotation> quotationsByNumber) {
        java.util.function.Function<String, String> cell = column -> {
            String header = headerOf.get(column);
            String value = header == null ? null : raw.cells().get(header);
            return value == null ? "" : value.trim();
        };
        List<String> errors = row.getErrors();

        String typeText = cell.apply(FinanceImportColumns.TYPE);
        Kind kind = FinanceImportColumns.kindOf(typeText);
        if (typeText.isEmpty()) {
            errors.add("Type is empty: write " + FinanceImportColumns.PAYMENT_WORD + ", "
                    + FinanceImportColumns.EXPENSE_WORD + " or " + FinanceImportColumns.RELEASE_WORD);
        } else if (kind == null) {
            errors.add("Type \"" + typeText + "\" is not " + FinanceImportColumns.PAYMENT_WORD + ", "
                    + FinanceImportColumns.EXPENSE_WORD + " or " + FinanceImportColumns.RELEASE_WORD);
        } else {
            row.setType(kind.name());
        }
        String what = kind == Kind.PAYMENT ? "a payment" : kind == Kind.RELEASE ? "a vendor release" : "this row";

        String dateText = cell.apply(FinanceImportColumns.DATE);
        LocalDate date = FinanceImportColumns.dateOf(dateText);
        if (!dateText.isEmpty() && date == null) {
            errors.add("Date \"" + dateText + "\" is not a date. Write it like 05-10-2026");
        } else if (date == null && kind != null && kind != Kind.EXPENSE) {
            errors.add("Date is needed for " + what);
        }
        row.setDate(date);

        String amountText = cell.apply(FinanceImportColumns.AMOUNT);
        BigDecimal amount = FinanceImportColumns.amountOf(amountText);
        if (amountText.isEmpty()) {
            if (kind != null && kind != Kind.EXPENSE) {
                errors.add("Amount is needed for " + what);
            }
        } else if (amount == null) {
            errors.add("Amount \"" + amountText + "\" is not a number");
        } else if (amount.signum() < 0) {
            errors.add("Amount cannot be negative");
        } else if (amount.signum() == 0 && kind != null && kind != Kind.EXPENSE) {
            errors.add("Amount must be more than zero");
        }
        if (amount != null) {
            amount = amount.setScale(2, RoundingMode.HALF_UP);
        }
        row.setAmount(amount);

        String modeText = cell.apply(FinanceImportColumns.MODE);
        FinanceIncomePayment.PaymentMode mode = FinanceImportColumns.modeOf(modeText);
        if (!modeText.isEmpty() && mode == null) {
            errors.add("Mode \"" + modeText + "\" is not " + FinanceImportColumns.CH_WORD + " or " + FinanceImportColumns.CA_WORD);
        } else if (mode == null && kind != null && kind != Kind.EXPENSE) {
            errors.add("Mode is needed for " + what + ": " + FinanceImportColumns.CH_WORD + " or " + FinanceImportColumns.CA_WORD);
        }
        if (kind != Kind.EXPENSE && mode != null) {
            row.setMode(mode.name());
        }

        String vendorText = cell.apply(FinanceImportColumns.VENDOR);
        Vendor vendor = null;
        if (!vendorText.isEmpty() && kind != Kind.PAYMENT) {
            List<Vendor> found = vendorsByName.get(FinanceImportColumns.squash(vendorText));
            if (found == null) {
                errors.add("No active vendor called \"" + vendorText + "\"" + vendorHint(vendorText, vendorsByName));
            } else if (found.size() > 1) {
                errors.add("More than one active vendor is called \"" + vendorText + "\"");
            } else {
                vendor = found.get(0);
            }
        } else if (vendorText.isEmpty() && kind == Kind.RELEASE) {
            errors.add("Vendor is needed for a vendor release");
        }
        row.setVendorName(vendor != null ? vendor.getVendorName() : vendorText.isEmpty() ? null : vendorText);

        String expenseName = cell.apply(FinanceImportColumns.EXPENSE);
        if (expenseName.isEmpty() && kind == Kind.EXPENSE) {
            errors.add("Expense Name is needed for an expense");
        } else if (expenseName.length() > 200) {
            errors.add("Expense Name is longer than 200 characters");
        }
        row.setExpenseName(expenseName.isEmpty() || kind == Kind.PAYMENT ? null : expenseName);

        String note = cell.apply(FinanceImportColumns.NOTE);
        String comment = cell.apply(FinanceImportColumns.COMMENT);
        row.setNote(note.isEmpty() ? null : note);
        if (!comment.isEmpty() && kind != Kind.PAYMENT && kind != null) {
            row.getWarnings().add("Comment is only kept for payments received; put it in Note instead");
        }

        ExpenseRequestDto expenseDto = null;
        if (kind == Kind.EXPENSE) {
            expenseDto = new ExpenseRequestDto();
            expenseDto.setTitle(expenseName);
            expenseDto.setAmount(amount);
            expenseDto.setVendorId(vendor != null ? vendor.getId() : null);
            expenseDto.setExpenseDate(date);
            expenseDto.setNote(row.getNote());
            String quotationText = cell.apply(FinanceImportColumns.QUOTATION);
            if (!quotationText.isEmpty()) {
                Quotation q = quotationsByNumber.get(FinanceImportColumns.squash(quotationText));
                if (q == null) {
                    errors.add("Quotation \"" + quotationText + "\" is not one of this customer's quotations");
                } else {
                    expenseDto.setQuotationId(q.getId());
                    row.setQuotationNumber(q.getQuotationNumber());
                }
            }
            splitInto(expenseDto, amount, mode, cell, errors);
        }

        if (!errors.isEmpty()) {
            return null;
        }
        ImportRow r = new ImportRow();
        r.row = row;
        r.kind = kind;
        r.date = date;
        r.amount = amount;
        r.mode = mode;
        r.vendor = vendor;
        r.expenseName = expenseName.isEmpty() ? null : expenseName;
        r.note = row.getNote();
        r.comment = comment.isEmpty() ? null : comment;
        r.expenseDto = expenseDto;
        return r;
    }

    /**
     * The cash in hand / cash in account split of an imported expense line, from whichever the
     * sheet gives: rupees in hand, rupees in account, a percentage, or only a Mode (all of the
     * line in that bucket). With none of them the line is all cash in hand, as in the form.
     */
    private void splitInto(ExpenseRequestDto dto, BigDecimal amount, FinanceIncomePayment.PaymentMode mode,
                           java.util.function.Function<String, String> cell, List<String> errors) {
        BigDecimal chAmount = null;
        BigDecimal caAmount = null;
        BigDecimal chPct = null;
        BigDecimal caPct = null;
        String[][] reads = {
                {FinanceImportColumns.CH_AMOUNT, "ch-rs"}, {FinanceImportColumns.CA_AMOUNT, "ca-rs"},
                {FinanceImportColumns.CH_PCT, "ch-%"}, {FinanceImportColumns.CA_PCT, "ca-%"},
                {FinanceImportColumns.CH_EITHER, "ch-?"}, {FinanceImportColumns.CA_EITHER, "ca-?"}};
        for (String[] read : reads) {
            String text = cell.apply(read[0]);
            if (text.isEmpty()) {
                continue;
            }
            boolean pct = read[1].endsWith("%") || (read[1].endsWith("?") && text.endsWith("%"));
            BigDecimal value = pct ? FinanceImportColumns.pctOf(text) : FinanceImportColumns.amountOf(text);
            if (value == null || value.signum() < 0) {
                errors.add(read[0] + " \"" + text + "\" is not " + (pct ? "a percentage" : "an amount"));
                return;
            }
            if (pct && value.compareTo(BigDecimal.valueOf(100)) > 0) {
                errors.add(read[0] + " cannot be more than 100%");
                return;
            }
            boolean ch = read[1].startsWith("ch");
            if (pct) {
                if (ch && chPct == null) chPct = value;
                else if (!ch && caPct == null) caPct = value;
            } else {
                if (ch && chAmount == null) chAmount = value;
                else if (!ch && caAmount == null) caAmount = value;
            }
        }
        BigDecimal total = amount == null ? BigDecimal.ZERO : amount;
        if (chAmount != null) {
            if (caAmount != null && chAmount.add(caAmount).compareTo(total) != 0) {
                errors.add("Cash in hand " + chAmount.toPlainString() + " + cash in account " + caAmount.toPlainString()
                        + " does not add up to the amount " + total.toPlainString());
                return;
            }
            dto.setCashInHandAmount(chAmount);
        } else if (caAmount != null) {
            if (caAmount.compareTo(total) > 0) {
                errors.add("Cash in account cannot be more than the expense amount");
                return;
            }
            dto.setCashInHandAmount(total.subtract(caAmount));
        } else if (chPct != null || caPct != null) {
            BigDecimal hand = chPct != null ? chPct : BigDecimal.valueOf(100).subtract(caPct);
            dto.setCashInHandPct(hand);
            dto.setCashInAccountPct(caPct != null && chPct != null ? caPct : BigDecimal.valueOf(100).subtract(hand));
        } else if (mode == FinanceIncomePayment.PaymentMode.CASH_IN_ACCOUNT) {
            dto.setCashInHandPct(BigDecimal.ZERO);
            dto.setCashInAccountPct(BigDecimal.valueOf(100));
        }
    }

    /** ". Did you mean X?" when exactly one active vendor's name contains (or is contained in) it. */
    private static String vendorHint(String typed, Map<String, List<Vendor>> vendorsByName) {
        String key = FinanceImportColumns.squash(typed);
        if (key.length() < 3) {
            return ". Add the vendor first, or check the spelling";
        }
        List<Vendor> close = vendorsByName.entrySet().stream()
                .filter(e -> e.getKey().contains(key) || key.contains(e.getKey()))
                .flatMap(e -> e.getValue().stream()).limit(2).toList();
        return close.size() == 1 ? ". Did you mean \"" + close.get(0).getVendorName() + "\"?"
                : ". Add the vendor first, or check the spelling";
    }

    private static String paymentKey(LocalDate date, BigDecimal amount, FinanceIncomePayment.PaymentMode mode) {
        return "P|" + date + "|" + money(amount) + "|" + mode;
    }

    private static String expenseKey(String title, BigDecimal amount) {
        return "E|" + FinanceImportColumns.squash(title) + "|" + money(amount);
    }

    private static String releaseKey(Long vendorId, LocalDate date, BigDecimal amount, FinanceIncomePayment.PaymentMode mode) {
        return "R|" + vendorId + "|" + date + "|" + money(amount) + "|" + mode;
    }

    private static String money(BigDecimal v) {
        return v == null ? "0" : v.stripTrailingZeros().toPlainString();
    }

    private static FinanceImportResultDto.Totals totalsOf(CustomerFinanceSummaryDto s) {
        FinanceImportResultDto.Totals t = new FinanceImportResultDto.Totals();
        t.setReceivedTotal(s.getReceivedTotal());
        t.setExpenseTotal(s.getExpenseTotal());
        t.setReleasedTotal(s.getReleasedTotal());
        t.setOutstandingTotal(s.getOutstandingTotal());
        t.setExtraTotal(s.getExtraTotal());
        t.setTotalMargin(s.getTotalMargin());
        t.setNetMargin(s.getNetMargin());
        return t;
    }

    // ------------------------------------------------------------------ receipts

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> uploadPaymentReceipts(Long paymentId, MultipartFile[] files) {
        FinanceIncomePayment payment = paymentRepository.findById(paymentId).orElse(null);
        if (payment == null) {
            return ApiResponse.error("Payment not found");
        }
        String error = validateBatch(files);
        if (error != null) {
            return ApiResponse.error(error);
        }
        try {
            for (StoredFile stored : storeBatch("payment", paymentId, files)) {
                FinanceReceiptFile record = newReceipt(stored, FinanceReceiptFile.Kind.RECEIPT);
                record.setPayment(payment);
                receiptRepository.save(record);
            }
        } catch (IOException e) {
            return ApiResponse.error("Failed to store the file: " + e.getMessage());
        }
        return ApiResponse.success("Receipts uploaded", buildSummary(payment.getFinance()));
    }

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> uploadExpenseReceipts(Long expenseId, String kind, MultipartFile[] files) {
        FinanceExpense expense = expenseRepository.findById(expenseId).orElse(null);
        if (expense == null) {
            return ApiResponse.error("Expense not found");
        }
        FinanceReceiptFile.Kind fileKind = FinanceReceiptFile.Kind.RECEIPT;
        if (kind != null && kind.equalsIgnoreCase("QUOTE")) {
            fileKind = FinanceReceiptFile.Kind.QUOTE;
        }
        String error = validateBatch(files);
        if (error != null) {
            return ApiResponse.error(error);
        }
        try {
            for (StoredFile stored : storeBatch("expense", expenseId, files)) {
                FinanceReceiptFile record = newReceipt(stored, fileKind);
                record.setExpense(expense);
                receiptRepository.save(record);
            }
        } catch (IOException e) {
            return ApiResponse.error("Failed to store the file: " + e.getMessage());
        }
        return ApiResponse.success("Files uploaded", buildSummary(expense.getFinance()));
    }

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> uploadReleaseReceipts(Long releaseId, MultipartFile[] files) {
        FinanceVendorRelease release = releaseRepository.findById(releaseId).orElse(null);
        if (release == null) {
            return ApiResponse.error("Release not found");
        }
        String error = validateBatch(files);
        if (error != null) {
            return ApiResponse.error(error);
        }
        try {
            for (StoredFile stored : storeBatch("release", releaseId, files)) {
                FinanceReceiptFile record = newReceipt(stored, FinanceReceiptFile.Kind.RECEIPT);
                record.setRelease(release);
                receiptRepository.save(record);
            }
        } catch (IOException e) {
            return ApiResponse.error("Failed to store the file: " + e.getMessage());
        }
        return ApiResponse.success("Receipts uploaded", buildSummary(release.getFinance()));
    }

    @Override
    public ApiResponse<CustomerFinanceSummaryDto> deleteReceipt(Long fileId) {
        FinanceReceiptFile file = receiptRepository.findById(fileId).orElse(null);
        if (file == null) {
            return ApiResponse.error("File not found");
        }
        CustomerFinance finance;
        if (file.getPayment() != null) {
            finance = file.getPayment().getFinance();
        } else if (file.getExpense() != null) {
            finance = file.getExpense().getFinance();
        } else if (file.getRelease() != null) {
            finance = file.getRelease().getFinance();
        } else {
            receiptRepository.delete(file);
            return ApiResponse.error("File had no owner and was removed");
        }
        String fileUrl = file.getFileUrl();
        receiptRepository.delete(file);
        deleteStoredFilesAfterCommit(Collections.singletonList(fileUrl));
        return ApiResponse.success("File removed", buildSummary(finance));
    }

    /** Validate the whole batch before storing anything (appliance precedent). */
    private String validateBatch(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return "Please choose at least one file to upload";
        }
        if (files.length > MAX_BATCH_FILES) {
            return "At most " + MAX_BATCH_FILES + " files can be uploaded at once";
        }
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                return "One of the selected files is empty";
            }
            String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
            String ext = name.contains(".") ? name.substring(name.lastIndexOf('.') + 1).toLowerCase() : "";
            if (!ALLOWED_EXTENSIONS.contains(ext)) {
                return "Only PDF, JPG and PNG files are allowed — \"" + name + "\" is not";
            }
            String mime = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
            if (!ALLOWED_MIME_TYPES.contains(mime)) {
                return "\"" + name + "\" has an unsupported file type";
            }
            if (file.getSize() > MAX_FILE_BYTES) {
                return "\"" + name + "\" is too large (maximum 20MB)";
            }
        }
        return null;
    }

    private record StoredFile(String url, String originalName) {
    }

    private List<StoredFile> storeBatch(String ownerType, Long ownerId, MultipartFile[] files) throws IOException {
        Path dir = Paths.get(receiptUploadDir);
        Files.createDirectories(dir);
        List<StoredFile> out = new ArrayList<>();
        int i = 0;
        for (MultipartFile file : files) {
            String original = file.getOriginalFilename() == null ? "receipt" : file.getOriginalFilename();
            String ext = original.contains(".") ? original.substring(original.lastIndexOf('.') + 1).toLowerCase() : "bin";
            String stored = "finance-" + ownerType + "-" + ownerId + "-" + System.currentTimeMillis() + "-" + (i++) + "." + ext;
            Files.copy(file.getInputStream(), dir.resolve(stored), StandardCopyOption.REPLACE_EXISTING);
            out.add(new StoredFile("/uploads/finance-receipts/" + stored, original));
        }
        return out;
    }

    private FinanceReceiptFile newReceipt(StoredFile stored, FinanceReceiptFile.Kind kind) {
        FinanceReceiptFile record = new FinanceReceiptFile();
        record.setKind(kind);
        record.setFileUrl(stored.url());
        record.setFileName(stored.originalName());
        record.setUploadedAt(LocalDateTime.now());
        return record;
    }

    /**
     * Remove receipt files from disk only once the transaction has committed. Deleting them before the
     * rows meant a delete that then failed and rolled back had already destroyed the files (this lost
     * a real receipt while finance deletes were failing).
     */
    private void deleteStoredFilesAfterCommit(List<String> urls) {
        List<String> targets = urls.stream().filter(u -> u != null && !u.isBlank()).toList();
        if (targets.isEmpty()) {
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    targets.forEach(u -> deleteStoredFile(u));
                }
            });
        } else {
            targets.forEach(this::deleteStoredFile);
        }
    }

    private void deleteStoredFile(String url) {
        if (url == null || url.isBlank()) return;
        try {
            Files.deleteIfExists(Paths.get(receiptUploadDir, Paths.get(url).getFileName().toString()));
        } catch (Exception e) {
            log.warn("Could not delete finance receipt file {}: {}", url, e.getMessage());
        }
    }

    // ------------------------------------------------------------------ summary assembly

    private CustomerFinanceSummaryDto buildSummary(CustomerFinance finance) {
        Long financeId = finance.getId();
        CustomerFinanceSummaryDto dto = new CustomerFinanceSummaryDto();
        dto.setFinanceId(financeId);
        dto.setCustomerId(finance.getCustomer().getId());
        dto.setCustomerName(finance.getCustomer().getName());
        dto.setCustomerContact(finance.getCustomer().getContact());
        dto.setCustomerPlace(finance.getCustomer().getPlace());
        dto.setCustomerAddress(finance.getCustomer().getAddress());
        dto.setTotalAmount(nz(finance.getTotalAmount()));
        dto.setCommittedCashInHand(nz(finance.getCommittedCashInHand()));
        dto.setCommittedCashInAccount(nz(finance.getCommittedCashInAccount()));
        dto.setNotes(finance.getNotes());

        // Income
        BigDecimal receivedCH = paymentRepository.sumByFinanceIdAndMode(financeId, FinanceIncomePayment.PaymentMode.CASH_IN_HAND);
        BigDecimal receivedCA = paymentRepository.sumByFinanceIdAndMode(financeId, FinanceIncomePayment.PaymentMode.CASH_IN_ACCOUNT);
        BigDecimal receivedTotal = receivedCH.add(receivedCA);
        dto.setReceivedTotal(receivedTotal);
        dto.setReceivedCashInHand(receivedCH);
        dto.setReceivedCashInAccount(receivedCA);
        dto.setTotalBalance(dto.getTotalAmount().subtract(receivedTotal));
        dto.setCashInHandBalance(dto.getCommittedCashInHand().subtract(receivedCH));
        dto.setCashInAccountBalance(dto.getCommittedCashInAccount().subtract(receivedCA));
        dto.setOverCollected(dto.getTotalBalance().compareTo(BigDecimal.ZERO) < 0);
        // The header stores totalAmount and the two committed buckets independently and validates
        // none of them against each other. When they disagree the per-bucket margins cannot re-sum
        // to totalMargin, so flag it rather than letting the split quietly lie.
        dto.setCommittedSplitMismatch(dto.getCommittedCashInHand().add(dto.getCommittedCashInAccount())
                .compareTo(dto.getTotalAmount()) != 0);

        // Expenses & releases
        BigDecimal expenseTotal = expenseRepository.sumByFinanceId(financeId);
        BigDecimal releasedCH = releaseRepository.sumByFinanceIdAndMode(financeId, FinanceIncomePayment.PaymentMode.CASH_IN_HAND);
        BigDecimal releasedCA = releaseRepository.sumByFinanceIdAndMode(financeId, FinanceIncomePayment.PaymentMode.CASH_IN_ACCOUNT);
        BigDecimal releasedTotal = releasedCH.add(releasedCA);
        dto.setExpenseTotal(expenseTotal);
        dto.setReleasedTotal(releasedTotal);
        dto.setReleasedCashInHand(releasedCH);
        dto.setReleasedCashInAccount(releasedCA);
        dto.setTotalMargin(dto.getTotalAmount().subtract(expenseTotal));
        dto.setCollectedMargin(receivedTotal.subtract(releasedTotal));

        // Children with receipts
        List<FinanceIncomePayment> payments = paymentRepository.findByFinanceIdOrderByPaymentDateAscIdAsc(financeId);
        List<FinanceExpense> expenses = expenseRepository.findByFinanceIdOrderByIdAsc(financeId);
        List<FinanceVendorRelease> releases = releaseRepository.findByFinanceIdOrderByReleaseDateAscIdAsc(financeId);

        Map<Long, List<FinanceReceiptFile>> paymentFiles = groupFiles(
                payments.isEmpty() ? List.of() : receiptRepository.findByPaymentIdIn(idsOfPayments(payments)),
                f -> f.getPayment().getId());
        Map<Long, List<FinanceReceiptFile>> expenseFiles = groupFiles(
                expenses.isEmpty() ? List.of() : receiptRepository.findByExpenseIdIn(idsOfExpenses(expenses)),
                f -> f.getExpense().getId());
        Map<Long, List<FinanceReceiptFile>> releaseFiles = groupFiles(
                releases.isEmpty() ? List.of() : receiptRepository.findByReleaseIdIn(idsOfReleases(releases)),
                f -> f.getRelease().getId());

        Map<Long, BigDecimal> releasedByExpense = new HashMap<>();
        for (Object[] row : releaseRepository.sumGroupedByExpense(financeId)) {
            releasedByExpense.put((Long) row[0], (BigDecimal) row[1]);
        }

        // The C/H and C/A totals are accumulated in the loops below rather than fetched as their
        // own SUM queries. The per-line split is either the exact rupees entered or amount x
        // pct/100 rounded HALF_UP to 2dp, so a SQL-side SUM(amount * pct / 100) would ignore the
        // exact lines, round once at the end and drift from the C/H Amt column the user can
        // actually see. Summing the same values that get rendered is the only way the tile total
        // and the column agree.
        BigDecimal expenseCH = BigDecimal.ZERO;
        BigDecimal expenseCA = BigDecimal.ZERO;
        // Vendor balances likewise: both sides come from the already-loaded lists, so per-vendor
        // figures reconcile with the per-line ones and with the top-level totals by construction.
        // A vendor with only expense lines and one with only releases must both still appear.
        Map<Long, CustomerFinanceSummaryDto.VendorTotalDto> vendorMap = new LinkedHashMap<>();
        // Who each rupee is owed by / paid to, for outstanding and extra: {expensed C/H, expensed
        // C/A, released C/H, released C/A} per vendor. A release linked to a line counts for that
        // line's vendor, since it pays that line; lines with no vendor share the null key.
        Map<Long, BigDecimal[]> owedByVendor = new HashMap<>();

        for (FinanceIncomePayment p : payments) {
            CustomerFinanceSummaryDto.PaymentDto pd = new CustomerFinanceSummaryDto.PaymentDto();
            pd.setId(p.getId());
            pd.setAmount(p.getAmount());
            pd.setMode(p.getMode());
            pd.setPaymentDate(p.getPaymentDate());
            pd.setNote(p.getNote());
            pd.setComment(p.getComment());
            pd.setCreatedBy(p.getCreatedBy());
            pd.setReceipts(toReceiptDtos(paymentFiles.get(p.getId())));
            dto.getPayments().add(pd);
        }

        for (FinanceExpense e : expenses) {
            CustomerFinanceSummaryDto.ExpenseDto ed = new CustomerFinanceSummaryDto.ExpenseDto();
            ed.setId(e.getId());
            ed.setTitle(e.getTitle());
            ed.setAmount(nz(e.getAmount()));
            ed.setCashInHandPct(nz(e.getCashInHandPct()));
            ed.setCashInAccountPct(nz(e.getCashInAccountPct()));
            // min(): a line whose amount was lowered by the previous jar (which does not know the
            // exact column) must not show more cash in hand than the line is worth.
            BigDecimal chAmount = e.getCashInHandAmount() != null
                    ? e.getCashInHandAmount().min(nz(e.getAmount()))
                    : nz(e.getAmount()).multiply(nz(e.getCashInHandPct()))
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal caAmount = nz(e.getAmount()).subtract(chAmount);
            ed.setSplitByAmount(e.getCashInHandAmount() != null);
            ed.setCashInHandAmount(chAmount);
            ed.setCashInAccountAmount(caAmount);
            expenseCH = expenseCH.add(chAmount);
            expenseCA = expenseCA.add(caAmount);
            addOwed(owedByVendor, e.getVendor() != null ? e.getVendor().getId() : null, 0, chAmount);
            addOwed(owedByVendor, e.getVendor() != null ? e.getVendor().getId() : null, 1, caAmount);
            if (e.getVendor() != null) {
                ed.setVendorId(e.getVendor().getId());
                ed.setVendorName(e.getVendor().getVendorName());
                CustomerFinanceSummaryDto.VendorTotalDto vt = vendorTotalFor(
                        vendorMap, e.getVendor().getId(), e.getVendor().getVendorName());
                vt.setTotalExpensed(vt.getTotalExpensed().add(nz(e.getAmount())));
                vt.setExpensedCashInHand(vt.getExpensedCashInHand().add(chAmount));
                vt.setExpensedCashInAccount(vt.getExpensedCashInAccount().add(caAmount));
                vt.setExpenseCount(vt.getExpenseCount() + 1);
            }
            if (e.getQuotation() != null) {
                ed.setQuotationId(e.getQuotation().getId());
                ed.setQuotationNumber(e.getQuotation().getQuotationNumber());
                ed.setQuotationTotal(e.getQuotation().getTotalAmount());
            }
            BigDecimal released = releasedByExpense.getOrDefault(e.getId(), BigDecimal.ZERO);
            ed.setReleasedAmount(released);
            ed.setPendingAmount(nz(e.getAmount()).subtract(released));
            ed.setExpenseDate(e.getExpenseDate());
            ed.setNote(e.getNote());
            ed.setReceipts(toReceiptDtos(expenseFiles.get(e.getId())));
            dto.getExpenses().add(ed);
        }

        for (FinanceVendorRelease r : releases) {
            CustomerFinanceSummaryDto.ReleaseDto rd = new CustomerFinanceSummaryDto.ReleaseDto();
            rd.setId(r.getId());
            rd.setVendorId(r.getVendor().getId());
            rd.setVendorName(r.getVendor().getVendorName());
            if (r.getExpense() != null) {
                rd.setExpenseId(r.getExpense().getId());
                rd.setExpenseTitle(r.getExpense().getTitle());
            }
            rd.setAmount(r.getAmount());
            rd.setMode(r.getMode());
            rd.setReleaseDate(r.getReleaseDate());
            rd.setNote(r.getNote());
            rd.setReceipts(toReceiptDtos(releaseFiles.get(r.getId())));
            dto.getReleases().add(rd);

            // A release is wholly one bucket (mode is a two-value enum), unlike an expense which
            // splits by percentage.
            CustomerFinanceSummaryDto.VendorTotalDto vt = vendorTotalFor(
                    vendorMap, r.getVendor().getId(), r.getVendor().getVendorName());
            BigDecimal amount = nz(r.getAmount());
            vt.setTotalReleased(vt.getTotalReleased().add(amount));
            if (r.getMode() == FinanceIncomePayment.PaymentMode.CASH_IN_HAND) {
                vt.setReleasedCashInHand(vt.getReleasedCashInHand().add(amount));
            } else {
                vt.setReleasedCashInAccount(vt.getReleasedCashInAccount().add(amount));
            }
            vt.setReleaseCount(vt.getReleaseCount() + 1);
            Long payee = r.getExpense() == null ? r.getVendor().getId()
                    : r.getExpense().getVendor() == null ? null : r.getExpense().getVendor().getId();
            addOwed(owedByVendor, payee,
                    r.getMode() == FinanceIncomePayment.PaymentMode.CASH_IN_HAND ? 2 : 3, amount);
        }

        // Cash split of the expense side, and the two figures that hang off it. Outstanding and
        // extra are worked out PER VENDOR and then summed, so one vendor's overpayment is never
        // hidden by another vendor's pending amount. Within a vendor they follow the vendor's
        // total, not each bucket: paying part of a vendor's bank share in cash leaves the cash
        // side "over" and the bank side pending, but nothing extra has left the business (the
        // vendor card names that cash/bank shift). Lines with no vendor are the exception: money
        // paid to a vendor beyond its own lines may be paying them, so they absorb it first.
        // The pair still reconciles with the net:
        //   outstandingTotal - extraTotal == expenseTotal - releasedTotal
        dto.setExpenseCashInHand(expenseCH);
        dto.setExpenseCashInAccount(expenseCA);

        BigDecimal[] untagged = owedByVendor.remove(null);
        if (untagged == null) {
            untagged = new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO};
        }
        BigDecimal outstandingCH = BigDecimal.ZERO;
        BigDecimal outstandingCA = BigDecimal.ZERO;
        for (Map.Entry<Long, BigDecimal[]> owed : owedByVendor.entrySet()) {
            BigDecimal[] o = owed.getValue();
            BigDecimal[] split = owedAndExtra(o);
            outstandingCH = outstandingCH.add(split[0]);
            outstandingCA = outstandingCA.add(split[1]);
            untagged[2] = untagged[2].add(split[2]);
            untagged[3] = untagged[3].add(split[3]);
            CustomerFinanceSummaryDto.VendorTotalDto vt = vendorMap.get(owed.getKey());
            if (vt != null) {
                markShift(vt, o);
            }
        }
        BigDecimal[] rest = owedAndExtra(untagged);
        outstandingCH = outstandingCH.add(rest[0]);
        outstandingCA = outstandingCA.add(rest[1]);
        BigDecimal extraCH = rest[2];
        BigDecimal extraCA = rest[3];
        dto.setOutstandingCashInHand(outstandingCH);
        dto.setOutstandingCashInAccount(outstandingCA);
        dto.setOutstandingTotal(outstandingCH.add(outstandingCA));

        dto.setExtraCashInHand(extraCH);
        dto.setExtraCashInAccount(extraCA);
        dto.setExtraTotal(extraCH.add(extraCA));

        // Margins per bucket mirror their totals: committed - expensed, and received - released.
        // These only re-sum to totalMargin when committedSplitMismatch is false.
        dto.setTotalMarginCashInHand(dto.getCommittedCashInHand().subtract(expenseCH));
        dto.setTotalMarginCashInAccount(dto.getCommittedCashInAccount().subtract(expenseCA));
        dto.setCollectedMarginCashInHand(receivedCH.subtract(releasedCH));
        dto.setCollectedMarginCashInAccount(receivedCA.subtract(releasedCA));

        // Net margin: total margin minus anything released BEYOND what was expensed. Total margin
        // assumes vendors are paid exactly what was expensed; an over-release is real money gone,
        // so it comes off. extraCH/CA are already clamped at zero above, so a vendor that is
        // merely outstanding leaves its buckets untouched.
        dto.setNetMarginCashInHand(dto.getTotalMarginCashInHand().subtract(extraCH));
        dto.setNetMarginCashInAccount(dto.getTotalMarginCashInAccount().subtract(extraCA));
        dto.setNetMargin(dto.getTotalMargin().subtract(dto.getExtraTotal()));

        // Balance may go negative on either side; it is shown, never hidden.
        for (CustomerFinanceSummaryDto.VendorTotalDto vt : vendorMap.values()) {
            vt.setBalance(vt.getTotalExpensed().subtract(vt.getTotalReleased()));
            vt.setBalanceCashInHand(vt.getExpensedCashInHand().subtract(vt.getReleasedCashInHand()));
            vt.setBalanceCashInAccount(vt.getExpensedCashInAccount().subtract(vt.getReleasedCashInAccount()));
            dto.getVendorTotals().add(vt);
        }

        return dto;
    }

    /**
     * {outstanding C/H, outstanding C/A, extra C/H, extra C/A} of one vendor's
     * {expensed C/H, expensed C/A, released C/H, released C/A}. They follow the vendor's total:
     * only a bucket that is itself owed (or over) can carry the vendor's owed (or over) amount.
     * When both buckets lean the same way the total is their sum, so each keeps its own figure;
     * when they disagree only the larger side survives, capped at the total.
     */
    private static BigDecimal[] owedAndExtra(BigDecimal[] o) {
        BigDecimal net = o[0].add(o[1]).subtract(o[2]).subtract(o[3]);
        BigDecimal owed = net.max(BigDecimal.ZERO);
        BigDecimal over = net.negate().max(BigDecimal.ZERO);
        return new BigDecimal[]{
                o[0].subtract(o[2]).max(BigDecimal.ZERO).min(owed),
                o[1].subtract(o[3]).max(BigDecimal.ZERO).min(owed),
                o[2].subtract(o[0]).max(BigDecimal.ZERO).min(over),
                o[3].subtract(o[1]).max(BigDecimal.ZERO).min(over)};
    }

    /**
     * One side paid beyond its share while the other is still owed: the part that moved across
     * (a cash/bank shift, not extra money) and anything paid beyond the vendor's total. Worked
     * out here, on the same grouping as outstanding and extra, so the card and the notice can
     * never disagree with those figures. Under a rupee is rounding from percentage splits.
     */
    private static void markShift(CustomerFinanceSummaryDto.VendorTotalDto vt, BigDecimal[] o) {
        BigDecimal ch = o[0].subtract(o[2]);
        BigDecimal ca = o[1].subtract(o[3]);
        FinanceIncomePayment.PaymentMode from = null;
        BigDecimal moved = BigDecimal.ZERO;
        if (ch.signum() < 0 && ca.signum() > 0) {
            from = FinanceIncomePayment.PaymentMode.CASH_IN_HAND;
            moved = ch.negate().min(ca);
        } else if (ca.signum() < 0 && ch.signum() > 0) {
            from = FinanceIncomePayment.PaymentMode.CASH_IN_ACCOUNT;
            moved = ca.negate().min(ch);
        }
        if (from != null && moved.compareTo(BigDecimal.ONE) >= 0) {
            vt.setShiftFrom(from);
            vt.setShiftAmount(moved);
            vt.setShiftBeyondTotal(ch.add(ca).negate().max(BigDecimal.ZERO));
        }
    }

    /** Adds to one slot of a vendor's {expensed C/H, expensed C/A, released C/H, released C/A}. */
    private void addOwed(Map<Long, BigDecimal[]> owedByVendor, Long vendorId, int slot, BigDecimal amount) {
        BigDecimal[] o = owedByVendor.computeIfAbsent(vendorId,
                id -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
        o[slot] = o[slot].add(nz(amount));
    }

    /**
     * Fetches or creates this customer's running total for a vendor. Every numeric field starts at
     * ZERO rather than null because the caller only ever adds to them, and a vendor may be seen
     * first from either the expense side or the release side.
     */
    private CustomerFinanceSummaryDto.VendorTotalDto vendorTotalFor(
            Map<Long, CustomerFinanceSummaryDto.VendorTotalDto> vendorMap, Long vendorId, String vendorName) {
        return vendorMap.computeIfAbsent(vendorId, id -> {
            CustomerFinanceSummaryDto.VendorTotalDto fresh = new CustomerFinanceSummaryDto.VendorTotalDto();
            fresh.setVendorId(id);
            fresh.setVendorName(vendorName);
            fresh.setTotalExpensed(BigDecimal.ZERO);
            fresh.setExpensedCashInHand(BigDecimal.ZERO);
            fresh.setExpensedCashInAccount(BigDecimal.ZERO);
            fresh.setTotalReleased(BigDecimal.ZERO);
            fresh.setReleasedCashInHand(BigDecimal.ZERO);
            fresh.setReleasedCashInAccount(BigDecimal.ZERO);
            fresh.setExpenseCount(0L);
            fresh.setReleaseCount(0L);
            return fresh;
        });
    }

    private List<Long> idsOfPayments(List<FinanceIncomePayment> list) {
        return list.stream().map(FinanceIncomePayment::getId).toList();
    }

    private List<Long> idsOfExpenses(List<FinanceExpense> list) {
        return list.stream().map(FinanceExpense::getId).toList();
    }

    private List<Long> idsOfReleases(List<FinanceVendorRelease> list) {
        return list.stream().map(FinanceVendorRelease::getId).toList();
    }

    private Map<Long, List<FinanceReceiptFile>> groupFiles(List<FinanceReceiptFile> files,
                                                           java.util.function.Function<FinanceReceiptFile, Long> keyFn) {
        return files.stream().collect(Collectors.groupingBy(keyFn));
    }

    private List<CustomerFinanceSummaryDto.ReceiptDto> toReceiptDtos(List<FinanceReceiptFile> files) {
        if (files == null || files.isEmpty()) {
            return new ArrayList<>();
        }
        return files.stream()
                .map(f -> new CustomerFinanceSummaryDto.ReceiptDto(
                        f.getId(), f.getKind(), f.getFileUrl(), f.getFileName(), f.getUploadedAt()))
                .collect(Collectors.toList());
    }

    private Map<Long, BigDecimal> sumsToMap(List<Object[]> rows) {
        Map<Long, BigDecimal> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((Long) row[0], (BigDecimal) row[1]);
        }
        return map;
    }

    private BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
