package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Map;

public interface QuotationService {
    ApiResponse<Page<QuotationSummaryDto>> getAllQuotations(Long customerId, Quotation.QuotationStatus status,
                                                            String customerName, LocalDateTime fromDate,
                                                            LocalDateTime toDate, Pageable pageable);
    ApiResponse<QuotationDto> getQuotationById(Long id, String userRole);
    ApiResponse<QuotationDto> createQuotation(QuotationCreateDto quotationCreateDto, String createdBy, String userRole);
    ApiResponse<QuotationDto> updateQuotation(Long id, QuotationDto quotationDto, String updatedBy, String userRole);
    ApiResponse<String> deleteQuotation(Long id);
    ApiResponse<String> updateQuotationStatus(Long id, Quotation.QuotationStatus newStatus, String updatedBy);
    ApiResponse<QuotationDto> duplicateQuotation(Long id, String createdBy, String userRole);
    ApiResponse<Map<String, Object>> getQuotationStatistics();
}

