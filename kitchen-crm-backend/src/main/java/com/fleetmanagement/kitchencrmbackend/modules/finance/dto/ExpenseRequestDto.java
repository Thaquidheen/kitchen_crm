package com.fleetmanagement.kitchencrmbackend.modules.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseRequestDto {

    @NotBlank(message = "Expense name is required")
    private String title;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0", inclusive = false, message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Cash in hand percentage is required")
    @DecimalMin(value = "0", message = "Percentage cannot be negative")
    private BigDecimal cashInHandPct;

    @NotNull(message = "Cash in account percentage is required")
    @DecimalMin(value = "0", message = "Percentage cannot be negative")
    private BigDecimal cashInAccountPct;

    private Long quotationId;

    private LocalDate expenseDate;

    private String note;
}
