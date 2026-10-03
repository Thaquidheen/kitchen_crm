package com.fleetmanagement.kitchencrmbackend.modules.finance.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.finance.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.finance.entity.*;
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
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Income & Expenses per customer. Every balance and margin is derived here, never stored:
 * received sums come from finance_income_payments, released sums from finance_vendor_releases,
 * totalMargin = totalAmount - SUM(expenses), collectedMargin = SUM(payments) - SUM(releases),
 * netMargin = totalMargin - extraTotal (extra = released beyond expensed, clamped per bucket).
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
        }

        // Cash split of the expense side, and the two figures that hang off it. Outstanding and
        // extra are clamped PER BUCKET before being summed — settling a 100%-cash expense from the
        // bank leaves you outstanding in C/H and over in C/A simultaneously, which a single net
        // figure would hide. The pair still reconciles with the net:
        //   outstandingTotal - extraTotal == expenseTotal - releasedTotal
        dto.setExpenseCashInHand(expenseCH);
        dto.setExpenseCashInAccount(expenseCA);

        BigDecimal outstandingCH = expenseCH.subtract(releasedCH).max(BigDecimal.ZERO);
        BigDecimal outstandingCA = expenseCA.subtract(releasedCA).max(BigDecimal.ZERO);
        dto.setOutstandingCashInHand(outstandingCH);
        dto.setOutstandingCashInAccount(outstandingCA);
        dto.setOutstandingTotal(outstandingCH.add(outstandingCA));

        BigDecimal extraCH = releasedCH.subtract(expenseCH).max(BigDecimal.ZERO);
        BigDecimal extraCA = releasedCA.subtract(expenseCA).max(BigDecimal.ZERO);
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
        // so it comes off. Per bucket this is committed - max(expensed, released). extraCH/CA are
        // already clamped at zero above, so a bucket that is merely outstanding is untouched.
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
