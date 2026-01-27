package com.fleetmanagement.kitchencrmbackend.modules.settings.service;

import java.math.BigDecimal;
import java.util.Map;
import org.springframework.web.multipart.MultipartFile;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;

public interface SystemSettingService {
    
    /**
     * Get margin percentage for a specific product category
     * @param category Category name (accessories, cabinets, doors, lighting)
     * @return Margin percentage as BigDecimal
     */
    BigDecimal getMarginPercentage(String category);
    
    /**
     * Update margin percentage for a specific product category
     * @param category Category name (accessories, cabinets, doors, lighting)
     * @param percentage New margin percentage
     */
    void updateMarginPercentage(String category, BigDecimal percentage);
    
    /**
     * Get all margin percentages for all categories
     * @return Map of category names to margin percentages
     */
    Map<String, BigDecimal> getAllMargins();
    
    /**
     * Update all margin percentages at once
     * @param margins Map of category names to margin percentages
     */
    void updateAllMargins(Map<String, BigDecimal> margins);
    
    /**
     * Get company information settings
     * @return Map of company setting keys to values
     */
    Map<String, String> getCompanySettings();
    
    /**
     * Update company information settings
     * @param settings Map of company setting keys to values
     */
    void updateCompanySettings(Map<String, String> settings);
    
    /**
     * Get a single setting value by key
     * @param key Setting key
     * @param defaultValue Default value if setting not found
     * @return Setting value or default value
     */
    String getSettingValue(String key, String defaultValue);
    
    /**
     * Get dashboard configuration settings
     * @return Map of dashboard setting keys to values
     */
    Map<String, String> getDashboardSettings();
    
    /**
     * Update dashboard configuration settings
     * @param settings Map of dashboard setting keys to values
     */
    void updateDashboardSettings(Map<String, String> settings);

    /**
     * Upload company logo for PDF generation
     * @param file Logo image file (PNG/JPG, max 2MB)
     * @return ApiResponse with logo URL on success
     */
    ApiResponse<String> uploadCompanyLogo(MultipartFile file);

    /**
     * Get company logo information
     * @return Map containing logoUrl and hasLogo status
     */
    Map<String, String> getCompanyLogo();

    /**
     * Delete company logo
     */
    void deleteCompanyLogo();

    /**
     * Get company logo as base64 encoded string for PDF embedding
     * @return Base64 encoded logo string, or empty string if no logo
     */
    String getCompanyLogoBase64();
}


