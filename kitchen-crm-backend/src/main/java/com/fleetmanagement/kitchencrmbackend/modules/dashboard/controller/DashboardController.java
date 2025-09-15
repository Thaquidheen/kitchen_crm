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

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getDashboardSummary() {
        return ResponseEntity.ok(dashboardService.getDashboardSummary());
    }

    @GetMapping("/revenue-analytics")
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

    @GetMapping("/real-time-metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRealTimeMetrics() {
        return ResponseEntity.ok(dashboardService.getRealTimeMetrics());
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