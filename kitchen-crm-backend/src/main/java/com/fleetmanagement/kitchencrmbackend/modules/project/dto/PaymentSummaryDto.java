package com.fleetmanagement.kitchencrmbackend.modules.project.dto;

import com.fleetmanagement.kitchencrmbackend.modules.project.entity.Payment;
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
public class PaymentSummaryDto {

    private Long id;
    private Long projectId;
    private String projectName;
    private String customerName;
    private BigDecimal amount;
    private Payment.PaymentMethod paymentMethod;
    private LocalDate paymentDate;
    private Payment.PaymentStatus paymentStatus;
    private String receivedBy;
}