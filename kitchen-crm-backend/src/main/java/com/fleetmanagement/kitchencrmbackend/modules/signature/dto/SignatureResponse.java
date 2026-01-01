package com.fleetmanagement.kitchencrmbackend.modules.signature.dto;

import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureStatus;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for signature operation response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignatureResponse {

    /**
     * Document ID
     */
    private Long documentId;

    /**
     * Success flag
     */
    private Boolean success;

    /**
     * Response message
     */
    private String message;

    /**
     * Current status of the document
     */
    private SignatureStatus status;

    /**
     * Type of signature captured
     */
    private SignatureType signatureType;

    /**
     * When the signature was captured
     */
    private LocalDateTime signedAt;

    /**
     * URL to the signed document PDF
     */
    private String signedDocumentUrl;

    /**
     * Error message (if any)
     */
    private String error;

    /**
     * Timestamp of response
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
