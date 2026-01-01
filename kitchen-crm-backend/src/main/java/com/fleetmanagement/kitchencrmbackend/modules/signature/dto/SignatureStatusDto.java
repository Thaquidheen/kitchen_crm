package com.fleetmanagement.kitchencrmbackend.modules.signature.dto;

import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.DocumentType;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureStatus;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for displaying signature status information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignatureStatusDto {

    /**
     * Document ID
     */
    private Long documentId;

    /**
     * Document type
     */
    private DocumentType documentType;

    /**
     * Reference ID (quotation/bill ID)
     */
    private Long referenceId;

    /**
     * Customer information
     */
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    /**
     * Current status
     */
    private SignatureStatus status;

    /**
     * Signature type (if signed)
     */
    private SignatureType signatureType;

    /**
     * Signing token (for generating link)
     */
    private String signingToken;

    /**
     * Token expiry
     */
    private LocalDateTime expiresAt;

    /**
     * Is token expired?
     */
    private Boolean expired;

    /**
     * Timeline information
     */
    private LocalDateTime createdAt;
    private LocalDateTime sentAt;
    private LocalDateTime openedAt;
    private LocalDateTime signedAt;

    /**
     * Reminder information
     */
    private Integer reminderCount;
    private LocalDateTime lastReminderAt;
    private Boolean canSendReminder;

    /**
     * Document URLs
     */
    private String originalDocumentUrl;
    private String signedDocumentUrl;

    /**
     * Signing URL (frontend)
     */
    private String signingUrl;

    /**
     * Additional info
     */
    private String rejectionReason;
    private String signedFromIp;
    private Integer daysElapsed;
    private Integer daysRemaining;
}
