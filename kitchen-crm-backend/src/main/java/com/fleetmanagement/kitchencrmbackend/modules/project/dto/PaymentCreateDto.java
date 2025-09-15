package com.fleetmanagement.kitchencrmbackend.modules.project.dto;

import com.fleetmanagement.kitchencrmbackend.modules.project.entity.Payment;
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
public class PaymentCreateDto {

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotNull(message = "Payment amount is required")
    @Positive(message = "Payment amount must be positive")
    private BigDecimal amount;

    @NotNull(message = "Payment method is required")
    private Payment.PaymentMethod paymentMethod;

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    private String referenceNumber;
    private String notes;
}