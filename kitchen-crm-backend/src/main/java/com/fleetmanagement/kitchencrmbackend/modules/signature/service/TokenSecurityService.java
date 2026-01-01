package com.fleetmanagement.kitchencrmbackend.modules.signature.service;

import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignedDocument;

/**
 * Service interface for token security operations
 * Handles token generation, validation, and security checks
 */
public interface TokenSecurityService {

    /**
     * Generate a secure signing token (UUID v4)
     *
     * @return secure random token
     */
    String generateSecureToken();

    /**
     * Validate token with comprehensive security checks
     *
     * @param token the signing token
     * @param ipAddress the IP address of the request
     * @param userAgent the user agent string
     * @return validation result with details
     */
    TokenValidationResult validateToken(String token, String ipAddress, String userAgent);

    /**
     * Log access attempt (both successful and failed)
     *
     * @param document the signed document (can be null if token not found)
     * @param token the attempted token
     * @param ipAddress the IP address
     * @param userAgent the user agent
     * @param success whether access was successful
     * @param reason failure reason if not successful
     */
    void logAccessAttempt(SignedDocument document, String token, String ipAddress,
                         String userAgent, boolean success, String reason);

    /**
     * Check if token has been used (document already signed/rejected)
     *
     * @param document the signed document
     * @return true if already used
     */
    boolean isTokenUsed(SignedDocument document);

    /**
     * Check if token has expired
     *
     * @param document the signed document
     * @return true if expired
     */
    boolean isTokenExpired(SignedDocument document);

    /**
     * Result class for token validation
     */
    class TokenValidationResult {
        private boolean valid;
        private String errorCode;
        private String errorMessage;
        private SignedDocument document;
        private ValidationFailureReason failureReason;

        public enum ValidationFailureReason {
            TOKEN_NOT_FOUND,
            TOKEN_EXPIRED,
            TOKEN_ALREADY_USED,
            DOCUMENT_SIGNED,
            DOCUMENT_REJECTED
        }

        public TokenValidationResult(boolean valid, SignedDocument document) {
            this.valid = valid;
            this.document = document;
        }

        public TokenValidationResult(boolean valid, String errorCode, String errorMessage,
                                    ValidationFailureReason failureReason) {
            this.valid = valid;
            this.errorCode = errorCode;
            this.errorMessage = errorMessage;
            this.failureReason = failureReason;
        }

        public boolean isValid() {
            return valid;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public SignedDocument getDocument() {
            return document;
        }

        public ValidationFailureReason getFailureReason() {
            return failureReason;
        }

        public void setDocument(SignedDocument document) {
            this.document = document;
        }
    }
}
