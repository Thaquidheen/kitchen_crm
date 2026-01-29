package com.fleetmanagement.kitchencrmbackend.modules.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.DesignPhaseRepository;
import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.NotificationLog;
import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.NotificationTemplate;
import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.NotificationType;
import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.ReferenceType;
import com.fleetmanagement.kitchencrmbackend.modules.notification.repository.NotificationLogRepository;
import com.fleetmanagement.kitchencrmbackend.modules.notification.repository.NotificationTemplateRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.service.JasperPdfGenerationService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import java.util.Base64;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignedDocument;
import com.fleetmanagement.kitchencrmbackend.modules.signature.repository.SignedDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Unified notification service implementation
 * Coordinates Email notifications and maintains audit logs
 */
@Service
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final EmailService emailService;
    private final TemplateService templateService;
    private final NotificationLogRepository notificationLogRepository;
    private final NotificationTemplateRepository notificationTemplateRepository;
    private final CustomerRepository customerRepository;
    private final QuotationRepository quotationRepository;
    private final SignedDocumentRepository signedDocumentRepository;
    private final DesignPhaseRepository designPhaseRepository;
    private final ObjectMapper objectMapper;
    private JasperPdfGenerationService pdfGenerationService;

    public NotificationServiceImpl(
            EmailService emailService,
            TemplateService templateService,
            NotificationLogRepository notificationLogRepository,
            NotificationTemplateRepository notificationTemplateRepository,
            CustomerRepository customerRepository,
            QuotationRepository quotationRepository,
            SignedDocumentRepository signedDocumentRepository,
            DesignPhaseRepository designPhaseRepository,
            ObjectMapper objectMapper) {
        this.emailService = emailService;
        this.templateService = templateService;
        this.notificationLogRepository = notificationLogRepository;
        this.notificationTemplateRepository = notificationTemplateRepository;
        this.customerRepository = customerRepository;
        this.quotationRepository = quotationRepository;
        this.signedDocumentRepository = signedDocumentRepository;
        this.designPhaseRepository = designPhaseRepository;
        this.objectMapper = objectMapper;
    }

    @Autowired(required = false)
    public void setPdfGenerationService(JasperPdfGenerationService pdfGenerationService) {
        this.pdfGenerationService = pdfGenerationService;
    }

    @Value("${app.notifications.attach-quotation-pdf:true}")
    private boolean attachQuotationPdf;

    @Override
    @Transactional
    public NotificationResponse sendNotification(NotificationRequest request) {
        long startTime = System.currentTimeMillis();

        log.info("Sending notification: type={}, customerId={}, referenceType={}, referenceId={}",
            request.getNotificationType(), request.getCustomerId(),
            request.getReferenceType(), request.getReferenceId());

        // Validate customer
        Customer customer = customerRepository.findById(request.getCustomerId())
            .orElseThrow(() -> new RuntimeException("Customer not found: " + request.getCustomerId()));

        // Create notification log entry
        NotificationLog notificationLog = createNotificationLog(request, customer);

        // Get or determine template
        NotificationTemplate template = getTemplate(request);

        // Build variables
        Map<String, String> variables = buildVariables(request, template);

        // Merge with provided variables
        if (request.getTemplateVariables() != null) {
            variables.putAll(request.getTemplateVariables());
        }

        // Initialize response
        NotificationResponse.NotificationResponseBuilder responseBuilder = NotificationResponse.builder()
            .notificationLogId(notificationLog.getId())
            .success(false)
            .successfulChannels(0)
            .failedChannels(0);

        // Send via Email only
        if (request.getSendEmail() && template.hasEmailTemplate()) {
            sendViaEmail(notificationLog, template, variables, responseBuilder, request);
        }

        // Update notification log
        try {
            notificationLog.setMetadata(objectMapper.writeValueAsString(request));
        } catch (Exception e) {
            log.warn("Failed to serialize metadata: {}", e.getMessage());
        }

        notificationLogRepository.save(notificationLog);

        // Build final response
        long processingTime = System.currentTimeMillis() - startTime;
        NotificationResponse response = responseBuilder
            .processingTimeMs(processingTime)
            .deliveryStatus(notificationLog.getDeliveryStatus())
            .timestamp(LocalDateTime.now())
            .build();

        // Determine overall success
        response.setSuccess(response.getSuccessfulChannels() > 0);
        response.setMessage(response.getStatusSummary());

        log.info("Notification sent: logId={}, status={}, channels={}/{}, time={}ms",
            notificationLog.getId(), response.getDeliveryStatus(),
            response.getSuccessfulChannels(),
            response.getSuccessfulChannels() + response.getFailedChannels(),
            processingTime);

        return response;
    }

    private void sendViaEmail(NotificationLog notifLog, NotificationTemplate template,
                              Map<String, String> variables,
                              NotificationResponse.NotificationResponseBuilder responseBuilder,
                              NotificationRequest request) {
        try {
            String subject = template.replaceEmailSubjectVariables(variables);
            String body = template.replaceEmailBodyVariables(variables);

            String recipientEmail = request.getRecipientEmail();
            if (recipientEmail == null || recipientEmail.isEmpty()) {
                recipientEmail = notifLog.getCustomer().getEmail();
            }

            EmailRequest emailRequest = EmailRequest.builder()
                .to(recipientEmail)
                .subject(subject)
                .htmlContent(body)
                .build();

            // Optionally attach quotation PDF for signature request emails
            try {
                if (attachQuotationPdf && pdfGenerationService != null && request.getNotificationType() == NotificationType.QUOTATION_SIGNATURE_REQUEST) {
                    Long quotationId = request.getReferenceId();
                    ApiResponse<Resource> pdfResponse = pdfGenerationService.generateQuotationPdf(quotationId, "SYSTEM");
                    if (pdfResponse != null && pdfResponse.getSuccess() && pdfResponse.getData() != null) {
                        byte[] pdfBytes = pdfResponse.getData().getInputStream().readAllBytes();
                        String base64 = Base64.getEncoder().encodeToString(pdfBytes);
                        Map<String, String> attachments = new HashMap<>();
                        attachments.put("quotation_" + variables.getOrDefault("quotationNumber", String.valueOf(quotationId)) + ".pdf", base64);
                        emailRequest.setAttachments(attachments);
                    } else {
                        log.warn("PDF generation failed or returned empty for quotationId={}", quotationId);
                    }
                }
            } catch (Exception ex) {
                // Do not block email if PDF attachment generation fails
                log.warn("Unable to attach quotation PDF: {}", ex.getMessage());
            }

            EmailResponse emailResponse = request.getRetryOnFailure() ?
                emailService.sendEmailWithRetry(emailRequest, request.getMaxRetries()) :
                emailService.sendEmail(emailRequest);

            if (emailResponse.isSuccess()) {
                notifLog.setEmailSent(true);
                notifLog.setEmailSentAt(LocalDateTime.now());
                notifLog.setRecipientEmail(recipientEmail);

                responseBuilder
                    .emailSent(true)
                    .emailMessageId(emailResponse.getMessageId())
                    .emailSentAt(LocalDateTime.now())
                    .successfulChannels(responseBuilder.build().getSuccessfulChannels() + 1);

                log.info("Email sent successfully: messageId={}", emailResponse.getMessageId());
            } else {
                notifLog.setEmailSent(false);
                notifLog.setEmailBounced(true);
                notifLog.setEmailErrorMessage(emailResponse.getErrorMessage());

                responseBuilder
                    .emailSent(false)
                    .emailError(emailResponse.getErrorMessage())
                    .failedChannels(responseBuilder.build().getFailedChannels() + 1);

                log.warn("Email sending failed: {}", emailResponse.getErrorMessage());
            }

        } catch (Exception e) {
            log.error("Error sending email: {}", e.getMessage(), e);
            notifLog.setEmailSent(false);
            notifLog.setEmailBounced(true);
            notifLog.setEmailErrorMessage(e.getMessage());

            responseBuilder
                .emailSent(false)
                .emailError(e.getMessage())
                .failedChannels(responseBuilder.build().getFailedChannels() + 1);
        }
    }

    @Override
    public NotificationResponse sendQuotationSignatureRequest(Long quotationId) {
        log.info("Sending quotation signature request for quotationId={}", quotationId);

        Quotation quotation = quotationRepository.findById(quotationId)
            .orElseThrow(() -> new RuntimeException("Quotation not found: " + quotationId));

        // Find signed document (should already exist from SignatureService)
        SignedDocument signedDocument = signedDocumentRepository
            .findTopByDocumentTypeAndReferenceIdOrderByCreatedAtDesc(com.fleetmanagement.kitchencrmbackend.modules.signature.entity.DocumentType.QUOTATION, quotationId)
            .orElseThrow(() -> new RuntimeException("Signed document not found for quotation: " + quotationId));

        // Build variables
        Map<String, String> variables = templateService.buildSignatureRequestVariables(signedDocument.getId());

        NotificationRequest request = NotificationRequest.builder()
            .customerId(quotation.getCustomer().getId())
            .notificationType(NotificationType.QUOTATION_SIGNATURE_REQUEST)
            .referenceType(ReferenceType.QUOTATION)
            .referenceId(quotationId)
            .signedDocumentId(signedDocument.getId())
            .templateCode("QUOTATION_SIGNATURE_REQUEST")
            .templateVariables(variables)
            .sendEmail(true)
            .build();

        return sendNotification(request);
    }

    @Override
    @Transactional
    public NotificationResponse sendSignatureReminder(Long documentId, int daysElapsed) {
        log.info("Sending signature reminder for documentId={}, daysElapsed={}", documentId, daysElapsed);

        SignedDocument document = signedDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Signed document not found: " + documentId));

        Map<String, String> variables = templateService.buildSignatureRequestVariables(documentId);
        variables.put("daysElapsed", String.valueOf(daysElapsed));

        // Determine notification type based on days elapsed
        NotificationType notificationType = daysElapsed >= 6 ?
            NotificationType.SIGNATURE_REMINDER_6_DAYS :
            NotificationType.SIGNATURE_REMINDER_3_DAYS;

        String templateCode = daysElapsed >= 6 ?
            "SIGNATURE_REMINDER_6_DAYS" :
            "SIGNATURE_REMINDER_3_DAYS";

        NotificationRequest request = NotificationRequest.builder()
            .customerId(document.getCustomer().getId())
            .notificationType(notificationType)
            .referenceType(ReferenceType.QUOTATION)
            .referenceId(document.getReferenceId())
            .signedDocumentId(documentId)
            .templateCode(templateCode)
            .templateVariables(variables)
            .sendEmail(true)
            .build();

        return sendNotification(request);
    }

    @Override
    @Transactional
    public NotificationResponse sendSignatureConfirmation(Long documentId) {
        log.info("Sending signature confirmation for documentId={}", documentId);

        SignedDocument document = signedDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Signed document not found: " + documentId));

        Map<String, String> variables = templateService.buildSignatureRequestVariables(documentId);

        NotificationRequest request = NotificationRequest.builder()
            .customerId(document.getCustomer().getId())
            .notificationType(NotificationType.SIGNATURE_RECEIVED)
            .referenceType(ReferenceType.QUOTATION)
            .referenceId(document.getReferenceId())
            .signedDocumentId(documentId)
            .templateCode("SIGNATURE_RECEIVED")
            .templateVariables(variables)
            .sendEmail(true)
            .build();

        return sendNotification(request);
    }

    @Override
    @Transactional
    public NotificationResponse sendDesignApprovalRequest(Long designPhaseId) {
        log.info("Sending design approval request for designPhaseId={}", designPhaseId);

        DesignPhase designPhase = designPhaseRepository.findById(designPhaseId)
            .orElseThrow(() -> new RuntimeException("Design phase not found: " + designPhaseId));

        Map<String, String> variables = templateService.buildDesignApprovalVariables(designPhaseId);

        NotificationRequest request = NotificationRequest.builder()
            .customerId(designPhase.getCustomer().getId())
            .notificationType(NotificationType.DESIGN_APPROVAL)
            .referenceType(ReferenceType.DESIGN_PHASE)
            .referenceId(designPhaseId)
            .templateCode("DESIGN_APPROVAL")
            .templateVariables(variables)
            .sendEmail(true)
            .build();

        return sendNotification(request);
    }

    @Override
    @Transactional
    public NotificationResponse sendPaymentReminder(Long customerId, Double amount) {
        log.info("Sending payment reminder for customerId={}, amount={}", customerId, amount);

        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));

        Map<String, String> variables = templateService.buildCustomerVariables(customerId);
        variables.put("pendingAmount", templateService.formatCurrency(amount));
        variables.put("pendingAmountRaw", amount.toString());

        NotificationRequest request = NotificationRequest.builder()
            .customerId(customerId)
            .notificationType(NotificationType.PAYMENT_REMINDER)
            .referenceType(ReferenceType.PAYMENT)
            .referenceId(customerId) // Using customerId as reference since we don't have payment ID
            .templateCode("PAYMENT_REMINDER")
            .templateVariables(variables)
            .sendEmail(true)
            .build();

        return sendNotification(request);
    }

    @Override
    public List<NotificationHistoryDto> getNotificationHistory(String referenceType, Long referenceId) {
        ReferenceType refType = ReferenceType.valueOf(referenceType);
        List<NotificationLog> logs = notificationLogRepository
            .findByReferenceTypeAndReferenceIdOrderByCreatedAtDesc(refType, referenceId);

        return logs.stream()
            .map(this::convertToHistoryDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<NotificationHistoryDto> getCustomerNotificationHistory(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));

        List<NotificationLog> logs = notificationLogRepository
            .findByCustomerOrderByCreatedAtDesc(customer);

        return logs.stream()
            .map(this::convertToHistoryDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<NotificationHistoryDto> getNotificationsByType(NotificationType notificationType) {
        List<NotificationLog> logs = notificationLogRepository
            .findByNotificationTypeOrderByCreatedAtDesc(notificationType);

        return logs.stream()
            .map(this::convertToHistoryDto)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationResponse retryNotification(Long notificationLogId) {
        log.info("Retrying notification: logId={}", notificationLogId);

        NotificationLog originalLog = notificationLogRepository.findById(notificationLogId)
            .orElseThrow(() -> new RuntimeException("Notification log not found: " + notificationLogId));

        // Build request from original log
        NotificationRequest request = NotificationRequest.builder()
            .customerId(originalLog.getCustomer().getId())
            .notificationType(originalLog.getNotificationType())
            .referenceType(originalLog.getReferenceType())
            .referenceId(originalLog.getReferenceId())
            .signedDocumentId(originalLog.getSignedDocument() != null ?
                originalLog.getSignedDocument().getId() : null)
            .recipientEmail(originalLog.getRecipientEmail())
            .priority(originalLog.getPriority())
            .sendEmail(!originalLog.getEmailSent())
            .build();

        return sendNotification(request);
    }

    @Override
    @Transactional
    public void updateNotificationStatus(Long notificationLogId, String channel,
                                         String status, String timestamp) {
        NotificationLog notifLog = notificationLogRepository.findById(notificationLogId)
            .orElseThrow(() -> new RuntimeException("Notification log not found: " + notificationLogId));

        LocalDateTime statusTime = timestamp != null ?
            LocalDateTime.parse(timestamp) : LocalDateTime.now();

        if ("EMAIL".equalsIgnoreCase(channel)) {
            switch (status.toUpperCase()) {
                case "DELIVERED":
                    notifLog.setEmailDelivered(true);
                    notifLog.setEmailDeliveredAt(statusTime);
                    break;
                case "OPENED":
                    notifLog.setEmailOpened(true);
                    notifLog.setEmailOpenedAt(statusTime);
                    break;
                case "CLICKED":
                    notifLog.setEmailClicked(true);
                    notifLog.setEmailClickedAt(statusTime);
                    break;
                case "BOUNCED":
                    notifLog.setEmailBounced(true);
                    break;
            }
        }

        notificationLogRepository.save(notifLog);
        log.info("Updated notification status: logId={}, channel={}, status={}",
            notificationLogId, channel, status);
    }

    @Override
    public Map<String, Object> getDeliveryStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        List<NotificationLog> logs = notificationLogRepository
            .findByCreatedAtBetween(startDate, endDate);

        Map<String, Object> stats = new HashMap<>();

        stats.put("totalNotifications", logs.size());
        stats.put("emailSent", logs.stream().filter(NotificationLog::getEmailSent).count());
        stats.put("emailDelivered", logs.stream().filter(NotificationLog::getEmailDelivered).count());
        stats.put("emailOpened", logs.stream().filter(NotificationLog::getEmailOpened).count());
        stats.put("emailBounced", logs.stream().filter(NotificationLog::getEmailBounced).count());

        return stats;
    }

    // Helper methods

    private NotificationLog createNotificationLog(NotificationRequest request, Customer customer) {
        NotificationLog log = new NotificationLog();
        log.setNotificationType(request.getNotificationType());
        log.setReferenceType(request.getReferenceType());
        log.setReferenceId(request.getReferenceId());
        log.setCustomer(customer);
        log.setPriority(request.getPriority());

        if (request.getSignedDocumentId() != null) {
            signedDocumentRepository.findById(request.getSignedDocumentId())
                .ifPresent(log::setSignedDocument);
        }

        return notificationLogRepository.save(log);
    }

    private NotificationTemplate getTemplate(NotificationRequest request) {
        String templateCode = request.getTemplateCode();

        // Auto-determine template code from notification type if not provided
        if (templateCode == null || templateCode.isEmpty()) {
            templateCode = request.getNotificationType().toString();
        }

        final String finalTemplateCode = templateCode;
        return notificationTemplateRepository.findByTemplateCodeAndIsActiveTrue(finalTemplateCode)
            .orElseThrow(() -> new RuntimeException("Template not found: " + finalTemplateCode));
    }

    private Map<String, String> buildVariables(NotificationRequest request, NotificationTemplate template) {
        Map<String, String> variables = new HashMap<>();

        // Build based on reference type
        switch (request.getReferenceType()) {
            case QUOTATION:
                variables.putAll(templateService.buildQuotationVariables(request.getReferenceId()));
                break;
            case DESIGN_PHASE:
                variables.putAll(templateService.buildDesignApprovalVariables(request.getReferenceId()));
                break;
            default:
                variables.putAll(templateService.buildCustomerVariables(request.getCustomerId()));
                break;
        }

        // Add signature variables if document is present
        if (request.getSignedDocumentId() != null) {
            variables.putAll(templateService.buildSignatureRequestVariables(request.getSignedDocumentId()));
        }

        return variables;
    }

    private NotificationHistoryDto convertToHistoryDto(NotificationLog log) {
        return NotificationHistoryDto.builder()
            .id(log.getId())
            .notificationType(log.getNotificationType())
            .referenceType(log.getReferenceType())
            .referenceId(log.getReferenceId())
            .customerId(log.getCustomer().getId())
            .customerName(log.getCustomer().getName())
            .recipientEmail(log.getRecipientEmail())
            .priority(log.getPriority())
            .emailSent(log.getEmailSent())
            .emailSentAt(log.getEmailSentAt())
            .emailDelivered(log.getEmailDelivered())
            .emailDeliveredAt(log.getEmailDeliveredAt())
            .emailOpened(log.getEmailOpened())
            .emailOpenedAt(log.getEmailOpenedAt())
            .emailBounced(log.getEmailBounced())
            .emailErrorMessage(log.getEmailErrorMessage())
            .deliveryStatus(log.getDeliveryStatus())
            .createdAt(log.getCreatedAt())
            .updatedAt(log.getUpdatedAt())
            .build();
    }
}
