package com.fleetmanagement.kitchencrmbackend.modules.signature.entity;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity representing a signed/approved document
 * Stores information about quotations, work completion certificates, and final bills
 */
@Entity
@Table(name = "signed_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignedDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Type of document (QUOTATION, WORK_COMPLETION, FINAL_BILL)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    private DocumentType documentType;

    /**
     * ID of the referenced entity (quotation_id, work_completion_id, etc.)
     */
    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    /**
     * Customer who needs to sign/approve
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    /**
     * Customer name (cached for quick access)
     */
    @Column(name = "customer_name", length = 200)
    private String customerName;

    /**
     * Customer email (cached)
     */
    @Column(name = "customer_email", length = 200)
    private String customerEmail;

    /**
     * Customer phone (cached)
     */
    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    /**
     * URL to the original unsigned PDF
     */
    @Column(name = "original_document_url", length = 500)
    private String originalDocumentUrl;

    /**
     * URL to the signed/approved PDF with approval stamp
     */
    @Column(name = "signed_document_url", length = 500)
    private String signedDocumentUrl;

    /**
     * Base64 signature image data (if drawn/uploaded signature)
     */
    @Column(name = "signature_data", columnDefinition = "TEXT")
    private String signatureData;

    /**
     * Type of signature capture method
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "signature_type", length = 30)
    private SignatureType signatureType;

    /**
     * Current status of the signature request
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private SignatureStatus status = SignatureStatus.PENDING;

    /**
     * Unique token for secure access to signing page
     */
    @Column(name = "signing_token", unique = true, length = 100)
    private String signingToken;

    /**
     * Token expiration timestamp (7 days from creation)
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * When the document was sent to customer
     */
    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    /**
     * When customer first opened the signing page
     */
    @Column(name = "opened_at")
    private LocalDateTime openedAt;

    /**
     * When customer signed/approved the document
     */
    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    /**
     * IP address from which document was signed
     */
    @Column(name = "signed_from_ip", length = 50)
    private String signedFromIp;

    /**
     * Browser user agent at time of signing
     */
    @Column(name = "signed_user_agent", columnDefinition = "TEXT")
    private String signedUserAgent;

    /**
     * Comments or reason if rejected
     */
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    /**
     * Number of reminders sent (0, 1, or 2)
     */
    @Column(name = "reminder_count", nullable = false)
    private Integer reminderCount = 0;

    /**
     * When the last reminder was sent
     */
    @Column(name = "last_reminder_at")
    private LocalDateTime lastReminderAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Check if the signing token is expired
     */
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Check if the document is signed/approved
     */
    public boolean isSigned() {
        return status == SignatureStatus.SIGNED;
    }

    /**
     * Check if reminders can still be sent
     */
    public boolean canSendReminder() {
        return status == SignatureStatus.SENT &&
               reminderCount < 2 &&
               !isExpired();
    }
}
