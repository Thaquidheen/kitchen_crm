package com.fleetmanagement.kitchencrmbackend.modules.notification.service;

import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.EmailRequest;
import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.EmailResponse;

import java.util.Map;

/**
 * Service interface for sending emails
 */
public interface EmailService {

    /**
     * Send an email using the provided request
     *
     * @param emailRequest the email request containing all email details
     * @return EmailResponse with sending status and message ID
     */
    EmailResponse sendEmail(EmailRequest emailRequest);

    /**
     * Send a simple email with minimal parameters
     *
     * @param to recipient email address
     * @param subject email subject
     * @param htmlContent HTML content of the email
     * @return EmailResponse with sending status
     */
    EmailResponse sendSimpleEmail(String to, String subject, String htmlContent);

    /**
     * Send a template-based email
     *
     * @param to recipient email address
     * @param subject email subject
     * @param templateName name of the email template
     * @param variables variables to replace in the template
     * @return EmailResponse with sending status
     */
    EmailResponse sendTemplateEmail(String to, String subject, String templateName, Map<String, String> variables);

    /**
     * Send email with retry logic
     *
     * @param emailRequest the email request
     * @param maxRetries maximum number of retry attempts
     * @return EmailResponse with final sending status
     */
    EmailResponse sendEmailWithRetry(EmailRequest emailRequest, int maxRetries);

    /**
     * Validate email address format
     *
     * @param email email address to validate
     * @return true if valid, false otherwise
     */
    boolean isValidEmail(String email);

    /**
     * Check if email service is enabled and configured
     *
     * @return true if service is ready to send emails
     */
    boolean isEnabled();
}
