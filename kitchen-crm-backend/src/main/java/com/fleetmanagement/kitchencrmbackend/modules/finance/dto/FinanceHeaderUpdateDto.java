package com.fleetmanagement.kitchencrmbackend.modules.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinanceHeaderUpdateDto {

    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0", message = "Total amount cannot be negative")
    private BigDecimal totalAmount;

    @DecimalMin(value = "0", message = "Committed cash in hand cannot be negative")
    private BigDecimal committedCashInHand;

    @DecimalMin(value = "0", message = "Committed cash in account cannot be negative")
    private BigDecimal committedCashInAccount;

    private String notes;
}
