package com.fleetmanagement.kitchencrmbackend.modules.warranty.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.EmailRequest;
import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.EmailResponse;
import com.fleetmanagement.kitchencrmbackend.modules.notification.service.EmailService;
import com.fleetmanagement.kitchencrmbackend.modules.notification.service.EmailTemplateService;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import com.fleetmanagement.kitchencrmbackend.modules.project.repository.CustomerProjectRepository;
import com.fleetmanagement.kitchencrmbackend.modules.settings.entity.SystemSetting;
import com.fleetmanagement.kitchencrmbackend.modules.settings.repository.SystemSettingRepository;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.dto.WarrantyCardDto;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.dto.WarrantyCardResponse;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.entity.WarrantyCard;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.repository.WarrantyCardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class WarrantyCardServiceImpl implements WarrantyCardService {

    @Autowired
    private WarrantyCardRepository warrantyCardRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerProjectRepository projectRepository;

    @Autowired
    private WarrantyCardPdfService pdfService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Autowired
    private EmailTemplateService emailTemplateService;

    private static final String UPLOAD_DIR = "uploads/warranty-cards";
    private static final String CERT_NUMBER_SETTING_KEY = "warranty.last_certificate_number";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Override
    public WarrantyCardResponse getWarrantyCardById(Long warrantyCardId) {
        WarrantyCard warrantyCard = warrantyCardRepository.findById(warrantyCardId)
                .orElseThrow(() -> new RuntimeException("Warranty card not found: " + warrantyCardId));
        return convertToResponse(warrantyCard);
    }

    @Override
    @Transactional
    public WarrantyCardResponse getWarrantyCardByCustomerId(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));

        Optional<WarrantyCard> existing = warrantyCardRepository.findByCustomerId(customerId);
        WarrantyCard warrantyCard;

        if (existing.isPresent()) {
            warrantyCard = existing.get();
        } else {
            // Create new warranty card with defaults
            warrantyCard = new WarrantyCard();
            warrantyCard.setCustomer(customer);
            warrantyCard.setProjectDescription("Modular Kitchen Design, Supply & Installation");
            warrantyCard.setIssueDate(LocalDate.now());
            warrantyCard.setSignatureDate(LocalDate.now());
            
            // Set default authorized info from settings
            String defaultName = getSettingValue("warranty.authorized_name", "");
            String defaultDesignation = getSettingValue("warranty.authorized_designation", "");
            warrantyCard.setAuthorizedName(defaultName);
            warrantyCard.setAuthorizedDesignation(defaultDesignation);
            
            warrantyCard = warrantyCardRepository.save(warrantyCard);
        }

        return convertToResponse(warrantyCard);
    }

    @Override
    @Transactional
    public WarrantyCardResponse createWarrantyCard(Long customerId, WarrantyCardDto dto, String createdBy) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));

        if (warrantyCardRepository.existsByCustomerId(customerId)) {
            throw new RuntimeException("Warranty card already exists for this customer");
        }

        WarrantyCard warrantyCard = new WarrantyCard();
        warrantyCard.setCustomer(customer);
        
        if (dto.getProjectId() != null) {
            CustomerProject project = projectRepository.findById(dto.getProjectId())
                    .orElse(null);
            warrantyCard.setProject(project);
        }

        updateWarrantyCardFields(warrantyCard, dto);
        warrantyCard.setCreatedBy(createdBy);
        
        // Generate certificate number if not provided
        if (warrantyCard.getCertificateNumber() == null || warrantyCard.getCertificateNumber().isEmpty()) {
            warrantyCard.setCertificateNumber(generateCertificateNumber());
        }

        WarrantyCard saved = warrantyCardRepository.save(warrantyCard);
        return convertToResponse(saved);
    }

    @Override
    @Transactional
    public WarrantyCardResponse updateWarrantyCard(Long warrantyCardId, WarrantyCardDto dto, String updatedBy) {
        WarrantyCard warrantyCard = warrantyCardRepository.findById(warrantyCardId)
                .orElseThrow(() -> new RuntimeException("Warranty card not found: " + warrantyCardId));

        if (dto.getProjectId() != null && !dto.getProjectId().equals(warrantyCard.getProject() != null ? warrantyCard.getProject().getId() : null)) {
            CustomerProject project = projectRepository.findById(dto.getProjectId())
                    .orElse(null);
            warrantyCard.setProject(project);
        }

        updateWarrantyCardFields(warrantyCard, dto);
        warrantyCard.setUpdatedBy(updatedBy);

        WarrantyCard saved = warrantyCardRepository.save(warrantyCard);
        return convertToResponse(saved);
    }

    @Override
    @Transactional
    public void generatePdf(Long warrantyCardId) {
        WarrantyCard warrantyCard = warrantyCardRepository.findById(warrantyCardId)
                .orElseThrow(() -> new RuntimeException("Warranty card not found: " + warrantyCardId));

        try {
            // Generate PDF bytes
            byte[] pdfBytes = pdfService.generatePdfBytes(warrantyCard, warrantyCard.getCustomer().getName());

            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate filename
            String filename = String.format("warranty-card-%d-%s.pdf", 
                    warrantyCard.getCustomer().getId(), 
                    warrantyCard.getCertificateNumber() != null ? warrantyCard.getCertificateNumber() : "temp");
            Path filePath = uploadPath.resolve(filename);

            // Save PDF file
            Files.write(filePath, pdfBytes);

            // Update warranty card with file path
            warrantyCard.setPdfFilePath(filePath.toString());
            warrantyCardRepository.save(warrantyCard);

        } catch (IOException e) {
            throw new RuntimeException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }

    @Override
    public Resource getWarrantyCardPdf(Long warrantyCardId) {
        WarrantyCard warrantyCard = warrantyCardRepository.findById(warrantyCardId)
                .orElseThrow(() -> new RuntimeException("Warranty card not found: " + warrantyCardId));

        if (warrantyCard.getPdfFilePath() == null || warrantyCard.getPdfFilePath().isEmpty()) {
            throw new RuntimeException("PDF not generated for this warranty card");
        }

        Path filePath = Paths.get(warrantyCard.getPdfFilePath());
        if (!Files.exists(filePath)) {
            throw new RuntimeException("PDF file not found at: " + warrantyCard.getPdfFilePath());
        }

        return new FileSystemResource(filePath.toFile());
    }

    @Override
    @Transactional
    public void sendEmail(Long warrantyCardId) {
        WarrantyCard warrantyCard = warrantyCardRepository.findById(warrantyCardId)
                .orElseThrow(() -> new RuntimeException("Warranty card not found: " + warrantyCardId));

        Customer customer = warrantyCard.getCustomer();
        if (customer.getEmail() == null || customer.getEmail().isEmpty()) {
            throw new RuntimeException("Customer email not found");
        }

        // Generate PDF if not exists
        if (warrantyCard.getPdfFilePath() == null || warrantyCard.getPdfFilePath().isEmpty()) {
            generatePdf(warrantyCardId);
            warrantyCard = warrantyCardRepository.findById(warrantyCardId).orElse(warrantyCard);
        }

        try {
            // Read PDF file
            Path pdfPath = Paths.get(warrantyCard.getPdfFilePath());
            byte[] pdfBytes = Files.readAllBytes(pdfPath);
            String base64Pdf = Base64.getEncoder().encodeToString(pdfBytes);

            // Create email content using template
            String subject = "Warranty Certificate - " + customer.getName();
            Map<String, String> emailVariables = new HashMap<>();
            emailVariables.put("CUSTOMER_NAME", customer.getName());
            emailVariables.put("CERTIFICATE_NUMBER", warrantyCard.getCertificateNumber() != null ? warrantyCard.getCertificateNumber() : "");
            emailVariables.put("ISSUE_DATE", warrantyCard.getIssueDate() != null ? warrantyCard.getIssueDate().format(DATE_FORMATTER) : "");
            emailVariables.put("COMPANY_PHONE", getSettingValue("company.phone", "[Phone Number]"));
            emailVariables.put("COMPANY_EMAIL", getSettingValue("company.email", "[Email Address]"));
            emailVariables.put("COMPANY_WEBSITE", getSettingValue("company.website", "[Website URL]"));
            
            String htmlContent = emailTemplateService.buildEmailContent("warranty-card-notification", emailVariables);

            // Prepare attachments
            Map<String, String> attachments = new HashMap<>();
            String filename = "Warranty_Certificate_" + warrantyCard.getCertificateNumber() + ".pdf";
            attachments.put(filename, base64Pdf);

            // Send email
            EmailRequest emailRequest = EmailRequest.builder()
                    .to(customer.getEmail())
                    .subject(subject)
                    .htmlContent(htmlContent)
                    .attachments(attachments)
                    .build();

            EmailResponse response = emailService.sendEmail(emailRequest);

            if (response.isSuccess()) {
                warrantyCard.setEmailSent(true);
                warrantyCard.setEmailSentAt(LocalDateTime.now());
                warrantyCardRepository.save(warrantyCard);
            } else {
                throw new RuntimeException("Failed to send email: " + response.getErrorMessage());
            }

        } catch (IOException e) {
            throw new RuntimeException("Failed to read PDF file: " + e.getMessage(), e);
        }
    }

    @Override
    public String generateCertificateNumber() {
        int currentYear = Year.now().getValue();
        String yearPrefix = String.valueOf(currentYear);
        
        // Get last certificate number from settings
        Optional<SystemSetting> setting = systemSettingRepository.findBySettingKey(CERT_NUMBER_SETTING_KEY);
        int lastNumber = 0;
        
        if (setting.isPresent()) {
            String lastCertNumber = setting.get().getSettingValue();
            // Extract number from format WC-YYYY-XXXX
            if (lastCertNumber != null && lastCertNumber.startsWith("WC-" + yearPrefix + "-")) {
                try {
                    String numberPart = lastCertNumber.substring(("WC-" + yearPrefix + "-").length());
                    lastNumber = Integer.parseInt(numberPart);
                } catch (NumberFormatException e) {
                    // If parsing fails, start from 1
                    lastNumber = 0;
                }
            }
        }
        
        // Increment and format
        int nextNumber = lastNumber + 1;
        String certNumber = String.format("WC-%s-%04d", yearPrefix, nextNumber);
        
        // Update setting
        SystemSetting certSetting = setting.orElse(new SystemSetting());
        certSetting.setSettingKey(CERT_NUMBER_SETTING_KEY);
        certSetting.setSettingValue(certNumber);
        certSetting.setDescription("Last generated warranty certificate number");
        systemSettingRepository.save(certSetting);
        
        return certNumber;
    }

    private void updateWarrantyCardFields(WarrantyCard warrantyCard, WarrantyCardDto dto) {
        if (dto.getCertificateNumber() != null) {
            warrantyCard.setCertificateNumber(dto.getCertificateNumber());
        }
        if (dto.getIssueDate() != null) {
            warrantyCard.setIssueDate(dto.getIssueDate());
        }
        if (dto.getProjectCompletionDate() != null) {
            warrantyCard.setProjectCompletionDate(dto.getProjectCompletionDate());
        }
        if (dto.getProjectAddress() != null) {
            warrantyCard.setProjectAddress(dto.getProjectAddress());
        }
        if (dto.getProjectDescription() != null) {
            warrantyCard.setProjectDescription(dto.getProjectDescription());
        }
        if (dto.getAuthorizedName() != null) {
            warrantyCard.setAuthorizedName(dto.getAuthorizedName());
        }
        if (dto.getAuthorizedDesignation() != null) {
            warrantyCard.setAuthorizedDesignation(dto.getAuthorizedDesignation());
        }
        if (dto.getSignatureDate() != null) {
            warrantyCard.setSignatureDate(dto.getSignatureDate());
        }
    }

    private WarrantyCardResponse convertToResponse(WarrantyCard warrantyCard) {
        Customer customer = warrantyCard.getCustomer();
        CustomerProject project = warrantyCard.getProject();

        return WarrantyCardResponse.builder()
                .id(warrantyCard.getId())
                .customerId(customer.getId())
                .customerName(customer.getName())
                .customerEmail(customer.getEmail())
                .projectId(project != null ? project.getId() : null)
                .projectName(project != null ? project.getProjectName() : null)
                .certificateNumber(warrantyCard.getCertificateNumber())
                .issueDate(warrantyCard.getIssueDate())
                .projectCompletionDate(warrantyCard.getProjectCompletionDate())
                .projectAddress(warrantyCard.getProjectAddress())
                .projectDescription(warrantyCard.getProjectDescription())
                .authorizedName(warrantyCard.getAuthorizedName())
                .authorizedDesignation(warrantyCard.getAuthorizedDesignation())
                .signatureDate(warrantyCard.getSignatureDate())
                .pdfFilePath(warrantyCard.getPdfFilePath())
                .emailSent(warrantyCard.getEmailSent())
                .emailSentAt(warrantyCard.getEmailSentAt())
                .createdAt(warrantyCard.getCreatedAt())
                .updatedAt(warrantyCard.getUpdatedAt())
                .build();
    }


    private String getSettingValue(String key, String defaultValue) {
        Optional<SystemSetting> setting = systemSettingRepository.findBySettingKey(key);
        return setting.map(SystemSetting::getSettingValue).orElse(defaultValue);
    }
}

