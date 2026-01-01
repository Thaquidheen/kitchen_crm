package com.fleetmanagement.kitchencrmbackend.modules.warranty.service;

import com.fleetmanagement.kitchencrmbackend.modules.settings.entity.SystemSetting;
import com.fleetmanagement.kitchencrmbackend.modules.settings.repository.SystemSettingRepository;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.dto.WarrantyComponentDto;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.entity.WarrantyCard;
import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.HtmlConverter;
import com.itextpdf.html2pdf.css.apply.impl.DefaultCssApplierFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class WarrantyCardPdfService {

    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Autowired
    private WarrantyComponentService warrantyComponentService;

    private static final String TEMPLATE_PATH = "classpath:templates/pdf/warranty-card-template.html";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] generatePdfBytes(WarrantyCard warrantyCard, String customerName) throws IOException {
        // Load HTML template
        String htmlContent = loadTemplate();

        // Get warranty components
        List<WarrantyComponentDto> components = warrantyComponentService.getAllActiveComponents();

        // Replace placeholders
        htmlContent = replacePlaceholders(htmlContent, warrantyCard, customerName, components);

        // Convert HTML to PDF
        return convertHtmlToPdf(htmlContent);
    }

    private String loadTemplate() throws IOException {
        try {
            Resource resource = resourceLoader.getResource(TEMPLATE_PATH);
            if (resource.exists()) {
                return new String(resource.getInputStream().readAllBytes());
            } else {
                throw new IOException("Warranty card template not found");
            }
        } catch (Exception e) {
            throw new IOException("Failed to load warranty card template: " + e.getMessage(), e);
        }
    }

    private String replacePlaceholders(String htmlContent, WarrantyCard warrantyCard, 
                                      String customerName, List<WarrantyComponentDto> components) {
        // Company information from system settings
        htmlContent = htmlContent.replace("{{COMPANY_NAME}}", getSettingValue("company.name", "THE HOCH"));
        htmlContent = htmlContent.replace("{{COMPANY_TAGLINE}}", getSettingValue("company.tagline", "Modular Interiors & Design Solutions"));
        htmlContent = htmlContent.replace("{{COMPANY_ADDRESS_LINE1}}", getSettingValue("company.address_line1", "[Address Line 1]"));
        htmlContent = htmlContent.replace("{{COMPANY_ADDRESS_LINE2}}", getSettingValue("company.address_line2", "[City, State, Zip Code]"));
        htmlContent = htmlContent.replace("{{COMPANY_PHONE}}", getSettingValue("company.phone", "[Phone Number]"));
        htmlContent = htmlContent.replace("{{COMPANY_EMAIL}}", getSettingValue("company.email", "[Email Address]"));
        htmlContent = htmlContent.replace("{{COMPANY_WEBSITE}}", getSettingValue("company.website", "[Website URL]"));

        // Certificate information
        htmlContent = htmlContent.replace("{{CERTIFICATE_NUMBER}}", 
                warrantyCard.getCertificateNumber() != null ? warrantyCard.getCertificateNumber() : "");
        htmlContent = htmlContent.replace("{{ISSUE_DATE}}", 
                warrantyCard.getIssueDate() != null ? formatDate(warrantyCard.getIssueDate()) : "");
        htmlContent = htmlContent.replace("{{CLIENT_NAME}}", customerName != null ? customerName : "");
        htmlContent = htmlContent.replace("{{PROJECT_ADDRESS}}", 
                warrantyCard.getProjectAddress() != null ? warrantyCard.getProjectAddress() : "");
        htmlContent = htmlContent.replace("{{PROJECT_DESCRIPTION}}", 
                warrantyCard.getProjectDescription() != null ? warrantyCard.getProjectDescription() : 
                "Modular Kitchen Design, Supply & Installation");
        htmlContent = htmlContent.replace("{{PROJECT_COMPLETION_DATE}}", 
                warrantyCard.getProjectCompletionDate() != null ? formatDate(warrantyCard.getProjectCompletionDate()) : "");

        // Warranty components table
        htmlContent = htmlContent.replace("{{WARRANTY_COMPONENTS_TABLE}}", generateComponentsTable(components));

        // Terms & Conditions
        String termsText = getSettingValue("warranty.terms_text", "");
        // If setting is "DEFAULT" or empty, use the default formatted terms
        if (termsText == null || termsText.isEmpty() || "DEFAULT".equals(termsText)) {
            htmlContent = htmlContent.replace("{{WARRANTY_TERMS_TEXT}}", getDefaultTermsText());
        } else {
            htmlContent = htmlContent.replace("{{WARRANTY_TERMS_TEXT}}", formatTermsText(termsText));
        }

        // Authorized signatory
        htmlContent = htmlContent.replace("{{AUTHORIZED_NAME}}", 
                warrantyCard.getAuthorizedName() != null ? warrantyCard.getAuthorizedName() : 
                getSettingValue("warranty.authorized_name", ""));
        htmlContent = htmlContent.replace("{{AUTHORIZED_DESIGNATION}}", 
                warrantyCard.getAuthorizedDesignation() != null ? warrantyCard.getAuthorizedDesignation() : 
                getSettingValue("warranty.authorized_designation", ""));
        htmlContent = htmlContent.replace("{{SIGNATURE_DATE}}", 
                warrantyCard.getSignatureDate() != null ? formatDate(warrantyCard.getSignatureDate()) : "");

        return htmlContent;
    }

    private String generateComponentsTable(List<WarrantyComponentDto> components) {
        if (components == null || components.isEmpty()) {
            return "<tr><td colspan='2'>No warranty components configured</td></tr>";
        }

        StringBuilder tableRows = new StringBuilder();
        for (WarrantyComponentDto component : components) {
            tableRows.append("<tr>");
            tableRows.append("<td>").append(escapeHtml(component.getComponentName())).append("</td>");
            tableRows.append("<td>").append(escapeHtml(component.getWarrantyPeriod())).append("</td>");
            tableRows.append("</tr>");
        }
        return tableRows.toString();
    }

    private String formatTermsText(String termsText) {
        if (termsText == null || termsText.isEmpty()) {
            return getDefaultTermsText();
        }
        
        // If the text already contains HTML tags, return as is (might be from settings)
        if (termsText.contains("<p>") || termsText.contains("<ul>") || termsText.contains("<ol>")) {
            return termsText;
        }
        
        // Otherwise, convert plain text to HTML paragraphs
        String[] paragraphs = termsText.split("\n\n");
        StringBuilder html = new StringBuilder();
        for (String para : paragraphs) {
            if (!para.trim().isEmpty()) {
                html.append("<p>").append(escapeHtml(para.trim())).append("</p>");
            }
        }
        return html.toString();
    }

    private String getDefaultTermsText() {
        return "<p><strong>Warranty & Service</strong></p>" +
                "<p>We warrant the furniture we sell to be free from defects in material and workmanship under normal residential usage to the original purchaser for the period specified below.</p>" +
                "<p>We will repair any part that proves to be defective in materials and workmanship. If repair is not possible, we will either replace the part with a new part or a component of similar composition and price.</p>" +
                "<p>This warranty does not apply to any issues with our furniture or parts of our furniture that result from improper handling, negligence, alterations, accidents, misuse, improper cleaning or care, or natural calamities. Additionally, consequential and incidental damages are not covered under this warranty.</p>" +
                "<p><strong>Specific Warranty Periods:</strong></p>" +
                "<ul>" +
                "<li>Stainless steel cabinets have 15 years of warranty against any manufacturing defect.</li>" +
                "<li>Any other doors have 8 years of warranty against any manufacturing defect.</li>" +
                "<li>Hardware & accessories: as provided by the manufacturer.</li>" +
                "<li>Lightings: as provided by the manufacturer.</li>" +
                "</ul>" +
                "<p><strong>Important Notes:</strong></p>" +
                "<ol>" +
                "<li>Any modifications or repairs made by third parties will void the warranty.</li>" +
                "<li>Regular maintenance as per our care instructions is recommended to uphold warranty terms.</li>" +
                "<li>Claims must be supported with this certificate and a copy of the original invoice.</li>" +
                "</ol>";
    }

    private String getSettingValue(String key, String defaultValue) {
        Optional<SystemSetting> setting = systemSettingRepository.findBySettingKey(key);
        return setting.map(SystemSetting::getSettingValue).orElse(defaultValue);
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMATTER) : "";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private byte[] convertHtmlToPdf(String htmlContent) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        ConverterProperties properties = new ConverterProperties();
        properties.setBaseUri(".");
        properties.setCssApplierFactory(new DefaultCssApplierFactory());

        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdf = new PdfDocument(writer);
        pdf.setDefaultPageSize(PageSize.A4);

        HtmlConverter.convertToPdf(htmlContent, pdf, properties);

        return outputStream.toByteArray();
    }
}

