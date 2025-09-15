package com.fleetmanagement.kitchencrmbackend.modules.project.controller;

import com.fleetmanagement.kitchencrmbackend.modules.project.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.Payment;
import com.fleetmanagement.kitchencrmbackend.modules.project.service.PaymentService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PaymentSummaryDto>>> getAllPayments(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Payment.PaymentMethod paymentMethod,
            @RequestParam(required = false) Payment.PaymentStatus paymentStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String customerName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "paymentDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(paymentService.getAllPayments(
                projectId, paymentMethod, paymentStatus, fromDate, toDate, customerName, pageable));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentStatistics() {
        return ResponseEntity.ok(paymentService.getPaymentStatistics());
    }

    @GetMapping("/statistics/date-range")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentStatisticsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(paymentService.getPaymentStatisticsByDateRange(fromDate, toDate));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentDto>> getPaymentById(@PathVariable Long id) {
        ApiResponse<PaymentDto> response = paymentService.getPaymentById(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<PaymentSummaryDto>>> getPaymentsByProject(
            @PathVariable Long projectId) {
        return ResponseEntity.ok(paymentService.getPaymentsByProject(projectId));
    }

    @GetMapping("/project/{projectId}/summary")
    public ResponseEntity<ApiResponse<ProjectPaymentSummaryDto>> getProjectPaymentSummary(
            @PathVariable Long projectId) {
        return ResponseEntity.ok(paymentService.getProjectPaymentSummary(projectId));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentDto>> createPayment(
            @Valid @RequestBody PaymentCreateDto paymentCreateDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<PaymentDto> response = paymentService.createPayment(
                paymentCreateDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<PaymentDto>> addPaymentToProject(
            @PathVariable Long projectId,
            @Valid @RequestBody PaymentCreateDto paymentCreateDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<PaymentDto> response = paymentService.addPaymentToProject(
                projectId, paymentCreateDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentDto>> updatePayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentDto paymentDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<PaymentDto> response = paymentService.updatePayment(
                id, paymentDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deletePayment(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.deletePayment(id));
    }
}