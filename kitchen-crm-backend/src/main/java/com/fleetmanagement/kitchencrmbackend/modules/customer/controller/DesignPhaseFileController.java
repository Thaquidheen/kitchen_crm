package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignFileUploadRequest;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignPhaseFileDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhaseFile;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.DesignPhaseFileService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/design-phase-files")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DesignPhaseFileController {

    @Autowired
    private DesignPhaseFileService fileService;

    // Upload design file
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DesignPhaseFileDto>> uploadDesignFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "designPhaseId", required = false) Long designPhaseId,
            @RequestParam(value = "customerId", required = false) Long customerId,
            @RequestParam(value = "fileCategory", required = false) String fileCategory,
            @RequestParam(value = "description", required = false) String description,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        try {
            // Create upload request object
            DesignFileUploadRequest request = new DesignFileUploadRequest();
            request.setDesignPhaseId(designPhaseId);
            request.setCustomerId(customerId);

            if (fileCategory != null) {
                request.setFileCategory(DesignPhaseFile.FileCategory.valueOf(fileCategory.toUpperCase()));
            }
            request.setDescription(description);

            String uploadedBy = currentUser != null ? currentUser.getName() : "System";
            ApiResponse<DesignPhaseFileDto> response = fileService.uploadDesignFile(file, request, uploadedBy);

            return response.getSuccess() ?
                    ResponseEntity.ok(response) :
                    ResponseEntity.badRequest().body(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Invalid file category: " + fileCategory + ". Allowed types: DESIGN, PLAN, REFERENCE, TECHNICAL, DOCUMENT, OTHER")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Upload failed: " + e.getMessage())
            );
        }
    }

    // Get all files for a design phase
    @GetMapping("/design-phase/{designPhaseId}")
    public ResponseEntity<ApiResponse<List<DesignPhaseFileDto>>> getDesignPhaseFiles(
            @PathVariable Long designPhaseId) {

        ApiResponse<List<DesignPhaseFileDto>> response = fileService.getDesignPhaseFiles(designPhaseId);
        return ResponseEntity.ok(response);
    }

    // Get all files for a customer
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<DesignPhaseFileDto>>> getCustomerDesignFiles(
            @PathVariable Long customerId) {

        ApiResponse<List<DesignPhaseFileDto>> response = fileService.getDesignPhaseFilesByCustomer(customerId);
        return ResponseEntity.ok(response);
    }

    // Get files by category
    @GetMapping("/design-phase/{designPhaseId}/category/{category}")
    public ResponseEntity<ApiResponse<List<DesignPhaseFileDto>>> getFilesByCategory(
            @PathVariable Long designPhaseId,
            @PathVariable String category) {

        ApiResponse<List<DesignPhaseFileDto>> response = fileService.getDesignPhaseFilesByCategory(designPhaseId, category);

        return response.getSuccess() ?
                ResponseEntity.ok(response) :
                ResponseEntity.badRequest().body(response);
    }

    // Get specific file by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DesignPhaseFileDto>> getFileById(@PathVariable Long id) {
        ApiResponse<DesignPhaseFileDto> response = fileService.getFileById(id);

        return response.getSuccess() ?
                ResponseEntity.ok(response) :
                ResponseEntity.notFound().build();
    }

    // Update file info (not the file itself)
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DesignPhaseFileDto>> updateFileInfo(
            @PathVariable Long id,
            @RequestBody DesignPhaseFileDto dto) {

        ApiResponse<DesignPhaseFileDto> response = fileService.updateFileInfo(id, dto);

        return response.getSuccess() ?
                ResponseEntity.ok(response) :
                ResponseEntity.badRequest().body(response);
    }

    // Delete file
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteFile(@PathVariable Long id) {
        ApiResponse<String> response = fileService.deleteFile(id);

        return response.getSuccess() ?
                ResponseEntity.ok(response) :
                ResponseEntity.badRequest().body(response);
    }

    // Get available file categories (helper endpoint)
    @GetMapping("/file-categories")
    public ResponseEntity<ApiResponse<DesignPhaseFile.FileCategory[]>> getAvailableFileCategories() {
        return ResponseEntity.ok(ApiResponse.success(DesignPhaseFile.FileCategory.values()));
    }
}
