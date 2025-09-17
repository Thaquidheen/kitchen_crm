package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerPlanImageDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.PlanImageUploadRequest;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerPlanImage;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.CustomerPlanImageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers/plan-images")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CustomerPlanImageController {

    @Autowired
    private CustomerPlanImageService planImageService;

    // Upload plan image for a customer
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<CustomerPlanImageDto>> uploadPlanImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("customerId") Long customerId,
            @RequestParam("imageType") String imageType,
            @RequestParam(value = "description", required = false) String description) {

        try {
            // Create upload request object
            PlanImageUploadRequest request = new PlanImageUploadRequest();
            request.setCustomerId(customerId);
            request.setImageType(CustomerPlanImage.ImageType.valueOf(imageType.toUpperCase()));
            request.setDescription(description);

            ApiResponse<CustomerPlanImageDto> response = planImageService.uploadPlanImage(file, request);

            return response.getSuccess() ?
                    ResponseEntity.ok(response) :
                    ResponseEntity.badRequest().body(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Invalid image type: " + imageType + ". Allowed types: FLOOR_PLAN, ELEVATION, THREE_D_VIEW, SECTION")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Upload failed: " + e.getMessage())
            );
        }
    }

    // Get all plan images for a customer
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<CustomerPlanImageDto>>> getCustomerPlanImages(
            @PathVariable Long customerId) {

        ApiResponse<List<CustomerPlanImageDto>> response = planImageService.getCustomerPlanImages(customerId);
        return ResponseEntity.ok(response);
    }

    // Get plan images by type for a customer
    @GetMapping("/customer/{customerId}/type/{imageType}")
    public ResponseEntity<ApiResponse<List<CustomerPlanImageDto>>> getCustomerPlanImagesByType(
            @PathVariable Long customerId,
            @PathVariable String imageType) {

        ApiResponse<List<CustomerPlanImageDto>> response =
                planImageService.getCustomerPlanImagesByType(customerId, imageType);

        return response.getSuccess() ?
                ResponseEntity.ok(response) :
                ResponseEntity.badRequest().body(response);
    }

    // Get specific plan image by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerPlanImageDto>> getPlanImageById(@PathVariable Long id) {
        ApiResponse<CustomerPlanImageDto> response = planImageService.getPlanImageById(id);

        return response.getSuccess() ?
                ResponseEntity.ok(response) :
                ResponseEntity.notFound().build();
    }

    // Update plan image info (not the file itself)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<CustomerPlanImageDto>> updatePlanImageInfo(
            @PathVariable Long id,
            @Valid @RequestBody CustomerPlanImageDto dto) {

        ApiResponse<CustomerPlanImageDto> response = planImageService.updatePlanImageInfo(id, dto);

        return response.getSuccess() ?
                ResponseEntity.ok(response) :
                ResponseEntity.badRequest().body(response);
    }

    // Delete plan image
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deletePlanImage(@PathVariable Long id) {
        ApiResponse<String> response = planImageService.deletePlanImage(id);

        return response.getSuccess() ?
                ResponseEntity.ok(response) :
                ResponseEntity.badRequest().body(response);
    }

    // Get available image types (helper endpoint)
    @GetMapping("/image-types")
    public ResponseEntity<ApiResponse<CustomerPlanImage.ImageType[]>> getAvailableImageTypes() {
        return ResponseEntity.ok(ApiResponse.success(CustomerPlanImage.ImageType.values()));
    }
}