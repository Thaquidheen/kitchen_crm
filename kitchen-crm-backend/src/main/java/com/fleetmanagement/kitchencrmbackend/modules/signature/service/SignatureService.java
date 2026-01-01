package com.fleetmanagement.kitchencrmbackend.modules.signature.service;

import com.fleetmanagement.kitchencrmbackend.modules.signature.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.DocumentType;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignedDocument;

import java.util.List;

/**
 * Service interface for digital signature operations
 * Handles document creation, signing, verification, and tracking
 */
public interface SignatureService {

    /**
     * Create a signature request for a quotation
     *
     * @param quotationId the quotation ID
     * @return created signed document
     */
    SignedDocument createQuotationSignatureRequest(Long quotationId);

    /**
     * Create a signature request for work completion
     *
     * @param workCompletionId the work completion ID
     * @return created signed document
     */
    SignedDocument createWorkCompletionSignatureRequest(Long workCompletionId);

    /**
     * Create a signature request for final bill
     *
     * @param finalBillId the final bill ID
     * @return created signed document
     */
    SignedDocument createFinalBillSignatureRequest(Long finalBillId);

    /**
     * Verify a signing token and return document information
     *
     * @param signingToken the signing token from URL
     * @param ipAddress the IP address of the request
     * @param userAgent the user agent string
     * @return verification result with document info
     */
    DocumentVerificationDto verifySigningToken(String signingToken, String ipAddress, String userAgent);

    /**
     * Capture a digital signature
     *
     * @param request the signature request with signature data
     * @return signature response with status
     */
    SignatureResponse captureSignature(SignatureRequest request);

    /**
     * Reject a document
     *
     * @param signingToken the signing token
     * @param reason the rejection reason
     * @param ipAddress the IP address
     * @param userAgent the user agent
     * @return signature response
     */
    SignatureResponse rejectDocument(String signingToken, String reason, String ipAddress, String userAgent);

    /**
     * Get signature status for a document
     *
     * @param documentId the signed document ID
     * @return signature status DTO
     */
    SignatureStatusDto getSignatureStatus(Long documentId);

    /**
     * Get signature status by signing token
     *
     * @param signingToken the signing token
     * @return signature status DTO
     */
    SignatureStatusDto getSignatureStatusByToken(String signingToken);

    /**
     * Get all signature requests for a customer
     *
     * @param customerId the customer ID
     * @return list of signature status DTOs
     */
    List<SignatureStatusDto> getCustomerSignatureRequests(Long customerId);

    /**
     * Get signature requests by document type
     *
     * @param documentType the document type
     * @return list of signature status DTOs
     */
    List<SignatureStatusDto> getSignatureRequestsByType(DocumentType documentType);

    /**
     * Get signature requests by reference
     *
     * @param documentType the document type
     * @param referenceId the reference ID
     * @return signature status DTO if found
     */
    SignatureStatusDto getSignatureRequestByReference(DocumentType documentType, Long referenceId);

    /**
     * Send reminder for pending signature
     *
     * @param documentId the signed document ID
     * @param daysElapsed days since request was sent
     * @return success flag
     */
    boolean sendSignatureReminder(Long documentId, int daysElapsed);

    /**
     * Mark document as expired
     *
     * @param documentId the signed document ID
     */
    void markDocumentAsExpired(Long documentId);

    /**
     * Regenerate signing token (if expired or needs refresh)
     *
     * @param documentId the signed document ID
     * @param expiryDays number of days until expiry
     * @return new signed document with new token
     */
    SignedDocument regenerateSigningToken(Long documentId, int expiryDays);

    /**
     * Get documents that need reminders
     * (documents sent 3+ days ago, less than 2 reminders sent, not expired)
     *
     * @return list of documents needing reminders
     */
    List<SignedDocument> getDocumentsNeedingReminders();

    /**
     * Get expired documents that need status update
     *
     * @return list of expired documents
     */
    List<SignedDocument> getExpiredDocuments();

    /**
     * Download signed document PDF
     *
     * @param documentId the signed document ID
     * @return PDF byte array
     */
    byte[] downloadSignedDocument(Long documentId);

    /**
     * Get audit trail for a document
     *
     * @param documentId the signed document ID
     * @return list of audit log entries
     */
    List<SignatureAuditLogDto> getDocumentAuditTrail(Long documentId);

    /**
     * Get signature statistics for dashboard
     *
     * @param startDate start date for statistics
     * @param endDate end date for statistics
     * @return map with statistics
     */
    java.util.Map<String, Object> getSignatureStatistics(java.time.LocalDateTime startDate,
                                                          java.time.LocalDateTime endDate);
}
