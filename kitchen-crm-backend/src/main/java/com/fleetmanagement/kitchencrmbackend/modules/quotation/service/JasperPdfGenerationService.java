package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.QuotationDto;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.PdfApprovalStampDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.core.io.Resource;

/**
 * Service interface for PDF generation using JasperReports.
 * Provides methods for generating quotation PDFs with a modern design.
 */
public interface JasperPdfGenerationService {

    /**
     * Generate a quotation PDF for the given quotation ID.
     *
     * @param quotationId the quotation ID
     * @param userRole the role of the user requesting the PDF
     * @return ApiResponse containing the PDF as a Resource
     */
    ApiResponse<Resource> generateQuotationPdf(Long quotationId, String userRole);

    /**
     * Generate a bill PDF for an approved quotation.
     *
     * @param quotationId the quotation ID
     * @param userRole the role of the user requesting the PDF
     * @return ApiResponse containing the bill PDF as a Resource
     */
    ApiResponse<Resource> generateBillPdf(Long quotationId, String userRole);

    /**
     * Create quotation PDF bytes from a QuotationDto.
     *
     * @param quotation the quotation data
     * @param userRole the role of the user
     * @return the PDF as byte array
     */
    byte[] createQuotationPdfBytes(QuotationDto quotation, String userRole);

    /**
     * Add an approval stamp to an existing PDF.
     *
     * @param originalPdfBytes the original PDF bytes
     * @param approvalData the approval stamp data
     * @return the PDF with stamp as byte array
     */
    byte[] addApprovalStampToPdf(byte[] originalPdfBytes, PdfApprovalStampDto approvalData);
}
