package com.fleetmanagement.kitchencrmbackend.modules.settings.controller;

import com.fleetmanagement.kitchencrmbackend.modules.settings.service.SystemSettingService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
}

