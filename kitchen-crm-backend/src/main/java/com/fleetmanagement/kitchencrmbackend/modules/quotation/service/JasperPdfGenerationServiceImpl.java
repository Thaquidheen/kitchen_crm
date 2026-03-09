package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.settings.entity.SystemSetting;
import com.fleetmanagement.kitchencrmbackend.modules.settings.repository.SystemSettingRepository;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.export.JRPdfExporter;
import net.sf.jasperreports.engine.util.JRSaver;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import net.sf.jasperreports.export.SimplePdfExporterConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import javax.imageio.ImageIO;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class JasperPdfGenerationServiceImpl implements JasperPdfGenerationService {

    private static final String JASPER_TEMPLATE_DIR = "classpath:templates/jasper/";
    private static final String MAIN_REPORT = "quotation-main.jrxml";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM-dd-yyyy", java.util.Locale.ENGLISH);

    @Value("${app.pdf.include-plan-images:true}")
    private boolean includePlanImages;

    @Autowired
    private QuotationService quotationService;

    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    private ImageService imageService;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    // Cache compiled reports for performance
    private Map<String, JasperReport> compiledReports = new HashMap<>();

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
            e.printStackTrace();
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
            e.printStackTrace();
            return ApiResponse.error("Failed to generate bill PDF: " + e.getMessage());
        }
    }

    @Override
    public byte[] createQuotationPdfBytes(QuotationDto quotation, String userRole) {
        try {
            // Load and compile the main report
            JasperReport mainReport = compileReport(MAIN_REPORT);

            // Compile all subreports to a temp directory
            Path subreportDir = compileAllSubreports();

            // Build parameters
            Map<String, Object> parameters = buildParameters(quotation);
            parameters.put("SUBREPORT_DIR", subreportDir.toString() + File.separator);

            // Build data source for kitchens
            JRDataSource kitchensDataSource = buildKitchensDataSource(quotation);
            parameters.put("KITCHENS_DATA_SOURCE", kitchensDataSource);

            // Fill the report
            JasperPrint jasperPrint = JasperFillManager.fillReport(
                mainReport,
                parameters,
                new JREmptyDataSource()
            );

            // Export to PDF
            return exportToPdf(jasperPrint);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to create quotation PDF: " + e.getMessage(), e);
        }
    }

    private byte[] generateGradientBackground(int width, int height) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_COLOR_RENDERING, RenderingHints.VALUE_COLOR_RENDER_QUALITY);

        // Warm cream (top) → off-white (bottom) — complements dark charcoal cover
        Color startColor = new Color(0xF5, 0xF0, 0xE8);
        Color endColor = new Color(0xFE, 0xFC, 0xFA);
        GradientPaint gradient = new GradientPaint(0, 0, startColor, 0, height, endColor);

        g2d.setPaint(gradient);
        g2d.fillRect(0, 0, width, height);
        g2d.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", baos);
        return baos.toByteArray();
    }

    private byte[] generateGlassOverlay(int width, int height, int cornerRadius) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = image.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        // Semi-transparent dark fill (~70% opacity)
        g2d.setColor(new Color(0x33, 0x33, 0x33, 0xB3));
        g2d.fillRoundRect(0, 0, width, height, cornerRadius, cornerRadius);
        g2d.dispose();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        return baos.toByteArray();
    }

    @Override
    public byte[] addApprovalStampToPdf(byte[] originalPdfBytes, PdfApprovalStampDto approvalData) {
        // Simple implementation - return original PDF
        // Can be enhanced later with iText to add stamps
        return originalPdfBytes;
    }

    private JasperReport compileReport(String reportName) throws JRException {
        if (compiledReports.containsKey(reportName)) {
            return compiledReports.get(reportName);
        }

        try {
            Resource resource = resourceLoader.getResource(JASPER_TEMPLATE_DIR + reportName);
            try (InputStream is = resource.getInputStream()) {
                JasperReport report = JasperCompileManager.compileReport(is);
                compiledReports.put(reportName, report);
                return report;
            }
        } catch (Exception e) {
            throw new JRException("Failed to compile report: " + reportName, e);
        }
    }

    private Path compileAllSubreports() throws Exception {
        Path tempDir = Files.createTempDirectory("jasper-subreports");
        String[] subreports = {
            "quotation-kitchen.jrxml",
            "subreport-scope.jrxml",
            "subreport-images.jrxml",
            "subreport-products.jrxml",
            "subreport-accessories.jrxml",
            "subreport-lighting.jrxml",
            "subreport-other-expenses.jrxml",
            "subreport-kitchen-totals.jrxml"
        };
        for (String name : subreports) {
            Resource res = resourceLoader.getResource(JASPER_TEMPLATE_DIR + name);
            try (InputStream is = res.getInputStream()) {
                JasperReport report = JasperCompileManager.compileReport(is);
                String jasperName = name.replace(".jrxml", ".jasper");
                JRSaver.saveObject(report, tempDir.resolve(jasperName).toFile());
            }
        }
        return tempDir;
    }

    private Map<String, Object> buildParameters(QuotationDto quotation) {
        Map<String, Object> params = new HashMap<>();

        // Company settings
        params.put("COMPANY_NAME", getSettingValue("company.name", "THE HOCH"));
        params.put("COMPANY_TAGLINE", getSettingValue("company.tagline", "Modular Interiors & Design Solutions"));

        String addressLine1 = getSettingValue("company.address_line1", "");
        String addressLine2 = getSettingValue("company.address_line2", "");
        String companyAddress = addressLine1 + (addressLine2.isEmpty() ? "" : ", " + addressLine2);
        params.put("COMPANY_ADDRESS", companyAddress);
        params.put("COMPANY_PHONE", getSettingValue("company.phone", ""));
        params.put("COMPANY_EMAIL", getSettingValue("company.email", ""));

        // Company logo
        String logoBase64 = getSettingValue("company.logo_base64", "");
        boolean hasLogo = logoBase64 != null && !logoBase64.isEmpty();
        params.put("HAS_LOGO", hasLogo);
        if (hasLogo && logoBase64 != null) {
            try {
                // Remove data URI prefix if present
                String base64Data = logoBase64;
                if (base64Data.contains(",")) {
                    base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
                }
                byte[] imageBytes = Base64.getDecoder().decode(base64Data);
                params.put("COMPANY_LOGO", new ByteArrayInputStream(imageBytes));
            } catch (Exception e) {
                params.put("COMPANY_LOGO", null);
                params.put("HAS_LOGO", false);
            }
        } else {
            params.put("COMPANY_LOGO", null);
        }

        // HOCH brand logo from classpath — byte[] so it can render in every footer
        try {
            Resource hochLogoResource = resourceLoader.getResource("classpath:hoch.png");
            if (hochLogoResource.exists()) {
                params.put("HOCH_LOGO", hochLogoResource.getInputStream().readAllBytes());
            } else {
                params.put("HOCH_LOGO", null);
            }
        } catch (Exception e) {
            params.put("HOCH_LOGO", null);
        }

        // Main logo from classpath — byte[] so it can render on cover + every footer
        try {
            Resource mainLogoResource = resourceLoader.getResource("classpath:logo.png");
            if (mainLogoResource.exists()) {
                params.put("MAIN_LOGO", mainLogoResource.getInputStream().readAllBytes());
            } else {
                params.put("MAIN_LOGO", null);
            }
        } catch (Exception e) {
            params.put("MAIN_LOGO", null);
        }

        // Glassmorphism overlay for cover box (semi-transparent dark with rounded corners)
        try {
            params.put("COVER_BOX_BG", generateGlassOverlay(495, 200, 12));
        } catch (Exception e) {
            params.put("COVER_BOX_BG", null);
        }

        // Page background — programmatic gradient (warm cream top → off-white bottom)
        try {
            params.put("PAGE_BG", generateGradientBackground(595, 842));
        } catch (Exception e) {
            params.put("PAGE_BG", null);
        }

        // Cover page background image from classpath
        try {
            Resource coverBgResource = resourceLoader.getResource("classpath:cover.png");
            if (coverBgResource.exists()) {
                params.put("COVER_BG", coverBgResource.getInputStream());
            } else {
                params.put("COVER_BG", null);
            }
        } catch (Exception e) {
            params.put("COVER_BG", null);
        }

        // Quotation details
        params.put("QUOTATION_NUMBER", quotation.getQuotationNumber() != null ? quotation.getQuotationNumber() : "");
        LocalDate createdDate = quotation.getUpdatedAt() != null ? quotation.getUpdatedAt().toLocalDate() :
                (quotation.getCreatedAt() != null ? quotation.getCreatedAt().toLocalDate() : LocalDate.now());
        LocalDate validUntil = quotation.getValidUntil() != null ? quotation.getValidUntil() : createdDate.plusDays(30);
        params.put("CREATED_DATE", formatDate(createdDate));
        params.put("VALID_UNTIL", formatDate(validUntil));
        params.put("CUSTOMER_NAME", quotation.getCustomerName() != null ? quotation.getCustomerName() : "");
        params.put("CUSTOMER_ADDRESS", quotation.getCustomerAddress() != null ? quotation.getCustomerAddress() : "");
        params.put("PROJECT_NAME", quotation.getProjectName() != null ? quotation.getProjectName() : "");

        // Kitchen info
        List<QuotationKitchenDto> kitchens = quotation.getKitchens();
        int totalKitchens = kitchens != null ? kitchens.size() : 1;
        params.put("TOTAL_KITCHENS", totalKitchens);

        // Kitchen names
        String kitchenNames = "";
        if (kitchens != null && !kitchens.isEmpty()) {
            kitchenNames = kitchens.stream()
                .map(k -> k.getKitchenName() != null ? k.getKitchenName() : "Kitchen")
                .collect(Collectors.joining(" | "));
        }
        params.put("KITCHEN_NAMES", kitchenNames);

        // Other expenses total (for summary page)
        boolean isMultiKitchen = quotation.getKitchens() != null && !quotation.getKitchens().isEmpty();
        BigDecimal otherExpensesGrandTotal = BigDecimal.ZERO;
        if (isMultiKitchen) {
            for (QuotationKitchenDto k : quotation.getKitchens()) {
                if (k.getOtherExpenses() != null) {
                    for (QuotationOtherExpenseDto e : k.getOtherExpenses()) {
                        if (e.getAmount() != null) otherExpensesGrandTotal = otherExpensesGrandTotal.add(e.getAmount());
                    }
                }
            }
        }
        params.put("OTHER_EXPENSES_TOTAL", otherExpensesGrandTotal);
        // Legacy params (kept for backward compat)
        params.put("TRANSPORTATION_PRICE", BigDecimal.ZERO);
        params.put("INSTALLATION_PRICE", BigDecimal.ZERO);

        // Grand total
        BigDecimal grandTotal = calculateGrandTotal(quotation);
        params.put("GRAND_TOTAL", grandTotal);

        // Notes (per-quotation)
        String notes = quotation.getNotes();
        params.put("NOTES", notes != null ? notes : "");

        // Terms
        String termsGeneral = getTermsGeneral();
        // Per-quotation custom T&C overrides global general terms when provided
        String customTerms = quotation.getTermsConditions();
        if (customTerms != null && !customTerms.trim().isEmpty()) {
            termsGeneral = customTerms;
        }
        params.put("TERMS_GENERAL", termsGeneral);
        String termsWarranty = getTermsWarranty();
        String customWarranty = quotation.getWarrantyAndService();
        if (customWarranty != null && !customWarranty.trim().isEmpty()) {
            termsWarranty = customWarranty;
        }
        params.put("TERMS_WARRANTY", termsWarranty);

        // Important Note & Payment Terms
        String importantNote = quotation.getImportantNote();
        if (importantNote == null || importantNote.isEmpty()) {
            importantNote = getDefaultImportantNote();
        }
        params.put("IMPORTANT_NOTE", importantNote);

        BigDecimal acceptPct = quotation.getPaymentAcceptancePct() != null ? quotation.getPaymentAcceptancePct() : BigDecimal.valueOf(60);
        BigDecimal deliveryPct = quotation.getPaymentDeliveryPct() != null ? quotation.getPaymentDeliveryPct() : BigDecimal.valueOf(30);
        BigDecimal installPct = quotation.getPaymentInstallationPct() != null ? quotation.getPaymentInstallationPct() : BigDecimal.valueOf(10);
        params.put("PAYMENT_ACCEPTANCE_PCT", acceptPct);
        params.put("PAYMENT_DELIVERY_PCT", deliveryPct);
        params.put("PAYMENT_INSTALLATION_PCT", installPct);

        // Kitchen totals data source (for combined totals table when multiple kitchens)
        List<QuotationKitchenDto> kitchensList = quotation.getKitchens();
        if (kitchensList != null && kitchensList.size() > 1) {
            List<Map<String, Object>> kitchenTotals = new ArrayList<>();
            for (QuotationKitchenDto k : kitchensList) {
                Map<String, Object> row = new HashMap<>();
                row.put("kitchenName", k.getKitchenName() != null ? k.getKitchenName() : "Kitchen");
                row.put("totalAmount", k.getTotalAmount() != null ? k.getTotalAmount() : BigDecimal.ZERO);
                BigDecimal otherExpenses = BigDecimal.ZERO;
                if (k.getOtherExpenses() != null) {
                    otherExpenses = k.getOtherExpenses().stream()
                            .map(e -> e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                }
                row.put("otherExpenses", otherExpenses);
                kitchenTotals.add(row);
            }
            params.put("KITCHEN_TOTALS_DATA", new net.sf.jasperreports.engine.data.JRBeanCollectionDataSource(kitchenTotals));
        } else {
            params.put("KITCHEN_TOTALS_DATA", null);
        }

        return params;
    }

    private JRDataSource buildKitchensDataSource(QuotationDto quotation) {
        List<QuotationKitchenDto> kitchens = quotation.getKitchens();

        if (kitchens == null || kitchens.isEmpty()) {
            // Single kitchen mode - create a virtual kitchen from quotation data
            QuotationKitchenDto virtualKitchen = createVirtualKitchen(quotation);
            kitchens = Collections.singletonList(virtualKitchen);
        }

        // Process images for each kitchen
        List<Map<String, Object>> kitchenData = new ArrayList<>();
        for (QuotationKitchenDto kitchen : kitchens) {
            Map<String, Object> kitchenMap = convertKitchenToMap(kitchen);
            kitchenData.add(kitchenMap);
        }

        return new JRBeanCollectionDataSource(kitchenData);
    }

    private Map<String, Object> convertKitchenToMap(QuotationKitchenDto kitchen) {
        Map<String, Object> map = new HashMap<>();

        map.put("kitchenName", kitchen.getKitchenName() != null ? kitchen.getKitchenName() : "Kitchen");
        map.put("scopeDetails", kitchen.getScopeDetails() != null ? kitchen.getScopeDetails() : Collections.emptyList());

        // Process plan images with base64 conversion
        List<Map<String, Object>> processedImages = new ArrayList<>();
        if (includePlanImages && kitchen.getPlanImages() != null) {
            for (QuotationKitchenPlanImageDto img : kitchen.getPlanImages()) {
                Map<String, Object> imageMap = new HashMap<>();
                imageMap.put("imageName", img.getImageName());
                imageMap.put("imageOrder", img.getImageOrder());

                // Convert image URL to base64
                String imageBase64 = null;
                if (img.getImageUrl() != null && !img.getImageUrl().isEmpty()) {
                    try {
                        imageBase64 = imageService.convertImageToBase64WithResize(img.getImageUrl());
                        // Remove data URI prefix for JasperReports
                        if (imageBase64 != null && imageBase64.contains(",")) {
                            imageBase64 = imageBase64.substring(imageBase64.indexOf(",") + 1);
                        }
                    } catch (Exception e) {
                        // Log and continue without image
                        System.err.println("Failed to process image: " + e.getMessage());
                    }
                }
                imageMap.put("imageBase64", imageBase64);
                processedImages.add(imageMap);
            }
        }
        map.put("planImages", processedImages);

        // Products
        map.put("cabinets", kitchen.getCabinets() != null ? kitchen.getCabinets() : Collections.emptyList());
        map.put("doors", kitchen.getDoors() != null ? kitchen.getDoors() : Collections.emptyList());
        map.put("accessories", kitchen.getAccessories() != null ? kitchen.getAccessories() : Collections.emptyList());
        map.put("lighting", kitchen.getLighting() != null ? kitchen.getLighting() : Collections.emptyList());

        // Other expenses
        List<QuotationOtherExpenseDto> otherExpensesList = kitchen.getOtherExpenses() != null ? kitchen.getOtherExpenses() : Collections.emptyList();
        map.put("otherExpenses", otherExpensesList);
        BigDecimal otherExpensesTotal = otherExpensesList.stream()
                .map(e -> e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        map.put("otherExpensesTotal", otherExpensesTotal);

        // Totals
        map.put("cabinetsFinalTotal", kitchen.getCabinetsFinalTotal() != null ? kitchen.getCabinetsFinalTotal() : BigDecimal.ZERO);
        map.put("doorsFinalTotal", kitchen.getDoorsFinalTotal() != null ? kitchen.getDoorsFinalTotal() : BigDecimal.ZERO);
        map.put("accessoriesFinalTotal", kitchen.getAccessoriesFinalTotal() != null ? kitchen.getAccessoriesFinalTotal() : BigDecimal.ZERO);
        map.put("lightingFinalTotal", kitchen.getLightingFinalTotal() != null ? kitchen.getLightingFinalTotal() : BigDecimal.ZERO);
        map.put("subtotal", kitchen.getSubtotal() != null ? kitchen.getSubtotal() : BigDecimal.ZERO);
        map.put("marginAmount", kitchen.getMarginAmount() != null ? kitchen.getMarginAmount() : BigDecimal.ZERO);
        map.put("taxAmount", kitchen.getTaxAmount() != null ? kitchen.getTaxAmount() : BigDecimal.ZERO);
        map.put("totalAmount", kitchen.getTotalAmount() != null ? kitchen.getTotalAmount() : BigDecimal.ZERO);

        return map;
    }

    private QuotationKitchenDto createVirtualKitchen(QuotationDto quotation) {
        QuotationKitchenDto kitchen = new QuotationKitchenDto();
        kitchen.setKitchenName(quotation.getProjectName() != null ? quotation.getProjectName() : "Kitchen");

        // Copy products from quotation level
        kitchen.setCabinets(quotation.getCabinets());
        kitchen.setDoors(quotation.getDoors());
        kitchen.setAccessories(quotation.getAccessories());
        kitchen.setLighting(quotation.getLighting());
        kitchen.setOtherExpenses(quotation.getOtherExpenses());

        // Copy totals from quotation level
        kitchen.setCabinetsFinalTotal(quotation.getCabinetsFinalTotal());
        kitchen.setDoorsFinalTotal(quotation.getDoorsFinalTotal());
        kitchen.setAccessoriesFinalTotal(quotation.getAccessoriesFinalTotal());
        kitchen.setLightingFinalTotal(quotation.getLightingFinalTotal());
        kitchen.setSubtotal(quotation.getSubtotal());
        kitchen.setMarginAmount(quotation.getMarginAmount());
        kitchen.setTaxAmount(quotation.getTaxAmount());
        kitchen.setTotalAmount(quotation.getTotalAmount());

        return kitchen;
    }

    private BigDecimal calculateGrandTotal(QuotationDto quotation) {
        BigDecimal total;
        if (quotation.getKitchens() != null && !quotation.getKitchens().isEmpty()) {
            // Multi-kitchen: kitchen totals already include per-kitchen transportation/installation
            total = quotation.getKitchens().stream()
                .map(k -> k.getTotalAmount() != null ? k.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        } else if (quotation.getTotalAmount() != null) {
            total = quotation.getTotalAmount();
        } else {
            total = BigDecimal.ZERO;
        }
        // Add quotation-level other expenses (only for single-kitchen mode)
        if (quotation.getKitchens() == null || quotation.getKitchens().isEmpty()) {
            if (quotation.getOtherExpenses() != null) {
                for (QuotationOtherExpenseDto e : quotation.getOtherExpenses()) {
                    if (e.getAmount() != null) total = total.add(e.getAmount());
                }
            } else {
                // Fallback to legacy fields
                if (quotation.getTransportationPrice() != null) total = total.add(quotation.getTransportationPrice());
                if (quotation.getInstallationPrice() != null) total = total.add(quotation.getInstallationPrice());
            }
        }
        return total;
    }

    private byte[] exportToPdf(JasperPrint jasperPrint) throws JRException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        JRPdfExporter exporter = new JRPdfExporter();
        exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
        exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(baos));

        SimplePdfExporterConfiguration configuration = new SimplePdfExporterConfiguration();
        configuration.setMetadataAuthor("Kitchen CRM");
        configuration.setMetadataCreator("JasperReports");
        exporter.setConfiguration(configuration);

        exporter.exportReport();

        return baos.toByteArray();
    }

    private String getSettingValue(String key, String defaultValue) {
        Optional<SystemSetting> setting = systemSettingRepository.findBySettingKey(key);
        return setting.map(SystemSetting::getSettingValue).orElse(defaultValue);
    }

    private String formatDate(LocalDate date) {
        if (date == null) return "";
        return date.format(DATE_FORMATTER).toUpperCase();
    }

    private String getTermsGeneral() {
        String terms = getSettingValue("quotation.terms.general", null);
        if (terms != null && !terms.isEmpty()) {
            return terms;
        }
        return "<ul>" +
            "<li>The Above-mentioned Terms are Subjected to Change depending upon the delay from Client side to provide necessary Inputs/Approvals</li>" +
            "<li>Kitchen Delivery and Installation will not proceed unless site condition requirements outlined in our Terms and Conditions.</li>" +
            "<li>Unloading Expenses of the materials at the sight to be bear by the customer</li>" +
            "<li>Our scope is limited to the installation of the specified items only. There will be additional charges for installing any items not included in this offer.</li>" +
            "<li>The client must provide all plumbing and electrical items, including faucets, as part of their scope. All plumbing outlets and electrical points should be installed according to our site drawing</li>" +
            "<li>The client should provide safe storage spaces for materials during installation at the site.</li>" +
            "</ul>";
    }

    private String getTermsWarranty() {
        String terms = getSettingValue("quotation.terms.warranty", null);
        if (terms != null && !terms.isEmpty()) {
            return terms;
        }
        return "We Warrant the Steel Furniture We Sell to Be Free from Defects in Material and Workmanship Under " +
            "Normal Residential Usage to The Original Purchaser for The Period Specified Below. We Will Repair Any " +
            "Part That Proves to Be Defective in Materials and Workmanship. If Repair Is Not Possible, We Will Either " +
            "Replace the Part with A New Part or A Component of Similar Composition and Price." +
            "<br/><br/>" +
            "This Warranty Does Not Apply to Any Issues with Our Furniture or Parts of Our Furniture That Result from " +
            "Improper Handling, Negligence, Alterations, Accidents, Misuse, Improper Cleaning or Care, Or Natural " +
            "Calamities. Additionally, Consequential and Incidental Damages Are Not Covered Under This Warranty." +
            "<br/><br/>" +
            "<b>Stainless Steel Cabinets Have 15 Years of Warranty Against Any Manufacturing Defect</b><br/>" +
            "<b>Any Other Doors Have 7 Years of Warranty Against Any Manufacturing Defect</b>" +
            "<br/><br/>" +
            "<b>Hardware's And Accessories: As Provided by The Manufacturer</b>" +
            "<br/><br/>" +
            "<b>Lightings: As Provided by The Manufacturer</b>";
    }

    private String getDefaultImportantNote() {
        return "THIS QUOTE IS ONLY FOR THE ITEMS MENTIONED IN THIS OFFER. ANY OTHER ITEMS OR APPLIANCES LIKE HOB, HOOD, " +
            "FRIDGE, OVEN ETC ARE EXCLUDED FROM THIS QUOTE. THE QUOTE FOR THOSE ITEMS ARE GIVEN SEPARATELY. " +
            "VALIDITY OF THIS QUOTE IS ONLY FOR 30 DAYS. THERE WILL BE REVISION OF PRICES IN EVERY 30 DAYS AS PER MARKET " +
            "COST FLUCTUATIONS.";
    }
}
