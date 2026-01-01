package com.fleetmanagement.kitchencrmbackend.modules.settings.service;

import com.fleetmanagement.kitchencrmbackend.modules.settings.entity.SystemSetting;
import com.fleetmanagement.kitchencrmbackend.modules.settings.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class SystemSettingServiceImpl implements SystemSettingService {

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    private static final String MARGIN_KEY_PREFIX = "_margin_percentage";
    private static final BigDecimal DEFAULT_MARGIN = BigDecimal.valueOf(20.00);

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
}


