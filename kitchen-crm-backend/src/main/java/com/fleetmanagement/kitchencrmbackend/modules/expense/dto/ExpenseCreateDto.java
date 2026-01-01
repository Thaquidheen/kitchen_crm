package com.fleetmanagement.kitchencrmbackend.modules.expense.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class ExpenseCreateDto {

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotNull(message = "Vendor ID is required")
    private Long vendorId;

    @NotNull(message = "Expense category is required")
    private String expenseCategory;

    private String description;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Payment method is required")
    private String paymentMethod;

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    private String referenceNumber;

    private String notes;

    private String paidBy;

    private String status = "PAID";
}
