package com.fleetmanagement.kitchencrmbackend.modules.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDto {

    // Customer Metrics
    private Long totalCustomers;
    private Long newCustomersThisMonth;
    private Long activeCustomers;

    // Quotation Metrics
    private Long totalQuotations;
    private Long pendingQuotations;
    private Long approvedQuotations;
    private BigDecimal totalQuotationValue;
    private BigDecimal averageQuotationValue;

    // Project Metrics
    private Long totalProjects;
    private Long activeProjects;
    private Long completedProjects;
    private BigDecimal totalProjectValue;
    private BigDecimal completedProjectValue;

    // Payment Metrics
    private BigDecimal totalPaymentsReceived;
    private BigDecimal paymentsThisMonth;
    private BigDecimal pendingPayments;
    private BigDecimal cashInHand;
    private BigDecimal cashInAccount;

    // Design Phase Metrics
    private Long designsInProgress;
    private Long designsAwaitingApproval;
    private Long approvedDesigns;

    // Production & Installation Metrics
    private Long installationsInProgress;
    private Long readyForInstallation;
    private Long completedInstallations;
    private Long overdueProjects;

    // Performance Metrics
    private Double conversionRate; // Quotations to Projects
    private Double completionRate; // Completed vs Total Projects
    private Integer averageProjectDuration; // Days

    private LocalDate lastUpdated;
}