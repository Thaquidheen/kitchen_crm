package com.fleetmanagement.kitchencrmbackend.modules.finance.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.finance.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.finance.service.FinanceService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Income & Expenses per customer. Money data — every endpoint is super-admin only.
 */
@RestController
@RequestMapping("/api/v1/customer-finance")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CustomerFinanceController {

    @Autowired
    private FinanceService service;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<FinanceListRowDto>>> getList(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(service.getList(search, pageable));
    }

    @GetMapping("/eligible-customers")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getEligibleCustomers(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(service.getEligibleCustomers(search));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> create(
            @Valid @RequestBody FinanceCreateDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return respond(service.create(dto, currentUser != null ? currentUser.getName() : null));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> getSummary(@PathVariable Long id) {
        return ResponseEntity.ok(service.getSummary(id));
    }

    @GetMapping("/by-customer/{customerId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> getByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(service.getSummaryByCustomer(customerId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> updateHeader(
            @PathVariable Long id,
            @Valid @RequestBody FinanceHeaderUpdateDto dto) {
        return respond(service.updateHeader(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        return ResponseEntity.ok(service.delete(id));
    }

    // ---------------------------------------------------------------- payments

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> addPayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentRequestDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return respond(service.addPayment(id, dto, currentUser != null ? currentUser.getName() : null));
    }

    @PutMapping("/payments/{paymentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> updatePayment(
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentRequestDto dto) {
        return respond(service.updatePayment(paymentId, dto));
    }

    @DeleteMapping("/payments/{paymentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> deletePayment(@PathVariable Long paymentId) {
        return respond(service.deletePayment(paymentId));
    }

    // ---------------------------------------------------------------- expenses

    @PostMapping("/{id}/expenses")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> addExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequestDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return respond(service.addExpense(id, dto, currentUser != null ? currentUser.getName() : null));
    }

    @PutMapping("/expenses/{expenseId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> updateExpense(
            @PathVariable Long expenseId,
            @Valid @RequestBody ExpenseRequestDto dto) {
        return respond(service.updateExpense(expenseId, dto));
    }

    @DeleteMapping("/expenses/{expenseId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> deleteExpense(@PathVariable Long expenseId) {
        return respond(service.deleteExpense(expenseId));
    }

    // ---------------------------------------------------------------- vendor releases

    @PostMapping("/{id}/releases")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> addRelease(
            @PathVariable Long id,
            @Valid @RequestBody ReleaseRequestDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return respond(service.addRelease(id, dto, currentUser != null ? currentUser.getName() : null));
    }

    @PutMapping("/releases/{releaseId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> updateRelease(
            @PathVariable Long releaseId,
            @Valid @RequestBody ReleaseRequestDto dto) {
        return respond(service.updateRelease(releaseId, dto));
    }

    @DeleteMapping("/releases/{releaseId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> deleteRelease(@PathVariable Long releaseId) {
        return respond(service.deleteRelease(releaseId));
    }

    // ---------------------------------------------------------------- receipts

    @PostMapping(value = "/payments/{paymentId}/receipts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> uploadPaymentReceipts(
            @PathVariable Long paymentId,
            @RequestParam("files") MultipartFile[] files) {
        return respond(service.uploadPaymentReceipts(paymentId, files));
    }

    @PostMapping(value = "/expenses/{expenseId}/receipts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> uploadExpenseReceipts(
            @PathVariable Long expenseId,
            @RequestParam(value = "kind", required = false) String kind,
            @RequestParam("files") MultipartFile[] files) {
        return respond(service.uploadExpenseReceipts(expenseId, kind, files));
    }

    @PostMapping(value = "/releases/{releaseId}/receipts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> uploadReleaseReceipts(
            @PathVariable Long releaseId,
            @RequestParam("files") MultipartFile[] files) {
        return respond(service.uploadReleaseReceipts(releaseId, files));
    }

    @DeleteMapping("/receipts/{fileId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerFinanceSummaryDto>> deleteReceipt(@PathVariable Long fileId) {
        return respond(service.deleteReceipt(fileId));
    }

    private <T> ResponseEntity<ApiResponse<T>> respond(ApiResponse<T> response) {
        return Boolean.TRUE.equals(response.getSuccess())
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }
}
