package com.fleetmanagement.kitchencrmbackend.modules.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RevenueAnalyticsDto {

    // Monthly Revenue Data
    private List<MonthlyRevenueDto> monthlyRevenue;

    // Payment Method Breakdown
    private Map<String, BigDecimal> paymentMethodBreakdown;

    // Revenue by Project Status
    private Map<String, BigDecimal> revenueByProjectStatus;

    // Top Customers by Revenue
    private List<CustomerRevenueDto> topCustomersByRevenue;

    // Revenue Projections
    private BigDecimal currentMonthProjection;
    private BigDecimal nextMonthProjection;

    // Financial Health Indicators
    private BigDecimal totalOutstanding;
    private BigDecimal averagePaymentTime; // Days
    private Double collectionEfficiency; // Percentage

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenueDto {
        private String month;
        private BigDecimal revenue;
        private BigDecimal target;
        private Integer projectsCompleted;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerRevenueDto {
        private Long customerId;
        private String customerName;
        private BigDecimal totalRevenue;
        private Integer projectsCount;
    }
}