package com.fleetmanagement.kitchencrmbackend.modules.dashboard.controller;

import com.fleetmanagement.kitchencrmbackend.modules.dashboard.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.dashboard.service.DashboardService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    /**
     * The summary mixes operational counts with the company's money, and staff need the counts —
     * so the endpoint stays open to every authenticated user and the FINANCIAL FIELDS are withheld
     * instead. Withheld means null, never zero: a 0 is indistinguishable from real data, and this
     * codebase has already been bitten by exactly that (see the note in QuotationDto and the V101
     * repair migration).
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getDashboardSummary() {
        ApiResponse<DashboardSummaryDto> response = dashboardService.getDashboardSummary();
        if (!isSuperAdmin() && response != null && response.getData() != null) {
            withholdFinancials(response.getData());
        }
        return ResponseEntity.ok(response);
    }

    /** Entirely a money report — there is no operational half worth keeping for staff. */
    @GetMapping("/revenue-analytics")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<RevenueAnalyticsDto>> getRevenueAnalytics(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().minusMonths(12)}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now()}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(dashboardService.getRevenueAnalytics(fromDate, toDate));
    }

    @GetMapping("/project-analytics")
    public ResponseEntity<ApiResponse<ProjectAnalyticsDto>> getProjectAnalytics(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().minusMonths(6)}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now()}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(dashboardService.getProjectAnalytics(fromDate, toDate));
    }

    @GetMapping("/customer-analytics")
    public ResponseEntity<ApiResponse<CustomerAnalyticsDto>> getCustomerAnalytics(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().minusMonths(12)}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now()}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(dashboardService.getCustomerAnalytics(fromDate, toDate));
    }

    @GetMapping("/performance-metrics")
    public ResponseEntity<ApiResponse<PerformanceMetricsDto>> getPerformanceMetrics(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().minusMonths(3)}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now()}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(dashboardService.getPerformanceMetrics(fromDate, toDate));
    }

    /** Same treatment: the operational counters stay, the money keys are removed for staff. */
    @GetMapping("/real-time-metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRealTimeMetrics() {
        ApiResponse<Map<String, Object>> response = dashboardService.getRealTimeMetrics();
        if (!isSuperAdmin() && response != null && response.getData() != null) {
            MONEY_METRIC_KEYS.forEach(response.getData()::remove);
        }
        return ResponseEntity.ok(response);
    }

    /** Money keys in the real-time metrics map, removed wholesale for non-super-admins. */
    private static final java.util.List<String> MONEY_METRIC_KEYS = java.util.List.of(
            "cash_in_hand", "cash_in_account", "pending_payments", "payments_today");

    private boolean isSuperAdmin() {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()));
    }

    /**
     * Nulls every money field. Kept as an explicit list rather than a clever filter so that adding
     * a financial field to the DTO and forgetting it here is a visible omission in review.
     */
    private void withholdFinancials(DashboardSummaryDto dto) {
        dto.setTotalQuotationValue(null);
        dto.setAverageQuotationValue(null);
        dto.setTotalProjectValue(null);
        dto.setCompletedProjectValue(null);
        dto.setTotalPaymentsReceived(null);
        dto.setPaymentsThisMonth(null);
        dto.setPendingPayments(null);
        dto.setCashInHand(null);
        dto.setCashInAccount(null);
    }

    @GetMapping("/business-alerts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBusinessAlerts() {
        return ResponseEntity.ok(dashboardService.getBusinessAlerts());
    }

    @GetMapping("/custom-report/{reportType}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateCustomReport(
            @PathVariable String reportType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Map<String, Object> parameters) {

        if (parameters == null) {
            parameters = Map.of();
        }

        return ResponseEntity.ok(dashboardService.generateCustomReport(reportType, fromDate, toDate, parameters));
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<byte[]>> exportDashboardData(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(dashboardService.exportDashboardData(format, fromDate, toDate));
    }
}