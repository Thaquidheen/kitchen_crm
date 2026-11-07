package com.fleetmanagement.kitchencrmbackend.modules.finance.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.finance.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface FinanceService {

    ApiResponse<Page<FinanceListRowDto>> getList(String search, Pageable pageable);

    ApiResponse<List<Map<String, Object>>> getEligibleCustomers(String search);

    ApiResponse<CustomerFinanceSummaryDto> create(FinanceCreateDto dto, String createdBy);

    ApiResponse<CustomerFinanceSummaryDto> getSummary(Long financeId);

    ApiResponse<CustomerFinanceSummaryDto> getSummaryByCustomer(Long customerId);

    ApiResponse<CustomerFinanceSummaryDto> updateHeader(Long financeId, FinanceHeaderUpdateDto dto);

    ApiResponse<String> delete(Long financeId);

    ApiResponse<CustomerFinanceSummaryDto> addPayment(Long financeId, PaymentRequestDto dto, String createdBy);

    ApiResponse<CustomerFinanceSummaryDto> updatePayment(Long paymentId, PaymentRequestDto dto);

    ApiResponse<CustomerFinanceSummaryDto> deletePayment(Long paymentId);

    ApiResponse<CustomerFinanceSummaryDto> addExpense(Long financeId, ExpenseRequestDto dto, String createdBy);

    ApiResponse<CustomerFinanceSummaryDto> updateExpense(Long expenseId, ExpenseRequestDto dto);

    ApiResponse<CustomerFinanceSummaryDto> deleteExpense(Long expenseId);

    ApiResponse<CustomerFinanceSummaryDto> addRelease(Long financeId, ReleaseRequestDto dto, String createdBy);

    ApiResponse<CustomerFinanceSummaryDto> updateRelease(Long releaseId, ReleaseRequestDto dto);

    ApiResponse<CustomerFinanceSummaryDto> deleteRelease(Long releaseId);

    ApiResponse<CustomerFinanceSummaryDto> uploadPaymentReceipts(Long paymentId, MultipartFile[] files);

    ApiResponse<CustomerFinanceSummaryDto> uploadExpenseReceipts(Long expenseId, String kind, MultipartFile[] files);

    ApiResponse<CustomerFinanceSummaryDto> uploadReleaseReceipts(Long releaseId, MultipartFile[] files);

    ApiResponse<CustomerFinanceSummaryDto> deleteReceipt(Long fileId);

    /** The stored file of one receipt, or null when the record or its file is gone. */
    FinanceReceiptContent getReceiptContent(Long fileId);

    /** Checks (save=false) or imports (save=true) a sheet of payments, expense lines and releases. */
    /** The Excel template for importSheet, with the active vendors in its Vendor drop-down. */
    byte[] importTemplate();

    ApiResponse<FinanceImportResultDto> importSheet(Long financeId, String fileName, byte[] bytes, boolean save, String createdBy);
}
