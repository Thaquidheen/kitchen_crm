package com.fleetmanagement.kitchencrmbackend.modules.expense.dto;

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
public class ExpenseUpdateDto {
    private Long vendorId;
    private String expenseCategory;
    private String description;
    private BigDecimal amount;
    private String paymentMethod;
    private LocalDate paymentDate;
    private String referenceNumber;
    private String notes;
    private String paidBy;
    private String status;
}
