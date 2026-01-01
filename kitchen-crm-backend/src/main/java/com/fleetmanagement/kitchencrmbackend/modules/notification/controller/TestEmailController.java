package com.fleetmanagement.kitchencrmbackend.modules.notification.controller;

import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.EmailResponse;
import com.fleetmanagement.kitchencrmbackend.modules.notification.service.EmailService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Temporary endpoint to test outbound email delivery via configured SMTP
 */
@RestController
@RequestMapping("/api/v1/email")
@RequiredArgsConstructor
@Slf4j
public class TestEmailController {

    private final EmailService emailService;

    @PostMapping("/test")
    public ResponseEntity<EmailResponse> sendTestEmail(@Validated @RequestBody SendTestEmailRequest request) {
        String subject = request.getSubject() != null && !request.getSubject().isBlank()
                ? request.getSubject() : "HOCH - Test Email";
        String html = request.getHtml() != null && !request.getHtml().isBlank()
                ? request.getHtml() : "<p>This is a test email from HOCH.</p>";

        log.info("Sending test email to {}", request.getTo());
        EmailResponse response = emailService.sendSimpleEmail(request.getTo(), subject, html);
        log.info("Test email result: success={}, code={}, message={}", response.isSuccess(), response.getStatusCode(), response.getErrorMessage());
        return ResponseEntity.status(response.isSuccess() ? 200 : 500).body(response);
    }

    @Data
    public static class SendTestEmailRequest {
        private String to;
        private String subject;
        private String html;
    }
}


