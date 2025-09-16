import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.service.PdfGenerationService;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.service.QuotationService;
import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.HtmlConverter;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class PdfGenerationServiceImpl implements PdfGenerationService {

    @Autowired
    private QuotationService quotationService;

    @Autowired
    private ResourceLoader resourceLoader;

    private static final String QUOTATION_TEMPLATE_PATH = "classpath:templates/pdf/quotation-template.html";
    private static final String BILL_TEMPLATE_PATH = "classpath:templates/pdf/bill-template.html";

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

            byte[] pdfBytes = createBillPdfBytes(quotation, userRole);

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
            htmlContent = replacePlaceholders(htmlContent, quotation, userRole, false);

            // Convert HTML to PDF using iText
            return convertHtmlToPdf(htmlContent);

        } catch (Exception e) {
            throw new RuntimeException("Failed to create quotation PDF", e);
        }
    }

    private byte[] createBillPdfBytes(QuotationDto quotation, String userRole) {
        try {
            // Load HTML template for bill
            String htmlContent = loadTemplate(BILL_TEMPLATE_PATH);

            // Replace placeholders with quotation data (bill format)
            htmlContent = replacePlaceholders(htmlContent, quotation, userRole, true);

            // Convert HTML to PDF using iText
            return convertHtmlToPdf(htmlContent);

        } catch (Exception e) {
            throw new RuntimeException("Failed to create bill PDF", e);
        }
    }

    private String loadTemplate(String templatePath) throws IOException {
        Resource resource = resourceLoader.getResource(templatePath);
        return Files.readString(resource.getFile().toPath());
    }

    private String replacePlaceholders(String htmlContent, QuotationDto quotation, String userRole, boolean isBill) {
        // Company information
        htmlContent = htmlContent.replace("{{COMPANY_NAME}}", "Kitchen CRM Solutions");
        htmlContent = htmlContent.replace("{{COMPANY_ADDRESS}}", "123 Business Street, City, State 12345");
        htmlContent = htmlContent.replace("{{COMPANY_PHONE}}", "+1 (555) 123-4567");
        htmlContent = htmlContent.replace("{{COMPANY_EMAIL}}", "info@kitchencrm.com");

        // Document title and number
        String documentTitle = isBill ? "INVOICE" : "QUOTATION";
        String documentNumber = isBill ? quotation.getQuotationNumber().replace("QT-", "INV-") : quotation.getQuotationNumber();

        htmlContent = htmlContent.replace("{{DOCUMENT_TITLE}}", documentTitle);
        htmlContent = htmlContent.replace("{{DOCUMENT_NUMBER}}", documentNumber);

        // Customer information
        htmlContent = htmlContent.replace("{{CUSTOMER_NAME}}", quotation.getCustomerName());
        htmlContent = htmlContent.replace("{{PROJECT_NAME}}", quotation.getProjectName() != null ? quotation.getProjectName() : "");

        // Dates
        htmlContent = htmlContent.replace("{{CREATED_DATE}}", quotation.getCreatedAt().toLocalDate().toString());
        htmlContent = htmlContent.replace("{{VALID_UNTIL}}", quotation.getValidUntil() != null ? quotation.getValidUntil().toString() : "");

        // Line items table
        StringBuilder lineItemsHtml = new StringBuilder();

        // Add accessories
        if (quotation.getAccessories() != null && !quotation.getAccessories().isEmpty()) {
            lineItemsHtml.append("<tr><td colspan='6' class='category-header'><strong>ACCESSORIES</strong></td></tr>");
            for (QuotationAccessoryDto accessory : quotation.getAccessories()) {
                lineItemsHtml.append(createAccessoryLineItemRow(accessory, userRole));
            }
        }

        // Add cabinets
        if (quotation.getCabinets() != null && !quotation.getCabinets().isEmpty()) {
            lineItemsHtml.append("<tr><td colspan='6' class='category-header'><strong>CABINETS</strong></td></tr>");
            for (QuotationCabinetDto cabinet : quotation.getCabinets()) {
                lineItemsHtml.append(createCabinetLineItemRow(cabinet, userRole));
            }
        }

        // Add doors
        if (quotation.getDoors() != null && !quotation.getDoors().isEmpty()) {
            lineItemsHtml.append("<tr><td colspan='6' class='category-header'><strong>DOORS</strong></td></tr>");
            for (QuotationDoorDto door : quotation.getDoors()) {
                lineItemsHtml.append(createDoorLineItemRow(door, userRole));
            }
        }

        // Add lighting
        if (quotation.getLighting() != null && !quotation.getLighting().isEmpty()) {
            lineItemsHtml.append("<tr><td colspan='6' class='category-header'><strong>LIGHTING</strong></td></tr>");
            for (QuotationLightingDto lighting : quotation.getLighting()) {
                lineItemsHtml.append(createLightingLineItemRow(lighting, userRole));
            }
        }

        // Add transportation and installation
        if (quotation.getTransportationPrice().compareTo(BigDecimal.ZERO) > 0) {
            lineItemsHtml.append("<tr>")
                    .append("<td>Transportation</td>")
                    .append("<td>1</td>")
                    .append("<td>Service</td>")
                    .append("<td>₹").append(formatCurrency(quotation.getTransportationPrice())).append("</td>");

            if ("ROLE_SUPER_ADMIN".equals(userRole)) {
                lineItemsHtml.append("<td>₹0.00</td>");
            }

            lineItemsHtml.append("<td>₹").append(formatCurrency(quotation.getTransportationPrice())).append("</td>")
                    .append("</tr>");
        }

        if (quotation.getInstallationPrice().compareTo(BigDecimal.ZERO) > 0) {
            lineItemsHtml.append("<tr>")
                    .append("<td>Installation</td>")
                    .append("<td>1</td>")
                    .append("<td>Service</td>")
                    .append("<td>₹").append(formatCurrency(quotation.getInstallationPrice())).append("</td>");

            if ("ROLE_SUPER_ADMIN".equals(userRole)) {
                lineItemsHtml.append("<td>₹0.00</td>");
            }

            lineItemsHtml.append("<td>₹").append(formatCurrency(quotation.getInstallationPrice())).append("</td>")
                    .append("</tr>");
        }

        htmlContent = htmlContent.replace("{{LINE_ITEMS}}", lineItemsHtml.toString());

        // Totals
        htmlContent = htmlContent.replace("{{SUBTOTAL}}", formatCurrency(quotation.getSubtotal()));
        htmlContent = htmlContent.replace("{{TAX_PERCENTAGE}}", quotation.getTaxPercentage().toString());
        htmlContent = htmlContent.replace("{{TAX_AMOUNT}}", formatCurrency(quotation.getTaxAmount()));
        htmlContent = htmlContent.replace("{{TOTAL_AMOUNT}}", formatCurrency(quotation.getTotalAmount()));

        // Show margin only to super admin
        if ("ROLE_SUPER_ADMIN".equals(userRole) && quotation.getMarginAmount() != null) {
            String marginRow = "<tr><td colspan='4' class='text-right'><strong>Margin (" +
                    quotation.getMarginPercentage() + "%):</strong></td>" +
                    "<td><strong>₹" + formatCurrency(quotation.getMarginAmount()) + "</strong></td></tr>";
            htmlContent = htmlContent.replace("{{MARGIN_ROW}}", marginRow);
        } else {
            htmlContent = htmlContent.replace("{{MARGIN_ROW}}", "");
        }

        // Notes and terms
        htmlContent = htmlContent.replace("{{NOTES}}", quotation.getNotes() != null ? quotation.getNotes() : "");
        htmlContent = htmlContent.replace("{{TERMS_CONDITIONS}}", quotation.getTermsConditions() != null ? quotation.getTermsConditions() : getDefaultTermsAndConditions());

        // Status and approval info
        htmlContent = htmlContent.replace("{{STATUS}}", quotation.getStatus().toString());
        if (quotation.getApprovedBy() != null) {
            htmlContent = htmlContent.replace("{{APPROVED_BY}}", "Approved by: " + quotation.getApprovedBy());
            htmlContent = htmlContent.replace("{{APPROVED_DATE}}", quotation.getApprovedAt().toString());
        } else {
            htmlContent = htmlContent.replace("{{APPROVED_BY}}", "");
            htmlContent = htmlContent.replace("{{APPROVED_DATE}}", "");
        }

        return htmlContent;
    }

//    private String createAccessoryLineItemRow(QuotationAccessoryDto accessory, String userRole) {
//        StringBuilder row = new StringBuilder();
//
//        String itemName = accessory.getCustomItem() ? accessory.getCustomItemName() : accessory.getAccessoryName();
//        String brandInfo = accessory.getBrandName() != null ? " (" + accessory.getBrandName() + ")" : "";
//
//        row.append("<tr>")
//                .append("<td>").append(itemName).append(brandInfo).append("</td>")
//                .append("<td>").append(accessory.getQuantity()).append("</td>")
//                .append("<td>Pieces</td>")
//                .append("<td>₹").append(formatCurrency(accessory.getUnitPrice())).append("</td>");
//
////        if ("ROLE_SUPER_ADMIN".equals(userRole)) {
////            row.append("<td>₹").append(formatCurrency(accessory.getMarginAmount())).append("</td>");
////        }
//
//        row.append("<td>₹").append(formatCurrency(accessory.getTotalPrice())).append("</td>")
//                .append("</tr>");
//
//        return row.toString();
//    }

    private String createCabinetLineItemRow(QuotationCabinetDto cabinet, String userRole) {
        StringBuilder row = new StringBuilder();

        String dimensions = "";
        if (cabinet.getWidthMm() != null && cabinet.getHeightMm() != null) {
            dimensions = " (" + cabinet.getWidthMm() + "mm x " + cabinet.getHeightMm() + "mm)";
        }

        row.append("<tr>")
                .append("<td>").append(cabinet.getCabinetTypeName()).append(dimensions).append("</td>")
                .append("<td>").append(cabinet.getQuantity()).append("</td>")
                .append("<td>").append(cabinet.getCalculatedSqft() != null ? "Sqft" : "Pieces").append("</td>")
                .append("<td>₹").append(formatCurrency(cabinet.getUnitPrice())).append("</td>");

        if ("ROLE_SUPER_ADMIN".equals(userRole)) {
            row.append("<td>₹").append(formatCurrency(cabinet.getMarginAmount())).append("</td>");
        }

        row.append("<td>₹").append(formatCurrency(cabinet.getTotalPrice())).append("</td>")
                .append("</tr>");

        return row.toString();
    }

    private String createDoorLineItemRow(QuotationDoorDto door, String userRole) {
        StringBuilder row = new StringBuilder();

        String dimensions = "";
        if (door.getWidthMm() != null && door.getHeightMm() != null) {
            dimensions = " (" + door.getWidthMm() + "mm x " + door.getHeightMm() + "mm)";
        }

        row.append("<tr>")
                .append("<td>").append(door.getDoorTypeName()).append(dimensions).append("</td>")
                .append("<td>").append(door.getQuantity()).append("</td>")
                .append("<td>").append(door.getCalculatedSqft() != null ? "Sqft" : "Pieces").append("</td>")
                .append("<td>₹").append(formatCurrency(door.getUnitPrice())).append("</td>");

        if ("ROLE_SUPER_ADMIN".equals(userRole)) {
            row.append("<td>₹").append(formatCurrency(door.getMarginAmount())).append("</td>");
        }

        row.append("<td>₹").append(formatCurrency(door.getTotalPrice())).append("</td>")
                .append("</tr>");

        return row.toString();
    }

    private String createLightingLineItemRow(QuotationLightingDto lighting, String userRole) {
        StringBuilder row = new StringBuilder();

        String specifications = "";
        if (lighting.getWattage() != null) {
            specifications += lighting.getWattage() + "W ";
        }
        if (lighting.getProfileType() != null) {
            specifications += "Profile " + lighting.getProfileType() + " ";
        }

        row.append("<tr>")
                .append("<td>").append(lighting.getItemName()).append(" ").append(specifications).append("</td>")
                .append("<td>").append(formatCurrency(lighting.getQuantity())).append("</td>")
                .append("<td>").append(lighting.getUnit()).append("</td>")
                .append("<td>₹").append(formatCurrency(lighting.getUnitPrice())).append("</td>");

        if ("ROLE_SUPER_ADMIN".equals(userRole)) {
            row.append("<td>₹").append(formatCurrency(lighting.getMarginAmount())).append("</td>");
        }

        row.append("<td>₹").append(formatCurrency(lighting.getTotalPrice())).append("</td>")
                .append("</tr>");

        return row.toString();
    }

    private byte[] convertHtmlToPdf(String htmlContent) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try {
            // Initialize PDF writer
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdfDoc = new PdfDocument(writer);

            // Set page size and margins
            pdfDoc.setDefaultPageSize(PageSize.A4);

            // Create converter properties
            ConverterProperties converterProperties = new ConverterProperties();

            // Convert HTML to PDF
            HtmlConverter.convertToPdf(htmlContent, pdfDoc, converterProperties);

            pdfDoc.close();

            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new IOException("Failed to convert HTML to PDF", e);
        } finally {
            outputStream.close();
        }
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "0.00";
        }
        return String.format("%.2f", amount);
    }

    private String getDefaultTermsAndConditions() {
        return "1. This quotation is valid for 30 days from the date of issue.\n" +
                "2. 50% advance payment required to start work.\n" +
                "3. Installation will be completed within agreed timeline.\n" +
                "4. Material specifications may vary based on availability.\n" +
                "5. Any changes to the original design will be charged extra.\n" +
                "6. Warranty: 1 year for manufacturing defects.";
    }

    private String populateQuotationTemplate(QuotationDto quotation, String userRole) throws IOException {
        // Load template
        String htmlContent = loadTemplate("quotation-template.html");

        // Company and customer details (existing code)...

        // Line items table with category-wise totals
        StringBuilder lineItemsHtml = new StringBuilder();

        // Add accessories section
        if (quotation.getAccessories() != null && !quotation.getAccessories().isEmpty()) {
            lineItemsHtml.append("<tr class='category-header'><td colspan='5'><strong>ACCESSORIES</strong></td></tr>");
            for (QuotationAccessoryDto accessory : quotation.getAccessories()) {
                lineItemsHtml.append(createLineItemRow(accessory));
            }

            // Category subtotal
            lineItemsHtml.append("<tr class='category-subtotal'>")
                    .append("<td colspan='4'><strong>Accessories Subtotal:</strong></td>")
                    .append("<td><strong>₹").append(formatCurrency(quotation.getAccessoriesBaseTotal())).append("</strong></td>")
                    .append("</tr>");

            // Show margin and tax for admin only
            if ("ROLE_SUPER_ADMIN".equals(userRole)) {
                lineItemsHtml.append("<tr class='category-margin'>")
                        .append("<td colspan='4'>Margin (").append(quotation.getMarginPercentage()).append("%):</td>")
                        .append("<td>₹").append(formatCurrency(quotation.getAccessoriesMarginAmount())).append("</td>")
                        .append("</tr>");

                lineItemsHtml.append("<tr class='category-tax'>")
                        .append("<td colspan='4'>Tax (").append(quotation.getTaxPercentage()).append("%):</td>")
                        .append("<td>₹").append(formatCurrency(quotation.getAccessoriesTaxAmount())).append("</td>")
                        .append("</tr>");
            }

            // Category final total
            lineItemsHtml.append("<tr class='category-total'>")
                    .append("<td colspan='4'><strong>ACCESSORIES TOTAL:</strong></td>")
                    .append("<td><strong>₹").append(formatCurrency(quotation.getAccessoriesFinalTotal())).append("</strong></td>")
                    .append("</tr>");
        }

        // Add cabinets section
        if (quotation.getCabinets() != null && !quotation.getCabinets().isEmpty()) {
            lineItemsHtml.append("<tr class='category-header'><td colspan='5'><strong>CABINETS</strong></td></tr>");
            for (QuotationCabinetDto cabinet : quotation.getCabinets()) {
                lineItemsHtml.append(createCabinetLineItemRow(cabinet));
            }

            // Category subtotal
            lineItemsHtml.append("<tr class='category-subtotal'>")
                    .append("<td colspan='4'><strong>Cabinets Subtotal:</strong></td>")
                    .append("<td><strong>₹").append(formatCurrency(quotation.getCabinetsBaseTotal())).append("</strong></td>")
                    .append("</tr>");

            // Show margin and tax for admin only
            if ("ROLE_SUPER_ADMIN".equals(userRole)) {
                lineItemsHtml.append("<tr class='category-margin'>")
                        .append("<td colspan='4'>Margin (").append(quotation.getMarginPercentage()).append("%):</td>")
                        .append("<td>₹").append(formatCurrency(quotation.getCabinetsMarginAmount())).append("</td>")
                        .append("</tr>");

                lineItemsHtml.append("<tr class='category-tax'>")
                        .append("<td colspan='4'>Tax (").append(quotation.getTaxPercentage()).append("%):</td>")
                        .append("<td>₹").append(formatCurrency(quotation.getCabinetsTaxAmount())).append("</td>")
                        .append("</tr>");
            }

            // Category final total
            lineItemsHtml.append("<tr class='category-total'>")
                    .append("<td colspan='4'><strong>CABINETS TOTAL:</strong></td>")
                    .append("<td><strong>₹").append(formatCurrency(quotation.getCabinetsFinalTotal())).append("</strong></td>")
                    .append("</tr>");
        }

        // Add doors section
        if (quotation.getDoors() != null && !quotation.getDoors().isEmpty()) {
            lineItemsHtml.append("<tr class='category-header'><td colspan='5'><strong>DOORS</strong></td></tr>");
            for (QuotationDoorDto door : quotation.getDoors()) {
                lineItemsHtml.append(createDoorLineItemRow(door));
            }

            // Category subtotal
            lineItemsHtml.append("<tr class='category-subtotal'>")
                    .append("<td colspan='4'><strong>Doors Subtotal:</strong></td>")
                    .append("<td><strong>₹").append(formatCurrency(quotation.getDoorsBaseTotal())).append("</strong></td>")
                    .append("</tr>");

            // Show margin and tax for admin only
            if ("ROLE_SUPER_ADMIN".equals(userRole)) {
                lineItemsHtml.append("<tr class='category-margin'>")
                        .append("<td colspan='4'>Margin (").append(quotation.getMarginPercentage()).append("%):</td>")
                        .append("<td>₹").append(formatCurrency(quotation.getDoorsMarginAmount())).append("</td>")
                        .append("</tr>");

                lineItemsHtml.append("<tr class='category-tax'>")
                        .append("<td colspan='4'>Tax (").append(quotation.getTaxPercentage()).append("%):</td>")
                        .append("<td>₹").append(formatCurrency(quotation.getDoorsTaxAmount())).append("</td>")
                        .append("</tr>");
            }

            // Category final total
            lineItemsHtml.append("<tr class='category-total'>")
                    .append("<td colspan='4'><strong>DOORS TOTAL:</strong></td>")
                    .append("<td><strong>₹").append(formatCurrency(quotation.getDoorsFinalTotal())).append("</strong></td>")
                    .append("</tr>");
        }

        // Add lighting section
        if (quotation.getLighting() != null && !quotation.getLighting().isEmpty()) {
            lineItemsHtml.append("<tr class='category-header'><td colspan='5'><strong>LIGHTING & PROFILES</strong></td></tr>");
            for (QuotationLightingDto lighting : quotation.getLighting()) {
                lineItemsHtml.append(createLightingLineItemRow(lighting));
            }

            // Category subtotal
            lineItemsHtml.append("<tr class='category-subtotal'>")
                    .append("<td colspan='4'><strong>Lighting Subtotal:</strong></td>")
                    .append("<td><strong>₹").append(formatCurrency(quotation.getLightingBaseTotal())).append("</strong></td>")
                    .append("</tr>");

            // Show margin and tax for admin only
            if ("ROLE_SUPER_ADMIN".equals(userRole)) {
                lineItemsHtml.append("<tr class='category-margin'>")
                        .append("<td colspan='4'>Margin (").append(quotation.getMarginPercentage()).append("%):</td>")
                        .append("<td>₹").append(formatCurrency(quotation.getLightingMarginAmount())).append("</td>")
                        .append("</tr>");

                lineItemsHtml.append("<tr class='category-tax'>")
                        .append("<td colspan='4'>Tax (").append(quotation.getTaxPercentage()).append("%):</td>")
                        .append("<td>₹").append(formatCurrency(quotation.getLightingTaxAmount())).append("</td>")
                        .append("</tr>");
            }

            // Category final total
            lineItemsHtml.append("<tr class='category-total'>")
                    .append("<td colspan='4'><strong>LIGHTING TOTAL:</strong></td>")
                    .append("<td><strong>₹").append(formatCurrency(quotation.getLightingFinalTotal())).append("</strong></td>")
                    .append("</tr>");
        }

        // Add transportation and installation
        if (quotation.getTransportationPrice().compareTo(BigDecimal.ZERO) > 0) {
            lineItemsHtml.append("<tr class='service-item'>")
                    .append("<td>Transportation</td>")
                    .append("<td>1</td>")
                    .append("<td>Service</td>")
                    .append("<td>₹").append(formatCurrency(quotation.getTransportationPrice())).append("</td>")
                    .append("<td>₹").append(formatCurrency(quotation.getTransportationPrice())).append("</td>")
                    .append("</tr>");
        }

        if (quotation.getInstallationPrice().compareTo(BigDecimal.ZERO) > 0) {
            lineItemsHtml.append("<tr class='service-item'>")
                    .append("<td>Installation</td>")
                    .append("<td>1</td>")
                    .append("<td>Service</td>")
                    .append("<td>₹").append(formatCurrency(quotation.getInstallationPrice())).append("</td>")
                    .append("<td>₹").append(formatCurrency(quotation.getInstallationPrice())).append("</td>")
                    .append("</tr>");
        }

        htmlContent = htmlContent.replace("{{LINE_ITEMS}}", lineItemsHtml.toString());

        // Final totals
        htmlContent = htmlContent.replace("{{SUBTOTAL}}", formatCurrency(quotation.getSubtotal()));
        htmlContent = htmlContent.replace("{{TAX_PERCENTAGE}}", quotation.getTaxPercentage().toString());
        htmlContent = htmlContent.replace("{{TAX_AMOUNT}}", formatCurrency(quotation.getTaxAmount()));
        htmlContent = htmlContent.replace("{{TOTAL_AMOUNT}}", formatCurrency(quotation.getTotalAmount()));

        // Show overall margin only to super admin
        if ("ROLE_SUPER_ADMIN".equals(userRole) && quotation.getMarginAmount() != null) {
            String marginRow = "<tr><td colspan='4' class='text-right'><strong>Total Margin (" +
                    quotation.getMarginPercentage() + "%):</strong></td>" +
                    "<td><strong>₹" + formatCurrency(quotation.getMarginAmount()) + "</strong></td></tr>";
            htmlContent = htmlContent.replace("{{MARGIN_ROW}}", marginRow);
        } else {
            htmlContent = htmlContent.replace("{{MARGIN_ROW}}", "");
        }

        // Rest of the template population...
        return htmlContent;
    }

    // Helper methods for creating line item rows (simplified - showing only base amounts)
    private String createLineItemRow(QuotationAccessoryDto accessory) {
        StringBuilder row = new StringBuilder();
        BigDecimal baseAmount = accessory.getUnitPrice().multiply(BigDecimal.valueOf(accessory.getQuantity()));

        row.append("<tr>")
                .append("<td>").append(accessory.getAccessoryName()).append("</td>")
                .append("<td>").append(accessory.getQuantity()).append("</td>")
                .append("<td>").append(accessory.getUnitPrice()).append("</td>")
                .append("<td>₹").append(formatCurrency(accessory.getUnitPrice())).append("</td>")
                .append("<td>₹").append(formatCurrency(baseAmount)).append("</td>")
                .append("</tr>");

        return row.toString();
    }

    private String createCabinetLineItemRow(QuotationCabinetDto cabinet) {
        StringBuilder row = new StringBuilder();
        BigDecimal baseAmount;

        if (cabinet.getCalculatedSqft() != null) {
            baseAmount = cabinet.getUnitPrice().multiply(cabinet.getCalculatedSqft()).multiply(BigDecimal.valueOf(cabinet.getQuantity()));
        } else {
            baseAmount = cabinet.getUnitPrice().multiply(BigDecimal.valueOf(cabinet.getQuantity()));
        }

        String specifications = "";
        if (cabinet.getWidthMm() != null && cabinet.getHeightMm() != null && cabinet.getDepthMm() != null) {
            specifications = " (" + cabinet.getWidthMm() + "×" + cabinet.getHeightMm() + "×" + cabinet.getDepthMm() + "mm)";
        }

        row.append("<tr>")
                .append("<td>").append(cabinet.getCabinetTypeName()).append(specifications).append("</td>")
                .append("<td>").append(cabinet.getQuantity()).append("</td>")
                .append("<td>").append(cabinet.getCalculatedSqft() != null ? "Sqft" : "Pieces").append("</td>")
                .append("<td>₹").append(formatCurrency(cabinet.getUnitPrice())).append("</td>")
                .append("<td>₹").append(formatCurrency(baseAmount)).append("</td>")
                .append("</tr>");

        return row.toString();
    }

    private String createDoorLineItemRow(QuotationDoorDto door) {
        StringBuilder row = new StringBuilder();
        BigDecimal baseAmount;

        if (door.getCalculatedSqft() != null) {
            baseAmount = door.getUnitPrice().multiply(door.getCalculatedSqft()).multiply(BigDecimal.valueOf(door.getQuantity()));
        } else {
            baseAmount = door.getUnitPrice().multiply(BigDecimal.valueOf(door.getQuantity()));
        }

        String specifications = "";
        if (door.getWidthMm() != null && door.getHeightMm() != null) {
            specifications = " (" + door.getWidthMm() + "×" + door.getHeightMm() + "mm)";
        }
        if (door.getDoorFinish() != null) {
            specifications += ", " + door.getDoorFinish();
        }

        row.append("<tr>")
                .append("<td>").append(door.getDoorTypeName()).append(specifications).append("</td>")
                .append("<td>").append(door.getQuantity()).append("</td>")
                .append("<td>").append(door.getCalculatedSqft() != null ? "Sqft" : "Pieces").append("</td>")
                .append("<td>₹").append(formatCurrency(door.getUnitPrice())).append("</td>")
                .append("<td>₹").append(formatCurrency(baseAmount)).append("</td>")
                .append("</tr>");

        return row.toString();
    }

    private String createLightingLineItemRow(QuotationLightingDto lighting) {
        StringBuilder row = new StringBuilder();
        BigDecimal baseAmount = lighting.getUnitPrice().multiply(lighting.getQuantity());

        String specifications = "";
        if (lighting.getWattage() != null) {
            specifications += lighting.getWattage() + "W ";
        }
        if (lighting.getProfileType() != null) {
            specifications += "Profile " + lighting.getProfileType() + " ";
        }

        row.append("<tr>")
                .append("<td>").append(lighting.getItemName()).append(" ").append(specifications).append("</td>")
                .append("<td>").append(formatCurrency(lighting.getQuantity())).append("</td>")
                .append("<td>").append(lighting.getUnit()).append("</td>")
                .append("<td>₹").append(formatCurrency(lighting.getUnitPrice())).append("</td>")
                .append("<td>₹").append(formatCurrency(baseAmount)).append("</td>")
                .append("</tr>");

        return row.toString();
    }

    private String createAccessoryLineItemRow(QuotationAccessoryDto accessory, String userRole) {
        StringBuilder row = new StringBuilder();

        String itemName = accessory.getCustomItem() ?
                accessory.getCustomItemName() : accessory.getAccessoryName();
        String brandInfo = accessory.getBrandName() != null ?
                " (" + accessory.getBrandName() + ")" : "";

        row.append("<tr class='accessory-row'>")
                .append("<td class='item-description'>");

        // Check if accessory has an image
        if (accessory.getImageUrl() != null && !accessory.getImageUrl().trim().isEmpty()) {
            // Create item with image layout
            row.append("<div class='item-with-image'>")
                    .append("<div class='item-image'>")
                    .append("<img src='").append(accessory.getImageUrl()).append("' ")
                    .append("alt='").append(itemName).append(" image' ")
                    .append("style='width: 80px; height: 80px; object-fit: cover; border-radius: 6px; ")
                    .append("border: 1px solid #ddd; margin-right: 12px;' />")
                    .append("</div>")
                    .append("<div class='item-details'>")
                    .append("<div class='item-name'><strong>").append(itemName).append(brandInfo).append("</strong></div>");

            // Add dimensions if available
            if (accessory.getWidthMm() != null && accessory.getHeightMm() != null) {
                row.append("<div class='item-dimensions' style='font-size: 11px; color: #666; margin-top: 2px;'>")
                        .append("Size: ").append(accessory.getWidthMm()).append("mm × ")
                        .append(accessory.getHeightMm()).append("mm");

                if (accessory.getDepthMm() != null) {
                    row.append(" × ").append(accessory.getDepthMm()).append("mm");
                }
                row.append("</div>");
            }

            // Add material code if available
            if (accessory.getMaterialCode() != null && !accessory.getMaterialCode().trim().isEmpty()) {
                row.append("<div class='item-code' style='font-size: 10px; color: #888; margin-top: 1px;'>")
                        .append("Code: ").append(accessory.getMaterialCode()).append("</div>");
            }

            // Add color if available
            if (accessory.getColor() != null && !accessory.getColor().trim().isEmpty()) {
                row.append("<div class='item-color' style='font-size: 10px; color: #888;'>")
                        .append("Color: ").append(accessory.getColor()).append("</div>");
            }

            row.append("</div>") // Close item-details
                    .append("</div>"); // Close item-with-image
        } else {
            // Fallback for items without images
            row.append("<div class='item-text-only'>")
                    .append("<strong>").append(itemName).append(brandInfo).append("</strong>");

            if (accessory.getWidthMm() != null && accessory.getHeightMm() != null) {
                row.append("<br><small style='color: #666;'>")
                        .append(accessory.getWidthMm()).append("mm × ")
                        .append(accessory.getHeightMm()).append("mm</small>");
            }

            if (accessory.getMaterialCode() != null) {
                row.append("<br><small style='color: #888;'>Code: ")
                        .append(accessory.getMaterialCode()).append("</small>");
            }

            row.append("</div>");
        }

        row.append("</td>")
                .append("<td style='text-align: center; vertical-align: middle;'>")
                .append(accessory.getQuantity()).append("</td>")
                .append("<td style='text-align: center; vertical-align: middle;'>Pieces</td>")
                .append("<td style='text-align: right; vertical-align: middle;'>₹")
                .append(formatCurrency(accessory.getUnitPrice())).append("</td>");



        row.append("<td style='text-align: right; vertical-align: middle;'><strong>₹")
                .append(formatCurrency(accessory.getTotalPrice())).append("</strong></td>")
                .append("</tr>");

        return row.toString();
    }
}