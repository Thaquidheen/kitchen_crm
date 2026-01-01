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
 * DTO for SignedDocument entity
 * Used for API responses to avoid lazy loading serialization issues
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignedDocumentDto {
    
    private Long id;
    private DocumentType documentType;
    private Long referenceId;
    
    // Customer information (cached fields, not lazy-loaded)
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    
    // Signature details
    private SignatureStatus status;
    private String signingToken;
    private LocalDateTime expiresAt;
    private LocalDateTime sentAt;
    private LocalDateTime signedAt;
    
    // Signature data
    private SignatureType signatureType;
    private String signatureData;
    private String signerName;
    private String signerEmail;
    private String signerPhone;
    private String signedFromIp;
    private String signedUserAgent;
    
    // Reminder tracking
    private Integer reminderCount;
    private LocalDateTime lastReminderAt;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
