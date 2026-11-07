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

    /** Operational, so open to staff; the one money field (project value) is withheld from them. */
    @GetMapping("/project-analytics")
    public ResponseEntity<ApiResponse<ProjectAnalyticsDto>> getProjectAnalytics(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().minusMonths(6)}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now()}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        ApiResponse<ProjectAnalyticsDto> response = dashboardService.getProjectAnalytics(fromDate, toDate);
        if (!isSuperAdmin() && response != null && response.getData() != null) {
            withholdFinancials(response.getData());
        }
        return ResponseEntity.ok(response);
    }

    /** Customer counts stay open to staff; the cost and lifetime-value figures are withheld. */
    @GetMapping("/customer-analytics")
    public ResponseEntity<ApiResponse<CustomerAnalyticsDto>> getCustomerAnalytics(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().minusMonths(12)}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now()}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        ApiResponse<CustomerAnalyticsDto> response = dashboardService.getCustomerAnalytics(fromDate, toDate);
        if (!isSuperAdmin() && response != null && response.getData() != null) {
            withholdFinancials(response.getData());
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Same treatment as /summary: the operational and quality figures stay for staff, the money is
     * withheld. This used to go out whole to every signed-in user, revenue and profit included.
     */
    @GetMapping("/performance-metrics")
    public ResponseEntity<ApiResponse<PerformanceMetricsDto>> getPerformanceMetrics(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().minusMonths(3)}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now()}")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        ApiResponse<PerformanceMetricsDto> response = dashboardService.getPerformanceMetrics(fromDate, toDate);
        if (!isSuperAdmin() && response != null && response.getData() != null) {
            withholdFinancials(response.getData());
        }
        return ResponseEntity.ok(response);
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

    /**
     * The achievement percentage goes too: the monthly target is a constant in the source, so the
     * percentage alone gives away the month's takings. The nested objects are kept (with null
     * fields) so a client reading salesPerformance.x or financialHealth.x does not crash.
     */
    private void withholdFinancials(PerformanceMetricsDto dto) {
        if (dto.getKpiMetrics() != null) {
            dto.getKpiMetrics().remove("total_revenue");
        }
        PerformanceMetricsDto.SalesPerformanceDto sales = dto.getSalesPerformance();
        if (sales != null) {
            sales.setMonthlyTarget(null);
            sales.setMonthlyAchieved(null);
            sales.setAchievementPercentage(null);
        }
        PerformanceMetricsDto.FinancialHealthDto health = dto.getFinancialHealth();
        if (health != null) {
            health.setGrossRevenue(null);
            health.setNetProfit(null);
            health.setProfitMargin(null);
            health.setOperatingExpenses(null);
            health.setReturnOnInvestment(null);
            health.setDaysOfCashOnHand(null);
        }
    }

    private void withholdFinancials(ProjectAnalyticsDto dto) {
        if (dto.getProjectTimelines() != null) {
            dto.getProjectTimelines().forEach(t -> t.setProjectValue(null));
        }
    }

    private void withholdFinancials(CustomerAnalyticsDto dto) {
        if (dto.getMonthlyAcquisition() != null) {
            dto.getMonthlyAcquisition().forEach(m -> m.setAcquisitionCost(null));
        }
        if (dto.getRetentionMetrics() != null) {
            dto.getRetentionMetrics().remove("customer_lifetime_value");
        }
    }

    /** Staff keep the operational alerts; the cash alert is only built for the administrator. */
    @GetMapping("/business-alerts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBusinessAlerts() {
        return ResponseEntity.ok(dashboardService.getBusinessAlerts(isSuperAdmin()));
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