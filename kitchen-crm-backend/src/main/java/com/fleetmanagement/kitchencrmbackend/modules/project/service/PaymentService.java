package com.fleetmanagement.kitchencrmbackend.modules.project.service;

import com.fleetmanagement.kitchencrmbackend.modules.project.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.Payment;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface PaymentService {

    ApiResponse<Page<PaymentSummaryDto>> getAllPayments(Long projectId,
                                                        Payment.PaymentMethod paymentMethod,
                                                        Payment.PaymentStatus paymentStatus,
                                                        LocalDate fromDate,
                                                        LocalDate toDate,
                                                        String customerName,
                                                        Pageable pageable);

    ApiResponse<PaymentDto> getPaymentById(Long id);

    ApiResponse<List<PaymentSummaryDto>> getPaymentsByProject(Long projectId);

    ApiResponse<PaymentDto> createPayment(PaymentCreateDto paymentCreateDto, String receivedBy);

    ApiResponse<PaymentDto> addPaymentToProject(Long projectId, PaymentCreateDto paymentCreateDto, String receivedBy);

    ApiResponse<PaymentDto> updatePayment(Long id, PaymentDto paymentDto, String updatedBy);

    ApiResponse<String> deletePayment(Long id);

    ApiResponse<ProjectPaymentSummaryDto> getProjectPaymentSummary(Long projectId);

    ApiResponse<Map<String, Object>> getPaymentStatistics();

    ApiResponse<Map<String, Object>> getPaymentStatisticsByDateRange(LocalDate fromDate, LocalDate toDate);
}