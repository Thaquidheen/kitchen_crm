package com.fleetmanagement.kitchencrmbackend.modules.notification.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.DesignPhaseRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignedDocument;
import com.fleetmanagement.kitchencrmbackend.modules.signature.repository.SignedDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Implementation of TemplateService for handling variable replacement and formatting
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateServiceImpl implements TemplateService {

    private final QuotationRepository quotationRepository;
    private final CustomerRepository customerRepository;
    private final SignedDocumentRepository signedDocumentRepository;
    private final DesignPhaseRepository designPhaseRepository;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a");

    @Override
    public String replaceVariables(String template, Map<String, String> variables) {
        if (template == null || template.isEmpty()) {
            return template;
        }

        if (variables == null || variables.isEmpty()) {
            return template;
        }

        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue() : "";
            result = result.replace(placeholder, value);
        }

        return result;
    }

    @Override
    public String formatCurrency(Double amount) {
        if (amount == null) {
            return "₹0";
        }

        // Indian numbering system formatter
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        return formatter.format(amount);
    }

    @Override
    public String formatDate(LocalDate date) {
        if (date == null) {
            return "";
        }
        return date.format(DATE_FORMATTER);
    }

    @Override
    public String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.format(DATETIME_FORMATTER);
    }

    @Override
    public String generateSigningUrl(Long documentId, String token) {
        // Frontend expects route: /sign/{token}
        return String.format("%s/sign/%s", frontendUrl, token);
    }

    @Override
    public String escapeHtml(String text) {
        if (text == null) {
            return "";
        }

        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#x27;");
    }

    @Override
    public Map<String, String> buildQuotationVariables(Long quotationId) {
        Map<String, String> variables = new HashMap<>();

        try {
            Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new RuntimeException("Quotation not found: " + quotationId));

            Customer customer = quotation.getCustomer();

            // Customer variables
            variables.put("customerName", customer.getName());
            variables.put("customerEmail", customer.getEmail());
            variables.put("customerPhone", customer.getContact());

            // Quotation variables
            variables.put("quotationNumber", quotation.getQuotationNumber());
            variables.put("quotationId", quotationId.toString());
            variables.put("totalAmount", formatCurrency(quotation.getTotalAmount().doubleValue()));
            variables.put("totalAmountRaw", quotation.getTotalAmount().toString());

            // Dates
            variables.put("quotationDate", formatDate(quotation.getCreatedAt().toLocalDate()));
            variables.put("validUntil", quotation.getValidUntil() != null ?
                formatDate(quotation.getValidUntil()) : "");

            // Status
            variables.put("status", quotation.getStatus() != null ?
                quotation.getStatus().toString() : "");

            // Company info (you can add these from properties later)
            variables.put("companyName", "HOCH");
            variables.put("companyPhone", "+91-XXXXXXXXXX");
            variables.put("companyEmail", "info@kitchencrm.com");

        } catch (Exception e) {
            log.error("Error building quotation variables for ID {}: {}", quotationId, e.getMessage());
        }

        return variables;
    }

    @Override
    public Map<String, String> buildCustomerVariables(Long customerId) {
        Map<String, String> variables = new HashMap<>();

        try {
            Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));

            variables.put("customerName", customer.getName());
            variables.put("customerEmail", customer.getEmail());
            variables.put("customerPhone", customer.getContact());
            variables.put("customerId", customerId.toString());

            // Address
            if (customer.getAddress() != null) {
                variables.put("customerAddress", customer.getAddress());
            }

        } catch (Exception e) {
            log.error("Error building customer variables for ID {}: {}", customerId, e.getMessage());
        }

        return variables;
    }

    @Override
    public Map<String, String> buildSignatureRequestVariables(Long documentId) {
        Map<String, String> variables = new HashMap<>();

        try {
            SignedDocument document = signedDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Signed document not found: " + documentId));

            // Document variables
            variables.put("documentId", documentId.toString());
            variables.put("documentType", document.getDocumentType().toString());

            // Generate signing URL
            String signingUrl = generateSigningUrl(documentId, document.getSigningToken());
            variables.put("signingUrl", signingUrl);
            variables.put("signingLink", signingUrl); // alias used by existing templates

            // Expiry
            if (document.getExpiresAt() != null) {
                variables.put("expiryDate", formatDateTime(document.getExpiresAt()));

                // Calculate days remaining
                long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(
                    LocalDateTime.now(), document.getExpiresAt());
                variables.put("daysRemaining", String.valueOf(daysRemaining));
            }

            // Status
            variables.put("documentStatus", document.getStatus().toString());

            // Add quotation/customer info if available
            if (document.getReferenceId() != null && document.getDocumentType() ==
                com.fleetmanagement.kitchencrmbackend.modules.signature.entity.DocumentType.QUOTATION) {
                // Fetch quotation
                quotationRepository.findById(document.getReferenceId()).ifPresent(quotation -> {
                    Customer customer = quotation.getCustomer();
                    variables.put("customerName", customer.getName());
                    variables.put("customerEmail", customer.getEmail());
                    variables.put("customerPhone", customer.getContact());
                    variables.put("quotationNumber", quotation.getQuotationNumber());
                    variables.put("totalAmount", formatCurrency(quotation.getTotalAmount().doubleValue()));
                });
            }

        } catch (Exception e) {
            log.error("Error building signature request variables for document ID {}: {}",
                documentId, e.getMessage());
        }

        return variables;
    }

    @Override
    public Map<String, String> buildDesignApprovalVariables(Long designPhaseId) {
        Map<String, String> variables = new HashMap<>();

        try {
            DesignPhase designPhase = designPhaseRepository.findById(designPhaseId)
                .orElseThrow(() -> new RuntimeException("Design phase not found: " + designPhaseId));

            // Design phase variables
            variables.put("designPhaseId", designPhaseId.toString());
            variables.put("designStatus", designPhase.getDesignStatus().toString());

            // Customer info
            Customer customer = designPhase.getCustomer();
            variables.put("customerName", customer.getName());
            variables.put("customerEmail", customer.getEmail());
            variables.put("customerPhone", customer.getContact());

            // Designer info
            if (designPhase.getStaffAssigned() != null) {
                variables.put("designerName", designPhase.getStaffAssigned().getName());
            }

            // Design completion
            if (designPhase.getDesignCompletionPercentage() != null) {
                variables.put("designCompletionPercentage", designPhase.getDesignCompletionPercentage().toString());
            }

            // Meeting notes
            if (designPhase.getMeetingNotes() != null) {
                variables.put("designNotes", escapeHtml(designPhase.getMeetingNotes()));
            }

        } catch (Exception e) {
            log.error("Error building design approval variables for design phase ID {}: {}",
                designPhaseId, e.getMessage());
        }

        return variables;
    }
}
