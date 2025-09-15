package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.QuotationDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.core.io.Resource;

public interface PdfGenerationService {
    ApiResponse<Resource> generateQuotationPdf(Long quotationId, String userRole);
    ApiResponse<Resource> generateBillPdf(Long quotationId, String userRole);
    byte[] createQuotationPdfBytes(QuotationDto quotation, String userRole);
}

