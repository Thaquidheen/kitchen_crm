package com.fleetmanagement.kitchencrmbackend.modules.quotation.controller;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.service.QuotationService;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.service.JasperPdfGenerationService;
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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/quotations")
@CrossOrigin(origins = "*", maxAge = 3600)
public class QuotationController {

    @Autowired
    private QuotationService quotationService;


    @Autowired
    private JasperPdfGenerationService pdfGenerationService;

    @Autowired
    private com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerPlanImageRepository customerPlanImageRepository;

    @Autowired
    private com.fleetmanagement.kitchencrmbackend.modules.customer.repository.DesignPhaseFileRepository designPhaseFileRepository;

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

    @GetMapping(value = "/{id}/pdf", produces = {MediaType.APPLICATION_PDF_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<?> downloadQuotationPdf(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        try {
            String userRole = currentUser.getAuthorities().iterator().next().getAuthority();

            // Check if service is available
            if (pdfGenerationService == null) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(ApiResponse.error("PDF generation service is not available"));
            }

            ApiResponse<Resource> response = pdfGenerationService.generateQuotationPdf(id, userRole);

            if (response.getSuccess()) {
                Resource resource = response.getData();
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"quotation_" + id + ".pdf\"")
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(resource);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(response);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error("Failed to generate PDF: " + e.getMessage()));
        }
    }

    @GetMapping(value = "/{id}/bill/pdf", produces = {MediaType.APPLICATION_PDF_VALUE, MediaType.APPLICATION_JSON_VALUE})
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

    @GetMapping("/customers/{customerId}/available-plan-images")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCustomerAvailablePlanImages(
            @PathVariable Long customerId) {
        try {
            // Fetch CustomerPlanImage entities
            List<com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerPlanImage> planImages =
                    customerPlanImageRepository.findByCustomerId(customerId);

            // Fetch DesignPhaseFile entities with PLAN category
            List<com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhaseFile> designFiles =
                    designPhaseFileRepository.findByCustomerId(customerId).stream()
                            .filter(file -> file.getFileCategory() ==
                                    com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhaseFile.FileCategory.PLAN)
                            .toList();

            // Convert to DTOs
            List<Map<String, Object>> planImageList = planImages.stream().map(img -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", img.getId());
                map.put("type", "plan_image");
                map.put("name", img.getImageName());
                map.put("url", img.getImageUrl());
                map.put("imageType", img.getImageType() != null ? img.getImageType().name() : "FLOOR_PLAN");
                return map;
            }).toList();

            List<Map<String, Object>> designFileList = designFiles.stream().map(file -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", file.getId());
                map.put("type", "design_file");
                map.put("name", file.getOriginalFileName());
                map.put("url", file.getFileUrl());
                map.put("fileCategory", file.getFileCategory() != null ? file.getFileCategory().name() : "PLAN");
                return map;
            }).toList();

            Map<String, Object> result = new java.util.HashMap<>();
            result.put("planImages", planImageList);
            result.put("designFiles", designFileList);

            return ResponseEntity.ok(ApiResponse.success("Available plan images retrieved successfully", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to fetch available plan images: " + e.getMessage()));
        }
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

    @PostMapping("/{id}/pdf/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> generateApprovedPdf(
            @PathVariable Long id,
            @Valid @RequestBody PdfApprovalStampDto approvalData,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        try {
            String userRole = currentUser.getAuthorities().iterator().next().getAuthority();

            // Check if service is available
            if (pdfGenerationService == null) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(ApiResponse.error("PDF generation service is not available"));
            }

            // First, generate the original quotation PDF
            ApiResponse<Resource> quotationResponse = pdfGenerationService.generateQuotationPdf(id, userRole);

            if (!quotationResponse.getSuccess()) {
                return ResponseEntity.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(quotationResponse);
            }

            // Read the original PDF bytes
            Resource originalResource = quotationResponse.getData();
            byte[] originalPdfBytes = originalResource.getInputStream().readAllBytes();

            // Add approval stamp to the PDF
            byte[] approvedPdfBytes = pdfGenerationService.addApprovalStampToPdf(originalPdfBytes, approvalData);

            // Create a temporary file for the approved PDF
            java.nio.file.Path tempFile = java.nio.file.Files.createTempFile(
                "quotation_approved_" + id + "_", ".pdf");
            java.nio.file.Files.write(tempFile, approvedPdfBytes);

            Resource approvedResource = new org.springframework.core.io.FileSystemResource(tempFile.toFile());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"quotation_approved_" + id + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(approvedResource);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error("Failed to generate approved PDF: " + e.getMessage()));
        }
    }
}