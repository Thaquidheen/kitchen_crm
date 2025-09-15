package com.fleetmanagement.kitchencrmbackend.modules.project.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectPaymentSummaryDto {

    private Long projectId;
    private String projectName;
    private String customerName;

    private BigDecimal totalProjectAmount;
    private BigDecimal totalPaidAmount;
    private BigDecimal balanceAmount;
    private BigDecimal paymentCompletionPercentage;

    private int totalPaymentCount;
    private BigDecimal cashPayments;
    private BigDecimal bankPayments;
    private BigDecimal otherPayments;

    private List<PaymentSummaryDto> recentPayments;
}