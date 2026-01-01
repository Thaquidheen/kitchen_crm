package com.fleetmanagement.kitchencrmbackend.modules.expense.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseDto {
    private Long id;
    private Long projectId;
    private String projectName;
    private Long vendorId;
    private String vendorName;
    private String expenseCategory;
    private String description;
    private BigDecimal amount;
    private String paymentMethod;
    private LocalDate paymentDate;
    private String referenceNumber;
    private String notes;
    private String paidBy;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
