package com.fleetmanagement.kitchencrmbackend.modules.notification.service;

import com.fleetmanagement.kitchencrmbackend.config.EmailProperties;
import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.EmailRequest;
import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.EmailResponse;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import org.springframework.core.io.ByteArrayResource;

import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.Base64;

/**
 * Gmail SMTP implementation of EmailService
 * Uses Spring Boot's JavaMailSender with Gmail SMTP configuration
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GmailSmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;
    private final EmailProperties emailProperties;

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    @Override
    public EmailResponse sendEmail(EmailRequest emailRequest) {
        if (!isEnabled()) {
            log.warn("Email service is disabled. Skipping email send.");
            return EmailResponse.failure("Email service is disabled", 0);
        }

        if (!isValidEmail(emailRequest.getTo())) {
            log.error("Invalid recipient email address: {}", emailRequest.getTo());
            return EmailResponse.failure("Invalid recipient email address", 400);
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Set sender
            String fromEmail = emailProperties.getSmtp().getFromEmail();
            String fromName = emailProperties.getSmtp().getFromName();
            if (fromName != null && !fromName.isEmpty()) {
                helper.setFrom(fromEmail, fromName);
            } else {
                helper.setFrom(fromEmail);
            }

            // Set recipient
            helper.setTo(emailRequest.getTo());

            // Set subject
            helper.setSubject(emailRequest.getSubject());

            // Set content (prefer HTML over plain text)
            if (emailRequest.getHtmlContent() != null && !emailRequest.getHtmlContent().isEmpty()) {
                // Provide HTML body directly; JavaMail will set the correct content type
                helper.setText(emailRequest.getHtmlContent(), true);
            } else if (emailRequest.getTextContent() != null && !emailRequest.getTextContent().isEmpty()) {
                helper.setText(emailRequest.getTextContent(), false);
            } else {
                throw new IllegalArgumentException("Email must have either HTML or text content");
            }

            // Set reply-to if specified
            if (emailRequest.getReplyTo() != null && !emailRequest.getReplyTo().isEmpty()) {
                helper.setReplyTo(emailRequest.getReplyTo());
            }

            // Add CC recipients
            if (emailRequest.getCc() != null && !emailRequest.getCc().isEmpty()) {
                helper.setCc(emailRequest.getCc().toArray(new String[0]));
            }

            // Add BCC recipients
            if (emailRequest.getBcc() != null && !emailRequest.getBcc().isEmpty()) {
                helper.setBcc(emailRequest.getBcc().toArray(new String[0]));
            }

            // Add attachments if provided (filename -> base64 content)
            if (emailRequest.getAttachments() != null && !emailRequest.getAttachments().isEmpty()) {
                for (Map.Entry<String, String> entry : emailRequest.getAttachments().entrySet()) {
                    try {
                        byte[] data = Base64.getDecoder().decode(entry.getValue());
                        helper.addAttachment(entry.getKey(), new ByteArrayResource(data));
                    } catch (IllegalArgumentException ex) {
                        log.warn("Skipping invalid base64 attachment '{}': {}", entry.getKey(), ex.getMessage());
                    }
                }
            }

            // Send email
            mailSender.send(message);

            // Generate a message ID (Gmail doesn't return one directly)
            String messageId = UUID.randomUUID().toString();
            log.info("Email sent successfully to {} via Gmail SMTP. Generated Message ID: {}",
                    emailRequest.getTo(), messageId);

            return EmailResponse.success(messageId, 200);

        } catch (MessagingException e) {
            log.error("Messaging error sending email to {}: {}", emailRequest.getTo(), e.getMessage(), e);
            return EmailResponse.failure("Messaging Error: " + e.getMessage(), 500);
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", emailRequest.getTo(), e.getMessage(), e);
            return EmailResponse.failure("Unexpected error: " + e.getMessage(), 500);
        }
    }

    @Override
    public EmailResponse sendSimpleEmail(String to, String subject, String htmlContent) {
        EmailRequest request = EmailRequest.builder()
                .to(to)
                .subject(subject)
                .htmlContent(htmlContent)
                .build();
        return sendEmail(request);
    }

    @Override
    public EmailResponse sendTemplateEmail(String to, String subject, String templateName, Map<String, String> variables) {
        // This method will be enhanced when we integrate with NotificationTemplate
        // For now, it works similar to simple email
        EmailRequest request = EmailRequest.builder()
                .to(to)
                .subject(subject)
                .templateVariables(variables)
                .build();
        return sendEmail(request);
    }

    @Override
    public EmailResponse sendEmailWithRetry(EmailRequest emailRequest, int maxRetries) {
        EmailResponse response = null;
        int attempts = 0;

        while (attempts < maxRetries) {
            attempts++;
            response = sendEmail(emailRequest);

            if (response.isSuccess()) {
                return response;
            }

            if (attempts < maxRetries) {
                log.warn("Email send attempt {} failed. Retrying... (max: {})", attempts, maxRetries);
                try {
                    Thread.sleep(emailProperties.getRetryDelayMs());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.error("Retry interrupted", e);
                    break;
                }
            }
        }

        log.error("Failed to send email after {} attempts", maxRetries);
        return response;
    }

    @Override
    public boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    @Override
    public boolean isEnabled() {
        // Check if email is enabled and SMTP configuration is present
        return emailProperties.isEnabled() &&
               emailProperties.getSmtp() != null &&
               emailProperties.getSmtp().getHost() != null &&
               !emailProperties.getSmtp().getHost().isEmpty() &&
               emailProperties.getSmtp().getUsername() != null &&
               !emailProperties.getSmtp().getUsername().isEmpty() &&
               !emailProperties.getSmtp().getUsername().equals("your-email@gmail.com");
    }
}
