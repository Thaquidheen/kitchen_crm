package com.fleetmanagement.kitchencrmbackend.modules.project.service;

import com.fleetmanagement.kitchencrmbackend.modules.project.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.Payment;
import com.fleetmanagement.kitchencrmbackend.modules.project.repository.CustomerProjectRepository;
import com.fleetmanagement.kitchencrmbackend.modules.project.repository.PaymentRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CustomerProjectRepository projectRepository;

    @Autowired
    private PaymentValidationService validationService;

    @Override
    public ApiResponse<Page<PaymentSummaryDto>> getAllPayments(Long projectId,
                                                               Payment.PaymentMethod paymentMethod,
                                                               Payment.PaymentStatus paymentStatus,
                                                               LocalDate fromDate,
                                                               LocalDate toDate,
                                                               String customerName,
                                                               Pageable pageable) {
        Page<Payment> payments = paymentRepository.findByFilters(
                projectId, paymentMethod, paymentStatus, fromDate, toDate, customerName, pageable);

        Page<PaymentSummaryDto> paymentDtos = payments.map(this::convertToSummaryDto);
        return ApiResponse.success(paymentDtos);
    }

    @Override
    public ApiResponse<PaymentDto> getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id).orElse(null);
        if (payment == null) {
            return ApiResponse.error("Payment not found");
        }
        return ApiResponse.success(convertToDto(payment));
    }

    @Override
    public ApiResponse<List<PaymentSummaryDto>> getPaymentsByProject(Long projectId) {
        List<Payment> payments = paymentRepository.findByProjectIdOrderByPaymentDateDesc(projectId);
        List<PaymentSummaryDto> paymentDtos = payments.stream()
                .map(this::convertToSummaryDto)
                .collect(Collectors.toList());
        return ApiResponse.success(paymentDtos);
    }

    @Override
    public ApiResponse<PaymentDto> createPayment(PaymentCreateDto paymentCreateDto, String receivedBy) {
        return addPaymentToProject(paymentCreateDto.getProjectId(), paymentCreateDto, receivedBy);
    }

    @Override
    public ApiResponse<PaymentDto> addPaymentToProject(Long projectId, PaymentCreateDto paymentCreateDto, String receivedBy) {
        // Validate project exists
        CustomerProject project = projectRepository.findById(projectId).orElse(null);
        if (project == null) {
            return ApiResponse.error("Project not found");
        }

        try {
            // Use validation service
            validationService.validatePayment(project, paymentCreateDto.getAmount(), paymentCreateDto.getPaymentDate());

            // Validate payment method specific requirements
            if (!validationService.isValidReferenceNumber(paymentCreateDto.getReferenceNumber(), paymentCreateDto.getPaymentMethod())) {
                return ApiResponse.error("Reference number is required for " + paymentCreateDto.getPaymentMethod());
            }

        } catch (IllegalArgumentException e) {
            return ApiResponse.error(e.getMessage());
        }

        // Create payment
        Payment payment = new Payment();
        payment.setProject(project);
        payment.setAmount(paymentCreateDto.getAmount());
        payment.setPaymentMethod(paymentCreateDto.getPaymentMethod());
        payment.setPaymentDate(paymentCreateDto.getPaymentDate());
        payment.setReferenceNumber(paymentCreateDto.getReferenceNumber());
        payment.setNotes(paymentCreateDto.getNotes());
        payment.setReceivedBy(receivedBy);
        payment.setPaymentStatus(Payment.PaymentStatus.COMPLETED);

        Payment savedPayment = paymentRepository.save(payment);

        // Update project balance based on payment method
        updateProjectBalance(project, paymentCreateDto.getAmount(), paymentCreateDto.getPaymentMethod());

        return ApiResponse.success("Payment recorded successfully", convertToDto(savedPayment));
    }

    @Override
    public ApiResponse<PaymentDto> updatePayment(Long id, PaymentDto paymentDto, String updatedBy) {
        Payment existingPayment = paymentRepository.findById(id).orElse(null);
        if (existingPayment == null) {
            return ApiResponse.error("Payment not found");
        }

        // Store original amount and method for balance adjustment
        BigDecimal originalAmount = existingPayment.getAmount();
        Payment.PaymentMethod originalMethod = existingPayment.getPaymentMethod();

        // Update payment details
        existingPayment.setAmount(paymentDto.getAmount());
        existingPayment.setPaymentMethod(paymentDto.getPaymentMethod());
        existingPayment.setPaymentDate(paymentDto.getPaymentDate());
        existingPayment.setReferenceNumber(paymentDto.getReferenceNumber());
        existingPayment.setNotes(paymentDto.getNotes());
        existingPayment.setPaymentStatus(paymentDto.getPaymentStatus());

        Payment updatedPayment = paymentRepository.save(existingPayment);

        // Adjust project balance (reverse original and apply new)
        CustomerProject project = existingPayment.getProject();
        reverseProjectBalance(project, originalAmount, originalMethod);
        updateProjectBalance(project, paymentDto.getAmount(), paymentDto.getPaymentMethod());

        return ApiResponse.success("Payment updated successfully", convertToDto(updatedPayment));
    }

    @Override
    public ApiResponse<String> deletePayment(Long id) {
        Payment payment = paymentRepository.findById(id).orElse(null);
        if (payment == null) {
            return ApiResponse.error("Payment not found");
        }

        // Reverse the payment from project balance
        reverseProjectBalance(payment.getProject(), payment.getAmount(), payment.getPaymentMethod());

        paymentRepository.delete(payment);
        return ApiResponse.success("Payment deleted successfully");
    }

    @Override
    public ApiResponse<ProjectPaymentSummaryDto> getProjectPaymentSummary(Long projectId) {
        CustomerProject project = projectRepository.findById(projectId).orElse(null);
        if (project == null) {
            return ApiResponse.error("Project not found");
        }

        List<Payment> payments = paymentRepository.findByProjectIdOrderByPaymentDateDesc(projectId);

        BigDecimal totalPaid = paymentRepository.getTotalPaidAmountByProject(projectId);
        if (totalPaid == null) totalPaid = BigDecimal.ZERO;

        BigDecimal cashPayments = paymentRepository.getTotalPaidByMethodAndProject(Payment.PaymentMethod.CASH, projectId);
        if (cashPayments == null) cashPayments = BigDecimal.ZERO;

        BigDecimal bankPayments = BigDecimal.ZERO;
        BigDecimal accountTransfer = paymentRepository.getTotalPaidByMethodAndProject(Payment.PaymentMethod.ACCOUNT_TRANSFER, projectId);
        BigDecimal neft = paymentRepository.getTotalPaidByMethodAndProject(Payment.PaymentMethod.NEFT, projectId);
        BigDecimal rtgs = paymentRepository.getTotalPaidByMethodAndProject(Payment.PaymentMethod.RTGS, projectId);
        BigDecimal upi = paymentRepository.getTotalPaidByMethodAndProject(Payment.PaymentMethod.UPI, projectId);

        if (accountTransfer != null) bankPayments = bankPayments.add(accountTransfer);
        if (neft != null) bankPayments = bankPayments.add(neft);
        if (rtgs != null) bankPayments = bankPayments.add(rtgs);
        if (upi != null) bankPayments = bankPayments.add(upi);

        BigDecimal otherPayments = totalPaid.subtract(cashPayments).subtract(bankPayments);

        BigDecimal paymentCompletionPercentage = BigDecimal.ZERO;
        if (project.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
            paymentCompletionPercentage = totalPaid
                    .multiply(BigDecimal.valueOf(100))
                    .divide(project.getTotalAmount(), 2, RoundingMode.HALF_UP);
        }

        List<PaymentSummaryDto> recentPayments = payments.stream()
                .limit(5)
                .map(this::convertToSummaryDto)
                .collect(Collectors.toList());

        ProjectPaymentSummaryDto summary = new ProjectPaymentSummaryDto();
        summary.setProjectId(project.getId());
        summary.setProjectName(project.getProjectName());
        summary.setCustomerName(project.getCustomer().getName());
        summary.setTotalProjectAmount(project.getTotalAmount());
        summary.setTotalPaidAmount(totalPaid);
        summary.setBalanceAmount(project.getBalanceAmount());
        summary.setPaymentCompletionPercentage(paymentCompletionPercentage);
        summary.setTotalPaymentCount(payments.size());
        summary.setCashPayments(cashPayments);
        summary.setBankPayments(bankPayments);
        summary.setOtherPayments(otherPayments);
        summary.setRecentPayments(recentPayments);

        return ApiResponse.success(summary);
    }

    @Override
    public ApiResponse<Map<String, Object>> getPaymentStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Payment counts by status
        for (Payment.PaymentStatus status : Payment.PaymentStatus.values()) {
            Long count = paymentRepository.countByPaymentStatus(status);
            stats.put(status.name().toLowerCase() + "_payments", count);
        }

        // Total payments
        stats.put("total_payments", paymentRepository.count());

        // Payment method breakdown
        List<Object[]> methodSummary = paymentRepository.getPaymentMethodSummary();
        Map<String, BigDecimal> methodBreakdown = new HashMap<>();
        for (Object[] row : methodSummary) {
            Payment.PaymentMethod method = (Payment.PaymentMethod) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            methodBreakdown.put(method.name().toLowerCase(), amount);
        }
        stats.put("payment_method_breakdown", methodBreakdown);

        // Current month payments
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        LocalDate monthEnd = LocalDate.now();
        BigDecimal currentMonthTotal = paymentRepository.getTotalPaymentsBetweenDates(monthStart, monthEnd);
        stats.put("current_month_total", currentMonthTotal != null ? currentMonthTotal : BigDecimal.ZERO);

        return ApiResponse.success(stats);
    }

    @Override
    public ApiResponse<Map<String, Object>> getPaymentStatisticsByDateRange(LocalDate fromDate, LocalDate toDate) {
        Map<String, Object> stats = new HashMap<>();

        BigDecimal totalAmount = paymentRepository.getTotalPaymentsBetweenDates(fromDate, toDate);
        stats.put("total_amount", totalAmount != null ? totalAmount : BigDecimal.ZERO);
        stats.put("from_date", fromDate);
        stats.put("to_date", toDate);

        return ApiResponse.success(stats);
    }

    // Helper methods
    private void updateProjectBalance(CustomerProject project, BigDecimal amount, Payment.PaymentMethod method) {
        if (method == Payment.PaymentMethod.CASH) {
            BigDecimal currentCash = project.getCashInHand() != null ? project.getCashInHand() : BigDecimal.ZERO;
            project.setCashInHand(currentCash.add(amount));
        } else {
            BigDecimal currentAccount = project.getCashInAccount() != null ? project.getCashInAccount() : BigDecimal.ZERO;
            project.setCashInAccount(currentAccount.add(amount));
        }

        BigDecimal currentTotal = project.getReceivedAmountTotal() != null ? project.getReceivedAmountTotal() : BigDecimal.ZERO;
        project.setReceivedAmountTotal(currentTotal.add(amount));

        projectRepository.save(project);
    }

    private void reverseProjectBalance(CustomerProject project, BigDecimal amount, Payment.PaymentMethod method) {
        if (method == Payment.PaymentMethod.CASH) {
            BigDecimal currentCash = project.getCashInHand() != null ? project.getCashInHand() : BigDecimal.ZERO;
            project.setCashInHand(currentCash.subtract(amount));
        } else {
            BigDecimal currentAccount = project.getCashInAccount() != null ? project.getCashInAccount() : BigDecimal.ZERO;
            project.setCashInAccount(currentAccount.subtract(amount));
        }

        BigDecimal currentTotal = project.getReceivedAmountTotal() != null ? project.getReceivedAmountTotal() : BigDecimal.ZERO;
        project.setReceivedAmountTotal(currentTotal.subtract(amount));

        projectRepository.save(project);
    }

    private PaymentDto convertToDto(Payment payment) {
        PaymentDto dto = new PaymentDto();
        dto.setId(payment.getId());
        dto.setProjectId(payment.getProject().getId());
        dto.setProjectName(payment.getProject().getProjectName());
        dto.setCustomerName(payment.getProject().getCustomer().getName());
        dto.setAmount(payment.getAmount());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setPaymentDate(payment.getPaymentDate());
        dto.setReferenceNumber(payment.getReferenceNumber());
        dto.setNotes(payment.getNotes());
        dto.setReceivedBy(payment.getReceivedBy());
        dto.setPaymentStatus(payment.getPaymentStatus());
        dto.setCreatedAt(payment.getCreatedAt());
        dto.setUpdatedAt(payment.getUpdatedAt());
        return dto;
    }

    private PaymentSummaryDto convertToSummaryDto(Payment payment) {
        return new PaymentSummaryDto(
                payment.getId(),
                payment.getProject().getId(),
                payment.getProject().getProjectName(),
                payment.getProject().getCustomer().getName(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getPaymentDate(),
                payment.getPaymentStatus(),
                payment.getReceivedBy()
        );
    }
}