package com.fleetmanagement.kitchencrmbackend.modules.dashboard.service;

import com.fleetmanagement.kitchencrmbackend.modules.dashboard.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.DesignPhaseRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionInstallationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.project.repository.CustomerProjectRepository;
import com.fleetmanagement.kitchencrmbackend.modules.project.repository.PaymentRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionInstallation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.Payment;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private CustomerProjectRepository projectRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private DesignPhaseRepository designPhaseRepository;

    @Autowired
    private ProductionInstallationRepository installationRepository;

    @Override
    public ApiResponse<DashboardSummaryDto> getDashboardSummary() {
        DashboardSummaryDto summary = new DashboardSummaryDto();

        // Customer Metrics
        summary.setTotalCustomers(customerRepository.count());
        summary.setNewCustomersThisMonth(getNewCustomersThisMonth());
        summary.setActiveCustomers(getActiveCustomersCount());

        // Quotation Metrics
        summary.setTotalQuotations(quotationRepository.count());
        summary.setPendingQuotations(quotationRepository.countByStatus(Quotation.QuotationStatus.PENDING));
        summary.setApprovedQuotations(quotationRepository.countByStatus(Quotation.QuotationStatus.APPROVED));
        summary.setTotalQuotationValue(getTotalQuotationValue());
        summary.setAverageQuotationValue(getAverageQuotationValue());

        // Project Metrics
        summary.setTotalProjects(projectRepository.count());
        summary.setActiveProjects(projectRepository.countByStatus(CustomerProject.ProjectStatus.ACTIVE));
        summary.setCompletedProjects(projectRepository.countByStatus(CustomerProject.ProjectStatus.COMPLETED));
        summary.setTotalProjectValue(getTotalProjectValue());
        summary.setCompletedProjectValue(getCompletedProjectValue());

        // Payment Metrics
        summary.setTotalPaymentsReceived(getTotalPaymentsReceived());
        summary.setPaymentsThisMonth(getPaymentsThisMonth());
        summary.setPendingPayments(getPendingPayments());
        summary.setCashInHand(getTotalCashInHand());
        summary.setCashInAccount(getTotalCashInAccount());

        // Design Phase Metrics
        summary.setDesignsInProgress(designPhaseRepository.countByDesignStatus(DesignPhase.DesignStatus.IN_PROGRESS));
        summary.setDesignsAwaitingApproval(designPhaseRepository.countByDesignStatus(DesignPhase.DesignStatus.SUBMITTED));
        summary.setApprovedDesigns(designPhaseRepository.countByDesignStatus(DesignPhase.DesignStatus.APPROVED));

        // Production & Installation Metrics
        summary.setInstallationsInProgress(installationRepository.countByOverallStatus(ProductionInstallation.InstallationStatus.INSTALLATION));
        summary.setReadyForInstallation(Long.valueOf(installationRepository.findReadyForInstallation().size()));
        summary.setCompletedInstallations(installationRepository.countByOverallStatus(ProductionInstallation.InstallationStatus.COMPLETED));
        summary.setOverdueProjects(Long.valueOf(installationRepository.findOverdueProjects(LocalDate.now()).size()));

        // Performance Metrics
        summary.setConversionRate(calculateConversionRate());
        summary.setCompletionRate(calculateCompletionRate());
        summary.setAverageProjectDuration(calculateAverageProjectDuration());

        summary.setLastUpdated(LocalDate.now());

        return ApiResponse.success(summary);
    }

    @Override
    public ApiResponse<RevenueAnalyticsDto> getRevenueAnalytics(LocalDate fromDate, LocalDate toDate) {
        RevenueAnalyticsDto analytics = new RevenueAnalyticsDto();

        // Monthly Revenue Data
        analytics.setMonthlyRevenue(getMonthlyRevenueData(fromDate, toDate));

        // Payment Method Breakdown
        analytics.setPaymentMethodBreakdown(getPaymentMethodBreakdown());

        // Revenue by Project Status
        analytics.setRevenueByProjectStatus(getRevenueByProjectStatus());

        // Top Customers by Revenue
        analytics.setTopCustomersByRevenue(getTopCustomersByRevenue(10));

        // Revenue Projections
        analytics.setCurrentMonthProjection(getCurrentMonthProjection());
        analytics.setNextMonthProjection(getNextMonthProjection());

        // Financial Health Indicators
        analytics.setTotalOutstanding(getTotalOutstanding());
        analytics.setAveragePaymentTime(getAveragePaymentTime());
        analytics.setCollectionEfficiency(getCollectionEfficiency());

        return ApiResponse.success(analytics);
    }

    @Override
    public ApiResponse<ProjectAnalyticsDto> getProjectAnalytics(LocalDate fromDate, LocalDate toDate) {
        ProjectAnalyticsDto analytics = new ProjectAnalyticsDto();

        // Project Status Distribution
        Map<String, Long> statusDistribution = new HashMap<>();
        for (CustomerProject.ProjectStatus status : CustomerProject.ProjectStatus.values()) {
            statusDistribution.put(status.name(), projectRepository.countByStatus(status));
        }
        analytics.setProjectStatusDistribution(statusDistribution);

        // Installation Status Distribution
        Map<String, Long> installationDistribution = new HashMap<>();
        for (ProductionInstallation.InstallationStatus status : ProductionInstallation.InstallationStatus.values()) {
            installationDistribution.put(status.name(), installationRepository.countByOverallStatus(status));
        }
        analytics.setInstallationStatusDistribution(installationDistribution);

        // Project Timeline Analysis
        analytics.setProjectTimelines(getProjectTimelineAnalysis());

        // Team Performance
        analytics.setTeamPerformance(getTeamPerformanceAnalysis());

        // Project Size Analysis
        analytics.setProjectSizeAnalysis(getProjectSizeAnalysis());

        // Bottleneck Analysis
        analytics.setBottlenecks(getBottleneckAnalysis());

        return ApiResponse.success(analytics);
    }

    @Override
    public ApiResponse<CustomerAnalyticsDto> getCustomerAnalytics(LocalDate fromDate, LocalDate toDate) {
        CustomerAnalyticsDto analytics = new CustomerAnalyticsDto();

        // Monthly Customer Acquisition
        analytics.setMonthlyAcquisition(getMonthlyCustomerAcquisition(fromDate, toDate));

        // Customer Segmentation
        analytics.setCustomerSegmentation(getCustomerSegmentation());

        // Customer Lifecycle
        analytics.setCustomerLifecycle(getCustomerLifecycle());

        // Customer Satisfaction
        analytics.setCustomerSatisfaction(getCustomerSatisfactionData());

        // Customer Retention
        analytics.setRetentionMetrics(getRetentionMetrics());

        // Geographic Distribution
        analytics.setGeographicDistribution(getGeographicDistribution());

        return ApiResponse.success(analytics);
    }

    @Override
    public ApiResponse<PerformanceMetricsDto> getPerformanceMetrics(LocalDate fromDate, LocalDate toDate) {
        PerformanceMetricsDto metrics = new PerformanceMetricsDto();

        // KPI Metrics
        Map<String, Object> kpiMetrics = new HashMap<>();
        kpiMetrics.put("total_revenue", getTotalPaymentsReceived());
        kpiMetrics.put("active_projects", projectRepository.countByStatus(CustomerProject.ProjectStatus.ACTIVE));
        kpiMetrics.put("customer_satisfaction", 4.2); // Mock data
        kpiMetrics.put("on_time_delivery", 87.5); // Mock data
        metrics.setKpiMetrics(kpiMetrics);

        // Sales Performance
        PerformanceMetricsDto.SalesPerformanceDto salesPerformance = new PerformanceMetricsDto.SalesPerformanceDto();
        salesPerformance.setMonthlyTarget(BigDecimal.valueOf(1000000));
        salesPerformance.setMonthlyAchieved(getPaymentsThisMonth());
        salesPerformance.setAchievementPercentage(calculateAchievementPercentage());
        salesPerformance.setConversionRate(calculateConversionRate());
        metrics.setSalesPerformance(salesPerformance);

        // Operational Efficiency
        PerformanceMetricsDto.OperationalEfficiencyDto operationalEfficiency = new PerformanceMetricsDto.OperationalEfficiencyDto();
        operationalEfficiency.setAverageProjectDuration(Double.valueOf(calculateAverageProjectDuration()));
        operationalEfficiency.setOnTimeDeliveryRate(calculateOnTimeDeliveryRate());
        operationalEfficiency.setResourceUtilization(calculateResourceUtilization());
        metrics.setOperationalEfficiency(operationalEfficiency);

        // Quality Metrics
        PerformanceMetricsDto.QualityMetricsDto qualityMetrics = new PerformanceMetricsDto.QualityMetricsDto();
        qualityMetrics.setQualityPassRate(calculateQualityPassRate());
        qualityMetrics.setCustomerSatisfactionAvg(4.2); // Mock data
        metrics.setQualityMetrics(qualityMetrics);

        // Financial Health
        PerformanceMetricsDto.FinancialHealthDto financialHealth = new PerformanceMetricsDto.FinancialHealthDto();
        financialHealth.setGrossRevenue(getTotalPaymentsReceived());
        financialHealth.setNetProfit(calculateNetProfit());
        financialHealth.setProfitMargin(calculateProfitMargin());
        metrics.setFinancialHealth(financialHealth);

        return ApiResponse.success(metrics);
    }

    @Override
    public ApiResponse<Map<String, Object>> getRealTimeMetrics() {
        Map<String, Object> realTimeMetrics = new HashMap<>();

        // Current Active Metrics
        realTimeMetrics.put("active_quotations", quotationRepository.countByStatus(Quotation.QuotationStatus.PENDING));
        realTimeMetrics.put("active_projects", projectRepository.countByStatus(CustomerProject.ProjectStatus.ACTIVE));
        realTimeMetrics.put("installations_today", getInstallationsToday());
        realTimeMetrics.put("payments_today", getPaymentsToday());

        // Urgent Actions Required
        realTimeMetrics.put("overdue_quotations", getOverdueQuotations());
        realTimeMetrics.put("overdue_projects", installationRepository.findOverdueProjects(LocalDate.now()).size());
        realTimeMetrics.put("pending_approvals", getPendingApprovals());

        // Today's Activity
        realTimeMetrics.put("new_customers_today", getNewCustomersToday());
        realTimeMetrics.put("quotations_sent_today", getQuotationsSentToday());
        realTimeMetrics.put("projects_completed_today", getProjectsCompletedToday());

        // Cash Flow
        realTimeMetrics.put("cash_in_hand", getTotalCashInHand());
        realTimeMetrics.put("cash_in_account", getTotalCashInAccount());
        realTimeMetrics.put("pending_payments", getPendingPayments());

        return ApiResponse.success(realTimeMetrics);
    }

    @Override
    public ApiResponse<Map<String, Object>> generateCustomReport(String reportType,
                                                                 LocalDate fromDate,
                                                                 LocalDate toDate,
                                                                 Map<String, Object> parameters) {
        Map<String, Object> report = new HashMap<>();

        switch (reportType.toLowerCase()) {
            case "sales_report":
                report = generateSalesReport(fromDate, toDate);
                break;
            case "financial_report":
                report = generateFinancialReport(fromDate, toDate);
                break;
            case "project_status_report":
                report = generateProjectStatusReport(fromDate, toDate);
                break;
            case "customer_report":
                report = generateCustomerReport(fromDate, toDate);
                break;
            default:
                return ApiResponse.error("Invalid report type: " + reportType);
        }

        report.put("report_type", reportType);
        report.put("from_date", fromDate);
        report.put("to_date", toDate);
        report.put("generated_at", LocalDate.now());

        return ApiResponse.success(report);
    }

    @Override
    public ApiResponse<byte[]> exportDashboardData(String format, LocalDate fromDate, LocalDate toDate) {
        // This would typically generate CSV/Excel/PDF files
        // For now, returning mock data
        String mockData = "Dashboard Export Data for " + fromDate + " to " + toDate;
        return ApiResponse.success(mockData.getBytes());
    }

    @Override
    public ApiResponse<Map<String, Object>> getBusinessAlerts() {
        Map<String, Object> alerts = new HashMap<>();
        List<Map<String, Object>> alertsList = new ArrayList<>();

        // Overdue Projects Alert
        int overdueCount = installationRepository.findOverdueProjects(LocalDate.now()).size();
        if (overdueCount > 0) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "warning");
            alert.put("title", "Overdue Projects");
            alert.put("message", overdueCount + " projects are overdue");
            alert.put("action", "Review project timelines");
            alert.put("priority", "high");
            alertsList.add(alert);
        }

        // Low Cash Alert
        BigDecimal totalCash = getTotalCashInHand().add(getTotalCashInAccount());
        if (totalCash.compareTo(BigDecimal.valueOf(100000)) < 0) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "danger");
            alert.put("title", "Low Cash Alert");
            alert.put("message", "Total cash below minimum threshold");
            alert.put("action", "Follow up on pending payments");
            alert.put("priority", "high");
            alertsList.add(alert);
        }

        // Pending Quotations Alert
        long pendingQuotations = quotationRepository.countByStatus(Quotation.QuotationStatus.PENDING);
        if (pendingQuotations > 10) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "info");
            alert.put("title", "Pending Quotations");
            alert.put("message", pendingQuotations + " quotations pending approval");
            alert.put("action", "Review and process quotations");
            alert.put("priority", "medium");
            alertsList.add(alert);
        }

        alerts.put("alerts", alertsList);
        alerts.put("total_alerts", alertsList.size());

        return ApiResponse.success(alerts);
    }

    // Helper methods for calculations
    private Long getNewCustomersThisMonth() {
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        return customerRepository.countByCreatedAtBetween(
                startOfMonth.atStartOfDay(),
                LocalDate.now().atTime(23, 59, 59));
    }

    private Long getActiveCustomersCount() {
        // Customers with active projects or recent activity
        return customerRepository.countActiveCustomers();
    }

    private BigDecimal getTotalQuotationValue() {
        return quotationRepository.getTotalQuotationValue();
    }

    private BigDecimal getAverageQuotationValue() {
        BigDecimal total = getTotalQuotationValue();
        long count = quotationRepository.count();
        return count > 0 ? total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    private BigDecimal getTotalProjectValue() {
        return projectRepository.getTotalProjectValue();
    }

    private BigDecimal getCompletedProjectValue() {
        return projectRepository.getTotalValueByStatus(CustomerProject.ProjectStatus.COMPLETED);
    }

    private BigDecimal getTotalPaymentsReceived() {
        return paymentRepository.getTotalPaymentsBetweenDates(LocalDate.of(2020, 1, 1), LocalDate.now());
    }

    private BigDecimal getPaymentsThisMonth() {
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        return paymentRepository.getTotalPaymentsBetweenDates(startOfMonth, LocalDate.now());
    }

    private BigDecimal getPendingPayments() {
        return projectRepository.getTotalPendingPayments();
    }

    private BigDecimal getTotalCashInHand() {
        return projectRepository.getTotalCashInHand();
    }

    private BigDecimal getTotalCashInAccount() {
        return projectRepository.getTotalCashInAccount();
    }

    private Double calculateConversionRate() {
        long totalQuotations = quotationRepository.count();
        long approvedQuotations = quotationRepository.countByStatus(Quotation.QuotationStatus.APPROVED);
        return totalQuotations > 0 ? (approvedQuotations * 100.0) / totalQuotations : 0.0;
    }

    private Double calculateCompletionRate() {
        long totalProjects = projectRepository.count();
        long completedProjects = projectRepository.countByStatus(CustomerProject.ProjectStatus.COMPLETED);
        return totalProjects > 0 ? (completedProjects * 100.0) / totalProjects : 0.0;
    }

    private Integer calculateAverageProjectDuration() {
        return projectRepository.getAverageProjectDuration();
    }

    private List<RevenueAnalyticsDto.MonthlyRevenueDto> getMonthlyRevenueData(LocalDate fromDate, LocalDate toDate) {
        List<RevenueAnalyticsDto.MonthlyRevenueDto> monthlyData = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        LocalDate current = fromDate.withDayOfMonth(1);
        while (!current.isAfter(toDate)) {
            LocalDate monthEnd = current.withDayOfMonth(current.lengthOfMonth());

            BigDecimal monthlyRevenue = paymentRepository.getTotalPaymentsBetweenDates(current, monthEnd);
            if (monthlyRevenue == null) monthlyRevenue = BigDecimal.ZERO;

            // Mock target data - in real implementation, this would come from a targets table
            BigDecimal target = BigDecimal.valueOf(500000);

            int projectsCompleted = projectRepository.countCompletedProjectsBetweenDates(current, monthEnd);

            RevenueAnalyticsDto.MonthlyRevenueDto monthlyDto = new RevenueAnalyticsDto.MonthlyRevenueDto(
                    current.format(formatter), monthlyRevenue, target, projectsCompleted);
            monthlyData.add(monthlyDto);

            current = current.plusMonths(1);
        }

        return monthlyData;
    }

    private Map<String, BigDecimal> getPaymentMethodBreakdown() {
        List<Object[]> methodSummary = paymentRepository.getPaymentMethodSummary();
        Map<String, BigDecimal> breakdown = new HashMap<>();

        for (Object[] row : methodSummary) {
            Payment.PaymentMethod method = (Payment.PaymentMethod) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            breakdown.put(method.name(), amount);
        }

        return breakdown;
    }

    private Map<String, BigDecimal> getRevenueByProjectStatus() {
        Map<String, BigDecimal> revenueByStatus = new HashMap<>();

        for (CustomerProject.ProjectStatus status : CustomerProject.ProjectStatus.values()) {
            BigDecimal revenue = projectRepository.getTotalValueByStatus(status);
            revenueByStatus.put(status.name(), revenue != null ? revenue : BigDecimal.ZERO);
        }

        return revenueByStatus;
    }

    private List<RevenueAnalyticsDto.CustomerRevenueDto> getTopCustomersByRevenue(int limit) {
        List<Object[]> topCustomers = customerRepository.getTopCustomersByRevenue(limit);
        List<RevenueAnalyticsDto.CustomerRevenueDto> customerRevenue = new ArrayList<>();

        for (Object[] row : topCustomers) {
            Long customerId = (Long) row[0];
            String customerName = (String) row[1];
            BigDecimal totalRevenue = (BigDecimal) row[2];
            Integer projectsCount = ((Number) row[3]).intValue();

            customerRevenue.add(new RevenueAnalyticsDto.CustomerRevenueDto(
                    customerId, customerName, totalRevenue, projectsCount));
        }

        return customerRevenue;
    }

    private BigDecimal getCurrentMonthProjection() {
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        BigDecimal currentMonthRevenue = paymentRepository.getTotalPaymentsBetweenDates(startOfMonth, LocalDate.now());

        // Simple projection based on current pace
        int daysInMonth = LocalDate.now().lengthOfMonth();
        int daysPassed = LocalDate.now().getDayOfMonth();

        if (daysPassed > 0) {
            return currentMonthRevenue.multiply(BigDecimal.valueOf(daysInMonth))
                    .divide(BigDecimal.valueOf(daysPassed), 2, RoundingMode.HALF_UP);
        }

        return BigDecimal.ZERO;
    }

    private BigDecimal getNextMonthProjection() {
        // Based on pipeline and historical data
        long activeProjects = projectRepository.countByStatus(CustomerProject.ProjectStatus.ACTIVE);
        BigDecimal avgProjectValue = getAverageQuotationValue();

        // Simple projection - 30% of active projects expected to complete next month
        return avgProjectValue.multiply(BigDecimal.valueOf(activeProjects * 0.3));
    }

    private BigDecimal getTotalOutstanding() {
        return projectRepository.getTotalPendingPayments();
    }

    private BigDecimal getAveragePaymentTime() {
        // Mock calculation - in real implementation, calculate from payment dates vs invoice dates
        return BigDecimal.valueOf(15); // 15 days average
    }

    private Double getCollectionEfficiency() {
        BigDecimal totalInvoiced = getTotalProjectValue();
        BigDecimal totalCollected = getTotalPaymentsReceived();

        if (totalInvoiced.compareTo(BigDecimal.ZERO) > 0) {
            return totalCollected.multiply(BigDecimal.valueOf(100))
                    .divide(totalInvoiced, 2, RoundingMode.HALF_UP).doubleValue();
        }

        return 0.0;
    }

    private List<ProjectAnalyticsDto.ProjectTimelineDto> getProjectTimelineAnalysis() {
        List<Object[]> projectTimelines = projectRepository.getProjectTimelineAnalysis();
        List<ProjectAnalyticsDto.ProjectTimelineDto> timelineData = new ArrayList<>();

        for (Object[] row : projectTimelines) {
            String projectName = (String) row[0];
            String customerName = (String) row[1];
            Integer estimatedDays = (Integer) row[2];
            Integer actualDays = (Integer) row[3];
            String status = (String) row[4];
            BigDecimal projectValue = (BigDecimal) row[5];

            timelineData.add(new ProjectAnalyticsDto.ProjectTimelineDto(
                    projectName, customerName, estimatedDays, actualDays, status, projectValue));
        }

        return timelineData;
    }

    private List<ProjectAnalyticsDto.TeamPerformanceDto> getTeamPerformanceAnalysis() {
        List<ProjectAnalyticsDto.TeamPerformanceDto> teamPerformance = new ArrayList<>();

        // Get unique project managers
        List<String> projectManagers = installationRepository.findAll().stream()
                .map(ProductionInstallation::getProjectManagerAssigned)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        for (String pm : projectManagers) {
            List<ProductionInstallation> pmProjects = installationRepository.findByProjectManagerAssigned(pm);

            int activeProjects = (int) pmProjects.stream()
                    .filter(p -> p.getOverallStatus() != ProductionInstallation.InstallationStatus.COMPLETED)
                    .count();

            int completedProjects = (int) pmProjects.stream()
                    .filter(p -> p.getOverallStatus() == ProductionInstallation.InstallationStatus.COMPLETED)
                    .count();

            // Mock calculations for demonstration
            Double avgCompletionTime = 45.0; // days
            Double efficiency = 85.0; // percentage

            teamPerformance.add(new ProjectAnalyticsDto.TeamPerformanceDto(
                    pm, "Project Manager", activeProjects, completedProjects, avgCompletionTime, efficiency));
        }

        return teamPerformance;
    }

    private Map<String, Object> getProjectSizeAnalysis() {
        Map<String, Object> sizeAnalysis = new HashMap<>();

        // Project value ranges
        sizeAnalysis.put("small_projects", projectRepository.countProjectsByValueRange(BigDecimal.ZERO, BigDecimal.valueOf(100000)));
        sizeAnalysis.put("medium_projects", projectRepository.countProjectsByValueRange(BigDecimal.valueOf(100000), BigDecimal.valueOf(500000)));
        sizeAnalysis.put("large_projects", projectRepository.countProjectsByValueRange(BigDecimal.valueOf(500000), BigDecimal.valueOf(1000000)));
        sizeAnalysis.put("enterprise_projects", projectRepository.countProjectsByValueRange(BigDecimal.valueOf(1000000), BigDecimal.valueOf(10000000)));

        return sizeAnalysis;
    }

    private List<ProjectAnalyticsDto.BottleneckDto> getBottleneckAnalysis() {
        List<ProjectAnalyticsDto.BottleneckDto> bottlenecks = new ArrayList<>();

        // Analyze where projects get stuck
        long designBottleneck = designPhaseRepository.countByDesignStatus(DesignPhase.DesignStatus.REVISION_REQUIRED);
        if (designBottleneck > 0) {
            bottlenecks.add(new ProjectAnalyticsDto.BottleneckDto(
                    "Design Revisions", designBottleneck, 7.5, "Improve initial design quality and client communication"));
        }

        long sitePreparationBottleneck = installationRepository.countByOverallStatus(ProductionInstallation.InstallationStatus.SITE_PREPARATION);
        if (sitePreparationBottleneck > 0) {
            bottlenecks.add(new ProjectAnalyticsDto.BottleneckDto(
                    "Site Preparation", sitePreparationBottleneck, 12.0, "Coordinate better with civil contractors"));
        }

        return bottlenecks;
    }

    private List<CustomerAnalyticsDto.MonthlyCustomerDto> getMonthlyCustomerAcquisition(LocalDate fromDate, LocalDate toDate) {
        List<CustomerAnalyticsDto.MonthlyCustomerDto> acquisitionData = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        LocalDate current = fromDate.withDayOfMonth(1);
        while (!current.isAfter(toDate)) {
            LocalDate monthEnd = current.withDayOfMonth(current.lengthOfMonth());

            Long newCustomers = customerRepository.countByCreatedAtBetween(
                    current.atStartOfDay(), monthEnd.atTime(23, 59, 59));

            Long totalCustomers = customerRepository.countByCreatedAtBefore(monthEnd.atTime(23, 59, 59));

            // Mock acquisition cost
            BigDecimal acquisitionCost = BigDecimal.valueOf(5000);

            acquisitionData.add(new CustomerAnalyticsDto.MonthlyCustomerDto(
                    current.format(formatter), newCustomers, totalCustomers, acquisitionCost));

            current = current.plusMonths(1);
        }

        return acquisitionData;
    }

    private Map<String, Long> getCustomerSegmentation() {
        Map<String, Long> segmentation = new HashMap<>();

        // Segment by project value
        segmentation.put("premium_customers", customerRepository.countPremiumCustomers());
        segmentation.put("standard_customers", customerRepository.countStandardCustomers());
        segmentation.put("budget_customers", customerRepository.countBudgetCustomers());

        return segmentation;
    }

    private Map<String, Long> getCustomerLifecycle() {
        Map<String, Long> lifecycle = new HashMap<>();

        lifecycle.put("prospects", customerRepository.countProspects());
        lifecycle.put("leads", customerRepository.countLeads());
        lifecycle.put("active_customers", customerRepository.countActiveCustomers());
        lifecycle.put("completed_customers", customerRepository.countCompletedCustomers());

        return lifecycle;
    }

    private List<CustomerAnalyticsDto.CustomerSatisfactionDto> getCustomerSatisfactionData() {
        // In real implementation, this would come from feedback/survey data
        List<CustomerAnalyticsDto.CustomerSatisfactionDto> satisfactionData = new ArrayList<>();

        // Mock data for demonstration
        satisfactionData.add(new CustomerAnalyticsDto.CustomerSatisfactionDto(
                1L, "John Doe", 5, "Excellent service and quality", "COMPLETED"));
        satisfactionData.add(new CustomerAnalyticsDto.CustomerSatisfactionDto(
                2L, "Jane Smith", 4, "Good work, minor delays", "INSTALLATION"));

        return satisfactionData;
    }

    private Map<String, Object> getRetentionMetrics() {
        Map<String, Object> retention = new HashMap<>();

        // Mock retention metrics
        retention.put("repeat_customers", 25L);
        retention.put("referral_customers", 15L);
        retention.put("retention_rate", 75.0);
        retention.put("customer_lifetime_value", BigDecimal.valueOf(150000));

        return retention;
    }

    private Map<String, Long> getGeographicDistribution() {
        Map<String, Long> distribution = new HashMap<>();

        // Mock geographic data
        distribution.put("Mumbai", 45L);
        distribution.put("Pune", 23L);
        distribution.put("Bangalore", 18L);
        distribution.put("Delhi", 12L);
        distribution.put("Others", 8L);

        return distribution;
    }

    private Double calculateAchievementPercentage() {
        BigDecimal target = BigDecimal.valueOf(1000000); // Monthly target
        BigDecimal achieved = getPaymentsThisMonth();

        return achieved.multiply(BigDecimal.valueOf(100))
                .divide(target, 2, RoundingMode.HALF_UP).doubleValue();
    }

    private Double calculateOnTimeDeliveryRate() {
        // Mock calculation - percentage of projects delivered on time
        return 87.5;
    }

    private Double calculateResourceUtilization() {
        // Mock calculation - percentage of team capacity utilized
        return 92.0;
    }

    private Double calculateQualityPassRate() {
        long totalQualityChecks = installationRepository.count();
        long passedChecks = installationRepository.findAll().stream()
                .mapToLong(i -> Boolean.TRUE.equals(i.getQualityCheckPassed()) ? 1 : 0)
                .sum();

        return totalQualityChecks > 0 ? (passedChecks * 100.0) / totalQualityChecks : 0.0;
    }

    private BigDecimal calculateNetProfit() {
        BigDecimal grossRevenue = getTotalPaymentsReceived();
        // Mock operating expenses - 30% of revenue
        BigDecimal operatingExpenses = grossRevenue.multiply(BigDecimal.valueOf(0.3));
        return grossRevenue.subtract(operatingExpenses);
    }

    private Double calculateProfitMargin() {
        BigDecimal grossRevenue = getTotalPaymentsReceived();
        BigDecimal netProfit = calculateNetProfit();

        if (grossRevenue.compareTo(BigDecimal.ZERO) > 0) {
            return netProfit.multiply(BigDecimal.valueOf(100))
                    .divide(grossRevenue, 2, RoundingMode.HALF_UP).doubleValue();
        }

        return 0.0;
    }

    // Real-time metrics helper methods
    private Long getInstallationsToday() {
        return installationRepository.findAll().stream()
                .filter(i -> i.getUpdatedAt() != null &&
                        i.getUpdatedAt().toLocalDate().equals(LocalDate.now()))
                .count();
    }

    private BigDecimal getPaymentsToday() {
        return paymentRepository.getTotalPaymentsBetweenDates(LocalDate.now(), LocalDate.now());
    }

    private Long getOverdueQuotations() {
        // Quotations older than 30 days without response
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        return quotationRepository.countOverdueQuotations(thirtyDaysAgo);
    }

    private Long getPendingApprovals() {
        return designPhaseRepository.countByDesignStatus(DesignPhase.DesignStatus.SUBMITTED);
    }

    private Long getNewCustomersToday() {
        LocalDate today = LocalDate.now();
        return customerRepository.countByCreatedAtBetween(
                today.atStartOfDay(), today.atTime(23, 59, 59));
    }

    private Long getQuotationsSentToday() {
        LocalDate today = LocalDate.now();
        return quotationRepository.countByCreatedAtBetween(
                today.atStartOfDay(), today.atTime(23, 59, 59));
    }

    private Long getProjectsCompletedToday() {
        return projectRepository.findAll().stream()
                .filter(p -> p.getUpdatedAt() != null &&
                        p.getUpdatedAt().toLocalDate().equals(LocalDate.now()) &&
                        p.getStatus() == CustomerProject.ProjectStatus.COMPLETED)
                .count();
    }

    // Custom report generators
    private Map<String, Object> generateSalesReport(LocalDate fromDate, LocalDate toDate) {
        Map<String, Object> report = new HashMap<>();

        report.put("total_quotations", quotationRepository.countByDateRange(fromDate, toDate));
        report.put("approved_quotations", quotationRepository.countApprovedByDateRange(fromDate, toDate));
        report.put("total_quotation_value", quotationRepository.getTotalValueByDateRange(fromDate, toDate));
        report.put("conversion_rate", calculateConversionRate());

        return report;
    }

    private Map<String, Object> generateFinancialReport(LocalDate fromDate, LocalDate toDate) {
        Map<String, Object> report = new HashMap<>();

        report.put("total_revenue", paymentRepository.getTotalPaymentsBetweenDates(fromDate, toDate));
        report.put("cash_in_hand", getTotalCashInHand());
        report.put("cash_in_account", getTotalCashInAccount());
        report.put("pending_payments", getPendingPayments());
        report.put("payment_method_breakdown", getPaymentMethodBreakdown());

        return report;
    }

    private Map<String, Object> generateProjectStatusReport(LocalDate fromDate, LocalDate toDate) {
        Map<String, Object> report = new HashMap<>();

        Map<String, Long> statusCounts = new HashMap<>();
        for (CustomerProject.ProjectStatus status : CustomerProject.ProjectStatus.values()) {
            statusCounts.put(status.name(), projectRepository.countByStatus(status));
        }

        report.put("project_status_distribution", statusCounts);
        report.put("completed_projects", projectRepository.countCompletedProjectsBetweenDates(fromDate, toDate));
        report.put("average_project_duration", calculateAverageProjectDuration());

        return report;
    }

    private Map<String, Object> generateCustomerReport(LocalDate fromDate, LocalDate toDate) {
        Map<String, Object> report = new HashMap<>();

        report.put("new_customers", customerRepository.countByCreatedAtBetween(
                fromDate.atStartOfDay(), toDate.atTime(23, 59, 59)));
        report.put("total_customers", customerRepository.count());
        report.put("active_customers", getActiveCustomersCount());
        report.put("top_customers", getTopCustomersByRevenue(10));

        return report;
    }
}