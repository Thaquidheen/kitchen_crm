package com.fleetmanagement.kitchencrmbackend.modules.signature.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.notification.service.NotificationService;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.signature.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.*;
import com.fleetmanagement.kitchencrmbackend.modules.signature.repository.SignatureAuditLogRepository;
import com.fleetmanagement.kitchencrmbackend.modules.signature.repository.SignedDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of SignatureService
 * Handles all digital signature operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SignatureServiceImpl implements SignatureService {

    private final SignedDocumentRepository signedDocumentRepository;
    private final SignatureAuditLogRepository auditLogRepository;
    private final QuotationRepository quotationRepository;
    private final CustomerRepository customerRepository;
    private final NotificationService notificationService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.signature.expiry-days:7}")
    private int defaultExpiryDays;

    @Override
    @Transactional
    public SignedDocument createQuotationSignatureRequest(Long quotationId) {
        log.info("Creating signature request for quotation ID: {}", quotationId);

        Quotation quotation = quotationRepository.findById(quotationId)
            .orElseThrow(() -> new RuntimeException("Quotation not found: " + quotationId));

        // Check if document already exists
        Optional<SignedDocument> existing = signedDocumentRepository
            .findTopByDocumentTypeAndReferenceIdOrderByCreatedAtDesc(DocumentType.QUOTATION, quotationId);

        if (existing.isPresent()) {
            SignedDocument doc = existing.get();
            if (doc.getStatus() == SignatureStatus.PENDING || doc.getStatus() == SignatureStatus.SENT) {
                log.info("Resending signature request for quotation ID: {} (documentId={})", quotationId, doc.getId());
                try {
                    notificationService.sendQuotationSignatureRequest(quotationId);
                    doc.setStatus(SignatureStatus.SENT);
                    doc.setSentAt(LocalDateTime.now());
                    signedDocumentRepository.save(doc);
                    createAuditLog(doc, SignatureAuditLog.EventType.SENT, "Signature request notification resent to customer");
                    return doc;
                } catch (Exception e) {
                    log.error("Failed to resend signature request notification: {}", e.getMessage(), e);
                    return doc; // Keep existing state; surface doc to caller
                }
            }
        }

        // Create new signature request
        SignedDocument document = new SignedDocument();
        document.setDocumentType(DocumentType.QUOTATION);
        document.setReferenceId(quotationId);
        document.setCustomer(quotation.getCustomer());
        document.setCustomerName(quotation.getCustomer().getName());
        document.setCustomerEmail(quotation.getCustomer().getEmail());
        document.setCustomerPhone(quotation.getCustomer().getContact());
        document.setStatus(SignatureStatus.PENDING);
        document.setSigningToken(generateSigningToken());
        document.setExpiresAt(LocalDateTime.now().plusDays(defaultExpiryDays));
        document.setReminderCount(0);

        document = signedDocumentRepository.save(document);

        // Update linked quotation metadata so admin list reflects signed status
        if (document.getDocumentType() == DocumentType.QUOTATION && document.getReferenceId() != null) {
            try {
                Long refId = document.getReferenceId();
                SignedDocument docRef = document; // effectively final for lambda
                quotationRepository.findById(refId).ifPresent(q -> {
                    q.setSignedDocument(docRef);
                    q.setQuotationSignedAt(docRef.getSignedAt());
                    quotationRepository.save(q);
                });
            } catch (Exception ignored) {
                // Best-effort update; do not block signature capture if this fails
            }
        }

        // Create audit log
        createAuditLog(document, SignatureAuditLog.EventType.CREATED,
            "Signature request created for quotation: " + quotation.getQuotationNumber());

        // Send notification to customer
        try {
            notificationService.sendQuotationSignatureRequest(quotationId);
            document.setStatus(SignatureStatus.SENT);
            document.setSentAt(LocalDateTime.now());
            document = signedDocumentRepository.save(document);
            
            createAuditLog(document, SignatureAuditLog.EventType.SENT,
                "Signature request notification sent to customer");
                
            log.info("Signature request notification sent successfully for quotation ID: {}", quotationId);
        } catch (Exception e) {
            log.error("Failed to send signature request notification: {}", e.getMessage(), e);
            // Don't fail the entire operation if notification fails
        }

        log.info("Created signature request: documentId={}, token={}", document.getId(), document.getSigningToken());

        return document;
    }

    @Override
    @Transactional
    public SignedDocument createWorkCompletionSignatureRequest(Long workCompletionId) {
        log.info("Creating signature request for work completion ID: {}", workCompletionId);

        // TODO: Implement when WorkCompletion entity is available
        throw new UnsupportedOperationException("Work completion signatures not yet implemented");
    }

    @Override
    @Transactional
    public SignedDocument createFinalBillSignatureRequest(Long finalBillId) {
        log.info("Creating signature request for final bill ID: {}", finalBillId);

        // TODO: Implement when FinalBill entity is available
        throw new UnsupportedOperationException("Final bill signatures not yet implemented");
    }

    @Override
    @Transactional
    public DocumentVerificationDto verifySigningToken(String signingToken, String ipAddress, String userAgent) {
        log.info("Verifying signing token: {}", signingToken);

        Optional<SignedDocument> documentOpt = signedDocumentRepository.findBySigningToken(signingToken);

        if (documentOpt.isEmpty()) {
            return DocumentVerificationDto.builder()
                .valid(false)
                .error("Invalid signing token")
                .build();
        }

        SignedDocument document = documentOpt.get();

        // Check if expired
        if (document.isExpired()) {
            return DocumentVerificationDto.builder()
                .valid(false)
                .error("Signing link has expired")
                .documentId(document.getId())
                .expired(true)
                .build();
        }

        // Check if already signed
        if (document.getStatus() == SignatureStatus.SIGNED) {
            return DocumentVerificationDto.builder()
                .valid(false)
                .error("Document has already been signed")
                .documentId(document.getId())
                .canSign(false)
                .reason("Already signed on " + document.getSignedAt())
                .build();
        }

        // Check if rejected
        if (document.getStatus() == SignatureStatus.REJECTED) {
            return DocumentVerificationDto.builder()
                .valid(false)
                .error("Document has been rejected")
                .documentId(document.getId())
                .canSign(false)
                .reason("Rejected")
                .build();
        }

        // Update status to OPENED if this is the first time
        if (document.getStatus() == SignatureStatus.SENT && document.getOpenedAt() == null) {
            document.setStatus(SignatureStatus.OPENED);
            document.setOpenedAt(LocalDateTime.now());
            signedDocumentRepository.save(document);

            createAuditLog(document, SignatureAuditLog.EventType.OPENED,
                "Customer opened signing link", ipAddress, userAgent);
        }

        // Get quotation details
        String referenceNumber = null;
        if (document.getDocumentType() == DocumentType.QUOTATION) {
            quotationRepository.findById(document.getReferenceId())
                .ifPresent(q -> {});
        }

        long daysRemaining = ChronoUnit.DAYS.between(LocalDateTime.now(), document.getExpiresAt());

        return DocumentVerificationDto.builder()
            .valid(true)
            .documentId(document.getId())
            .documentType(document.getDocumentType())
            .status(document.getStatus())
            .customerName(document.getCustomerName())
            .customerEmail(document.getCustomerEmail())
            .referenceId(document.getReferenceId())
            .referenceNumber(referenceNumber)
            .expiresAt(document.getExpiresAt())
            .expired(false)
            .daysRemaining((int) daysRemaining)
            .originalDocumentUrl(document.getOriginalDocumentUrl())
            .canSign(true)
            .build();
    }

    @Override
    @Transactional
    public SignatureResponse captureSignature(SignatureRequest request) {
        log.info("Capturing signature for token: {}", request.getSigningToken());

        // Verify token
        SignedDocument document = signedDocumentRepository.findBySigningToken(request.getSigningToken())
            .orElseThrow(() -> new RuntimeException("Invalid signing token"));

        // Validate can sign
        if (document.isExpired()) {
            return SignatureResponse.builder()
                .success(false)
                .error("Signing link has expired")
                .status(SignatureStatus.EXPIRED)
                .build();
        }

        if (document.isSigned()) {
            return SignatureResponse.builder()
                .success(false)
                .error("Document has already been signed")
                .status(SignatureStatus.SIGNED)
                .build();
        }

        // Validate signature data
        if (request.getSignatureType() != SignatureType.CHECKBOX) {
            if (request.getSignatureData() == null || request.getSignatureData().isEmpty()) {
                return SignatureResponse.builder()
                    .success(false)
                    .error("Signature data is required")
                    .build();
            }
        } else {
            if (request.getConfirmed() == null || !request.getConfirmed()) {
                return SignatureResponse.builder()
                    .success(false)
                    .error("Please confirm to proceed")
                    .build();
            }
        }

        // Update document
        SignatureStatus previousStatus = document.getStatus();
        document.setStatus(SignatureStatus.SIGNED);
        document.setSignatureType(request.getSignatureType());
        document.setSignatureData(request.getSignatureData());
        document.setSignedAt(LocalDateTime.now());
        document.setSignedFromIp(request.getIpAddress());
        document.setSignedUserAgent(request.getUserAgent());

        document = signedDocumentRepository.save(document);

        // Create audit log
        createAuditLog(document, SignatureAuditLog.EventType.SIGNED,
            "Document signed by customer", previousStatus, SignatureStatus.SIGNED,
            request.getIpAddress(), request.getUserAgent());

        // Send confirmation notification
        try {
            notificationService.sendSignatureConfirmation(document.getId());
        } catch (Exception e) {
            log.error("Failed to send signature confirmation: {}", e.getMessage(), e);
        }

        log.info("Signature captured successfully: documentId={}", document.getId());

        return SignatureResponse.builder()
            .success(true)
            .message("Signature captured successfully")
            .documentId(document.getId())
            .status(SignatureStatus.SIGNED)
            .signatureType(request.getSignatureType())
            .signedAt(document.getSignedAt())
            .build();
    }

    @Override
    @Transactional
    public SignatureResponse rejectDocument(String signingToken, String reason, String ipAddress, String userAgent) {
        log.info("Rejecting document for token: {}", signingToken);

        SignedDocument document = signedDocumentRepository.findBySigningToken(signingToken)
            .orElseThrow(() -> new RuntimeException("Invalid signing token"));

        if (document.isExpired()) {
            return SignatureResponse.builder()
                .success(false)
                .error("Signing link has expired")
                .status(SignatureStatus.EXPIRED)
                .build();
        }

        if (document.isSigned()) {
            return SignatureResponse.builder()
                .success(false)
                .error("Document has already been signed")
                .status(SignatureStatus.SIGNED)
                .build();
        }

        SignatureStatus previousStatus = document.getStatus();
        document.setStatus(SignatureStatus.REJECTED);
        document.setRejectionReason(reason);
        document.setSignedAt(LocalDateTime.now());
        document.setSignedFromIp(ipAddress);
        document.setSignedUserAgent(userAgent);

        document = signedDocumentRepository.save(document);

        createAuditLog(document, SignatureAuditLog.EventType.REJECTED,
            "Document rejected by customer: " + reason, previousStatus, SignatureStatus.REJECTED,
            ipAddress, userAgent);

        log.info("Document rejected: documentId={}, reason={}", document.getId(), reason);

        return SignatureResponse.builder()
            .success(true)
            .message("Document rejected")
            .documentId(document.getId())
            .status(SignatureStatus.REJECTED)
            .build();
    }

    @Override
    public SignatureStatusDto getSignatureStatus(Long documentId) {
        SignedDocument document = signedDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Signed document not found: " + documentId));

        return convertToStatusDto(document);
    }

    @Override
    public SignatureStatusDto getSignatureStatusByToken(String signingToken) {
        SignedDocument document = signedDocumentRepository.findBySigningToken(signingToken)
            .orElseThrow(() -> new RuntimeException("Invalid signing token"));

        return convertToStatusDto(document);
    }

    @Override
    public List<SignatureStatusDto> getCustomerSignatureRequests(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));

        List<SignedDocument> documents = signedDocumentRepository.findByCustomerId(customerId);

        return documents.stream()
            .map(this::convertToStatusDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<SignatureStatusDto> getSignatureRequestsByType(DocumentType documentType) {
        List<SignedDocument> documents = signedDocumentRepository
            .findByDocumentTypeOrderByCreatedAtDesc(documentType);

        return documents.stream()
            .map(this::convertToStatusDto)
            .collect(Collectors.toList());
    }

    @Override
    public SignatureStatusDto getSignatureRequestByReference(DocumentType documentType, Long referenceId) {
        return signedDocumentRepository
            .findTopByDocumentTypeAndReferenceIdOrderByCreatedAtDesc(documentType, referenceId)
            .map(this::convertToStatusDto)
            .orElse(null);
    }

    @Override
    @Transactional
    public boolean sendSignatureReminder(Long documentId, int daysElapsed) {
        log.info("Sending signature reminder for document ID: {}, daysElapsed: {}", documentId, daysElapsed);

        SignedDocument document = signedDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Signed document not found: " + documentId));

        if (!document.canSendReminder()) {
            log.warn("Cannot send reminder for document ID: {}, status: {}, reminderCount: {}",
                documentId, document.getStatus(), document.getReminderCount());
            return false;
        }

        try {
            notificationService.sendSignatureReminder(documentId, daysElapsed);

            document.setReminderCount(document.getReminderCount() + 1);
            document.setLastReminderAt(LocalDateTime.now());
            signedDocumentRepository.save(document);

            createAuditLog(document, SignatureAuditLog.EventType.REMINDER_SENT,
                "Reminder sent to customer (reminder #" + document.getReminderCount() + ", " + daysElapsed + " days elapsed)");

            log.info("Reminder sent successfully for document ID: {}", documentId);
            return true;

        } catch (Exception e) {
            log.error("Failed to send reminder for document ID: {}", documentId, e);
            return false;
        }
    }

    @Override
    @Transactional
    public void markDocumentAsExpired(Long documentId) {
        log.info("Marking document as expired: {}", documentId);

        SignedDocument document = signedDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Signed document not found: " + documentId));

        if (document.getStatus() != SignatureStatus.EXPIRED) {
            SignatureStatus previousStatus = document.getStatus();
            document.setStatus(SignatureStatus.EXPIRED);
            signedDocumentRepository.save(document);

            createAuditLog(document, SignatureAuditLog.EventType.EXPIRED,
                "Document expired", previousStatus, SignatureStatus.EXPIRED);

            log.info("Document marked as expired: {}", documentId);
        }
    }

    @Override
    @Transactional
    public SignedDocument regenerateSigningToken(Long documentId, int expiryDays) {
        log.info("Regenerating signing token for document ID: {}", documentId);

        SignedDocument document = signedDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Signed document not found: " + documentId));

        String oldToken = document.getSigningToken();
        String newToken = generateSigningToken();

        document.setSigningToken(newToken);
        document.setExpiresAt(LocalDateTime.now().plusDays(expiryDays));
        document.setStatus(SignatureStatus.PENDING);
        document.setReminderCount(0);

        document = signedDocumentRepository.save(document);

        createAuditLog(document, "TOKEN_REGENERATED",
            "Signing token regenerated (old: " + oldToken.substring(0, 8) + "..., new: " + newToken.substring(0, 8) + "...)");

        log.info("Signing token regenerated for document ID: {}", documentId);

        return document;
    }

    @Override
    public List<SignedDocument> getDocumentsNeedingReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threeDaysAgo = now.minusDays(3);
        LocalDateTime sixDaysAgo = now.minusDays(6);

        return signedDocumentRepository.findDocumentsNeedingReminders(now, threeDaysAgo, sixDaysAgo);
    }

    @Override
    public List<SignedDocument> getExpiredDocuments() {
        return signedDocumentRepository.findExpiredDocuments(LocalDateTime.now());
    }

    @Override
    public byte[] downloadSignedDocument(Long documentId) {
        // TODO: Implement PDF generation/retrieval
        throw new UnsupportedOperationException("PDF download not yet implemented");
    }

    @Override
    public List<SignatureAuditLogDto> getDocumentAuditTrail(Long documentId) {
        SignedDocument document = signedDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Signed document not found: " + documentId));

        List<SignatureAuditLog> logs = auditLogRepository.findBySignedDocumentOrderByCreatedAtDesc(document);

        return logs.stream()
            .map(this::convertToAuditLogDto)
            .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getSignatureStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        List<SignedDocument> documents = signedDocumentRepository
            .findSignedDocumentsByDateRange(startDate, endDate);

        Map<String, Object> stats = new HashMap<>();

        stats.put("totalDocuments", documents.size());
        stats.put("signed", documents.stream().filter(d -> d.getStatus() == SignatureStatus.SIGNED).count());
        stats.put("pending", documents.stream().filter(d -> d.getStatus() == SignatureStatus.PENDING).count());
        stats.put("sent", documents.stream().filter(d -> d.getStatus() == SignatureStatus.SENT).count());
        stats.put("opened", documents.stream().filter(d -> d.getStatus() == SignatureStatus.OPENED).count());
        stats.put("rejected", documents.stream().filter(d -> d.getStatus() == SignatureStatus.REJECTED).count());
        stats.put("expired", documents.stream().filter(d -> d.getStatus() == SignatureStatus.EXPIRED).count());

        // Calculate conversion rate
        long sentOrOpened = documents.stream()
            .filter(d -> d.getStatus() == SignatureStatus.SENT || d.getStatus() == SignatureStatus.OPENED)
            .count();
        long signed = documents.stream().filter(d -> d.getStatus() == SignatureStatus.SIGNED).count();

        double conversionRate = sentOrOpened > 0 ? (signed * 100.0 / sentOrOpened) : 0.0;
        stats.put("conversionRate", String.format("%.2f%%", conversionRate));

        return stats;
    }

    // Helper methods

    private String generateSigningToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private void createAuditLog(SignedDocument document, String eventType, String description) {
        SignatureAuditLog log = new SignatureAuditLog(document, eventType, description);
        auditLogRepository.save(log);
    }

    private void createAuditLog(SignedDocument document, String eventType, String description,
                               String ipAddress, String userAgent) {
        SignatureAuditLog log = new SignatureAuditLog(document, eventType, description, ipAddress, userAgent);
        auditLogRepository.save(log);
    }

    private void createAuditLog(SignedDocument document, String eventType, String description,
                               SignatureStatus previousStatus, SignatureStatus newStatus) {
        SignatureAuditLog log = new SignatureAuditLog();
        log.setSignedDocument(document);
        log.setEventType(eventType);
        log.setEventDescription(description);
        log.setPreviousStatus(previousStatus);
        log.setNewStatus(newStatus);
        auditLogRepository.save(log);
    }

    private void createAuditLog(SignedDocument document, String eventType, String description,
                               SignatureStatus previousStatus, SignatureStatus newStatus,
                               String ipAddress, String userAgent) {
        SignatureAuditLog log = new SignatureAuditLog();
        log.setSignedDocument(document);
        log.setEventType(eventType);
        log.setEventDescription(description);
        log.setPreviousStatus(previousStatus);
        log.setNewStatus(newStatus);
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent);
        auditLogRepository.save(log);
    }

    private SignatureStatusDto convertToStatusDto(SignedDocument document) {
        String signingUrl = String.format("%s/sign/%s", frontendUrl, document.getSigningToken());

        long daysElapsed = 0;
        long daysRemaining = 0;

        if (document.getSentAt() != null) {
            daysElapsed = ChronoUnit.DAYS.between(document.getSentAt(), LocalDateTime.now());
        }

        if (document.getExpiresAt() != null) {
            daysRemaining = ChronoUnit.DAYS.between(LocalDateTime.now(), document.getExpiresAt());
        }

        return SignatureStatusDto.builder()
            .documentId(document.getId())
            .documentType(document.getDocumentType())
            .referenceId(document.getReferenceId())
            .customerId(document.getCustomer().getId())
            .customerName(document.getCustomerName())
            .customerEmail(document.getCustomerEmail())
            .customerPhone(document.getCustomerPhone())
            .status(document.getStatus())
            .signatureType(document.getSignatureType())
            .signingToken(document.getSigningToken())
            .expiresAt(document.getExpiresAt())
            .expired(document.isExpired())
            .createdAt(document.getCreatedAt())
            .sentAt(document.getSentAt())
            .openedAt(document.getOpenedAt())
            .signedAt(document.getSignedAt())
            .reminderCount(document.getReminderCount())
            .lastReminderAt(document.getLastReminderAt())
            .canSendReminder(document.canSendReminder())
            .originalDocumentUrl(document.getOriginalDocumentUrl())
            .signedDocumentUrl(document.getSignedDocumentUrl())
            .signingUrl(signingUrl)
            .rejectionReason(document.getRejectionReason())
            .signedFromIp(document.getSignedFromIp())
            .daysElapsed((int) daysElapsed)
            .daysRemaining((int) daysRemaining)
            .build();
    }

    private SignatureAuditLogDto convertToAuditLogDto(SignatureAuditLog log) {
        return SignatureAuditLogDto.builder()
            .id(log.getId())
            .documentId(log.getSignedDocument().getId())
            .eventType(log.getEventType())
            .eventDescription(log.getEventDescription())
            .previousStatus(log.getPreviousStatus())
            .newStatus(log.getNewStatus())
            .ipAddress(log.getIpAddress())
            .userAgent(log.getUserAgent())
            .deviceType(log.getDeviceType())
            .browser(log.getBrowser())
            .operatingSystem(log.getOperatingSystem())
            .location(log.getLocation())
            .performedByUserId(log.getPerformedByUserId())
            .performedByUserName(log.getPerformedByUserName())
            .customerEvent(log.isCustomerEvent())
            .createdAt(log.getCreatedAt())
            .build();
    }
}
