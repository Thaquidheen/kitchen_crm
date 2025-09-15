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
public class CustomerAnalyticsDto {

    // Customer Acquisition
    private List<MonthlyCustomerDto> monthlyAcquisition;

    // Customer Segmentation
    private Map<String, Long> customerSegmentation;

    // Customer Lifecycle
    private Map<String, Long> customerLifecycle;

    // Customer Satisfaction
    private List<CustomerSatisfactionDto> customerSatisfaction;

    // Customer Retention
    private Map<String, Object> retentionMetrics;

    // Geographic Distribution
    private Map<String, Long> geographicDistribution;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyCustomerDto {
        private String month;
        private Long newCustomers;
        private Long totalCustomers;
        private BigDecimal acquisitionCost;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerSatisfactionDto {
        private Long customerId;
        private String customerName;
        private Integer satisfactionScore;
        private String feedback;
        private String projectPhase;
    }
}