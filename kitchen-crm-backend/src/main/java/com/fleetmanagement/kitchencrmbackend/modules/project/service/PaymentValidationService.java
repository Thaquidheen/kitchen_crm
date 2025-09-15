package com.fleetmanagement.kitchencrmbackend.modules.project.service;

import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.Payment;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class PaymentValidationService {

    public void validatePayment(CustomerProject project, BigDecimal amount, LocalDate paymentDate) {
        validateProject(project);
        validateAmount(amount);
        validatePaymentDate(paymentDate);
        validateBalance(project, amount);
    }

    private void validateProject(CustomerProject project) {
        if (project == null) {
            throw new IllegalArgumentException("Project not found");
        }

        if (project.getStatus() == CustomerProject.ProjectStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot add payments to cancelled project");
        }

        if (project.getStatus() == CustomerProject.ProjectStatus.COMPLETED) {
            throw new IllegalArgumentException("Project is already completed");
        }
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }
    }

    private void validatePaymentDate(LocalDate paymentDate) {
        if (paymentDate == null) {
            throw new IllegalArgumentException("Payment date is required");
        }

        if (paymentDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Payment date cannot be in the future");
        }
    }

    private void validateBalance(CustomerProject project, BigDecimal amount) {
        BigDecimal balance = project.getBalanceAmount();

        if (amount.compareTo(balance) > 0) {
            throw new IllegalArgumentException(
                    String.format("Payment amount (%.2f) exceeds remaining balance (%.2f)",
                            amount, balance));
        }
    }

    public boolean isValidPaymentMethod(Payment.PaymentMethod method) {
        return method != null;
    }

    public boolean isValidReferenceNumber(String referenceNumber, Payment.PaymentMethod method) {
        // For bank transfers, reference number should be provided
        if (method == Payment.PaymentMethod.ACCOUNT_TRANSFER ||
                method == Payment.PaymentMethod.NEFT ||
                method == Payment.PaymentMethod.RTGS ||
                method == Payment.PaymentMethod.CHEQUE) {
            return referenceNumber != null && !referenceNumber.trim().isEmpty();
        }
        return true; // For cash and other methods, reference is optional
    }
}