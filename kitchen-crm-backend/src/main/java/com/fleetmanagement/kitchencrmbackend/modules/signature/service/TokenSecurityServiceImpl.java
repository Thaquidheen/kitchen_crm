package com.fleetmanagement.kitchencrmbackend.modules.signature.service;

import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureAuditLog;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureStatus;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignedDocument;
import com.fleetmanagement.kitchencrmbackend.modules.signature.repository.SignatureAuditLogRepository;
import com.fleetmanagement.kitchencrmbackend.modules.signature.repository.SignedDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of TokenSecurityService
 * Handles token generation, validation, and security logging
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenSecurityServiceImpl implements TokenSecurityService {

    private final SignedDocumentRepository signedDocumentRepository;
    private final SignatureAuditLogRepository auditLogRepository;

    @Override
    public String generateSecureToken() {
        // Generate UUID v4 and remove dashes for cleaner URLs
        String token = UUID.randomUUID().toString().replace("-", "");

        log.debug("Generated secure token: {}...", token.substring(0, 8));

        return token;
    }

    @Override
    @Transactional
    public TokenValidationResult validateToken(String token, String ipAddress, String userAgent) {
        log.info("SECURITY: Validating token from IP: {}", ipAddress);

        // Step 1: Check if token exists
        Optional<SignedDocument> documentOpt = signedDocumentRepository.findBySigningToken(token);

        if (documentOpt.isEmpty()) {
            log.warn("SECURITY: Token not found - IP: {}", ipAddress);
            logAccessAttempt(null, token, ipAddress, userAgent, false, "TOKEN_NOT_FOUND");

            return new TokenValidationResult(
                false,
                "TOKEN_NOT_FOUND",
                "Invalid signing token. Please check your link or contact support.",
                TokenValidationResult.ValidationFailureReason.TOKEN_NOT_FOUND
            );
        }

        SignedDocument document = documentOpt.get();

        // Step 2: Check if token has expired
        if (isTokenExpired(document)) {
            log.warn("SECURITY: Token expired - documentId: {}, expiredAt: {}, IP: {}",
                document.getId(), document.getExpiresAt(), ipAddress);
            logAccessAttempt(document, token, ipAddress, userAgent, false, "TOKEN_EXPIRED");

            return new TokenValidationResult(
                false,
                "TOKEN_EXPIRED",
                "This signing link has expired. Please request a new link.",
                TokenValidationResult.ValidationFailureReason.TOKEN_EXPIRED
            );
        }

        // Step 3: Check if token has already been used (signed)
        if (document.getStatus() == SignatureStatus.SIGNED) {
            log.warn("SECURITY: Token already used (signed) - documentId: {}, signedAt: {}, IP: {}",
                document.getId(), document.getSignedAt(), ipAddress);
            logAccessAttempt(document, token, ipAddress, userAgent, false, "ALREADY_SIGNED");

            return new TokenValidationResult(
                false,
                "ALREADY_SIGNED",
                "This document has already been signed on " + document.getSignedAt(),
                TokenValidationResult.ValidationFailureReason.DOCUMENT_SIGNED
            );
        }

        // Step 4: Check if token has already been used (rejected)
        if (document.getStatus() == SignatureStatus.REJECTED) {
            log.warn("SECURITY: Token already used (rejected) - documentId: {}, IP: {}",
                document.getId(), ipAddress);
            logAccessAttempt(document, token, ipAddress, userAgent, false, "ALREADY_REJECTED");

            return new TokenValidationResult(
                false,
                "ALREADY_REJECTED",
                "This document has been rejected and cannot be signed.",
                TokenValidationResult.ValidationFailureReason.DOCUMENT_REJECTED
            );
        }

        // Step 5: All validations passed (removed CANCELLED check as it doesn't exist in enum)

        // All validations passed
        log.info("SECURITY: Token validation successful - documentId: {}, status: {}, IP: {}",
            document.getId(), document.getStatus(), ipAddress);

        logAccessAttempt(document, token, ipAddress, userAgent, true, "ACCESS_GRANTED");

        TokenValidationResult result = new TokenValidationResult(true, document);
        return result;
    }

    @Override
    @Transactional
    public void logAccessAttempt(SignedDocument document, String token, String ipAddress,
                                 String userAgent, boolean success, String reason) {

        SignatureAuditLog auditLog = new SignatureAuditLog();

        if (document != null) {
            auditLog.setSignedDocument(document);
        }

        auditLog.setEventType(success ? SignatureAuditLog.EventType.ACCESS_GRANTED : SignatureAuditLog.EventType.ACCESS_DENIED);
        auditLog.setEventDescription(success
            ? "Token validation successful - access granted"
            : "Token validation failed - access denied: " + reason);
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);

        // Parse device information from user agent
        parseUserAgentInfo(auditLog, userAgent);

        auditLogRepository.save(auditLog);

        log.info("ACCESS_LOG: {} - documentId: {}, token: {}..., IP: {}, reason: {}",
            success ? "SUCCESS" : "FAILED",
            document != null ? document.getId() : "N/A",
            token != null && token.length() > 8 ? token.substring(0, 8) : "INVALID",
            ipAddress,
            reason);
    }

    @Override
    public boolean isTokenUsed(SignedDocument document) {
        return document.getStatus() == SignatureStatus.SIGNED
            || document.getStatus() == SignatureStatus.REJECTED;
    }

    @Override
    public boolean isTokenExpired(SignedDocument document) {
        if (document.getExpiresAt() == null) {
            return false;
        }

        boolean expired = LocalDateTime.now().isAfter(document.getExpiresAt());

        // Auto-update status if expired but not yet marked
        if (expired && document.getStatus() != SignatureStatus.EXPIRED) {
            log.info("SECURITY: Auto-marking document as expired - documentId: {}", document.getId());
            document.setStatus(SignatureStatus.EXPIRED);
            signedDocumentRepository.save(document);
        }

        return expired;
    }

    /**
     * Parse user agent information to extract device type, browser, and OS
     */
    private void parseUserAgentInfo(SignatureAuditLog log, String userAgent) {
        if (userAgent == null || userAgent.isEmpty()) {
            return;
        }

        String ua = userAgent.toLowerCase();

        // Detect device type
        if (ua.contains("mobile") || ua.contains("android") || ua.contains("iphone")) {
            log.setDeviceType("Mobile");
        } else if (ua.contains("tablet") || ua.contains("ipad")) {
            log.setDeviceType("Tablet");
        } else {
            log.setDeviceType("Desktop");
        }

        // Detect browser
        if (ua.contains("edg")) {
            log.setBrowser("Edge");
        } else if (ua.contains("chrome")) {
            log.setBrowser("Chrome");
        } else if (ua.contains("firefox")) {
            log.setBrowser("Firefox");
        } else if (ua.contains("safari")) {
            log.setBrowser("Safari");
        } else if (ua.contains("opera") || ua.contains("opr")) {
            log.setBrowser("Opera");
        } else {
            log.setBrowser("Other");
        }

        // Detect operating system
        if (ua.contains("windows")) {
            log.setOperatingSystem("Windows");
        } else if (ua.contains("mac os") || ua.contains("macos")) {
            log.setOperatingSystem("macOS");
        } else if (ua.contains("linux")) {
            log.setOperatingSystem("Linux");
        } else if (ua.contains("android")) {
            log.setOperatingSystem("Android");
        } else if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ios")) {
            log.setOperatingSystem("iOS");
        } else {
            log.setOperatingSystem("Other");
        }
    }
}
