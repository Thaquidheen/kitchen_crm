package com.fleetmanagement.kitchencrmbackend.modules.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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

    /** Optional: a line is often written down first and priced later. Missing means zero. */
    @DecimalMin(value = "0", message = "Amount cannot be negative")
    private BigDecimal amount;

    /** Percentage split. With neither sent (and no {@link #cashInHandAmount}) the line is all cash in hand. */
    @DecimalMin(value = "0", message = "Percentage cannot be negative")
    private BigDecimal cashInHandPct;

    @DecimalMin(value = "0", message = "Percentage cannot be negative")
    private BigDecimal cashInAccountPct;

    /**
     * Exact cash-in-hand rupees. When present the split is by amount: cash in account is the
     * rest of {@link #amount} and the percentages are derived, whatever was sent for them.
     */
    @DecimalMin(value = "0", message = "Cash in hand amount cannot be negative")
    private BigDecimal cashInHandAmount;

    /** Optional vendor this expense is for; must reference an active vendor when present. */
    private Long vendorId;

    private Long quotationId;

    private LocalDate expenseDate;

    private String note;
}
