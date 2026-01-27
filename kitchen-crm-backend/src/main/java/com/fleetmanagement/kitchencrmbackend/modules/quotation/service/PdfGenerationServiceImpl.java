package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerPlanImage;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerPlanImageRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationKitchen;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationKitchenPlanImage;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationKitchenPlanImageRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationKitchenRepository;
import com.fleetmanagement.kitchencrmbackend.modules.settings.entity.SystemSetting;
import com.fleetmanagement.kitchencrmbackend.modules.settings.repository.SystemSettingRepository;
import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.HtmlConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PdfGenerationServiceImpl implements PdfGenerationService {

    @Value("${app.pdf.include-plan-images:true}")
    private boolean includePlanImages;

    @Autowired
    private QuotationService quotationService;

    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    private ImageService imageService;

    @Autowired
    private CustomerPlanImageRepository planImageRepository;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Autowired
    private QuotationKitchenRepository kitchenRepository;

    @Autowired
    private QuotationKitchenPlanImageRepository kitchenPlanImageRepository;

    private static final String QUOTATION_TEMPLATE_PATH = "classpath:templates/pdf/quotation-template.html";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Override
    public ApiResponse<Resource> generateQuotationPdf(Long quotationId, String userRole) {
        try {
            ApiResponse<QuotationDto> quotationResponse = quotationService.getQuotationById(quotationId, userRole);
            if (!quotationResponse.getSuccess()) {
                return ApiResponse.error("Quotation not found");
            }

            QuotationDto quotation = quotationResponse.getData();
            byte[] pdfBytes = createQuotationPdfBytes(quotation, userRole);

            // Create temporary file
            Path tempFile = Files.createTempFile("quotation_" + quotation.getQuotationNumber(), ".pdf");
            Files.write(tempFile, pdfBytes);

            Resource resource = new FileSystemResource(tempFile.toFile());
            return ApiResponse.success(resource);

        } catch (Exception e) {
            return ApiResponse.error("Failed to generate PDF: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<Resource> generateBillPdf(Long quotationId, String userRole) {
        try {
            ApiResponse<QuotationDto> quotationResponse = quotationService.getQuotationById(quotationId, userRole);
            if (!quotationResponse.getSuccess()) {
                return ApiResponse.error("Quotation not found");
            }

            QuotationDto quotation = quotationResponse.getData();

            // Only generate bill for approved quotations
            if (quotation.getStatus() != Quotation.QuotationStatus.APPROVED) {
                return ApiResponse.error("Can only generate bill for approved quotations");
            }

            byte[] pdfBytes = createQuotationPdfBytes(quotation, userRole);

            // Create temporary file
            Path tempFile = Files.createTempFile("bill_" + quotation.getQuotationNumber(), ".pdf");
            Files.write(tempFile, pdfBytes);

            Resource resource = new FileSystemResource(tempFile.toFile());
            return ApiResponse.success(resource);

        } catch (Exception e) {
            return ApiResponse.error("Failed to generate bill PDF: " + e.getMessage());
        }
    }

    @Override
    public byte[] createQuotationPdfBytes(QuotationDto quotation, String userRole) {
        try {
            // Load HTML template
            String htmlContent = loadTemplate(QUOTATION_TEMPLATE_PATH);

            // Replace placeholders with quotation data
            htmlContent = replacePlaceholders(htmlContent, quotation, userRole);

            // Convert HTML to PDF using iText
            return convertHtmlToPdf(htmlContent);

        } catch (Exception e) {
            throw new RuntimeException("Failed to create quotation PDF", e);
        }
    }

    @Override
    public byte[] addApprovalStampToPdf(byte[] originalPdfBytes, PdfApprovalStampDto approvalData) {
        // Simple implementation - just return the original PDF for now
        // Can be enhanced later to add actual approval stamps
        return originalPdfBytes;
    }

    private String loadTemplate(String templatePath) throws IOException {
        try {
            var resource = resourceLoader.getResource(templatePath);
            if (resource.exists()) {
                String template = new String(resource.getInputStream().readAllBytes());
                System.out.println("Template loaded successfully from: " + templatePath);
                System.out.println("Template contains KITCHEN_SECTIONS: " + template.contains("{{KITCHEN_SECTIONS}}"));
                return template;
            } else {
                System.out.println("Template file not found at: " + templatePath + ", using basic template");
            }
        } catch (Exception e) {
            System.err.println("Error loading template: " + e.getMessage());
            e.printStackTrace();
        }
        System.out.println("Falling back to basic template");
        return getBasicTemplate();
    }

    private String getBasicTemplate() {
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Quotation</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .kitchen-section { margin: 20px 0; padding: 15px; border: 2px solid #0f3a53; border-radius: 6px; }
                .kitchen-header { color: #0f3a53; font-size: 18px; font-weight: bold; border-bottom: 2px solid #0f3a53; padding-bottom: 8px; margin-bottom: 15px; }
                .category-title { font-size: 14px; color: #0f3a53; font-weight: bold; margin: 15px 0 8px 0; }
                table { width: 100%; border-collapse: collapse; margin: 8px 0; }
                th { background: #0f3a53; color: #fff; padding: 8px; text-align: left; }
                td { padding: 8px; border-bottom: 1px dotted #cfd8df; }
                .text-right { text-align: right; }
                .plan-images-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0; }
                .plan-image-item { border: 1px solid #ddd; padding: 5px; text-align: center; }
            </style>
        </head>
        <body>
            {{KITCHEN_SECTIONS}}
            <hr>
            <p>Generated by HOCH</p>
        </body>
        </html>
        """;
    }

    private String replacePlaceholders(String htmlContent, QuotationDto quotation, String userRole) {
        // Replace company settings placeholders
        String companyName = getSettingValue("company.name", "THE HOCH");
        htmlContent = htmlContent.replace("{{COMPANY_NAME}}", companyName);
        // Short name for footer (first word or first 10 chars)
        String companyNameShort = companyName.contains(" ") ? companyName.split(" ")[0] :
                                  (companyName.length() > 10 ? companyName.substring(0, 10) : companyName);
        htmlContent = htmlContent.replace("{{COMPANY_NAME_SHORT}}", companyNameShort);
        htmlContent = htmlContent.replace("{{COMPANY_TAGLINE}}", getSettingValue("company.tagline", "Modular Interiors & Design Solutions"));
        String addressLine1 = getSettingValue("company.address_line1", "");
        String addressLine2 = getSettingValue("company.address_line2", "");
        String companyAddress = addressLine1 + (addressLine2.isEmpty() ? "" : ", " + addressLine2);
        htmlContent = htmlContent.replace("{{COMPANY_ADDRESS}}", companyAddress);
        htmlContent = htmlContent.replace("{{COMPANY_ADDRESS_LINE1}}", addressLine1);
        htmlContent = htmlContent.replace("{{COMPANY_ADDRESS_LINE2}}", addressLine2);
        htmlContent = htmlContent.replace("{{COMPANY_PHONE}}", getSettingValue("company.phone", ""));
        htmlContent = htmlContent.replace("{{COMPANY_EMAIL}}", getSettingValue("company.email", ""));
        htmlContent = htmlContent.replace("{{COMPANY_WEBSITE}}", getSettingValue("company.website", ""));

        // Replace logo placeholders
        String logoBase64 = getSettingValue("company.logo_base64", "");
        boolean hasLogo = logoBase64 != null && !logoBase64.isEmpty();
        htmlContent = htmlContent.replace("{{COMPANY_LOGO_BASE64}}", hasLogo ? logoBase64 : "");
        htmlContent = htmlContent.replace("{{HAS_LOGO}}", String.valueOf(hasLogo));
        // Handle conditional logo display (simple find/replace for {{#if HAS_LOGO}} blocks)
        if (hasLogo) {
            htmlContent = htmlContent.replace("{{#if HAS_LOGO}}", "");
            htmlContent = htmlContent.replace("{{else}}", "<!--");
            htmlContent = htmlContent.replace("{{/if}}", "-->");
        } else {
            htmlContent = htmlContent.replace("{{#if HAS_LOGO}}", "<!--");
            htmlContent = htmlContent.replace("{{else}}", "-->");
            htmlContent = htmlContent.replace("{{/if}}", "");
        }

        // Replace quotation placeholders
        htmlContent = htmlContent.replace("{{QUOTATION_NUMBER}}", quotation.getQuotationNumber() != null ? quotation.getQuotationNumber() : "");
        htmlContent = htmlContent.replace("{{CREATED_DATE}}", quotation.getCreatedAt() != null ? formatDate(quotation.getCreatedAt().toLocalDate()) : "");
        htmlContent = htmlContent.replace("{{VALID_UNTIL}}", quotation.getValidUntil() != null ? formatDate(quotation.getValidUntil()) : "");
        htmlContent = htmlContent.replace("{{CUSTOMER_NAME}}", quotation.getCustomerName() != null ? quotation.getCustomerName() : "");
        htmlContent = htmlContent.replace("{{PROJECT_NAME}}", quotation.getProjectName() != null ? quotation.getProjectName() : "");

        // Generate structured pages
        String structuredPages = generateStructuredPages(quotation, userRole);
        htmlContent = htmlContent.replace("{{STRUCTURED_PAGES}}", structuredPages);

        // Keep backward compatibility
        String kitchenSections = generateKitchenSections(quotation, userRole);
        htmlContent = htmlContent.replace("{{KITCHEN_SECTIONS}}", kitchenSections);

        return htmlContent;
    }

    private String getSettingValue(String key, String defaultValue) {
        Optional<SystemSetting> setting = systemSettingRepository.findBySettingKey(key);
        return setting.map(SystemSetting::getSettingValue).orElse(defaultValue);
    }

    private String formatDate(LocalDate date) {
        if (date == null) return "";
        return date.format(DATE_FORMATTER);
    }

    /**
     * Generate quotation header with company information (appears on every page)
     */
    private String generateQuotationHeader() {
        StringBuilder header = new StringBuilder();
        header.append("<div class='quotation-header'>");
        header.append("<div class='header-content'>");

        // Left side: Logo or Company name, tagline
        header.append("<div class='header-left'>");

        // Check if logo exists
        String logoBase64 = getSettingValue("company.logo_base64", "");
        if (logoBase64 != null && !logoBase64.isEmpty()) {
            header.append("<img src='").append(logoBase64).append("' alt='Logo' class='header-logo-img' />");
        } else {
            header.append("<div class='header-company-text'>").append(escapeHtml(getSettingValue("company.name", "THE HOCH"))).append("</div>");
        }
        header.append("<div class='header-tagline'>").append(escapeHtml(getSettingValue("company.tagline", "Modular Interiors & Design Solutions"))).append("</div>");
        header.append("</div>"); // End header-left

        // Right side: Address, Phone, Email
        header.append("<div class='header-right'>");
        String addressLine1 = getSettingValue("company.address_line1", "");
        String addressLine2 = getSettingValue("company.address_line2", "");
        if (!addressLine1.isEmpty()) {
            header.append(escapeHtml(addressLine1));
            if (!addressLine2.isEmpty()) {
                header.append("<br/>").append(escapeHtml(addressLine2));
            }
            header.append("<br/>");
        }
        String phone = getSettingValue("company.phone", "");
        String email = getSettingValue("company.email", "");
        if (!phone.isEmpty() || !email.isEmpty()) {
            if (!phone.isEmpty()) {
                header.append(escapeHtml(phone));
            }
            if (!phone.isEmpty() && !email.isEmpty()) {
                header.append(" | ");
            }
            if (!email.isEmpty()) {
                header.append(escapeHtml(email));
            }
        }
        header.append("</div>"); // End header-right

        header.append("</div>"); // End header-content
        header.append("</div>"); // End quotation-header
        header.append("<div class='header-accent-line'></div>"); // Red accent line

        return header.toString();
    }

    private String generateStructuredPages(QuotationDto quotation, String userRole) {
        StringBuilder pages = new StringBuilder();

        // Page 1: Cover page with company details
        pages.append(generateCoverPage(quotation));

        // Pages 2+: For each kitchen, generate separate pages
        if (quotation.getKitchens() != null && !quotation.getKitchens().isEmpty()) {
            for (QuotationKitchenDto kitchen : quotation.getKitchens()) {
                // Page: Scope of Work
                pages.append(generateScopeOfWorkPage(kitchen));
                // Page: Plan Images
                pages.append(generatePlanImagesPage(kitchen));
                // Page: Products (Cabinets, Doors, Accessories, Lights)
                pages.append(generateProductsPage(kitchen));
                // Page: Kitchen Totals
                pages.append(generateKitchenTotalsPage(kitchen));
            }
        } else {
            // Single kitchen mode - create virtual kitchen pages
            pages.append(generateSingleKitchenStructuredPages(quotation, userRole));
        }

        // Terms & Conditions Page (Last Page)
        pages.append(generateTermsAndConditionsPage(quotation));

        return pages.toString();
    }

    private String generateCoverPage(QuotationDto quotation) {
        StringBuilder page = new StringBuilder();
        page.append("<div class='page cover-page' style='page-break-after: always;'>");
        page.append(generateQuotationHeader());
        page.append("<div class='cover-content'>");
        
        // Welcome Message Section
        page.append("<div class='cover-welcome-message'>");
        page.append("<p>Thank you for choosing ").append(escapeHtml(getSettingValue("company.name", "THE HOCH"))).append(".</p>");
        page.append("<p>We are pleased to present this quotation for your kitchen project.</p>");
        page.append("</div>");
        
        // Combined Details Table
        page.append("<div class='cover-details-section'>");
        page.append("<h2 class='cover-title'>QUOTATION</h2>");
        page.append("<table class='cover-details-table'>");
        page.append("<tbody>");
        
        // Quotation Details
        page.append("<tr style='background: transparent;'>");
        page.append("<td style='text-align: left; background: transparent; font-weight: 600; width: 35%; padding: 10px 12px;'>Quotation No:</td>");
        page.append("<td style='text-align: left; background: transparent; padding: 10px 12px;'>").append(escapeHtml(quotation.getQuotationNumber() != null ? quotation.getQuotationNumber() : "")).append("</td>");
        page.append("</tr>");
        
        page.append("<tr style='background: transparent;'>");
        page.append("<td style='text-align: left; background: transparent; font-weight: 600; padding: 10px 12px;'>Date:</td>");
        page.append("<td style='text-align: left; background: transparent; padding: 10px 12px;'>").append(quotation.getCreatedAt() != null ? formatDate(quotation.getCreatedAt().toLocalDate()) : "").append("</td>");
        page.append("</tr>");
        
        if (quotation.getValidUntil() != null) {
            page.append("<tr style='background: transparent;'>");
            page.append("<td style='text-align: left; background: transparent; font-weight: 600; padding: 10px 12px;'>Valid Until:</td>");
            page.append("<td style='text-align: left; background: transparent; padding: 10px 12px;'>").append(formatDate(quotation.getValidUntil())).append("</td>");
            page.append("</tr>");
        }
        
        // Customer Details
        page.append("<tr style='background: transparent;'>");
        page.append("<td style='text-align: left; background: transparent; font-weight: 600; padding: 10px 12px;'>Customer:</td>");
        page.append("<td style='text-align: left; background: transparent; padding: 10px 12px;'>").append(escapeHtml(quotation.getCustomerName() != null ? quotation.getCustomerName() : "")).append("</td>");
        page.append("</tr>");
        
        if (quotation.getProjectName() != null && !quotation.getProjectName().isEmpty()) {
            page.append("<tr style='background: transparent;'>");
            page.append("<td style='text-align: left; background: transparent; font-weight: 600; padding: 10px 12px;'>Project:</td>");
            page.append("<td style='text-align: left; background: transparent; padding: 10px 12px;'>").append(escapeHtml(quotation.getProjectName())).append("</td>");
            page.append("</tr>");
        }
        
        // Kitchen Counts
        int kitchenCount = (quotation.getKitchens() != null && !quotation.getKitchens().isEmpty()) ? quotation.getKitchens().size() : 1;
        page.append("<tr style='background: transparent;'>");
        page.append("<td style='text-align: left; background: transparent; font-weight: 600; padding: 10px 12px;'>Total Kitchens:</td>");
        page.append("<td style='text-align: left; background: transparent; padding: 10px 12px;'>").append(kitchenCount).append("</td>");
        page.append("</tr>");
        
        // Kitchen List
        if (quotation.getKitchens() != null && !quotation.getKitchens().isEmpty()) {
            for (int i = 0; i < quotation.getKitchens().size(); i++) {
                QuotationKitchenDto kitchen = quotation.getKitchens().get(i);
                page.append("<tr style='background: transparent;'>");
                page.append("<td style='text-align: left; background: transparent; font-weight: 600; padding: 10px 12px;'>Kitchen ").append(i + 1).append(":</td>");
                page.append("<td style='text-align: left; background: transparent; padding: 10px 12px;'>").append(escapeHtml(kitchen.getKitchenName() != null ? kitchen.getKitchenName() : "Kitchen")).append("</td>");
                page.append("</tr>");
            }
        }
        
        page.append("</tbody>");
        page.append("</table>");
        page.append("</div>");
        
        page.append("</div>");
        page.append("</div>");
        return page.toString();
    }


    private String generateScopeOfWorkPage(QuotationKitchenDto kitchen) {
        StringBuilder page = new StringBuilder();
        page.append("<div class='page-break page scope-page'>");
        page.append(generateQuotationHeader());
        page.append("<h2 class='kitchen-page-title'>").append(escapeHtml(kitchen.getKitchenName() != null ? kitchen.getKitchenName() : "Kitchen")).append("</h2>");
        page.append("<h3 class='section-title'>Scope of Work</h3>");
        page.append("<table class='scope-table'>");
        page.append("<thead><tr><th style='width: 40%; text-align: left;'>Field</th><th style='width: 60%; text-align: left;'>Description</th></tr></thead>");
        page.append("<tbody>");
        
        if (kitchen.getScopeDetails() != null && !kitchen.getScopeDetails().isEmpty()) {
            for (QuotationKitchenScopeDetailDto scopeDetail : kitchen.getScopeDetails()) {
                page.append("<tr style='background: transparent;'>");
                page.append("<td style='text-align: left; background: transparent;'>").append(escapeHtml(scopeDetail.getFieldName() != null ? scopeDetail.getFieldName() : "")).append("</td>");
                page.append("<td style='text-align: left; background: transparent;'>").append(escapeHtml(scopeDetail.getFieldValue() != null ? scopeDetail.getFieldValue() : "")).append("</td>");
                page.append("</tr>");
            }
        } else {
            page.append("<tr style='background: transparent;'><td colspan='2' style='text-align: center; background: transparent;'>No scope details available</td></tr>");
        }
        
        page.append("</tbody>");
        page.append("</table>");
        page.append("</div>");
        return page.toString();
    }

    private String generatePlanImagesPage(QuotationKitchenDto kitchen) {
        StringBuilder page = new StringBuilder();
        page.append("<div class='page-break page plan-images-page'>");
        page.append(generateQuotationHeader());
        page.append("<h2 class='kitchen-page-title'>").append(escapeHtml(kitchen.getKitchenName() != null ? kitchen.getKitchenName() : "Kitchen")).append("</h2>");
        page.append("<h3 class='section-title'>Plan Images</h3>");
        
        if (kitchen.getPlanImages() != null && !kitchen.getPlanImages().isEmpty()) {
            page.append("<div class='plan-images-grid'>");
            int imageCount = Math.min(4, kitchen.getPlanImages().size());
            for (int i = 0; i < imageCount; i++) {
                QuotationKitchenPlanImageDto planImage = kitchen.getPlanImages().get(i);
                String base64Image = imageService != null ? imageService.convertImageToBase64WithResize(planImage.getImageUrl()) : null;
                page.append("<div class='plan-image-item'>");
                if (base64Image != null && !base64Image.isEmpty()) {
                    page.append("<img src='data:image/jpeg;base64,").append(base64Image).append("' alt='").append(escapeHtml(planImage.getImageName())).append("' />");
                    page.append("<div class='plan-image-label'>").append(escapeHtml(planImage.getImageName())).append("</div>");
                } else {
                    page.append("<div class='plan-image-placeholder'>").append(escapeHtml(planImage.getImageName())).append("</div>");
                }
                page.append("</div>");
            }
            page.append("</div>");
        } else {
            page.append("<div class='no-content'>No plan images available</div>");
        }
        
        page.append("</div>");
        return page.toString();
    }

    private String generateProductsPage(QuotationKitchenDto kitchen) {
        StringBuilder page = new StringBuilder();
        page.append("<div class='page-break page products-page'>");
        page.append(generateQuotationHeader());
        page.append("<h2 class='kitchen-page-title'>").append(escapeHtml(kitchen.getKitchenName() != null ? kitchen.getKitchenName() : "Kitchen")).append("</h2>");
        page.append("<h3 class='section-title'>Products</h3>");
        
        // Combined Cabinets and Doors Table
        if ((kitchen.getCabinets() != null && !kitchen.getCabinets().isEmpty()) ||
            (kitchen.getDoors() != null && !kitchen.getDoors().isEmpty())) {
            page.append("<h4 class='category-subtitle'>Cabinets & Doors</h4>");
            page.append("<table class='products-table'>");
            page.append("<thead><tr><th style='text-align: left;'>Cabinet</th><th style='text-align: center;'>Qty</th><th style='text-align: center;'>Width (mm)</th><th style='text-align: center;'>Depth (mm)</th><th style='text-align: center;'>Height (mm)</th><th style='text-align: left;'>Door</th><th style='text-align: center;'>Qty</th><th style='text-align: center;'>Width (mm)</th><th style='text-align: center;'>Height (mm)</th></tr></thead>");
            page.append("<tbody>");
            page.append(generateCombinedCabinetsDoorsTable(kitchen.getCabinets(), kitchen.getDoors()));
            page.append("</tbody>");
            page.append("</table>");
        }
        
        // Accessories
        if (kitchen.getAccessories() != null && !kitchen.getAccessories().isEmpty()) {
            page.append("<h4 class='category-subtitle'>Accessories</h4>");
            page.append("<table class='products-table'>");
            page.append("<thead><tr><th style='text-align: left;'>Item / Description</th><th style='text-align: center;'>Qty</th><th style='text-align: left;'>Details</th></tr></thead>");
            page.append("<tbody>");
            page.append(generateAccessoriesTableNoPrices(kitchen.getAccessories()));
            page.append("</tbody>");
            page.append("</table>");
        }
        
        // Lighting
        if (kitchen.getLighting() != null && !kitchen.getLighting().isEmpty()) {
            page.append("<h4 class='category-subtitle'>Lights</h4>");
            page.append("<table class='products-table'>");
            page.append("<thead><tr><th style='text-align: left;'>Item / Description</th><th style='text-align: center;'>Qty</th><th style='text-align: left;'>Details</th></tr></thead>");
            page.append("<tbody>");
            page.append(generateLightingTableNoPrices(kitchen.getLighting()));
            page.append("</tbody>");
            page.append("</table>");
        }
        
        if ((kitchen.getCabinets() == null || kitchen.getCabinets().isEmpty()) &&
            (kitchen.getDoors() == null || kitchen.getDoors().isEmpty()) &&
            (kitchen.getAccessories() == null || kitchen.getAccessories().isEmpty()) &&
            (kitchen.getLighting() == null || kitchen.getLighting().isEmpty())) {
            page.append("<div class='no-content'>No products available</div>");
        }
        
        page.append("</div>");
        return page.toString();
    }

    private String generateKitchenTotalsPage(QuotationKitchenDto kitchen) {
        StringBuilder page = new StringBuilder();
        page.append("<div class='page-break page totals-page'>");
        page.append(generateQuotationHeader());
        page.append("<h2 class='kitchen-page-title'>").append(escapeHtml(kitchen.getKitchenName() != null ? kitchen.getKitchenName() : "Kitchen")).append("</h2>");
        page.append("<h3 class='section-title'>Kitchen Totals</h3>");
        
        page.append("<table class='totals-breakdown-table'>");
        page.append("<tbody>");
        
        // Category totals
        if (kitchen.getCabinetsFinalTotal() != null && kitchen.getCabinetsFinalTotal().compareTo(BigDecimal.ZERO) > 0) {
            page.append("<tr style='background: transparent;'><td style='background: transparent;'>Cabinets Total</td><td class='text-right' style='background: transparent;'>₹").append(formatCurrency(kitchen.getCabinetsFinalTotal())).append("</td></tr>");
        }
        if (kitchen.getDoorsFinalTotal() != null && kitchen.getDoorsFinalTotal().compareTo(BigDecimal.ZERO) > 0) {
            page.append("<tr style='background: transparent;'><td style='background: transparent;'>Doors Total</td><td class='text-right' style='background: transparent;'>₹").append(formatCurrency(kitchen.getDoorsFinalTotal())).append("</td></tr>");
        }
        if (kitchen.getAccessoriesFinalTotal() != null && kitchen.getAccessoriesFinalTotal().compareTo(BigDecimal.ZERO) > 0) {
            page.append("<tr style='background: transparent;'><td style='background: transparent;'>Accessories Total</td><td class='text-right' style='background: transparent;'>₹").append(formatCurrency(kitchen.getAccessoriesFinalTotal())).append("</td></tr>");
        }
        if (kitchen.getLightingFinalTotal() != null && kitchen.getLightingFinalTotal().compareTo(BigDecimal.ZERO) > 0) {
            page.append("<tr style='background: transparent;'><td style='background: transparent;'>Lights Total</td><td class='text-right' style='background: transparent;'>₹").append(formatCurrency(kitchen.getLightingFinalTotal())).append("</td></tr>");
        }
        
        page.append("<tr class='subtotal-row' style='background: transparent;'><td style='background: transparent;'><strong>Subtotal</strong></td><td class='text-right' style='background: transparent;'><strong>₹").append(formatCurrency(kitchen.getSubtotal())).append("</strong></td></tr>");
        
        // Transportation and installation are at quotation level, not per kitchen
        if (kitchen.getMarginAmount() != null && kitchen.getMarginAmount().compareTo(BigDecimal.ZERO) > 0) {
            page.append("<tr style='background: transparent;'><td style='background: transparent;'>Margin</td><td class='text-right' style='background: transparent;'>₹").append(formatCurrency(kitchen.getMarginAmount())).append("</td></tr>");
        }
        if (kitchen.getTaxAmount() != null && kitchen.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
            page.append("<tr style='background: transparent;'><td style='background: transparent;'>Tax</td><td class='text-right' style='background: transparent;'>₹").append(formatCurrency(kitchen.getTaxAmount())).append("</td></tr>");
        }
        
        page.append("<tr class='grand-total-row' style='background: transparent;'><td style='background: transparent;'><strong>Kitchen Total</strong></td><td class='text-right' style='background: transparent;'><strong>₹").append(formatCurrency(kitchen.getTotalAmount())).append("</strong></td></tr>");
        page.append("</tbody>");
        page.append("</table>");
        page.append("</div>");
        return page.toString();
    }

    private String generateTermsAndConditionsPage(QuotationDto quotation) {
        StringBuilder page = new StringBuilder();
        page.append("<div class='page-break page terms-page'>");
        page.append(generateQuotationHeader());
        page.append("<h2 class='page-title'>Terms & Conditions</h2>");
        
        page.append("<div class='terms-content'>");
        
        // General Terms Section
        String generalTerms = getSettingValue("quotation.terms.general", 
            "The Above-mentioned Terms are Subjected to Change depending upon the delay from Client side to provide necessary Inputs/Approvals\n" +
            "Kitchen Delivery and Installation will not proceed unless site condition requirements outlined in our Terms and Conditions.\n" +
            "Unloading Expenses of the materials at the sight to bear by the customer\n" +
            "Our scope is limited to the installation of the specified items only. There will be additional charges for installing any items not included in this offer.\n" +
            "The client must provide all plumbing and electrical items, including faucets, as part of their scope. All plumbing outlets and electrical points should be installed according to our site drawing\n" +
            "The client should provide safe storage spaces for materials during installation at the site.");
        
        page.append("<div class='terms-section'>");
        page.append("<h3 class='terms-section-title'>General Terms</h3>");
        page.append("<ul class='terms-list'>");
        String[] generalTermsLines = generalTerms.split("\n");
        for (String line : generalTermsLines) {
            String trimmedLine = line.trim();
            if (!trimmedLine.isEmpty()) {
                page.append("<li>").append(escapeHtml(trimmedLine)).append("</li>");
            }
        }
        page.append("</ul>");
        page.append("</div>");
        
        // Warranty & Service Section
        String warrantyTerms = getSettingValue("quotation.terms.warranty",
            "We Warrant the Furniture We Sell to Be Free from Defects in Material and Workmanship Under Normal Residential Usage to The Original Purchaser for The Period Specified Below. We Will Repair Any Part That Proves to Be Defective in Materials and Workmanship. If Repair Is Not Possible, We Will Either Replace the Part with A New Part or A Component of Similar Composition and Price.\n\n" +
            "This Warranty Does Not Apply to Any Issues with Our Furniture or Parts of Our Furniture That Result from Improper Handling, Negligence, Alterations, Accidents, Misuse, Improper Cleaning or Care, Or Natural Calamities. Additionally, Consequential and Incidental Damages Are Not Covered Under This Warranty.\n\n" +
            "Stainless Steel Cabinets Have 20 Years of Warranty Against Any Manufacturing Defect\n" +
            "Any Other Doors Have 8 Years of Warranty Against Any Manufacturing Defect\n" +
            "Hardware & Accessories: As Provided by The Manufacturer\n" +
            "Lightings: As Provided by The Manufacturer");
        
        page.append("<div class='terms-section'>");
        page.append("<h3 class='terms-section-title'>Warranty & Service</h3>");
        
        String[] warrantyLines = warrantyTerms.split("\n");
        boolean inList = false;
        for (String line : warrantyLines) {
            String trimmedLine = line.trim();
            if (trimmedLine.isEmpty()) {
                if (inList) {
                    page.append("</ul>");
                    inList = false;
                }
                continue;
            }
            
            // Check if this line looks like a list item (starts with capital letter and is relatively short, or contains colon)
            boolean isListItem = trimmedLine.length() < 150 || trimmedLine.contains(":");
            
            if (isListItem && !inList) {
                // Start a new list
                page.append("<ul class='terms-list'>");
                inList = true;
                page.append("<li>").append(escapeHtml(trimmedLine)).append("</li>");
            } else if (isListItem && inList) {
                // Continue list
                page.append("<li>").append(escapeHtml(trimmedLine)).append("</li>");
            } else {
                // This is a paragraph
                if (inList) {
                    page.append("</ul>");
                    inList = false;
                }
                page.append("<p class='terms-paragraph'>").append(escapeHtml(trimmedLine)).append("</p>");
            }
        }
        if (inList) {
            page.append("</ul>");
        }
        
        page.append("</div>");
        page.append("</div>");
        
        // Signature Section
        page.append("<div class='signature-section'>");
        page.append("<div class='signature-box'>");
        page.append("<div class='signature-item'>");
        page.append("<div class='signature-label'>Client Signature</div>");
        page.append("<div class='signature-line'></div>");
        page.append("<div class='signature-name'>").append(escapeHtml(quotation.getCustomerName() != null ? quotation.getCustomerName() : "")).append("</div>");
        page.append("<div class='signature-date'>Date: _________________</div>");
        page.append("</div>");
        
        page.append("<div class='signature-item'>");
        page.append("<div class='signature-label'>Designer Signature</div>");
        page.append("<div class='signature-line'></div>");
        page.append("<div class='signature-name'>").append(escapeHtml(getSettingValue("company.name", "THE HOCH"))).append("</div>");
        page.append("<div class='signature-date'>Date: _________________</div>");
        page.append("</div>");
        page.append("</div>");
        page.append("</div>");
        
        page.append("</div>");
        return page.toString();
    }

    private String generateSingleKitchenStructuredPages(QuotationDto quotation, String userRole) {
        StringBuilder pages = new StringBuilder();
        
        // Create a virtual kitchen DTO for single kitchen mode
        String kitchenName = quotation.getProjectName() != null ? quotation.getProjectName() : "Kitchen";
        
        // Scope of Work page
        pages.append("<div class='page-break page scope-page'>");
        pages.append(generateQuotationHeader());
        pages.append("<h2 class='kitchen-page-title'>").append(escapeHtml(kitchenName)).append("</h2>");
        pages.append("<h3 class='section-title'>Scope of Work</h3>");
        pages.append("<table class='scope-table'>");
        pages.append("<thead><tr><th style='width: 40%; text-align: left;'>Field</th><th style='width: 60%; text-align: left;'>Description</th></tr></thead>");
        pages.append("<tbody>");
        pages.append("<tr style='background: transparent;'><td style='text-align: left; background: transparent;'>Project Name</td><td style='text-align: left; background: transparent;'>").append(escapeHtml(quotation.getProjectName() != null ? quotation.getProjectName() : "")).append("</td></tr>");
        pages.append("<tr style='background: transparent;'><td style='text-align: left; background: transparent;'>Customer</td><td style='text-align: left; background: transparent;'>").append(escapeHtml(quotation.getCustomerName())).append("</td></tr>");
        pages.append("</tbody>");
        pages.append("</table>");
        pages.append("</div>");
        
        // Plan Images page
        pages.append("<div class='page-break page plan-images-page'>");
        pages.append(generateQuotationHeader());
        pages.append("<h2 class='kitchen-page-title'>").append(escapeHtml(kitchenName)).append("</h2>");
        pages.append("<h3 class='section-title'>Plan Images</h3>");
        
        // Try to get plan images from quotation's kitchens first
        List<QuotationKitchenPlanImageDto> quotationPlanImageDtos = null;
        List<QuotationKitchenPlanImage> quotationPlanImageEntities = null;
        boolean useDtos = false;
        
        // First check if kitchens are already loaded in the DTO
        if (quotation.getKitchens() != null && !quotation.getKitchens().isEmpty()) {
            QuotationKitchenDto firstKitchen = quotation.getKitchens().get(0);
            if (firstKitchen.getPlanImages() != null && !firstKitchen.getPlanImages().isEmpty()) {
                quotationPlanImageDtos = firstKitchen.getPlanImages();
                useDtos = true;
            }
        }
        
        // If not found in DTO, query database for kitchens and their plan images
        if (!useDtos && quotation.getId() != null) {
            List<QuotationKitchen> kitchens = kitchenRepository.findByQuotationIdOrderByKitchenOrderAsc(quotation.getId());
            if (kitchens != null && !kitchens.isEmpty()) {
                QuotationKitchen firstKitchen = kitchens.get(0);
                quotationPlanImageEntities = kitchenPlanImageRepository.findByKitchenIdOrderByImageOrderAsc(firstKitchen.getId());
            }
        }
        
        // Display plan images if found
        if (useDtos && quotationPlanImageDtos != null && !quotationPlanImageDtos.isEmpty()) {
            pages.append("<div class='plan-images-grid'>");
            int imageCount = Math.min(4, quotationPlanImageDtos.size());
            for (int i = 0; i < imageCount; i++) {
                QuotationKitchenPlanImageDto planImage = quotationPlanImageDtos.get(i);
                String base64Image = imageService != null ? imageService.convertImageToBase64WithResize(planImage.getImageUrl()) : null;
                pages.append("<div class='plan-image-item'>");
                if (base64Image != null && !base64Image.isEmpty()) {
                    pages.append("<img src='data:image/jpeg;base64,").append(base64Image).append("' alt='").append(escapeHtml(planImage.getImageName())).append("' />");
                    pages.append("<div class='plan-image-label'>").append(escapeHtml(planImage.getImageName())).append("</div>");
                } else {
                    pages.append("<div class='plan-image-placeholder'>").append(escapeHtml(planImage.getImageName())).append("</div>");
                }
                pages.append("</div>");
            }
            pages.append("</div>");
        } else if (quotationPlanImageEntities != null && !quotationPlanImageEntities.isEmpty()) {
            pages.append("<div class='plan-images-grid'>");
            int imageCount = Math.min(4, quotationPlanImageEntities.size());
            for (int i = 0; i < imageCount; i++) {
                QuotationKitchenPlanImage planImage = quotationPlanImageEntities.get(i);
                String base64Image = imageService != null ? imageService.convertImageToBase64WithResize(planImage.getImageUrl()) : null;
                pages.append("<div class='plan-image-item'>");
                if (base64Image != null && !base64Image.isEmpty()) {
                    pages.append("<img src='data:image/jpeg;base64,").append(base64Image).append("' alt='").append(escapeHtml(planImage.getImageName())).append("' />");
                    pages.append("<div class='plan-image-label'>").append(escapeHtml(planImage.getImageName())).append("</div>");
                } else {
                    pages.append("<div class='plan-image-placeholder'>").append(escapeHtml(planImage.getImageName())).append("</div>");
                }
                pages.append("</div>");
            }
            pages.append("</div>");
        } else {
            // Fallback: show all customer plan images only if no quotation-specific images exist
            if (quotation.getCustomerId() != null) {
                List<CustomerPlanImage> allCustomerPlanImages = planImageRepository.findByCustomerId(quotation.getCustomerId());
                if (allCustomerPlanImages != null && !allCustomerPlanImages.isEmpty()) {
                    pages.append("<div class='plan-images-grid'>");
                    int imageCount = Math.min(4, allCustomerPlanImages.size());
                    for (int i = 0; i < imageCount; i++) {
                        CustomerPlanImage planImage = allCustomerPlanImages.get(i);
                        String base64Image = imageService != null ? imageService.convertImageToBase64WithResize(planImage.getImageUrl()) : null;
                        pages.append("<div class='plan-image-item'>");
                        if (base64Image != null && !base64Image.isEmpty()) {
                            pages.append("<img src='data:image/jpeg;base64,").append(base64Image).append("' alt='").append(escapeHtml(planImage.getImageName())).append("' />");
                            pages.append("<div class='plan-image-label'>").append(escapeHtml(planImage.getImageName())).append("</div>");
                        } else {
                            pages.append("<div class='plan-image-placeholder'>").append(escapeHtml(planImage.getImageName())).append("</div>");
                        }
                        pages.append("</div>");
                    }
                    pages.append("</div>");
                } else {
                    pages.append("<div class='no-content'>No plan images available</div>");
                }
            } else {
                pages.append("<div class='no-content'>No plan images available</div>");
            }
        }
        pages.append("</div>");
        
        // Products page
        pages.append("<div class='page-break page products-page'>");
        pages.append(generateQuotationHeader());
        pages.append("<h2 class='kitchen-page-title'>").append(escapeHtml(kitchenName)).append("</h2>");
        pages.append("<h3 class='section-title'>Products</h3>");
        
        // Combined Cabinets and Doors Table
        if ((quotation.getCabinets() != null && !quotation.getCabinets().isEmpty()) ||
            (quotation.getDoors() != null && !quotation.getDoors().isEmpty())) {
            pages.append("<h4 class='category-subtitle'>Cabinets & Doors</h4>");
            pages.append("<table class='products-table'>");
            pages.append("<thead><tr><th style='text-align: left;'>Cabinet</th><th style='text-align: center;'>Qty</th><th style='text-align: center;'>Width (mm)</th><th style='text-align: center;'>Depth (mm)</th><th style='text-align: center;'>Height (mm)</th><th style='text-align: left;'>Door</th><th style='text-align: center;'>Qty</th><th style='text-align: center;'>Width (mm)</th><th style='text-align: center;'>Height (mm)</th></tr></thead>");
            pages.append("<tbody>");
            pages.append(generateCombinedCabinetsDoorsTable(quotation.getCabinets(), quotation.getDoors()));
            pages.append("</tbody>");
            pages.append("</table>");
        }
        
        // Accessories
        if (quotation.getAccessories() != null && !quotation.getAccessories().isEmpty()) {
            pages.append("<h4 class='category-subtitle'>Accessories</h4>");
            pages.append("<table class='products-table'>");
            pages.append("<thead><tr><th style='text-align: left;'>Item / Description</th><th style='text-align: center;'>Qty</th><th style='text-align: left;'>Details</th></tr></thead>");
            pages.append("<tbody>");
            pages.append(generateAccessoriesTableNoPrices(quotation.getAccessories()));
            pages.append("</tbody>");
            pages.append("</table>");
        }
        
        // Lighting
        if (quotation.getLighting() != null && !quotation.getLighting().isEmpty()) {
            pages.append("<h4 class='category-subtitle'>Lights</h4>");
            pages.append("<table class='products-table'>");
            pages.append("<thead><tr><th style='text-align: left;'>Item / Description</th><th style='text-align: center;'>Qty</th><th style='text-align: left;'>Details</th></tr></thead>");
            pages.append("<tbody>");
            pages.append(generateLightingTableNoPrices(quotation.getLighting()));
            pages.append("</tbody>");
            pages.append("</table>");
        }
        
        if ((quotation.getCabinets() == null || quotation.getCabinets().isEmpty()) &&
            (quotation.getDoors() == null || quotation.getDoors().isEmpty()) &&
            (quotation.getAccessories() == null || quotation.getAccessories().isEmpty()) &&
            (quotation.getLighting() == null || quotation.getLighting().isEmpty())) {
            pages.append("<div class='no-content'>No products available</div>");
        }
        pages.append("</div>");
        
        // Totals page
        pages.append("<div class='page-break page totals-page'>");
        pages.append(generateQuotationHeader());
        pages.append("<h2 class='kitchen-page-title'>").append(escapeHtml(kitchenName)).append("</h2>");
        pages.append("<h3 class='section-title'>Kitchen Totals</h3>");
        pages.append("<table class='totals-breakdown-table'>");
        pages.append("<tbody>");
        pages.append("<tr class='subtotal-row' style='background: transparent;'><td style='background: transparent;'><strong>Subtotal</strong></td><td class='text-right' style='background: transparent;'><strong>₹").append(formatCurrency(quotation.getSubtotal())).append("</strong></td></tr>");
        if (quotation.getTransportationPrice() != null && quotation.getTransportationPrice().compareTo(BigDecimal.ZERO) > 0) {
            pages.append("<tr style='background: transparent;'><td style='background: transparent;'>Transportation</td><td class='text-right' style='background: transparent;'>₹").append(formatCurrency(quotation.getTransportationPrice())).append("</td></tr>");
        }
        if (quotation.getInstallationPrice() != null && quotation.getInstallationPrice().compareTo(BigDecimal.ZERO) > 0) {
            pages.append("<tr style='background: transparent;'><td style='background: transparent;'>Installation</td><td class='text-right' style='background: transparent;'>₹").append(formatCurrency(quotation.getInstallationPrice())).append("</td></tr>");
        }
        if (quotation.getTaxAmount() != null && quotation.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
            pages.append("<tr style='background: transparent;'><td style='background: transparent;'>Tax</td><td class='text-right' style='background: transparent;'>₹").append(formatCurrency(quotation.getTaxAmount())).append("</td></tr>");
        }
        pages.append("<tr class='grand-total-row' style='background: transparent;'><td style='background: transparent;'><strong>Kitchen Total</strong></td><td class='text-right' style='background: transparent;'><strong>₹").append(formatCurrency(quotation.getTotalAmount())).append("</strong></td></tr>");
        pages.append("</tbody>");
        pages.append("</table>");
        pages.append("</div>");
        
        return pages.toString();
    }

    private String generateKitchenSections(QuotationDto quotation, String userRole) {
        StringBuilder sections = new StringBuilder();

        System.out.println("=== Generating kitchen sections ===");
        System.out.println("Quotation ID: " + quotation.getId());
        System.out.println("Kitchens count: " + (quotation.getKitchens() != null ? quotation.getKitchens().size() : "null"));

        if (quotation.getKitchens() != null && !quotation.getKitchens().isEmpty()) {
            // Multi-kitchen mode
            System.out.println("Using MULTI-KITCHEN mode");
            int index = 0;
            for (QuotationKitchenDto kitchen : quotation.getKitchens()) {
                System.out.println("Processing kitchen " + (index + 1) + ": " + kitchen.getKitchenName() + " (ID: " + kitchen.getId() + ")");
                sections.append(generateKitchenSection(kitchen, userRole, index == 0));
                index++;
            }
        } else {
            // Single kitchen mode - create virtual kitchen
            System.out.println("Using SINGLE-KITCHEN mode");
            sections.append(generateSingleKitchenSection(quotation, userRole));
        }

        System.out.println("=== Finished generating kitchen sections ===");
        return sections.toString();
    }

    private String generateSingleKitchenSection(QuotationDto quotation, String userRole) {
        StringBuilder section = new StringBuilder();

        System.out.println("=== Generating SINGLE kitchen section ===");
        System.out.println("Quotation ID: " + quotation.getId());
        System.out.println("Accessories count: " + (quotation.getAccessories() != null ? quotation.getAccessories().size() : "null"));
        System.out.println("Cabinets count: " + (quotation.getCabinets() != null ? quotation.getCabinets().size() : "null"));
        System.out.println("Doors count: " + (quotation.getDoors() != null ? quotation.getDoors().size() : "null"));
        System.out.println("Lighting count: " + (quotation.getLighting() != null ? quotation.getLighting().size() : "null"));

        section.append("<div class='kitchen-section'>");

        // Kitchen name header
        String kitchenName = quotation.getProjectName() != null ? quotation.getProjectName() : "Kitchen";
        section.append("<h2 class='kitchen-header'>").append(escapeHtml(kitchenName)).append("</h2>");

        // Scope of work table
        section.append("<h3 class='category-title'>Scope of Work</h3>");
        section.append("<table>");
        section.append("<tr><th style='width: 40%'>Field</th><th style='width: 60%'>Description</th></tr>");
        section.append("<tr><td>Project Name</td><td>").append(escapeHtml(quotation.getProjectName() != null ? quotation.getProjectName() : "")).append("</td></tr>");
        section.append("<tr><td>Customer</td><td>").append(escapeHtml(quotation.getCustomerName())).append("</td></tr>");
        section.append("</table>");

        // Plan images
        if (quotation.getCustomerId() != null) {
            List<CustomerPlanImage> planImages = planImageRepository.findByCustomerId(quotation.getCustomerId());
            if (planImages != null && !planImages.isEmpty()) {
                section.append("<h3 class='category-title'>Plan Images</h3>");
                section.append("<div class='plan-images-grid'>");

                int imageCount = Math.min(4, planImages.size());
                for (int i = 0; i < imageCount; i++) {
                    CustomerPlanImage planImage = planImages.get(i);
                    String base64Image = imageService != null ? imageService.convertImageToBase64WithResize(planImage.getImageUrl()) : null;
                    section.append("<div class='plan-image-item'>");
                    if (base64Image != null && !base64Image.isEmpty()) {
                        section.append("<img src='data:image/jpeg;base64,").append(base64Image).append("' alt='").append(escapeHtml(planImage.getImageName())).append("' style='max-width: 100%; height: auto;' />");
                    } else {
                        section.append("<p style='color: #999;'>").append(escapeHtml(planImage.getImageName())).append("</p>");
                    }
                    section.append("</div>");
                }
                section.append("</div>");
            }
        }

        // Category tables
        if (quotation.getAccessories() != null && !quotation.getAccessories().isEmpty()) {
            System.out.println("Generating Accessories table with " + quotation.getAccessories().size() + " items");
            section.append(generateCategorySection("Accessories", generateAccessoriesTable(quotation.getAccessories())));
        } else {
            System.out.println("Accessories list is null or empty - skipping");
        }

        if (quotation.getCabinets() != null && !quotation.getCabinets().isEmpty()) {
            System.out.println("Generating Cabinets table with " + quotation.getCabinets().size() + " items");
            section.append(generateCategorySection("Cabinets", generateCabinetsTable(quotation.getCabinets())));
        } else {
            System.out.println("Cabinets list is null or empty - skipping");
        }

        if (quotation.getDoors() != null && !quotation.getDoors().isEmpty()) {
            System.out.println("Generating Doors table with " + quotation.getDoors().size() + " items");
            section.append(generateCategorySection("Doors", generateDoorsTable(quotation.getDoors())));
        } else {
            System.out.println("Doors list is null or empty - skipping");
        }

        if (quotation.getLighting() != null && !quotation.getLighting().isEmpty()) {
            System.out.println("Generating Lighting table with " + quotation.getLighting().size() + " items");
            section.append(generateCategorySection("Lighting", generateLightingTable(quotation.getLighting())));
        } else {
            System.out.println("Lighting list is null or empty - skipping");
        }

        // Kitchen totals
        section.append("<h3 class='category-title'>Kitchen Totals</h3>");
        section.append("<table>");
        section.append("<tr><td class='text-right'><strong>Subtotal:</strong></td><td class='text-right'>₹").append(formatCurrency(quotation.getSubtotal())).append("</td></tr>");
        section.append("<tr style='background: #F39C12; color: #fff;'><td class='text-right'><strong>Kitchen Total:</strong></td><td class='text-right'><strong>₹").append(formatCurrency(quotation.getTotalAmount())).append("</strong></td></tr>");
        section.append("</table>");

        section.append("</div>");

        return section.toString();
    }

    private String generateCategorySection(String categoryName, String tableContent) {
        System.out.println("Generating category section: " + categoryName);
        System.out.println("Table content length: " + (tableContent != null ? tableContent.length() : "null"));
        
        StringBuilder section = new StringBuilder();
        section.append("<h3 class='category-title'>").append(categoryName).append("</h3>");
        section.append("<table>");
        section.append("<tr><th>Item / Description</th><th>Qty</th><th>Details</th><th class='text-right'>Unit Price</th><th class='text-right'>Total</th></tr>");
        section.append(tableContent != null ? tableContent : "");
        section.append("</table>");
        
        String result = section.toString();
        System.out.println("Category section generated, length: " + result.length());
        return result;
    }

    private String generateCombinedCabinetsDoorsTable(List<QuotationCabinetDto> cabinets, List<QuotationDoorDto> doors) {
        StringBuilder table = new StringBuilder();
        
        // Create lists for matching
        List<QuotationCabinetDto> cabinetList = cabinets != null ? new ArrayList<>(cabinets) : new ArrayList<>();
        List<QuotationDoorDto> doorList = doors != null ? new ArrayList<>(doors) : new ArrayList<>();
        
        // Process cabinets and match with doors
        for (QuotationCabinetDto cabinet : cabinetList) {
            String cabinetType = cabinet.getCabinetTypeName() != null ? cabinet.getCabinetTypeName() : "Cabinet";
            
            // Try to find matching door by dimensions
            QuotationDoorDto matchedDoor = null;
            int matchedDoorIndex = -1;
            if (cabinet.getWidthMm() != null && cabinet.getHeightMm() != null) {
                for (int i = 0; i < doorList.size(); i++) {
                    QuotationDoorDto door = doorList.get(i);
                    if (door.getWidthMm() != null && door.getHeightMm() != null &&
                        door.getWidthMm().equals(cabinet.getWidthMm()) &&
                        door.getHeightMm().equals(cabinet.getHeightMm())) {
                        matchedDoor = door;
                        matchedDoorIndex = i;
                        break;
                    }
                }
            }
            
            table.append("<tr style='background: transparent;'>");
            // Cabinet columns
            table.append("<td style='text-align: left; background: transparent;'>").append(escapeHtml(cabinetType)).append("</td>");
            table.append("<td style='text-align: center; background: transparent;'>").append(cabinet.getQuantity() != null ? cabinet.getQuantity() : 0).append("</td>");
            table.append("<td style='text-align: center; background: transparent;'>").append(cabinet.getWidthMm() != null ? cabinet.getWidthMm().toString() : "-").append("</td>");
            table.append("<td style='text-align: center; background: transparent;'>").append(cabinet.getDepthMm() != null ? cabinet.getDepthMm().toString() : "-").append("</td>");
            table.append("<td style='text-align: center; background: transparent;'>").append(cabinet.getHeightMm() != null ? cabinet.getHeightMm().toString() : "-").append("</td>");
            
            // Door columns
            if (matchedDoor != null) {
                String doorType = matchedDoor.getDoorTypeName() != null ? matchedDoor.getDoorTypeName() : "Door";
                table.append("<td style='text-align: left; background: transparent;'>").append(escapeHtml(doorType)).append("</td>");
                table.append("<td style='text-align: center; background: transparent;'>").append(matchedDoor.getQuantity() != null ? matchedDoor.getQuantity() : 0).append("</td>");
                table.append("<td style='text-align: center; background: transparent;'>").append(matchedDoor.getWidthMm() != null ? matchedDoor.getWidthMm().toString() : "-").append("</td>");
                table.append("<td style='text-align: center; background: transparent;'>").append(matchedDoor.getHeightMm() != null ? matchedDoor.getHeightMm().toString() : "-").append("</td>");
                doorList.remove(matchedDoorIndex); // Remove matched door from list
            } else {
                table.append("<td style='text-align: left; background: transparent;'>-</td>");
                table.append("<td style='text-align: center; background: transparent;'>-</td>");
                table.append("<td style='text-align: center; background: transparent;'>-</td>");
                table.append("<td style='text-align: center; background: transparent;'>-</td>");
            }
            table.append("</tr>");
        }
        
        // Add any remaining unmatched doors
        for (QuotationDoorDto door : doorList) {
            String doorType = door.getDoorTypeName() != null ? door.getDoorTypeName() : "Door";
            
            table.append("<tr style='background: transparent;'>");
            // Cabinet columns (empty for unmatched doors)
            table.append("<td style='text-align: left; background: transparent;'>-</td>");
            table.append("<td style='text-align: center; background: transparent;'>-</td>");
            table.append("<td style='text-align: center; background: transparent;'>-</td>");
            table.append("<td style='text-align: center; background: transparent;'>-</td>");
            table.append("<td style='text-align: center; background: transparent;'>-</td>");
            // Door columns
            table.append("<td style='text-align: left; background: transparent;'>").append(escapeHtml(doorType)).append("</td>");
            table.append("<td style='text-align: center; background: transparent;'>").append(door.getQuantity() != null ? door.getQuantity() : 0).append("</td>");
            table.append("<td style='text-align: center; background: transparent;'>").append(door.getWidthMm() != null ? door.getWidthMm().toString() : "-").append("</td>");
            table.append("<td style='text-align: center; background: transparent;'>").append(door.getHeightMm() != null ? door.getHeightMm().toString() : "-").append("</td>");
            table.append("</tr>");
        }
        
        return table.toString();
    }

    private String generateAccessoriesTableNoPrices(List<QuotationAccessoryDto> accessories) {
        StringBuilder table = new StringBuilder();
        for (QuotationAccessoryDto accessory : accessories) {
            String itemName = (accessory.getCustomItem() != null && accessory.getCustomItem() && accessory.getCustomItemName() != null) ?
                accessory.getCustomItemName() : (accessory.getAccessoryName() != null ? accessory.getAccessoryName() : "Accessory");
            table.append("<tr style='background: transparent;'>");
            table.append("<td style='text-align: left; background: transparent;'>").append(escapeHtml(itemName)).append("</td>");
            table.append("<td style='text-align: center; background: transparent;'>").append(accessory.getQuantity() != null ? accessory.getQuantity() : 0).append("</td>");
            table.append("<td style='text-align: left; background: transparent;'>").append(escapeHtml(accessory.getDescription() != null ? accessory.getDescription() : "")).append("</td>");
            table.append("</tr>");
        }
        return table.toString();
    }

    private String generateLightingTableNoPrices(List<QuotationLightingDto> lighting) {
        StringBuilder table = new StringBuilder();
        for (QuotationLightingDto light : lighting) {
            String itemName = light.getItemName() != null ? light.getItemName() : "Lighting Item";
            table.append("<tr style='background: transparent;'>");
            table.append("<td style='text-align: left; background: transparent;'>").append(escapeHtml(itemName)).append("</td>");
            table.append("<td style='text-align: center; background: transparent;'>").append(light.getQuantity() != null ? light.getQuantity() : 0).append("</td>");
            table.append("<td style='text-align: left; background: transparent;'>").append(escapeHtml(light.getSpecifications() != null ? light.getSpecifications() : "")).append("</td>");
            table.append("</tr>");
        }
        return table.toString();
    }

    private String generateAccessoriesTable(List<QuotationAccessoryDto> accessories) {
        StringBuilder table = new StringBuilder();
        for (QuotationAccessoryDto accessory : accessories) {
            String itemName = (accessory.getCustomItem() != null && accessory.getCustomItem() && accessory.getCustomItemName() != null) ?
                accessory.getCustomItemName() : (accessory.getAccessoryName() != null ? accessory.getAccessoryName() : "Accessory");
            table.append("<tr>");
            table.append("<td>").append(escapeHtml(itemName)).append("</td>");
            table.append("<td>").append(accessory.getQuantity()).append("</td>");
            table.append("<td>").append(escapeHtml(accessory.getDescription() != null ? accessory.getDescription() : "")).append("</td>");
            table.append("<td class='text-right'>₹").append(formatCurrency(accessory.getUnitPrice())).append("</td>");
            table.append("<td class='text-right'>₹").append(formatCurrency(accessory.getTotalPrice())).append("</td>");
            table.append("</tr>");
        }
        return table.toString();
    }

    private String generateCabinetsTable(List<QuotationCabinetDto> cabinets) {
        StringBuilder table = new StringBuilder();
        for (QuotationCabinetDto cabinet : cabinets) {
            String cabinetType = cabinet.getCabinetTypeName() != null ? cabinet.getCabinetTypeName() : "Cabinet";
            String dimensions = (cabinet.getWidthMm() != null && cabinet.getHeightMm() != null) ?
                cabinet.getWidthMm() + "×" + cabinet.getHeightMm() + "mm" : "";
            table.append("<tr>");
            table.append("<td>").append(escapeHtml(cabinetType)).append("</td>");
            table.append("<td>").append(cabinet.getQuantity()).append("</td>");
            table.append("<td>").append(escapeHtml(dimensions)).append("</td>");
            table.append("<td class='text-right'>₹").append(formatCurrency(cabinet.getUnitPrice())).append("</td>");
            table.append("<td class='text-right'>₹").append(formatCurrency(cabinet.getTotalPrice())).append("</td>");
            table.append("</tr>");
        }
        return table.toString();
    }

    private String generateDoorsTable(List<QuotationDoorDto> doors) {
        StringBuilder table = new StringBuilder();
        for (QuotationDoorDto door : doors) {
            String doorType = door.getDoorTypeName() != null ? door.getDoorTypeName() : "Door";
            String dimensions = (door.getWidthMm() != null && door.getHeightMm() != null) ?
                door.getWidthMm() + "×" + door.getHeightMm() + "mm" : "";
            table.append("<tr>");
            table.append("<td>").append(escapeHtml(doorType)).append("</td>");
            table.append("<td>").append(door.getQuantity()).append("</td>");
            table.append("<td>").append(escapeHtml(dimensions)).append("</td>");
            table.append("<td class='text-right'>₹").append(formatCurrency(door.getUnitPrice())).append("</td>");
            table.append("<td class='text-right'>₹").append(formatCurrency(door.getTotalPrice())).append("</td>");
            table.append("</tr>");
        }
        return table.toString();
    }

    private String generateLightingTable(List<QuotationLightingDto> lighting) {
        StringBuilder table = new StringBuilder();
        for (QuotationLightingDto light : lighting) {
            String itemName = light.getItemName() != null ? light.getItemName() : "Lighting Item";
            table.append("<tr>");
            table.append("<td>").append(escapeHtml(itemName)).append("</td>");
            table.append("<td>").append(light.getQuantity()).append("</td>");
            table.append("<td>").append(escapeHtml(light.getSpecifications() != null ? light.getSpecifications() : "")).append("</td>");
            table.append("<td class='text-right'>₹").append(formatCurrency(light.getUnitPrice())).append("</td>");
            table.append("<td class='text-right'>₹").append(formatCurrency(light.getTotalPrice())).append("</td>");
            table.append("</tr>");
        }
        return table.toString();
    }

    private String generateKitchenSection(QuotationKitchenDto kitchen, String userRole, boolean isFirst) {
        StringBuilder section = new StringBuilder();

        // Debug logging
        System.out.println("=== Generating PDF section for kitchen: " + kitchen.getKitchenName() + " (ID: " + kitchen.getId() + ") ===");
        System.out.println("Accessories count: " + (kitchen.getAccessories() != null ? kitchen.getAccessories().size() : "null"));
        System.out.println("Cabinets count: " + (kitchen.getCabinets() != null ? kitchen.getCabinets().size() : "null"));
        System.out.println("Doors count: " + (kitchen.getDoors() != null ? kitchen.getDoors().size() : "null"));
        System.out.println("Lighting count: " + (kitchen.getLighting() != null ? kitchen.getLighting().size() : "null"));

        section.append("<div class='kitchen-section'>");

        // Kitchen name header
        String kitchenName = kitchen.getKitchenName() != null ? kitchen.getKitchenName() : "Kitchen";
        section.append("<h2 class='kitchen-header'>").append(escapeHtml(kitchenName)).append("</h2>");

        // Scope of work table
        section.append("<h3 class='category-title'>Scope of Work</h3>");
        section.append("<table>");
        section.append("<tr><th style='width: 40%'>Field</th><th style='width: 60%'>Description</th></tr>");
        
        if (kitchen.getScopeDetails() != null && !kitchen.getScopeDetails().isEmpty()) {
            for (QuotationKitchenScopeDetailDto scopeDetail : kitchen.getScopeDetails()) {
                section.append("<tr>");
                section.append("<td>").append(escapeHtml(scopeDetail.getFieldName() != null ? scopeDetail.getFieldName() : "")).append("</td>");
                section.append("<td>").append(escapeHtml(scopeDetail.getFieldValue() != null ? scopeDetail.getFieldValue() : "")).append("</td>");
                section.append("</tr>");
            }
        }
        section.append("</table>");

        // Plan images
        if (kitchen.getPlanImages() != null && !kitchen.getPlanImages().isEmpty()) {
            section.append("<h3 class='category-title'>Plan Images</h3>");
            section.append("<div class='plan-images-grid'>");

            int imageCount = Math.min(4, kitchen.getPlanImages().size());
            for (int i = 0; i < imageCount; i++) {
                QuotationKitchenPlanImageDto planImage = kitchen.getPlanImages().get(i);
                String base64Image = imageService != null ? imageService.convertImageToBase64WithResize(planImage.getImageUrl()) : null;
                section.append("<div class='plan-image-item'>");
                if (base64Image != null && !base64Image.isEmpty()) {
                    section.append("<img src='data:image/jpeg;base64,").append(base64Image).append("' alt='").append(escapeHtml(planImage.getImageName())).append("' style='max-width: 100%; height: auto;' />");
                } else {
                    section.append("<p style='color: #999;'>").append(escapeHtml(planImage.getImageName())).append("</p>");
                }
                section.append("</div>");
            }
            section.append("</div>");
        }

        // Category tables
        if (kitchen.getAccessories() != null && !kitchen.getAccessories().isEmpty()) {
            System.out.println("Generating Accessories table with " + kitchen.getAccessories().size() + " items");
            section.append(generateCategorySection("Accessories", generateAccessoriesTable(kitchen.getAccessories())));
        } else {
            System.out.println("Accessories list is null or empty - skipping");
        }

        if (kitchen.getCabinets() != null && !kitchen.getCabinets().isEmpty()) {
            System.out.println("Generating Cabinets table with " + kitchen.getCabinets().size() + " items");
            section.append(generateCategorySection("Cabinets", generateCabinetsTable(kitchen.getCabinets())));
        } else {
            System.out.println("Cabinets list is null or empty - skipping");
        }

        if (kitchen.getDoors() != null && !kitchen.getDoors().isEmpty()) {
            System.out.println("Generating Doors table with " + kitchen.getDoors().size() + " items");
            section.append(generateCategorySection("Doors", generateDoorsTable(kitchen.getDoors())));
        } else {
            System.out.println("Doors list is null or empty - skipping");
        }

        if (kitchen.getLighting() != null && !kitchen.getLighting().isEmpty()) {
            System.out.println("Generating Lighting table with " + kitchen.getLighting().size() + " items");
            section.append(generateCategorySection("Lighting", generateLightingTable(kitchen.getLighting())));
        } else {
            System.out.println("Lighting list is null or empty - skipping");
        }

        // Kitchen totals
        section.append("<h3 class='category-title'>Kitchen Totals</h3>");
        section.append("<table>");
        section.append("<tr><td class='text-right'><strong>Subtotal:</strong></td><td class='text-right'>₹").append(formatCurrency(kitchen.getSubtotal())).append("</td></tr>");
        section.append("<tr style='background: #F39C12; color: #fff;'><td class='text-right'><strong>Kitchen Total:</strong></td><td class='text-right'><strong>₹").append(formatCurrency(kitchen.getTotalAmount())).append("</strong></td></tr>");
        section.append("</table>");

        section.append("</div>");

        System.out.println("=== Finished generating PDF section for kitchen: " + kitchen.getKitchenName() + " ===");
        return section.toString();
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0.00";
        return String.format("%.2f", amount);
    }

    private byte[] convertHtmlToPdf(String htmlContent) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ConverterProperties properties = new ConverterProperties();
        properties.setBaseUri(".");
        HtmlConverter.convertToPdf(htmlContent, outputStream, properties);
        return outputStream.toByteArray();
    }
}