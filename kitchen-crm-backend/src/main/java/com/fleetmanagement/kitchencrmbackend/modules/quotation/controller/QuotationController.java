package com.fleetmanagement.kitchencrmbackend.modules.quotation.controller;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.service.QuotationService;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.service.PdfGenerationService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/quotations")
@CrossOrigin(origins = "*", maxAge = 3600)
public class QuotationController {

    @Autowired
    private QuotationService quotationService;


    @Autowired
    private PdfGenerationService pdfGenerationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<QuotationSummaryDto>>> getAllQuotations(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Quotation.QuotationStatus status,
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(quotationService.getAllQuotations(
                customerId, status, customerName, fromDate, toDate, pageable));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getQuotationStatistics() {
        return ResponseEntity.ok(quotationService.getQuotationStatistics());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuotationDto>> getQuotationById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        String userRole = currentUser.getAuthorities().iterator().next().getAuthority();
        ApiResponse<QuotationDto> response = quotationService.getQuotationById(id, userRole);

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QuotationDto>> createQuotation(
            @Valid @RequestBody QuotationCreateDto quotationCreateDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        String userRole = currentUser.getAuthorities().iterator().next().getAuthority();
        ApiResponse<QuotationDto> response = quotationService.createQuotation(
                quotationCreateDto, currentUser.getName(), userRole);

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuotationDto>> updateQuotation(
            @PathVariable Long id,
            @Valid @RequestBody QuotationDto quotationDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        String userRole = currentUser.getAuthorities().iterator().next().getAuthority();
        ApiResponse<QuotationDto> response = quotationService.updateQuotation(
                id, quotationDto, currentUser.getName(), userRole);

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteQuotation(@PathVariable Long id) {
        return ResponseEntity.ok(quotationService.deleteQuotation(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> updateQuotationStatus(
            @PathVariable Long id,
            @RequestParam Quotation.QuotationStatus status,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(quotationService.updateQuotationStatus(
                id, status, currentUser.getName()));
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<ApiResponse<QuotationDto>> duplicateQuotation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        String userRole = currentUser.getAuthorities().iterator().next().getAuthority();
        ApiResponse<QuotationDto> response = quotationService.duplicateQuotation(
                id, currentUser.getName(), userRole);

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<?> downloadQuotationPdf(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        try {
            String userRole = currentUser.getAuthorities().iterator().next().getAuthority();

            // Check if service is available
            if (pdfGenerationService == null) {
                return ResponseEntity.ok(ApiResponse.error("PDF generation service is not available"));
            }

            ApiResponse<Resource> response = pdfGenerationService.generateQuotationPdf(id, userRole);

            if (response.getSuccess()) {
                Resource resource = response.getData();
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"quotation_" + id + ".pdf\"")
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(resource);
            } else {
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("Failed to generate PDF: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/bill/pdf")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> downloadBillPdf(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        try {
            String userRole = currentUser.getAuthorities().iterator().next().getAuthority();

            if (pdfGenerationService == null) {
                // Return JSON error response instead of PDF
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(ApiResponse.error("PDF generation service is not available"));
            }

            ApiResponse<Resource> response = pdfGenerationService.generateBillPdf(id, userRole);

            if (response.getSuccess()) {
                Resource resource = response.getData();
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"bill_" + id + ".pdf\"")
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(resource);
            } else {
                // Return JSON error response with proper content type
                return ResponseEntity.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(response);
            }
        } catch (Exception e) {
            // Return JSON error response with proper content type
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error("Failed to generate bill PDF: " + e.getMessage()));
        }
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<Page<QuotationSummaryDto>>> getQuotationsByCustomer(
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(quotationService.getAllQuotations(
                customerId, null, null, null, null, pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<QuotationSummaryDto>>> searchQuotations(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // Search in customer name, quotation number, or project name
        return ResponseEntity.ok(quotationService.getAllQuotations(
                null, null, query, null, null, pageable));
    }
}