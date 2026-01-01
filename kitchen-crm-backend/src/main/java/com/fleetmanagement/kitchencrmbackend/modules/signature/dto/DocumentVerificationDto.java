package com.fleetmanagement.kitchencrmbackend.modules.signature.dto;

import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.DocumentType;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for document verification (when customer opens signing link)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentVerificationDto {

    /**
     * Verification success flag
     */
    private Boolean valid;

    /**
     * Error message (if invalid)
     */
    private String error;

    /**
     * Document information (if valid)
     */
    private Long documentId;
    private DocumentType documentType;
    private SignatureStatus status;

    /**
     * Customer information
     */
    private String customerName;
    private String customerEmail;

    /**
     * Reference information
     */
    private Long referenceId;
    private String referenceNumber;

    /**
     * Token information
     */
    private LocalDateTime expiresAt;
    private Boolean expired;
    private Integer daysRemaining;

    /**
     * Document URLs
     */
    private String originalDocumentUrl;

    /**
     * Can customer sign?
     */
    private Boolean canSign;

    /**
     * Reason if cannot sign
     */
    private String reason;

    /**
     * Timestamp
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
