package com.fleetmanagement.kitchencrmbackend.modules.settings.controller;

import com.fleetmanagement.kitchencrmbackend.modules.settings.service.SystemSettingService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
@CrossOrigin(origins = "*")
public class SettingsController {

    @Autowired
    private SystemSettingService systemSettingService;

    /**
     * Get all margin percentages (Super Admin only)
     * @return Map of category names to margin percentages
     */
    @GetMapping("/margins")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Map<String, BigDecimal>> getMargins() {
        try {
            Map<String, BigDecimal> margins = systemSettingService.getAllMargins();
            return ApiResponse.success("Margins retrieved successfully", margins);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve margins: " + e.getMessage());
        }
    }

    /**
     * Update all margin percentages (Super Admin only)
     * @param margins Map of category names to new margin percentages
     * @return Success response
     */
    @PutMapping("/margins")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<String> updateMargins(@RequestBody Map<String, BigDecimal> margins) {
        try {
            systemSettingService.updateAllMargins(margins);
            return ApiResponse.success("Margins updated successfully", "Updated");
        } catch (Exception e) {
            return ApiResponse.error("Failed to update margins: " + e.getMessage());
        }
    }

    /**
     * Get company information settings (Super Admin only)
     * @return Map of company setting keys to values
     */
    @GetMapping("/company")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Map<String, String>> getCompanySettings() {
        try {
            Map<String, String> settings = systemSettingService.getCompanySettings();
            return ApiResponse.success("Company settings retrieved successfully", settings);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve company settings: " + e.getMessage());
        }
    }

    /**
     * Update company information settings (Super Admin only)
     * @param settings Map of company setting keys to values
     * @return Success response
     */
    @PutMapping("/company")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<String> updateCompanySettings(@RequestBody Map<String, String> settings) {
        try {
            systemSettingService.updateCompanySettings(settings);
            return ApiResponse.success("Company settings updated successfully", "Updated");
        } catch (Exception e) {
            return ApiResponse.error("Failed to update company settings: " + e.getMessage());
        }
    }

    /**
     * Get dashboard configuration settings (Super Admin only)
     * @return Map of dashboard setting keys to values
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Map<String, String>> getDashboardSettings() {
        try {
            Map<String, String> settings = systemSettingService.getDashboardSettings();
            return ApiResponse.success("Dashboard settings retrieved successfully", settings);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve dashboard settings: " + e.getMessage());
        }
    }

    /**
     * Update dashboard configuration settings (Super Admin only)
     * @param settings Map of dashboard setting keys to values
     * @return Success response
     */
    @PutMapping("/dashboard")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<String> updateDashboardSettings(@RequestBody Map<String, String> settings) {
        try {
            systemSettingService.updateDashboardSettings(settings);
            return ApiResponse.success("Dashboard settings updated successfully", "Updated");
        } catch (Exception e) {
            return ApiResponse.error("Failed to update dashboard settings: " + e.getMessage());
        }
    }

    /**
     * Upload company logo (Super Admin only)
     * @param file Logo image file (PNG/JPG, max 2MB)
     * @return Success response with logo URL
     */
    @PostMapping(value = "/company/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> uploadCompanyLogo(@RequestParam("file") MultipartFile file) {
        try {
            ApiResponse<String> response = systemSettingService.uploadCompanyLogo(file);
            return response.getSuccess() ?
                    ResponseEntity.ok(response) :
                    ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Logo upload failed: " + e.getMessage())
            );
        }
    }

    /**
     * Get company logo information
     * @return Map with logoUrl and hasLogo status
     */
    @GetMapping("/company/logo")
    public ApiResponse<Map<String, String>> getCompanyLogo() {
        try {
            Map<String, String> logoData = systemSettingService.getCompanyLogo();
            return ApiResponse.success("Logo info retrieved successfully", logoData);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve logo info: " + e.getMessage());
        }
    }

    /**
     * Delete company logo (Super Admin only)
     * @return Success response
     */
    @DeleteMapping("/company/logo")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<String> deleteCompanyLogo() {
        try {
            systemSettingService.deleteCompanyLogo();
            return ApiResponse.success("Logo deleted successfully", "Deleted");
        } catch (Exception e) {
            return ApiResponse.error("Failed to delete logo: " + e.getMessage());
        }
    }
}

