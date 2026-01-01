package com.fleetmanagement.kitchencrmbackend.modules.expense.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseStatsDto {
    private Long projectId;
    private BigDecimal totalExpense;
    private Long expenseCount;
    private Map<String, BigDecimal> expenseByCategory;
    private Map<String, BigDecimal> expenseByVendor;
    private Map<String, BigDecimal> expenseByPaymentMethod;
}
