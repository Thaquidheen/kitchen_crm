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
public class PerformanceMetricsDto {

    // KPI Metrics
    private Map<String, Object> kpiMetrics;

    // Sales Performance
    private SalesPerformanceDto salesPerformance;

    // Operational Efficiency
    private OperationalEfficiencyDto operationalEfficiency;

    // Quality Metrics
    private QualityMetricsDto qualityMetrics;

    // Financial Health
    private FinancialHealthDto financialHealth;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesPerformanceDto {
        private BigDecimal monthlyTarget;
        private BigDecimal monthlyAchieved;
        private Double achievementPercentage;
        private Integer leadsGenerated;
        private Integer quotationsSent;
        private Integer projectsWon;
        private Double conversionRate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperationalEfficiencyDto {
        private Double averageProjectDuration;
        private Double onTimeDeliveryRate;
        private Double resourceUtilization;
        private Integer activeTeamMembers;
        private Double productivityIndex;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityMetricsDto {
        private Double qualityPassRate;
        private Integer revisionCount;
        private Double customerSatisfactionAvg;
        private Integer warrantyIssues;
        private Double defectRate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialHealthDto {
        private BigDecimal grossRevenue;
        private BigDecimal netProfit;
        private Double profitMargin;
        private BigDecimal operatingExpenses;
        private Double returnOnInvestment;
        private Integer daysOfCashOnHand;
    }
}