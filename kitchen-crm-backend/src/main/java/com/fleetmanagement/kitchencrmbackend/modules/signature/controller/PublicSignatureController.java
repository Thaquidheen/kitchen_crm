package com.fleetmanagement.kitchencrmbackend.modules.signature.controller;

import com.fleetmanagement.kitchencrmbackend.modules.signature.dto.DocumentVerificationDto;
import com.fleetmanagement.kitchencrmbackend.modules.signature.dto.SignatureRequest;
import com.fleetmanagement.kitchencrmbackend.modules.signature.dto.SignatureResponse;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignedDocument;
import com.fleetmanagement.kitchencrmbackend.modules.signature.service.SignatureService;
import com.fleetmanagement.kitchencrmbackend.modules.signature.service.TokenSecurityService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public REST Controller for customer-facing signature operations
 * These endpoints do not require authentication
 * Uses TokenSecurityService for enhanced security and logging
 */
@RestController
@RequestMapping("/api/public/documents/sign")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PublicSignatureController {

    private final SignatureService signatureService;
    private final TokenSecurityService tokenSecurityService;

    /**
     * Get document for signing (customer opens signing link)
     * GET /api/public/documents/sign/{token}
     *
     * This endpoint is called when a customer clicks on the signing link
     * It uses TokenSecurityService for comprehensive validation and logging
     */
    @GetMapping("/{token}")
    public ResponseEntity<DocumentVerificationDto> getDocumentForSigning(
            @PathVariable String token,
            HttpServletRequest request) {

        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        log.info("PUBLIC: Customer accessing document with token from IP: {}", ipAddress);

        try {
            // Validate token with comprehensive security checks
            TokenSecurityService.TokenValidationResult validationResult =
                tokenSecurityService.validateToken(token, ipAddress, userAgent);

            if (!validationResult.isValid()) {
                // Token validation failed - error already logged by TokenSecurityService
                log.warn("PUBLIC: Token validation failed: {}", validationResult.getErrorMessage());

                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(DocumentVerificationDto.builder()
                        .valid(false)
                        .error(validationResult.getErrorMessage())
                        .build());
            }

            // Token is valid - get full document details
            SignedDocument document = validationResult.getDocument();
            DocumentVerificationDto result = signatureService.verifySigningToken(
                token, ipAddress, userAgent);

            log.info("PUBLIC: Token validated successfully for document: {}", document.getId());
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("PUBLIC: Error accessing document: {}", e.getMessage(), e);

            DocumentVerificationDto error = DocumentVerificationDto.builder()
                .valid(false)
                .error("Unable to load document. Please contact support or try again later.")
                .build();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Submit approval/signature (customer submits approval form)
     * POST /api/public/documents/sign/{token}
     *
     * This endpoint is called when customer submits the approval form
     * It validates the token first, then captures the signature
     */
    @PostMapping("/{token}")
    public ResponseEntity<SignatureResponse> submitApproval(
            @PathVariable String token,
            @Valid @RequestBody SignatureRequest signatureRequest,
            HttpServletRequest request) {

        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        log.info("PUBLIC: Customer submitting approval for token, IP: {}, type: {}",
            ipAddress, signatureRequest.getSignatureType());

        try {
            // Validate token before processing signature
            TokenSecurityService.TokenValidationResult validationResult =
                tokenSecurityService.validateToken(token, ipAddress, userAgent);

            if (!validationResult.isValid()) {
                log.warn("PUBLIC: Token validation failed on signature submission: {}",
                    validationResult.getErrorMessage());

                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(SignatureResponse.builder()
                        .success(false)
                        .error(validationResult.getErrorMessage())
                        .build());
            }

            // Token is valid - proceed with signature capture
            signatureRequest.setSigningToken(token);
            signatureRequest.setIpAddress(ipAddress);
            signatureRequest.setUserAgent(userAgent);

            SignatureResponse response = signatureService.captureSignature(signatureRequest);

            if (response.getSuccess()) {
                log.info("PUBLIC: Approval submitted successfully for document: {}",
                    response.getDocumentId());
                return ResponseEntity.ok(response);
            } else {
                log.warn("PUBLIC: Approval submission failed: {}", response.getError());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

        } catch (Exception e) {
            log.error("PUBLIC: Error submitting approval: {}", e.getMessage(), e);

            SignatureResponse error = SignatureResponse.builder()
                .success(false)
                .error("Unable to submit approval. Please try again or contact support.")
                .build();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Reject document (customer rejects the document)
     * POST /api/public/documents/sign/{token}/reject
     *
     * This endpoint allows customers to reject a document with a reason
     */
    @PostMapping("/{token}/reject")
    public ResponseEntity<SignatureResponse> rejectDocument(
            @PathVariable String token,
            @RequestParam String reason,
            HttpServletRequest request) {

        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        log.info("PUBLIC: Customer rejecting document for token, reason: {}", reason);

        try {
            SignatureResponse response = signatureService.rejectDocument(
                token, reason, ipAddress, userAgent);

            if (response.getSuccess()) {
                log.info("PUBLIC: Document rejected successfully");
                return ResponseEntity.ok(response);
            } else {
                log.warn("PUBLIC: Document rejection failed: {}", response.getError());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

        } catch (Exception e) {
            log.error("PUBLIC: Error rejecting document: {}", e.getMessage(), e);

            SignatureResponse error = SignatureResponse.builder()
                .success(false)
                .error("Unable to reject document. Please try again or contact support.")
                .build();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
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
