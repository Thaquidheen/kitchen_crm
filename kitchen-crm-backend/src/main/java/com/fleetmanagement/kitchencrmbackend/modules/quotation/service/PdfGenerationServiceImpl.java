package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerPlanImage;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerPlanImageRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
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
import org.springframework.beans.factory.annotation.Value;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    private static final String QUOTATION_TEMPLATE_PATH = "classpath:templates/pdf/quotation-template.html";
    private static final String BILL_TEMPLATE_PATH = "classpath:templates/pdf/bill-template.html";


    private String generatePlanImagesHtml(Long customerId) {
        if (!includePlanImages) {
            return ""; // Don't include images if disabled
        }

        try {
            List<CustomerPlanImage> planImages = planImageRepository.findByCustomerId(customerId);

            if (planImages.isEmpty()) {
                return "";
            }

            StringBuilder imagesHtml = new StringBuilder();
            imagesHtml.append("<div class='plan-images-section'>");
            imagesHtml.append("<h2 class='plan-images-title'>Project Plan Images</h2>");

            // Group images by type for better organization
            Map<CustomerPlanImage.ImageType, List<CustomerPlanImage>> groupedImages =
                    planImages.stream().collect(Collectors.groupingBy(CustomerPlanImage::getImageType));

            for (Map.Entry<CustomerPlanImage.ImageType, List<CustomerPlanImage>> entry : groupedImages.entrySet()) {
                String typeTitle = formatImageType(entry.getKey());
                List<CustomerPlanImage> typeImages = entry.getValue();

                imagesHtml.append("<div class='image-type-section'>");
                imagesHtml.append("<h3 class='image-type-title'>").append(typeTitle).append("</h3>");
                imagesHtml.append("<div class='plan-images-grid'>");

                for (CustomerPlanImage planImage : typeImages) {
                    imagesHtml.append(generateSingleImageHtml(planImage));
                }

                imagesHtml.append("</div>");
                imagesHtml.append("</div>");
            }

            imagesHtml.append("</div>");
            return imagesHtml.toString();

        } catch (Exception e) {
            System.err.println("Error generating plan images HTML: " + e.getMessage());
            return "<div class='plan-images-section'><p>Error loading plan images.</p></div>";
        }
    }

    private String generateSingleImageHtml(CustomerPlanImage planImage) {
        StringBuilder imageHtml = new StringBuilder();

        imageHtml.append("<div class='plan-image-item'>");
        imageHtml.append("<div class='plan-image-header'>");
        imageHtml.append("<span class='image-name'>").append(planImage.getImageName()).append("</span>");
        imageHtml.append("</div>");

        // Try to load and convert image
        String base64Image = imageService.convertImageToBase64WithResize(planImage.getImageUrl());

        if (base64Image != null) {
            imageHtml.append("<img src='data:image/jpeg;base64,").append(base64Image).append("' ");
            imageHtml.append("class='plan-image' alt='").append(planImage.getImageName()).append("' />");
        } else {
            imageHtml.append("<div class='image-placeholder'>");
            imageHtml.append("<p>Image not available</p>");
            imageHtml.append("<p class='image-filename'>").append(planImage.getImageName()).append("</p>");
            imageHtml.append("</div>");
        }

        imageHtml.append("</div>");
        return imageHtml.toString();
    }
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
        try {
            Resource resource = resourceLoader.getResource(templatePath);
            if (resource.exists()) {
                return Files.readString(resource.getFile().toPath());
            } else {
                // Fallback to classpath resource reading
                return new String(resource.getInputStream().readAllBytes());
            }
        } catch (Exception e) {
            // If template loading fails, return a basic template
            return getBasicQuotationTemplate();
        }
    }

    private String getBasicQuotationTemplate() {
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 20px; }
                .company-name { font-size: 24px; color: #007bff; font-weight: bold; }
                .document-title { font-size: 28px; color: #007bff; font-weight: bold; text-align: right; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total-row { background-color: #007bff; color: white; font-weight: bold; }
                .category-header { background-color: #007bff; color: white; font-weight: bold; text-align: center; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">{{COMPANY_NAME}}</div>
                <div class="document-title">{{DOCUMENT_TITLE}}</div>
                <p>{{DOCUMENT_NUMBER}}</p>
                <p>Date: {{CREATED_DATE}}</p>
            </div>
            
            <div>
                <h3>Customer: {{CUSTOMER_NAME}}</h3>
                <p>Project: {{PROJECT_NAME}}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {{LINE_ITEMS}}
                </tbody>
            </table>
            
            <div style="text-align: right; margin-top: 20px;">
                <p><strong>Subtotal: ₹{{SUBTOTAL}}</strong></p>
                <p><strong>Tax ({{TAX_PERCENTAGE}}%): ₹{{TAX_AMOUNT}}</strong></p>
                <p class="total-row" style="padding: 10px; background: #007bff; color: white;"><strong>Total: ₹{{TOTAL_AMOUNT}}</strong></p>
            </div>
            
            <div style="margin-top: 20px;">
                <p><strong>Notes:</strong> {{NOTES}}</p>
            </div>
        </body>
        </html>
        """;
    }
    // NEW METHOD: Generate plan images HTML section


    private String formatImageType(CustomerPlanImage.ImageType imageType) {
        switch (imageType) {
            case FLOOR_PLAN: return "Floor Plan";
            case ELEVATION: return "Elevation View";
            case THREE_D_VIEW: return "3D View";
            case SECTION: return "Section View";
            default: return "Plan Image";
        }
    }

    private boolean isImageAccessible(String imageUrl) {
        // Check if the image URL is accessible (e.g., public URL)
        return imageUrl != null && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"));
    }

    private String convertImageToBase64(String imageUrl) {
        try {
            // Method 1: If images are stored locally
            if (imageUrl.startsWith("/uploads/") || imageUrl.startsWith("uploads/")) {
                Path imagePath = Paths.get("uploads/" + imageUrl.replace("/uploads/", ""));
                if (Files.exists(imagePath)) {
                    byte[] imageBytes = Files.readAllBytes(imagePath);
                    return Base64.getEncoder().encodeToString(imageBytes);
                }
            }

            // Method 2: If images are accessible via HTTP
            if (imageUrl.startsWith("http")) {
                URL url = new URL(imageUrl);
                try (InputStream inputStream = url.openStream()) {
                    byte[] imageBytes = inputStream.readAllBytes();
                    return Base64.getEncoder().encodeToString(imageBytes);
                }
            }

            return null;
        } catch (Exception e) {
            System.err.println("Error converting image to base64: " + imageUrl + " - " + e.getMessage());
            return null;
        }
    }

    private String replacePlaceholders(String htmlContent, QuotationDto quotation, String userRole, boolean isBill) {
        // Company information
        htmlContent = htmlContent.replace("{{COMPANY_NAME}}", "Kitchen CRM Company");
        htmlContent = htmlContent.replace("{{COMPANY_ADDRESS}}", "123 Business Street, City, State - 12345");
        htmlContent = htmlContent.replace("{{COMPANY_PHONE}}", "+91 9876543210");
        htmlContent = htmlContent.replace("{{COMPANY_EMAIL}}", "info@kitchencrm.com");

        // Document information
        htmlContent = htmlContent.replace("{{DOCUMENT_TITLE}}", isBill ? "INVOICE" : "QUOTATION");
        htmlContent = htmlContent.replace("{{DOCUMENT_NUMBER}}", quotation.getQuotationNumber());

        // Customer information
        htmlContent = htmlContent.replace("{{CUSTOMER_NAME}}", quotation.getCustomerName() != null ? quotation.getCustomerName() : "");
        htmlContent = htmlContent.replace("{{PROJECT_NAME}}", quotation.getProjectName() != null ? quotation.getProjectName() : "");

        // Dates
        htmlContent = htmlContent.replace("{{CREATED_DATE}}", quotation.getCreatedAt().toLocalDate().toString());
        htmlContent = htmlContent.replace("{{VALID_UNTIL}}", quotation.getValidUntil() != null ? quotation.getValidUntil().toString() : "");

        // Generate GROUPED line items HTML
        StringBuilder lineItemsHtml = new StringBuilder();

        // Calculate category totals
        BigDecimal accessoriesTotal = BigDecimal.ZERO;
        BigDecimal cabinetsTotal = BigDecimal.ZERO;
        BigDecimal doorsTotal = BigDecimal.ZERO;
        BigDecimal lightingTotal = BigDecimal.ZERO;

        htmlContent = htmlContent.replace("{{PLAN_IMAGES}}", generatePlanImagesHtml(quotation.getCustomerId()));


        // ACCESSORIES SECTION
        if (quotation.getAccessories() != null && !quotation.getAccessories().isEmpty()) {
            lineItemsHtml.append("<tr class='category-header'>")
                    .append("<td colspan='2'><strong>ACCESSORIES</strong></td>")
                    .append("</tr>");

            for (QuotationAccessoryDto accessory : quotation.getAccessories()) {
                lineItemsHtml.append(createGroupedAccessoryRow(accessory));
                accessoriesTotal = accessoriesTotal.add(accessory.getTotalPrice());
            }

            // Accessories total row
            lineItemsHtml.append("<tr class='category-total'>")
                    .append("<td><strong>Total Accessories:</strong></td>")
                    .append("<td><strong>₹").append(formatCurrency(accessoriesTotal)).append("</strong></td>")
                    .append("</tr>");

            // Add spacing
            lineItemsHtml.append("<tr class='spacer'><td colspan='2'>&nbsp;</td></tr>");
        }

        // CABINETS SECTION
        if (quotation.getCabinets() != null && !quotation.getCabinets().isEmpty()) {
            lineItemsHtml.append("<tr class='category-header'>")
                    .append("<td colspan='2'><strong>CABINETS</strong></td>")
                    .append("</tr>");

            for (QuotationCabinetDto cabinet : quotation.getCabinets()) {
                lineItemsHtml.append(createGroupedCabinetRow(cabinet));
                cabinetsTotal = cabinetsTotal.add(cabinet.getTotalPrice());
            }

            // Cabinets total row
            lineItemsHtml.append("<tr class='category-total'>")
                    .append("<td><strong>Total Cabinets:</strong></td>")
                    .append("<td><strong>₹").append(formatCurrency(cabinetsTotal)).append("</strong></td>")
                    .append("</tr>");

            // Add spacing
            lineItemsHtml.append("<tr class='spacer'><td colspan='2'>&nbsp;</td></tr>");
        }

        // DOORS SECTION
        if (quotation.getDoors() != null && !quotation.getDoors().isEmpty()) {
            lineItemsHtml.append("<tr class='category-header'>")
                    .append("<td colspan='2'><strong>DOORS</strong></td>")
                    .append("</tr>");

            for (QuotationDoorDto door : quotation.getDoors()) {
                lineItemsHtml.append(createGroupedDoorRow(door));
                doorsTotal = doorsTotal.add(door.getTotalPrice());
            }

            // Doors total row
            lineItemsHtml.append("<tr class='category-total'>")
                    .append("<td><strong>Total Doors:</strong></td>")
                    .append("<td><strong>₹").append(formatCurrency(doorsTotal)).append("</strong></td>")
                    .append("</tr>");

            // Add spacing
            lineItemsHtml.append("<tr class='spacer'><td colspan='2'>&nbsp;</td></tr>");
        }

        // LIGHTING & PROFILES SECTION
        if (quotation.getLighting() != null && !quotation.getLighting().isEmpty()) {
            lineItemsHtml.append("<tr class='category-header'>")
                    .append("<td colspan='2'><strong>LIGHTING & PROFILES</strong></td>")
                    .append("</tr>");

            for (QuotationLightingDto lighting : quotation.getLighting()) {
                lineItemsHtml.append(createGroupedLightingRow(lighting));
                lightingTotal = lightingTotal.add(lighting.getTotalPrice());
            }

            // Lighting total row
            lineItemsHtml.append("<tr class='category-total'>")
                    .append("<td><strong>Total Lighting & Profiles:</strong></td>")
                    .append("<td><strong>₹").append(formatCurrency(lightingTotal)).append("</strong></td>")
                    .append("</tr>");

            // Add spacing
            lineItemsHtml.append("<tr class='spacer'><td colspan='2'>&nbsp;</td></tr>");
        }

        // SERVICES SECTION (Transportation and Installation)
        BigDecimal servicesTotal = BigDecimal.ZERO;
        if ((quotation.getTransportationPrice() != null && quotation.getTransportationPrice().compareTo(BigDecimal.ZERO) > 0) ||
                (quotation.getInstallationPrice() != null && quotation.getInstallationPrice().compareTo(BigDecimal.ZERO) > 0)) {

            lineItemsHtml.append("<tr class='category-header'>")
                    .append("<td colspan='2'><strong>SERVICES</strong></td>")
                    .append("</tr>");

            if (quotation.getTransportationPrice() != null && quotation.getTransportationPrice().compareTo(BigDecimal.ZERO) > 0) {
                lineItemsHtml.append("<tr>")
                        .append("<td>Transportation Service (Qty: 1)</td>")
                        .append("<td></td>")
                        .append("</tr>");
                servicesTotal = servicesTotal.add(quotation.getTransportationPrice());
            }

            if (quotation.getInstallationPrice() != null && quotation.getInstallationPrice().compareTo(BigDecimal.ZERO) > 0) {
                lineItemsHtml.append("<tr>")
                        .append("<td>Installation Service (Qty: 1)</td>")
                        .append("<td></td>")
                        .append("</tr>");
                servicesTotal = servicesTotal.add(quotation.getInstallationPrice());
            }

            // Services total row
            lineItemsHtml.append("<tr class='category-total'>")
                    .append("<td><strong>Total Services:</strong></td>")
                    .append("<td><strong>₹").append(formatCurrency(servicesTotal)).append("</strong></td>")
                    .append("</tr>");
        }

        htmlContent = htmlContent.replace("{{LINE_ITEMS}}", lineItemsHtml.toString());

        // Calculate and set totals
        BigDecimal subtotal = accessoriesTotal.add(cabinetsTotal).add(doorsTotal).add(lightingTotal).add(servicesTotal);

        htmlContent = htmlContent.replace("{{SUBTOTAL}}", formatCurrency(subtotal));
        htmlContent = htmlContent.replace("{{TAX_PERCENTAGE}}", quotation.getTaxPercentage().toString());
        htmlContent = htmlContent.replace("{{TAX_AMOUNT}}", formatCurrency(quotation.getTaxAmount()));
        htmlContent = htmlContent.replace("{{TOTAL_AMOUNT}}", formatCurrency(quotation.getTotalAmount()));

        // Notes and terms
        htmlContent = htmlContent.replace("{{NOTES}}", quotation.getNotes() != null ? quotation.getNotes() : "No special notes");
        htmlContent = htmlContent.replace("{{TERMS_CONDITIONS}}", quotation.getTermsConditions() != null ? quotation.getTermsConditions() : "Standard terms and conditions apply");

        // Amount in words (for bills)
        if (isBill) {
            htmlContent = htmlContent.replace("{{AMOUNT_IN_WORDS}}", convertToWords(quotation.getTotalAmount()));
        }

        return htmlContent;
    }

    private String createGroupedAccessoryRow(QuotationAccessoryDto accessory) {
        StringBuilder row = new StringBuilder();

        // Get item name
        String itemName = "";
        if (accessory.getCustomItem() != null && accessory.getCustomItem()) {
            itemName = accessory.getCustomItemName() != null ? accessory.getCustomItemName() : "Custom Accessory";
        } else {
            itemName = accessory.getAccessoryName() != null ? accessory.getAccessoryName() : "Accessory Item";
        }

        // Add brand info if available
        String brandInfo = "";
        if (accessory.getBrandName() != null && !accessory.getBrandName().trim().isEmpty()) {
            brandInfo = " - " + accessory.getBrandName();
        }

        // Add specifications if available
        String specifications = "";
        if (accessory.getWidthMm() != null && accessory.getHeightMm() != null) {
            specifications = " (" + accessory.getWidthMm() + "×" + accessory.getHeightMm();
            if (accessory.getDepthMm() != null) {
                specifications += "×" + accessory.getDepthMm();
            }
            specifications += "mm)";
        }

        row.append("<tr class='item-row'>")
                .append("<td>").append(itemName).append(brandInfo).append(specifications)
                .append(" (Qty: ").append(accessory.getQuantity()).append(")</td>")
                .append("<td></td>") // Empty price column
                .append("</tr>");

        return row.toString();
    }

    private String createGroupedCabinetRow(QuotationCabinetDto cabinet) {
        StringBuilder row = new StringBuilder();

        // Get cabinet name
        String itemName = "";
        if (cabinet.getCabinetTypeName() != null && !cabinet.getCabinetTypeName().trim().isEmpty()) {
            itemName = cabinet.getCabinetTypeName();
        } else {
            itemName = "Cabinet";
        }

        // Add dimensions
        String dimensions = "";
        if (cabinet.getWidthMm() != null && cabinet.getHeightMm() != null && cabinet.getDepthMm() != null) {
            dimensions = " (" + cabinet.getWidthMm() + "×" + cabinet.getHeightMm() + "×" + cabinet.getDepthMm() + "mm)";
        }

        row.append("<tr class='item-row'>")
                .append("<td>").append(itemName).append(dimensions)
                .append(" (Qty: ").append(cabinet.getQuantity()).append(")</td>")
                .append("<td></td>") // Empty price column
                .append("</tr>");

        return row.toString();
    }

    private String createGroupedDoorRow(QuotationDoorDto door) {
        StringBuilder row = new StringBuilder();

        String itemName = door.getDoorTypeName() != null ? door.getDoorTypeName() : "Door";

        // Add style and finish info
        String styleInfo = "";
        if (door.getDoorStyle() != null || door.getDoorFinish() != null) {
            styleInfo = " (";
            if (door.getDoorStyle() != null) {
                styleInfo += door.getDoorStyle();
            }
            if (door.getDoorFinish() != null) {
                if (door.getDoorStyle() != null) styleInfo += ", ";
                styleInfo += door.getDoorFinish();
            }
            styleInfo += ")";
        }

        // Add dimensions
        String dimensions = "";
        if (door.getWidthMm() != null && door.getHeightMm() != null) {
            dimensions = " - " + door.getWidthMm() + "×" + door.getHeightMm() + "mm";
        }

        row.append("<tr class='item-row'>")
                .append("<td>").append(itemName).append(styleInfo).append(dimensions)
                .append(" (Qty: ").append(door.getQuantity()).append(")</td>")
                .append("<td></td>") // Empty price column
                .append("</tr>");

        return row.toString();
    }

    private String createGroupedLightingRow(QuotationLightingDto lighting) {
        StringBuilder row = new StringBuilder();

        // Get lighting item name
        String itemName = lighting.getItemName() != null ? lighting.getItemName() : "Lighting Item";

        // Add additional specifications
        String specifications = "";
        if (lighting.getWattage() != null) {
            specifications += " (" + lighting.getWattage() + "W)";
        }
        if (lighting.getProfileType() != null) {
            specifications += " - Profile " + lighting.getProfileType();
        }

        row.append("<tr class='item-row'>")
                .append("<td>").append(itemName).append(specifications)
                .append(" (Qty: ").append(formatCurrency(lighting.getQuantity())).append(")</td>")
                .append("<td></td>") // Empty price column
                .append("</tr>");

        return row.toString();
    }

    // FIXED: Line item creation methods - showing only total amounts
    private String createAccessoryLineItemRow(QuotationAccessoryDto accessory, String userRole) {
        StringBuilder row = new StringBuilder();

        // Get item name - handle both custom and regular accessories
        String itemName = "";
        if (accessory.getCustomItem() != null && accessory.getCustomItem()) {
            itemName = accessory.getCustomItemName() != null ? accessory.getCustomItemName() : "Custom Accessory";
        } else {
            itemName = accessory.getAccessoryName() != null ? accessory.getAccessoryName() : "Accessory Item";
        }

        // Add brand info if available
        String brandInfo = "";
        if (accessory.getBrandName() != null && !accessory.getBrandName().trim().isEmpty()) {
            brandInfo = " - " + accessory.getBrandName();
        }

        // Add specifications if available
        String specifications = "";
        if (accessory.getWidthMm() != null && accessory.getHeightMm() != null) {
            specifications = " (" + accessory.getWidthMm() + "×" + accessory.getHeightMm();
            if (accessory.getDepthMm() != null) {
                specifications += "×" + accessory.getDepthMm();
            }
            specifications += "mm)";
        }

        row.append("<tr>")
                .append("<td>").append(itemName).append(brandInfo).append(specifications).append("</td>")
                .append("<td>").append(accessory.getQuantity()).append("</td>")
                .append("<td>Pieces</td>")
                .append("<td>₹").append(formatCurrency(accessory.getTotalPrice())).append("</td>")
                .append("</tr>");

        return row.toString();
    }

    private String createCabinetLineItemRow(QuotationCabinetDto cabinet, String userRole) {
        StringBuilder row = new StringBuilder();

        // Get cabinet name
        String itemName = "";
        if (cabinet.getCabinetTypeName() != null && !cabinet.getCabinetTypeName().trim().isEmpty()) {
            itemName = cabinet.getCabinetTypeName();
        } else {
            itemName = "Cabinet";
        }

        // Add dimensions
        String dimensions = "";
        if (cabinet.getWidthMm() != null && cabinet.getHeightMm() != null && cabinet.getDepthMm() != null) {
            dimensions = " (" + cabinet.getWidthMm() + "×" + cabinet.getHeightMm() + "×" + cabinet.getDepthMm() + "mm)";
        }

        // Determine unit type
        String unit = cabinet.getCalculatedSqft() != null ? "Sq.ft" : "Pieces";

        row.append("<tr>")
                .append("<td>").append(itemName).append(dimensions).append("</td>")
                .append("<td>").append(cabinet.getQuantity()).append("</td>")
                .append("<td>").append(unit).append("</td>")
                .append("<td>₹").append(formatCurrency(cabinet.getTotalPrice())).append("</td>")
                .append("</tr>");

        return row.toString();
    }

    private String createDoorLineItemRow(QuotationDoorDto door, String userRole) {
        StringBuilder row = new StringBuilder();

        String itemName = door.getDoorTypeName() != null ? door.getDoorTypeName() : "Door";

        // Add style and finish info
        String styleInfo = "";
        if (door.getDoorStyle() != null || door.getDoorFinish() != null) {
            styleInfo = " (";
            if (door.getDoorStyle() != null) {
                styleInfo += door.getDoorStyle();
            }
            if (door.getDoorFinish() != null) {
                if (door.getDoorStyle() != null) styleInfo += ", ";
                styleInfo += door.getDoorFinish();
            }
            styleInfo += ")";
        }

        // Add dimensions
        String dimensions = "";
        if (door.getWidthMm() != null && door.getHeightMm() != null) {
            dimensions = " - " + door.getWidthMm() + "×" + door.getHeightMm() + "mm";
        }

        String unit = door.getCalculatedSqft() != null ? "Sq.ft" : "Pieces";

        row.append("<tr>")
                .append("<td>").append(itemName).append(styleInfo).append(dimensions).append("</td>")
                .append("<td>").append(door.getQuantity()).append("</td>")
                .append("<td>").append(unit).append("</td>")
                .append("<td>₹").append(formatCurrency(door.getTotalPrice())).append("</td>")
                .append("</tr>");

        return row.toString();
    }

    private String createLightingLineItemRow(QuotationLightingDto lighting, String userRole) {
        StringBuilder row = new StringBuilder();

        // Get lighting item name
        String itemName = lighting.getItemName() != null ? lighting.getItemName() : "Lighting Item";

        // Add additional specifications
        String specifications = "";
        if (lighting.getWattage() != null) {
            specifications += " (" + lighting.getWattage() + "W)";
        }
        if (lighting.getProfileType() != null) {
            specifications += " - Profile " + lighting.getProfileType();
        }

        row.append("<tr>")
                .append("<td>").append(itemName).append(specifications).append("</td>")
                .append("<td>").append(formatCurrency(lighting.getQuantity())).append("</td>")
                .append("<td>").append(lighting.getUnit() != null ? lighting.getUnit() : "Pieces").append("</td>")
                .append("<td>₹").append(formatCurrency(lighting.getTotalPrice())).append("</td>")
                .append("</tr>");

        return row.toString();
    }

    private byte[] convertHtmlToPdf(String htmlContent) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try {
            // Initialize PDF writer
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdfDoc = new PdfDocument(writer);

            // Set page size
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

    // Helper method to convert number to words (basic implementation)
    private String convertToWords(BigDecimal amount) {
        if (amount == null) {
            return "Zero Rupees Only";
        }

        long rupees = amount.longValue();
        int paise = (int) ((amount.remainder(BigDecimal.ONE)).multiply(BigDecimal.valueOf(100)).intValue());

        StringBuilder words = new StringBuilder();
        words.append(numberToWords(rupees)).append(" Rupees");

        if (paise > 0) {
            words.append(" and ").append(numberToWords(paise)).append(" Paise");
        }

        words.append(" Only");
        return words.toString();
    }

    // Basic number to words conversion (you can enhance this)
    private String numberToWords(long number) {
        if (number == 0) return "Zero";

        String[] ones = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
                "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
                "Seventeen", "Eighteen", "Nineteen"};

        String[] tens = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};

        if (number < 20) {
            return ones[(int) number];
        } else if (number < 100) {
            return tens[(int) number / 10] + (number % 10 != 0 ? " " + ones[(int) number % 10] : "");
        } else if (number < 1000) {
            return ones[(int) number / 100] + " Hundred" + (number % 100 != 0 ? " " + numberToWords(number % 100) : "");
        } else if (number < 100000) {
            return numberToWords(number / 1000) + " Thousand" + (number % 1000 != 0 ? " " + numberToWords(number % 1000) : "");
        } else if (number < 10000000) {
            return numberToWords(number / 100000) + " Lakh" + (number % 100000 != 0 ? " " + numberToWords(number % 100000) : "");
        } else {
            return numberToWords(number / 10000000) + " Crore" + (number % 10000000 != 0 ? " " + numberToWords(number % 10000000) : "");
        }
    }
}