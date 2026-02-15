package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.settings.entity.SystemSetting;
import com.fleetmanagement.kitchencrmbackend.modules.settings.repository.SystemSettingRepository;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.utils.PdfMerger;
import fr.opensagres.poi.xwpf.converter.pdf.PdfConverter;
import fr.opensagres.poi.xwpf.converter.pdf.PdfOptions;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.export.JRPdfExporter;
import net.sf.jasperreports.engine.util.JRSaver;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import net.sf.jasperreports.export.SimplePdfExporterConfiguration;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
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
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

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

    @Autowired
    private CustomerRepository customerRepository;

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
            byte[] jasperPdfBytes = exportToPdf(jasperPrint);

            // Generate cover page from Word template and merge
            try {
                byte[] coverPdfBytes = generateCoverPagePdf(quotation);
                if (coverPdfBytes != null) {
                    return mergePdfs(coverPdfBytes, jasperPdfBytes);
                }
            } catch (Throwable e) {
                System.err.println("Failed to generate cover page, returning quotation without cover: " + e.getMessage());
                e.printStackTrace();
            }

            return jasperPdfBytes;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to create quotation PDF: " + e.getMessage(), e);
        }
    }

    private byte[] generateCoverPagePdf(QuotationDto quotation) throws Exception {
        Resource templateResource = resourceLoader.getResource("classpath:templates/frist.docx");
        if (!templateResource.exists()) {
            System.err.println("Cover page template not found: templates/frist.docx");
            return null;
        }

        // Fetch customer address for project location
        String projectLocation = "";
        if (quotation.getCustomerId() != null) {
            Optional<Customer> customer = customerRepository.findById(quotation.getCustomerId());
            if (customer.isPresent() && customer.get().getAddress() != null) {
                projectLocation = customer.get().getAddress();
            }
        }

        String clientName = quotation.getCustomerName() != null ? quotation.getCustomerName() : "";
        String date = quotation.getCreatedAt() != null ? formatDate(quotation.getCreatedAt().toLocalDate()) : "";

        // Load and modify the Word template
        try (InputStream is = templateResource.getInputStream();
             XWPFDocument document = new XWPFDocument(is)) {

            // Replace text in body paragraphs
            replaceTextInParagraphs(document.getParagraphs(), clientName, projectLocation, date);

            // Also replace text in tables (Word templates often use tables for layout)
            for (XWPFTable table : document.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        replaceTextInParagraphs(cell.getParagraphs(), clientName, projectLocation, date);
                    }
                }
            }

            // Convert Word document to PDF
            ByteArrayOutputStream pdfOutput = new ByteArrayOutputStream();
            PdfOptions options = PdfOptions.create();
            PdfConverter.getInstance().convert(document, pdfOutput, options);
            return pdfOutput.toByteArray();
        }
    }

    private void replaceTextInParagraphs(List<XWPFParagraph> paragraphs, String clientName, String projectLocation, String date) {
        for (XWPFParagraph paragraph : paragraphs) {
            String fullText = paragraph.getText();
            if (fullText == null) continue;

            if (fullText.contains("Client Name")) {
                replaceInParagraph(paragraph, "Client Name", clientName);
            }
            if (fullText.contains("Project Location")) {
                replaceInParagraph(paragraph, "Project Location", projectLocation);
            }
            if (fullText.contains("Date")) {
                replaceInParagraph(paragraph, "Date", date);
            }
        }
    }

    private void replaceInParagraph(XWPFParagraph paragraph, String fieldLabel, String value) {
        // Reconstruct full text from all runs
        List<XWPFRun> runs = paragraph.getRuns();
        if (runs == null || runs.isEmpty()) return;

        StringBuilder fullText = new StringBuilder();
        for (XWPFRun run : runs) {
            String text = run.getText(0);
            if (text != null) fullText.append(text);
        }

        String original = fullText.toString();
        // Replace "Client Name :" with "Client Name : Value" etc.
        // Handle both "Label :" and "Label:" patterns
        String replaced = original;
        if (original.contains(fieldLabel + " :")) {
            replaced = original.replace(fieldLabel + " :", fieldLabel + " : " + value);
        } else if (original.contains(fieldLabel + ":")) {
            replaced = original.replace(fieldLabel + ":", fieldLabel + ": " + value);
        }

        if (!replaced.equals(original)) {
            // Clear all runs and set the replaced text in the first run
            for (int i = runs.size() - 1; i > 0; i--) {
                paragraph.removeRun(i);
            }
            if (!runs.isEmpty()) {
                runs.get(0).setText(replaced, 0);
            }
        }
    }

    private byte[] mergePdfs(byte[] coverPdf, byte[] mainPdf) throws Exception {
        ByteArrayOutputStream mergedOutput = new ByteArrayOutputStream();

        try (PdfDocument cover = new PdfDocument(new PdfReader(new ByteArrayInputStream(coverPdf)));
             PdfDocument main = new PdfDocument(new PdfReader(new ByteArrayInputStream(mainPdf)));
             PdfDocument merged = new PdfDocument(new PdfWriter(mergedOutput))) {

            PdfMerger merger = new PdfMerger(merged);
            merger.merge(cover, 1, cover.getNumberOfPages());
            merger.merge(main, 1, main.getNumberOfPages());
        }

        return mergedOutput.toByteArray();
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
            "subreport-lighting.jrxml"
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

        // Page background image — byte[] so it can render on every page
        try {
            Resource bgResource = resourceLoader.getResource("classpath:newbg.jpg");
            if (bgResource.exists()) {
                params.put("PAGE_BG", bgResource.getInputStream().readAllBytes());
            } else {
                params.put("PAGE_BG", null);
            }
        } catch (Exception e) {
            params.put("PAGE_BG", null);
        }

        // Cover page background image from classpath
        try {
            Resource coverBgResource = resourceLoader.getResource("classpath:Gemini_Generated_Image_5l0sfp5l0sfp5l0s.png");
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
        params.put("CREATED_DATE", quotation.getCreatedAt() != null ? formatDate(quotation.getCreatedAt().toLocalDate()) : "");
        params.put("VALID_UNTIL", quotation.getValidUntil() != null ? formatDate(quotation.getValidUntil()) : "");
        params.put("CUSTOMER_NAME", quotation.getCustomerName() != null ? quotation.getCustomerName() : "");
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

        // Grand total
        BigDecimal grandTotal = calculateGrandTotal(quotation);
        params.put("GRAND_TOTAL", grandTotal);

        // Terms
        params.put("TERMS_GENERAL", getTermsGeneral());
        params.put("TERMS_WARRANTY", getTermsWarranty());

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
        if (quotation.getKitchens() != null && !quotation.getKitchens().isEmpty()) {
            return quotation.getKitchens().stream()
                .map(k -> k.getTotalAmount() != null ? k.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        } else if (quotation.getTotalAmount() != null) {
            return quotation.getTotalAmount();
        }
        return BigDecimal.ZERO;
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
        return date.format(DATE_FORMATTER);
    }

    private String getTermsGeneral() {
        String terms = getSettingValue("quotation.terms.general", null);
        if (terms != null && !terms.isEmpty()) {
            return terms;
        }
        return "<ul>" +
            "<li>The above-mentioned terms are subjected to change based on final site measurements.</li>" +
            "<li>Kitchen delivery and installation will not proceed without payment of outstanding balance.</li>" +
            "<li>Unloading expenses of the materials are not included in the quotation.</li>" +
            "<li>Our scope is limited to the installation of kitchens only.</li>" +
            "<li>The client must provide all plumbing and electrical items required for installation.</li>" +
            "<li>The client should provide safe storage spaces for materials at site.</li>" +
            "</ul>";
    }

    private String getTermsWarranty() {
        String terms = getSettingValue("quotation.terms.warranty", null);
        if (terms != null && !terms.isEmpty()) {
            return terms;
        }
        return "<ul>" +
            "<li>We warrant the furniture we sell for defects in material and workmanship.</li>" +
            "<li>This warranty does not apply to damage caused by misuse, abuse, or negligence.</li>" +
            "<li><strong>Stainless Steel Cabinets:</strong> 20 Years of Warranty</li>" +
            "<li><strong>Any Other Doors:</strong> 8 Years of Warranty</li>" +
            "<li><strong>Hardware & Accessories:</strong> As provided by manufacturer</li>" +
            "<li><strong>Lightings:</strong> As provided by manufacturer</li>" +
            "</ul>";
    }
}
