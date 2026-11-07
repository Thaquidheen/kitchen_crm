package com.fleetmanagement.kitchencrmbackend.modules.dashboard.service;

import com.fleetmanagement.kitchencrmbackend.modules.dashboard.dto.*;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;

import java.time.LocalDate;
import java.util.Map;

public interface DashboardService {

    // Main Dashboard
    ApiResponse<DashboardSummaryDto> getDashboardSummary();

    // Revenue Analytics
    ApiResponse<RevenueAnalyticsDto> getRevenueAnalytics(LocalDate fromDate, LocalDate toDate);

    // Project Analytics
    ApiResponse<ProjectAnalyticsDto> getProjectAnalytics(LocalDate fromDate, LocalDate toDate);

    // Customer Analytics
    ApiResponse<CustomerAnalyticsDto> getCustomerAnalytics(LocalDate fromDate, LocalDate toDate);

    // Performance Metrics
    ApiResponse<PerformanceMetricsDto> getPerformanceMetrics(LocalDate fromDate, LocalDate toDate);

    // Real-time Metrics
    ApiResponse<Map<String, Object>> getRealTimeMetrics();

    // Custom Reports
    ApiResponse<Map<String, Object>> generateCustomReport(String reportType,
                                                          LocalDate fromDate,
                                                          LocalDate toDate,
                                                          Map<String, Object> parameters);

    // Export Capabilities
    ApiResponse<byte[]> exportDashboardData(String format, LocalDate fromDate, LocalDate toDate);

    // Alerts and Notifications. includeFinancial is false for anyone who may not see the company's
    // money: the cash alert is then not even computed, so it cannot leak through the list or the
    // alert count.
    ApiResponse<Map<String, Object>> getBusinessAlerts(boolean includeFinancial);
}