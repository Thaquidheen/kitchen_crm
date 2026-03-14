package com.fleetmanagement.kitchencrmbackend.modules.settings.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.settings.entity.SystemSetting;
import com.fleetmanagement.kitchencrmbackend.modules.settings.repository.SystemSettingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SystemSettingServiceImpl implements SystemSettingService {

    private static final Logger logger = LoggerFactory.getLogger(SystemSettingServiceImpl.class);

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Value("${app.logo-upload-dir:uploads/company}")
    private String logoUploadDir;

    private static final String MARGIN_KEY_PREFIX = "_margin_percentage";
    private static final BigDecimal DEFAULT_MARGIN = BigDecimal.valueOf(20.00);
    private static final List<String> ALLOWED_LOGO_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png");
    private static final long MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

    @Override
    public BigDecimal getMarginPercentage(String category) {
        String key = category.toLowerCase() + MARGIN_KEY_PREFIX;
        return systemSettingRepository.findBySettingKey(key)
                .map(setting -> new BigDecimal(setting.getSettingValue()))
                .orElse(DEFAULT_MARGIN);
    }

    @Override
    @Transactional
    public void updateMarginPercentage(String category, BigDecimal percentage) {
        String key = category.toLowerCase() + MARGIN_KEY_PREFIX;
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElseThrow(() -> new RuntimeException("Setting not found: " + key));
        
        setting.setSettingValue(percentage.toString());
        systemSettingRepository.save(setting);
    }

    @Override
    public Map<String, BigDecimal> getAllMargins() {
        Map<String, BigDecimal> margins = new HashMap<>();
        margins.put("accessories", getMarginPercentage("accessories"));
        margins.put("cabinets", getMarginPercentage("cabinets"));
        margins.put("doors", getMarginPercentage("doors"));
        margins.put("lighting", getMarginPercentage("lighting"));
        margins.put("miscellaneous", getMarginPercentage("miscellaneous"));
        return margins;
    }

    @Override
    @Transactional
    public void updateAllMargins(Map<String, BigDecimal> margins) {
        margins.forEach(this::updateMarginPercentage);
    }

    @Override
    public Map<String, String> getCompanySettings() {
        Map<String, String> settings = new HashMap<>();
        settings.put("company.name", getSettingValue("company.name", "THE HOCH"));
        settings.put("company.tagline", getSettingValue("company.tagline", "Modular Interiors & Design Solutions"));
        settings.put("company.address_line1", getSettingValue("company.address_line1", "[Address Line 1]"));
        settings.put("company.address_line2", getSettingValue("company.address_line2", "[City, State, Zip Code]"));
        settings.put("company.phone", getSettingValue("company.phone", "[Phone Number]"));
        settings.put("company.email", getSettingValue("company.email", "[Email Address]"));
        settings.put("company.website", getSettingValue("company.website", "[Website URL]"));
        settings.put("quotation.terms.general", getSettingValue("quotation.terms.general", 
            "The Above-mentioned Terms are Subjected to Change depending upon the delay from Client side to provide necessary Inputs/Approvals\n" +
            "Kitchen Delivery and Installation will not proceed unless site condition requirements outlined in our Terms and Conditions.\n" +
            "Unloading Expenses of the materials at the sight to bear by the customer\n" +
            "Our scope is limited to the installation of the specified items only. There will be additional charges for installing any items not included in this offer.\n" +
            "The client must provide all plumbing and electrical items, including faucets, as part of their scope. All plumbing outlets and electrical points should be installed according to our site drawing\n" +
            "The client should provide safe storage spaces for materials during installation at the site."));
        settings.put("quotation.terms.warranty", getSettingValue("quotation.terms.warranty",
            "We Warrant the Furniture We Sell to Be Free from Defects in Material and Workmanship Under Normal Residential Usage to The Original Purchaser for The Period Specified Below. We Will Repair Any Part That Proves to Be Defective in Materials and Workmanship. If Repair Is Not Possible, We Will Either Replace the Part with A New Part or A Component of Similar Composition and Price.\n\n" +
            "This Warranty Does Not Apply to Any Issues with Our Furniture or Parts of Our Furniture That Result from Improper Handling, Negligence, Alterations, Accidents, Misuse, Improper Cleaning or Care, Or Natural Calamities. Additionally, Consequential and Incidental Damages Are Not Covered Under This Warranty.\n\n" +
            "Stainless Steel Cabinets Have 20 Years of Warranty Against Any Manufacturing Defect\n" +
            "Any Other Doors Have 8 Years of Warranty Against Any Manufacturing Defect\n" +
            "Hardware & Accessories: As Provided by The Manufacturer\n" +
            "Lightings: As Provided by The Manufacturer"));
        return settings;
    }

    @Override
    @Transactional
    public void updateCompanySettings(Map<String, String> settings) {
        settings.forEach((key, value) -> {
            SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                    .orElseGet(() -> {
                        SystemSetting newSetting = new SystemSetting();
                        newSetting.setSettingKey(key);
                        return newSetting;
                    });
            setting.setSettingValue(value != null ? value : "");
            systemSettingRepository.save(setting);
        });
    }

    @Override
    public String getSettingValue(String key, String defaultValue) {
        return systemSettingRepository.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    @Override
    public Map<String, String> getDashboardSettings() {
        Map<String, String> settings = new HashMap<>();
        settings.put("dashboard.pagePadding", getSettingValue("dashboard.pagePadding", "6"));
        settings.put("dashboard.headerMarginBottom", getSettingValue("dashboard.headerMarginBottom", "6"));
        settings.put("dashboard.headerGap", getSettingValue("dashboard.headerGap", "3"));
        settings.put("dashboard.iconSize", getSettingValue("dashboard.iconSize", "8"));
        settings.put("dashboard.titleSize", getSettingValue("dashboard.titleSize", "3xl"));
        settings.put("dashboard.subtitleSize", getSettingValue("dashboard.subtitleSize", "sm"));
        settings.put("dashboard.buttonGap", getSettingValue("dashboard.buttonGap", "2"));
        settings.put("dashboard.buttonIconSize", getSettingValue("dashboard.buttonIconSize", "4"));
        settings.put("dashboard.cardPadding", getSettingValue("dashboard.cardPadding", "4"));
        settings.put("dashboard.cardMarginBottom", getSettingValue("dashboard.cardMarginBottom", "4"));
        settings.put("dashboard.sectionMarginBottom", getSettingValue("dashboard.sectionMarginBottom", "6"));
        settings.put("dashboard.tabPaddingX", getSettingValue("dashboard.tabPaddingX", "4"));
        settings.put("dashboard.tabPaddingY", getSettingValue("dashboard.tabPaddingY", "3"));
        settings.put("dashboard.tabGap", getSettingValue("dashboard.tabGap", "4"));
        settings.put("dashboard.contentGap", getSettingValue("dashboard.contentGap", "6"));
        settings.put("dashboard.gridGap", getSettingValue("dashboard.gridGap", "6"));
        settings.put("dashboard.gridColsMobile", getSettingValue("dashboard.gridColsMobile", "1"));
        settings.put("dashboard.gridColsDesktop", getSettingValue("dashboard.gridColsDesktop", "2"));
        return settings;
    }

    @Override
    @Transactional
    public void updateDashboardSettings(Map<String, String> settings) {
        settings.forEach((key, value) -> {
            SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                    .orElseGet(() -> {
                        SystemSetting newSetting = new SystemSetting();
                        newSetting.setSettingKey(key);
                        return newSetting;
                    });
            setting.setSettingValue(value != null ? value : "");
            systemSettingRepository.save(setting);
        });
    }

    @Override
    @Transactional
    public ApiResponse<String> uploadCompanyLogo(MultipartFile file) {
        try {
            // Validate file
            if (file == null || file.isEmpty()) {
                return ApiResponse.error("File is empty");
            }

            if (file.getSize() > MAX_LOGO_SIZE) {
                return ApiResponse.error("Logo file must be less than 2MB");
            }

            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename).toLowerCase();
            if (!ALLOWED_LOGO_EXTENSIONS.contains(extension)) {
                return ApiResponse.error("Only JPG and PNG files are allowed");
            }

            // Create upload directory if not exists
            Path uploadPath = Paths.get(logoUploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Delete old logo if exists
            String oldLogoUrl = getSettingValue("company.logo_url", "");
            if (oldLogoUrl != null && !oldLogoUrl.isEmpty()) {
                try {
                    String oldFileName = oldLogoUrl.replace("/uploads/company/", "");
                    Path oldFilePath = Paths.get(logoUploadDir, oldFileName);
                    Files.deleteIfExists(oldFilePath);
                    logger.info("Deleted old logo: {}", oldFilePath);
                } catch (IOException e) {
                    logger.warn("Failed to delete old logo: {}", e.getMessage());
                }
            }

            // Generate unique filename
            String fileName = "company_logo_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + extension;
            Path filePath = Paths.get(logoUploadDir, fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Generate base64 for PDF embedding
            byte[] fileBytes = Files.readAllBytes(filePath);
            String base64Data = Base64.getEncoder().encodeToString(fileBytes);

            // Determine MIME type for base64 prefix
            String mimeType = extension.equals("png") ? "image/png" : "image/jpeg";
            String base64WithPrefix = "data:" + mimeType + ";base64," + base64Data;

            // Save to settings
            String logoUrl = "/uploads/company/" + fileName;
            saveLogoSettings(logoUrl, base64WithPrefix);

            logger.info("Company logo uploaded successfully: {}", logoUrl);
            return ApiResponse.success("Logo uploaded successfully", logoUrl);

        } catch (Exception e) {
            logger.error("Failed to upload logo: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to upload logo: " + e.getMessage());
        }
    }

    @Override
    public Map<String, String> getCompanyLogo() {
        Map<String, String> logoData = new HashMap<>();
        String logoUrl = getSettingValue("company.logo_url", "");
        logoData.put("logoUrl", logoUrl);
        logoData.put("hasLogo", String.valueOf(logoUrl != null && !logoUrl.isEmpty()));
        return logoData;
    }

    @Override
    @Transactional
    public void deleteCompanyLogo() {
        String logoUrl = getSettingValue("company.logo_url", "");
        if (logoUrl != null && !logoUrl.isEmpty()) {
            try {
                String fileName = logoUrl.replace("/uploads/company/", "");
                Path filePath = Paths.get(logoUploadDir, fileName);
                Files.deleteIfExists(filePath);
                logger.info("Company logo deleted: {}", filePath);
            } catch (IOException e) {
                logger.warn("Failed to delete logo file: {}", e.getMessage());
            }
        }
        saveLogoSettings("", "");
    }

    @Override
    public String getCompanyLogoBase64() {
        return getSettingValue("company.logo_base64", "");
    }

    private void saveLogoSettings(String logoUrl, String base64Data) {
        // Save logo URL
        SystemSetting urlSetting = systemSettingRepository.findBySettingKey("company.logo_url")
                .orElseGet(() -> {
                    SystemSetting newSetting = new SystemSetting();
                    newSetting.setSettingKey("company.logo_url");
                    return newSetting;
                });
        urlSetting.setSettingValue(logoUrl != null ? logoUrl : "");
        systemSettingRepository.save(urlSetting);

        // Save base64 data
        SystemSetting base64Setting = systemSettingRepository.findBySettingKey("company.logo_base64")
                .orElseGet(() -> {
                    SystemSetting newSetting = new SystemSetting();
                    newSetting.setSettingKey("company.logo_base64");
                    return newSetting;
                });
        base64Setting.setSettingValue(base64Data != null ? base64Data : "");
        systemSettingRepository.save(base64Setting);
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf(".") == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}


