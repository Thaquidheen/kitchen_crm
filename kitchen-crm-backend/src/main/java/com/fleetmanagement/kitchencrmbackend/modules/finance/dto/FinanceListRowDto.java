package com.fleetmanagement.kitchencrmbackend.modules.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** One row of the Income & Expenses index table; sums batched per page, no N+1. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinanceListRowDto {

    private Long financeId;
    private Long customerId;
    private String customerName;
    private String customerContact;
    private String customerPlace;

    private BigDecimal totalAmount;
    private BigDecimal receivedTotal;
    private BigDecimal totalBalance;
    private BigDecimal expenseTotal;
    private BigDecimal totalMargin;
    private Long paymentCount;
}
