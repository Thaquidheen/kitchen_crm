package com.fleetmanagement.kitchencrmbackend.modules.dashboard.service;

import com.fleetmanagement.kitchencrmbackend.modules.dashboard.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.DesignPhaseRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionInstallationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionInstallation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.finance.entity.FinanceIncomePayment;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
    private DesignPhaseRepository designPhaseRepository;

    @Autowired
    private ProductionInstallationRepository installationRepository;

    @Autowired
    private com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionCustomTaskRepository productionCustomTaskRepository;

    @Autowired
    private com.fleetmanagement.kitchencrmbackend.modules.finance.repository.FinanceIncomePaymentRepository financeIncomePaymentRepository;

    @Autowired
    private com.fleetmanagement.kitchencrmbackend.modules.finance.repository.CustomerFinanceRepository customerFinanceRepository;

    @Override
    public ApiResponse<DashboardSummaryDto> getDashboardSummary() {
        DashboardSummaryDto summary = new DashboardSummaryDto();

        // Customer Metrics
        summary.setTotalCustomers(customerRepository.count());
        summary.setNewCustomersThisMonth(getNewCustomersThisMonth());
        summary.setActiveCustomers(getActiveCustomersCount());

        // Quotation Metrics
        summary.setTotalQuotations(quotationRepository.count());
        summary.setPendingQuotations(quotationRepository.countByStatus(Quotation.QuotationStatus.DRAFT));
        summary.setApprovedQuotations(quotationRepository.countByStatus(Quotation.QuotationStatus.APPROVED));
        summary.setTotalQuotationValue(getTotalQuotationValue());
        summary.setAverageQuotationValue(getAverageQuotationValue());

        // Project Metrics
        // Projects were retired. These DTO fields stay so the response shape is unchanged for
        // any cached client, but there is nothing left to count.
        summary.setTotalProjects(0L);
        summary.setActiveProjects(0L);
        summary.setCompletedProjects(0L);
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
        summary.setStalledProductionJobs(countStalledProductionJobs());

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
        analytics.setProjectStatusDistribution(new HashMap<>());

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
        kpiMetrics.put("active_projects", 0L);
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
        realTimeMetrics.put("active_quotations", quotationRepository.countByStatus(Quotation.QuotationStatus.DRAFT));
        realTimeMetrics.put("active_projects", 0L);
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
        long pendingQuotations = quotationRepository.countByStatus(Quotation.QuotationStatus.DRAFT);
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

    /**
     * A production job is "stalled" when it is in flight, has a stage checklist, is older than
     * 14 days, and no checklist task has been completed in the last 14 days. Computed from the
     * checklist rather than the status column so it reflects what staff actually do.
     */
    private Long countStalledProductionJobs() {
        try {
            java.time.LocalDateTime cutoff = java.time.LocalDateTime.now().minusDays(14);
            return installationRepository.findAll().stream()
                    .filter(i -> i.getOverallStatus() != ProductionInstallation.InstallationStatus.COMPLETED
                            && i.getOverallStatus() != ProductionInstallation.InstallationStatus.CANCELLED
                            && i.getOverallStatus() != ProductionInstallation.InstallationStatus.ON_HOLD)
                    .filter(i -> i.getCreatedAt() != null && i.getCreatedAt().isBefore(cutoff))
                    .filter(i -> {
                        var tasks = productionCustomTaskRepository
                                .findByProductionInstallationIdOrderBySortOrderAsc(i.getId());
                        if (tasks.isEmpty()) return false; // legacy jobs without a checklist are not judged
                        boolean allDone = tasks.stream().allMatch(t -> Boolean.TRUE.equals(t.getCompleted()));
                        if (allDone) return false;
                        return tasks.stream()
                                .filter(t -> t.getCompletedAt() != null)
                                .noneMatch(t -> t.getCompletedAt().isAfter(cutoff));
                    })
                    .count();
        } catch (Exception e) {
            return 0L;
        }
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
        return BigDecimal.ZERO;
    }

    private BigDecimal getCompletedProjectValue() {
        return BigDecimal.ZERO;
    }

    // Collections now come entirely from the Income & Expenses module, which is where payments
    // have actually been recorded since V99 - the projects received columns are gone.
    private BigDecimal getTotalPaymentsReceived() {
        return getTotalCashInHand().add(getTotalCashInAccount());
    }

    /** Sums finance payments for one mode; sumGroupedByMode returns rows of [mode, total]. */
    private BigDecimal sumFinanceByMode(FinanceIncomePayment.PaymentMode mode) {
        for (Object[] row : financeIncomePaymentRepository.sumGroupedByMode()) {
            if (row.length > 1 && mode.equals(row[0]) && row[1] instanceof BigDecimal) {
                return (BigDecimal) row[1];
            }
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal getPaymentsThisMonth() {
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        BigDecimal result = financeIncomePaymentRepository.sumBetween(startOfMonth, LocalDate.now());
        return result != null ? result : BigDecimal.ZERO;
    }

    private BigDecimal getPendingPayments() {
        // Outstanding is invoiced-minus-collected, both from the Income & Expenses module, which
        // is where this has actually been recorded since V99.
        BigDecimal invoiced = customerFinanceRepository.sumTotalAmount();
        if (invoiced == null) {
            invoiced = BigDecimal.ZERO;
        }
        return invoiced.subtract(getTotalPaymentsReceived()).max(BigDecimal.ZERO);
    }

    private BigDecimal getTotalCashInHand() {
        return sumFinanceByMode(FinanceIncomePayment.PaymentMode.CASH_IN_HAND);
    }

    private BigDecimal getTotalCashInAccount() {
        return sumFinanceByMode(FinanceIncomePayment.PaymentMode.CASH_IN_ACCOUNT);
    }

    private Double calculateConversionRate() {
        long totalQuotations = quotationRepository.count();
        long approvedQuotations = quotationRepository.countByStatus(Quotation.QuotationStatus.APPROVED);
        return totalQuotations > 0 ? (approvedQuotations * 100.0) / totalQuotations : 0.0;
    }

    private Double calculateCompletionRate() {
        return 0.0;
    }

    private Integer calculateAverageProjectDuration() {
        return 0;
    }

    private List<RevenueAnalyticsDto.MonthlyRevenueDto> getMonthlyRevenueData(LocalDate fromDate, LocalDate toDate) {
        List<RevenueAnalyticsDto.MonthlyRevenueDto> monthlyData = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        // One grouped query for the whole window; looked up per month in the loop.
        Map<String, BigDecimal> byMonth = new HashMap<>();
        for (Object[] row : financeIncomePaymentRepository.sumGroupedByMonth(fromDate.withDayOfMonth(1), toDate)) {
            byMonth.put(row[0] + "-" + row[1], (BigDecimal) row[2]);
        }

        LocalDate current = fromDate.withDayOfMonth(1);
        while (!current.isAfter(toDate)) {
            LocalDate monthEnd = current.withDayOfMonth(current.lengthOfMonth());

            BigDecimal monthlyRevenue = byMonth.getOrDefault(
                    current.getYear() + "-" + current.getMonthValue(), BigDecimal.ZERO);

            // Mock target data - in real implementation, this would come from a targets table
            BigDecimal target = BigDecimal.valueOf(500000);

            int projectsCompleted = 0;

            RevenueAnalyticsDto.MonthlyRevenueDto monthlyDto = new RevenueAnalyticsDto.MonthlyRevenueDto(
                    current.format(formatter), monthlyRevenue, target, projectsCompleted);
            monthlyData.add(monthlyDto);

            current = current.plusMonths(1);
        }

        return monthlyData;
    }

    private Map<String, BigDecimal> getPaymentMethodBreakdown() {
        Map<String, BigDecimal> breakdown = new HashMap<>();
        for (Object[] row : financeIncomePaymentRepository.sumGroupedByMode()) {
            String label = String.valueOf(row[0]).equals("CASH_IN_HAND") ? "Cash in Hand" : "Cash in Account";
            breakdown.put(label, (BigDecimal) row[1]);
        }
        return breakdown;
    }

    private Map<String, BigDecimal> getRevenueByProjectStatus() {
        Map<String, BigDecimal> revenueByStatus = new HashMap<>();

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
        BigDecimal currentMonthRevenue = getPaymentsThisMonth();

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
        // Was projected from the active project count; that signal no longer exists.
        return BigDecimal.ZERO;
    }

    private BigDecimal getTotalOutstanding() {
        return getPendingPayments();
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
        return new ArrayList<>();
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

        // Project value ranges came from the retired Projects module. The keys stay so the
        // response shape is unchanged for any cached client.
        sizeAnalysis.put("small_projects", 0L);
        sizeAnalysis.put("medium_projects", 0L);
        sizeAnalysis.put("large_projects", 0L);
        sizeAnalysis.put("enterprise_projects", 0L);

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

        if (target.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }

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
        BigDecimal result = financeIncomePaymentRepository.sumBetween(LocalDate.now(), LocalDate.now());
        return result != null ? result : BigDecimal.ZERO;
    }

    private Long getOverdueQuotations() {
        // Quotations older than 30 days without response
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        LocalDateTime thirtyDaysAgoDateTime = thirtyDaysAgo.atTime(LocalTime.MAX);
        return quotationRepository.countOverdueQuotations(thirtyDaysAgoDateTime);
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
        return 0L;
    }

    // Custom report generators
    private Map<String, Object> generateSalesReport(LocalDate fromDate, LocalDate toDate) {
        Map<String, Object> report = new HashMap<>();

        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(LocalTime.MAX);

        report.put("total_quotations", quotationRepository.countByDateRange(fromDateTime, toDateTime));
        report.put("approved_quotations", quotationRepository.countApprovedByDateRange(fromDateTime, toDateTime));
        report.put("total_quotation_value", quotationRepository.getTotalValueByDateRange(fromDateTime, toDateTime));
        report.put("conversion_rate", calculateConversionRate());

        return report;
    }

    private Map<String, Object> generateFinancialReport(LocalDate fromDate, LocalDate toDate) {
        Map<String, Object> report = new HashMap<>();

        report.put("total_revenue", getTotalPaymentsReceived());
        report.put("cash_in_hand", getTotalCashInHand());
        report.put("cash_in_account", getTotalCashInAccount());
        report.put("pending_payments", getPendingPayments());
        report.put("payment_method_breakdown", getPaymentMethodBreakdown());

        return report;
    }

    private Map<String, Object> generateProjectStatusReport(LocalDate fromDate, LocalDate toDate) {
        Map<String, Object> report = new HashMap<>();

        report.put("project_status_distribution", new HashMap<String, Long>());
        report.put("completed_projects", 0);
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