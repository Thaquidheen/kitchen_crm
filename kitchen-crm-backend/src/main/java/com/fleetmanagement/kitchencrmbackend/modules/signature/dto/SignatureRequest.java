package com.fleetmanagement.kitchencrmbackend.modules.signature.dto;

import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for capturing a digital signature
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignatureRequest {

    /**
     * Signing token from the URL
     */
    @JsonIgnore
    private String signingToken;

    /**
     * Type of signature being captured
     */
    @NotNull(message = "Signature type is required")
    private SignatureType signatureType;

    /**
     * Base64-encoded signature image data
     * Required for DRAWN, UPLOADED, and TYPED signatures
     */
    private String signatureData;

    /**
     * IP address of the signer (captured from request)
     */
    private String ipAddress;

    /**
     * User agent string (captured from request)
     */
    private String userAgent;

    /**
     * Optional comments from customer
     */
    private String comments;

    /**
     * Customer name (for verification)
     */
    private String customerName;

    /**
     * Customer email (for verification)
     */
    private String customerEmail;

    /**
     * Checkbox confirmation (for CHECKBOX type)
     */
    private Boolean confirmed;
}
