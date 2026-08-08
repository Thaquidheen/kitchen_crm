package com.fleetmanagement.kitchencrmbackend.modules.finance.dto;

import com.fleetmanagement.kitchencrmbackend.modules.finance.entity.FinanceIncomePayment;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReleaseRequestDto {

    @NotNull(message = "Vendor is required")
    private Long vendorId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0", inclusive = false, message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Payment mode is required")
    private FinanceIncomePayment.PaymentMode mode;

    @NotNull(message = "Release date is required")
    private LocalDate releaseDate;

    private Long expenseId;

    private String note;
}
