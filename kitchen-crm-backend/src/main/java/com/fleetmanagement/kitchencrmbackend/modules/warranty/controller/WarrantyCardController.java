package com.fleetmanagement.kitchencrmbackend.modules.warranty.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.dto.WarrantyCardDto;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.dto.WarrantyCardResponse;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.service.WarrantyCardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/warranty-cards")
@CrossOrigin(origins = "*")
public class WarrantyCardController {

    @Autowired
    private WarrantyCardService warrantyCardService;

    @GetMapping("/customer/{customerId}")
    public ApiResponse<WarrantyCardResponse> getWarrantyCardByCustomer(@PathVariable Long customerId) {
        try {
            WarrantyCardResponse response = warrantyCardService.getWarrantyCardByCustomerId(customerId);
            return ApiResponse.success("Warranty card retrieved successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve warranty card: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<WarrantyCardResponse> getWarrantyCard(@PathVariable Long id) {
        try {
            WarrantyCardResponse response = warrantyCardService.getWarrantyCardById(id);
            return ApiResponse.success("Warranty card retrieved successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve warranty card: " + e.getMessage());
        }
    }

    @PostMapping
    public ApiResponse<WarrantyCardResponse> createWarrantyCard(
            @RequestBody WarrantyCardDto dto,
            Authentication authentication) {
        try {
            String createdBy = authentication != null ? authentication.getName() : "SYSTEM";
            WarrantyCardResponse response = warrantyCardService.createWarrantyCard(
                    dto.getCustomerId(), dto, createdBy);
            return ApiResponse.success("Warranty card created successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to create warranty card: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<WarrantyCardResponse> updateWarrantyCard(
            @PathVariable Long id,
            @RequestBody WarrantyCardDto dto,
            Authentication authentication) {
        try {
            String updatedBy = authentication != null ? authentication.getName() : "SYSTEM";
            WarrantyCardResponse response = warrantyCardService.updateWarrantyCard(id, dto, updatedBy);
            return ApiResponse.success("Warranty card updated successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to update warranty card: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/generate-pdf")
    public ApiResponse<String> generatePdf(@PathVariable Long id) {
        try {
            warrantyCardService.generatePdf(id);
            return ApiResponse.success("PDF generated successfully", "Generated");
        } catch (Exception e) {
            return ApiResponse.error("Failed to generate PDF: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<Resource> downloadPdf(@PathVariable Long id) {
        try {
            Resource resource = warrantyCardService.getWarrantyCardPdf(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"warranty-certificate.pdf\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/send-email")
    public ApiResponse<String> sendEmail(@PathVariable Long id) {
        try {
            warrantyCardService.sendEmail(id);
            return ApiResponse.success("Email sent successfully", "Sent");
        } catch (Exception e) {
            return ApiResponse.error("Failed to send email: " + e.getMessage());
        }
    }

    @PostMapping("/generate-certificate-number")
    public ApiResponse<String> generateCertificateNumber() {
        try {
            String certNumber = warrantyCardService.generateCertificateNumber();
            return ApiResponse.success("Certificate number generated successfully", certNumber);
        } catch (Exception e) {
            return ApiResponse.error("Failed to generate certificate number: " + e.getMessage());
        }
    }
}

