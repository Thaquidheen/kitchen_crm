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
public class PaymentRequestDto {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0", inclusive = false, message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Payment mode is required")
    private FinanceIncomePayment.PaymentMode mode;

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    private String note;

    private String comment;
}
