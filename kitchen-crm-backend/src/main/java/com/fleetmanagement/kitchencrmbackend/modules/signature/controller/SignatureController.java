package com.fleetmanagement.kitchencrmbackend.modules.signature.controller;

import com.fleetmanagement.kitchencrmbackend.modules.signature.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.DocumentType;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureStatus;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignedDocument;
import com.fleetmanagement.kitchencrmbackend.modules.signature.service.SignatureService;
import com.fleetmanagement.kitchencrmbackend.modules.signature.service.TokenSecurityService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import com.fleetmanagement.kitchencrmbackend.security.ViewerScope;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for digital signature operations
 * Provides endpoints for document signing, verification, and tracking
 *
 * <p>Who may call what. The only screen that uses this controller is the Digital Signature panel
 * on the quotation page, and it calls exactly two endpoints here: send-for-signature and the
 * quotation's documents (plus the PDF download, which is not built yet). Those stay open to every
 * signed-in user, with the answer trimmed for staff. Everything else is the administrator's: no
 * screen calls it, and it either hands out the customer's signing token (whoever holds it can
 * approve or reject the quotation as the customer on the public page), lists customers' email and
 * phone past customers.view, or changes a signing request.
 *
 * <p>The customer signs on the public page (PublicSignatureController), never through here.
 */
@RestController
@RequestMapping("/api/v1/signatures")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SignatureController {

    private final SignatureService signatureService;
    private final TokenSecurityService tokenSecurityService;

    /**
     * Create signature request for a quotation
     * POST /api/signatures/quotation/{quotationId}/request
     */
    @PostMapping("/quotation/{quotationId}/request")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SignedDocument> createQuotationSignatureRequest(
            @PathVariable Long quotationId) {

        log.info("REST: Creating signature request for quotationId: {}", quotationId);

        try {
            SignedDocument document = signatureService.createQuotationSignatureRequest(quotationId);
            return ResponseEntity.ok(document);

        } catch (Exception e) {
            log.error("Error creating signature request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Check a signing token
     * GET /api/signatures/verify/{signingToken}
     *
     * The customer's own open goes through the public GET, which records it. This one is a
     * signed-in check, so it must not record anything: it used to mark the document OPENED, and
     * a check from the office then showed as the customer having opened the link.
     */
    @GetMapping("/verify/{signingToken}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<DocumentVerificationDto> verifySigningToken(
            @PathVariable String signingToken,
            HttpServletRequest request) {

        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        log.info("REST: Verifying signing token from IP: {}", ipAddress);

        try {
            DocumentVerificationDto result = signatureService.verifySigningToken(
                signingToken, ipAddress, userAgent, false);

            if (result.getValid()) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
            }

        } catch (Exception e) {
            log.error("Error verifying signing token: {}", e.getMessage(), e);

            DocumentVerificationDto error = DocumentVerificationDto.builder()
                .valid(false)
                .error("An error occurred while verifying the signing link")
                .build();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Capture digital signature
     * POST /api/signatures/sign
     *
     * Records the customer's approval, so it is the administrator's alone: it used to accept any
     * token from any signed-in user, which let staff approve a quotation in the customer's name.
     * No screen calls it; customers approve on the public page. The token goes through the same
     * checks as there (exists, not expired, not already signed or rejected), and every attempt is
     * written to the audit log.
     */
    @PostMapping("/sign")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SignatureResponse> captureSignature(
            @Valid @RequestBody SignatureRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        request.setIpAddress(ipAddress);
        request.setUserAgent(userAgent);

        log.info("REST: Capturing signature for token: {}, type: {}, IP: {}",
            tokenPrefix(request.getSigningToken()), request.getSignatureType(), ipAddress);

        try {
            SignatureResponse refused = refuseInvalidToken(request.getSigningToken(), ipAddress, userAgent);
            if (refused != null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(refused);
            }

            SignatureResponse response = signatureService.captureSignature(request);

            if (response.getSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

        } catch (Exception e) {
            log.error("Error capturing signature: {}", e.getMessage(), e);

            SignatureResponse error = SignatureResponse.builder()
                .success(false)
                .error("An error occurred while capturing the signature: " + e.getMessage())
                .build();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Reject a document
     * POST /api/signatures/reject
     *
     * Administrator only, for the same reason as /sign: it records the customer's decision.
     */
    @PostMapping("/reject")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SignatureResponse> rejectDocument(
            @RequestParam String signingToken,
            @RequestParam String reason,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        log.info("REST: Rejecting document for token: {}, reason: {}", tokenPrefix(signingToken), reason);

        try {
            SignatureResponse refused = refuseInvalidToken(signingToken, ipAddress, userAgent);
            if (refused != null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(refused);
            }

            SignatureResponse response = signatureService.rejectDocument(
                signingToken, reason, ipAddress, userAgent);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error rejecting document: {}", e.getMessage(), e);

            SignatureResponse error = SignatureResponse.builder()
                .success(false)
                .error("An error occurred while rejecting the document")
                .build();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get signature status by document ID
     * GET /api/signatures/status/{documentId}
     */
    @GetMapping("/status/{documentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SignatureStatusDto> getSignatureStatus(
            @PathVariable Long documentId) {

        log.info("REST: Getting signature status for documentId: {}", documentId);

        try {
            SignatureStatusDto status = signatureService.getSignatureStatus(documentId);
            return ResponseEntity.ok(status);

        } catch (Exception e) {
            log.error("Error getting signature status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get signature status by signing token
     * GET /api/signatures/status/token/{signingToken}
     */
    @GetMapping("/status/token/{signingToken}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SignatureStatusDto> getSignatureStatusByToken(
            @PathVariable String signingToken) {

        log.info("REST: Getting signature status for token: {}", tokenPrefix(signingToken));

        try {
            SignatureStatusDto status = signatureService.getSignatureStatusByToken(signingToken);
            return ResponseEntity.ok(status);

        } catch (Exception e) {
            log.error("Error getting signature status by token: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get all signature requests for a customer
     * GET /api/signatures/customer/{customerId}
     */
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<SignatureStatusDto>> getCustomerSignatureRequests(
            @PathVariable Long customerId) {

        log.info("REST: Getting signature requests for customerId: {}", customerId);

        try {
            List<SignatureStatusDto> requests = signatureService
                .getCustomerSignatureRequests(customerId);

            return ResponseEntity.ok(requests);

        } catch (Exception e) {
            log.error("Error getting customer signature requests: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get signature requests by document type
     * GET /api/signatures/type/{documentType}
     */
    @GetMapping("/type/{documentType}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<SignatureStatusDto>> getSignatureRequestsByType(
            @PathVariable DocumentType documentType) {

        log.info("REST: Getting signature requests by type: {}", documentType);

        try {
            List<SignatureStatusDto> requests = signatureService
                .getSignatureRequestsByType(documentType);

            return ResponseEntity.ok(requests);

        } catch (Exception e) {
            log.error("Error getting signature requests by type: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get signature request by reference
     * GET /api/signatures/reference
     */
    @GetMapping("/reference")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SignatureStatusDto> getSignatureRequestByReference(
            @RequestParam DocumentType documentType,
            @RequestParam Long referenceId) {

        log.info("REST: Getting signature request for type: {}, referenceId: {}",
            documentType, referenceId);

        try {
            SignatureStatusDto status = signatureService
                .getSignatureRequestByReference(documentType, referenceId);

            if (status != null) {
                return ResponseEntity.ok(status);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

        } catch (Exception e) {
            log.error("Error getting signature request by reference: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Send signature reminder
     * POST /api/signatures/{documentId}/reminder
     */
    @PostMapping("/{documentId}/reminder")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> sendSignatureReminder(
            @PathVariable Long documentId,
            @RequestParam(defaultValue = "3") int daysElapsed) {

        log.info("REST: Sending signature reminder for documentId: {}, daysElapsed: {}",
            documentId, daysElapsed);

        try {
            boolean success = signatureService.sendSignatureReminder(documentId, daysElapsed);

            return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Reminder sent successfully" : "Failed to send reminder"
            ));

        } catch (Exception e) {
            log.error("Error sending signature reminder: {}", e.getMessage(), e);

            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Error: " + e.getMessage()
            ));
        }
    }

    /**
     * Regenerate signing token
     * POST /api/signatures/{documentId}/regenerate-token
     */
    @PostMapping("/{documentId}/regenerate-token")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SignedDocument> regenerateSigningToken(
            @PathVariable Long documentId,
            @RequestParam(defaultValue = "7") int expiryDays) {

        log.info("REST: Regenerating signing token for documentId: {}", documentId);

        try {
            SignedDocument document = signatureService.regenerateSigningToken(documentId, expiryDays);
            return ResponseEntity.ok(document);

        } catch (Exception e) {
            log.error("Error regenerating signing token: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Mark document as expired
     * POST /api/signatures/{documentId}/expire
     */
    @PostMapping("/{documentId}/expire")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> markDocumentAsExpired(
            @PathVariable Long documentId) {

        log.info("REST: Marking document as expired: {}", documentId);

        try {
            signatureService.markDocumentAsExpired(documentId);

            return ResponseEntity.ok(Map.of(
                "message", "Document marked as expired",
                "documentId", documentId.toString()
            ));

        } catch (Exception e) {
            log.error("Error marking document as expired: {}", e.getMessage(), e);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get audit trail for a document
     * GET /api/signatures/{documentId}/audit-trail
     */
    @GetMapping("/{documentId}/audit-trail")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<SignatureAuditLogDto>> getDocumentAuditTrail(
            @PathVariable Long documentId) {

        log.info("REST: Getting audit trail for documentId: {}", documentId);

        try {
            List<SignatureAuditLogDto> auditTrail = signatureService
                .getDocumentAuditTrail(documentId);

            return ResponseEntity.ok(auditTrail);

        } catch (Exception e) {
            log.error("Error getting audit trail: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get signature statistics
     * GET /api/signatures/statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getSignatureStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        log.info("REST: Getting signature statistics from {} to {}", startDate, endDate);

        try {
            Map<String, Object> statistics = signatureService
                .getSignatureStatistics(startDate, endDate);

            return ResponseEntity.ok(statistics);

        } catch (Exception e) {
            log.error("Error getting signature statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get documents needing reminders (admin endpoint)
     * GET /api/signatures/admin/pending-reminders
     */
    @GetMapping("/admin/pending-reminders")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<SignedDocument>> getDocumentsNeedingReminders() {

        log.info("REST: Getting documents needing reminders");

        try {
            List<SignedDocument> documents = signatureService.getDocumentsNeedingReminders();
            return ResponseEntity.ok(documents);

        } catch (Exception e) {
            log.error("Error getting documents needing reminders: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get expired documents (admin endpoint)
     * GET /api/signatures/admin/expired
     */
    @GetMapping("/admin/expired")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<SignedDocument>> getExpiredDocuments() {

        log.info("REST: Getting expired documents");

        try {
            List<SignedDocument> documents = signatureService.getExpiredDocuments();
            return ResponseEntity.ok(documents);

        } catch (Exception e) {
            log.error("Error getting expired documents: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Send quotation for signature (admin endpoint)
     * POST /api/quotations/{id}/send-for-signature
     *
     * Creates a signature request and sends notifications to customer
     *
     * Staff press "Send for Signature" on the quotation page, so this stays open to them. The
     * screen ignores the answer; staff get it without the token and the customer's contact.
     */
    @PostMapping("/quotations/{quotationId}/send-for-signature")
    public ResponseEntity<SignedDocumentDto> sendQuotationForSignature(
            @PathVariable Long quotationId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("REST: Sending quotation {} for signature", quotationId);

        try {
            // A new request replaces the quotation's current one, so sending again after the customer
            // approved or rejected would wipe their answer. The panel only offers Send while there is
            // no request; staff get exactly that, the administrator keeps the choice.
            if (!ViewerScope.isSuperAdmin(currentUser)) {
                SignatureStatusDto current = signatureService.getSignatureRequestByReference(
                    DocumentType.QUOTATION, quotationId);
                if (current != null && (current.getStatus() == SignatureStatus.SIGNED
                        || current.getStatus() == SignatureStatus.REJECTED)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).build();
                }
            }
            SignedDocument document = signatureService.createQuotationSignatureRequest(quotationId);
            SignedDocumentDto dto = forViewer(convertToDto(document), currentUser);

            log.info("REST: Quotation {} sent for signature successfully, documentId: {}",
                quotationId, document.getId());

            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            log.error("Error sending quotation for signature: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all signed documents for a quotation (admin endpoint)
     * GET /api/quotations/{id}/documents
     *
     * Returns all signature requests and their statuses for a quotation
     *
     * The Digital Signature panel loads this for staff as well, so it stays open, trimmed.
     */
    @GetMapping("/quotations/{quotationId}/documents")
    public ResponseEntity<List<SignatureStatusDto>> getQuotationDocuments(
            @PathVariable Long quotationId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("REST: Getting signature documents for quotationId: {}", quotationId);

        try {
            SignatureStatusDto status = signatureService.getSignatureRequestByReference(
                DocumentType.QUOTATION, quotationId);

            if (status != null) {
                return ResponseEntity.ok(List.of(forViewer(status, currentUser)));
            } else {
                return ResponseEntity.ok(List.of());
            }

        } catch (Exception e) {
            log.error("Error getting quotation documents: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Download signed document PDF (admin endpoint)
     * GET /api/documents/{id}/download
     *
     * Downloads the signed/approved PDF document
     */
    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<byte[]> downloadDocument(
            @PathVariable Long documentId) {

        log.info("REST: Downloading document: {}", documentId);

        try {
            byte[] pdfBytes = signatureService.downloadSignedDocument(documentId);

            return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=signed-document-" + documentId + ".pdf")
                .body(pdfBytes);

        } catch (Exception e) {
            log.error("Error downloading document: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Health check endpoint
     * GET /api/signatures/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "SignatureService",
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * What staff may see of a signing request. The signing token (and the link built from it) is
     * the customer's key to the public approval page: whoever holds it can approve or reject the
     * quotation as the customer, so only the administrator gets it, to pass on to the customer.
     * Email and phone are left out for all staff: the panel never shows them, and here they would
     * go past customers.view. Status, dates and the customer's name stay, which is what the panel
     * shows.
     */
    private SignatureStatusDto forViewer(SignatureStatusDto status, UserPrincipal currentUser) {
        if (ViewerScope.isSuperAdmin(currentUser)) {
            return status;
        }
        status.setSigningToken(null);
        status.setSigningUrl(null);
        status.setCustomerEmail(null);
        status.setCustomerPhone(null);
        status.setSignedFromIp(null);
        return status;
    }

    /** Same rule as above, for the answer to send-for-signature. */
    private SignedDocumentDto forViewer(SignedDocumentDto dto, UserPrincipal currentUser) {
        if (ViewerScope.isSuperAdmin(currentUser)) {
            return dto;
        }
        dto.setSigningToken(null);
        dto.setSignatureData(null);
        dto.setCustomerEmail(null);
        dto.setCustomerPhone(null);
        dto.setSignerEmail(null);
        dto.setSignerPhone(null);
        dto.setSignedFromIp(null);
        dto.setSignedUserAgent(null);
        return dto;
    }

    /**
     * Runs the token through the same checks the public page uses (exists, not expired, not
     * already signed or rejected), which also writes the attempt to the audit log. Returns the
     * refusal to send back, or null when the token may be used.
     */
    private SignatureResponse refuseInvalidToken(String token, String ipAddress, String userAgent) {
        TokenSecurityService.TokenValidationResult validation =
            tokenSecurityService.validateToken(token, ipAddress, userAgent);
        if (validation.isValid()) {
            return null;
        }
        return SignatureResponse.builder()
            .success(false)
            .error(validation.getErrorMessage())
            .build();
    }

    // The token works like a password for the public page, so only its first characters are logged.
    private static String tokenPrefix(String token) {
        return token != null && token.length() > 8 ? token.substring(0, 8) + "..." : "INVALID";
    }

    // Helper method to convert SignedDocument entity to DTO
    private SignedDocumentDto convertToDto(SignedDocument document) {
        return SignedDocumentDto.builder()
            .id(document.getId())
            .documentType(document.getDocumentType())
            .referenceId(document.getReferenceId())
            .customerId(document.getCustomer() != null ? document.getCustomer().getId() : null)
            .customerName(document.getCustomerName())
            .customerEmail(document.getCustomerEmail())
            .customerPhone(document.getCustomerPhone())
            .status(document.getStatus())
            .signingToken(document.getSigningToken())
            .expiresAt(document.getExpiresAt())
            .sentAt(document.getSentAt())
            .signedAt(document.getSignedAt())
            .signatureType(document.getSignatureType())
            .signatureData(document.getSignatureData())
            .signerName(document.getCustomerName()) // Use customer name as signer name
            .signerEmail(document.getCustomerEmail()) // Use customer email as signer email
            .signerPhone(document.getCustomerPhone()) // Use customer phone as signer phone
            .signedFromIp(document.getSignedFromIp())
            .signedUserAgent(document.getSignedUserAgent())
            .reminderCount(document.getReminderCount())
            .lastReminderAt(document.getLastReminderAt())
            .createdAt(document.getCreatedAt())
            .updatedAt(document.getUpdatedAt())
            .build();
    }

    // Helper method to get client IP address
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}
