package com.fleetmanagement.kitchencrmbackend.modules.notification.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity for storing reusable notification templates
 * Supports both Email and WhatsApp templates with variable replacement
 */
@Entity
@Table(name = "notification_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique template identifier (e.g., "QUOTATION_SIGNATURE_REQUEST")
     */
    @Column(name = "template_code", unique = true, nullable = false, length = 50)
    private String templateCode;

    /**
     * Human-readable template name
     */
    @Column(name = "template_name", length = 200)
    private String templateName;

    /**
     * Template description for admin reference
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Email template fields
    /**
     * Email subject line
     * Supports variables: {{customerName}}, {{quotationNumber}}, etc.
     */
    @Column(name = "email_subject", length = 200)
    private String emailSubject;

    /**
     * Email body (HTML format)
     * Supports variables: {{customerName}}, {{signingUrl}}, {{expiryDate}}, etc.
     */
    @Column(name = "email_body", columnDefinition = "TEXT")
    private String emailBody;

    /**
     * Optional plain text version of email
     */
    @Column(name = "email_plain_text", columnDefinition = "TEXT")
    private String emailPlainText;

    // WhatsApp template fields
    /**
     * WhatsApp template name (must match approved template in Gupshup)
     */
    @Column(name = "whatsapp_template_name", length = 100)
    private String whatsappTemplateName;

    /**
     * WhatsApp message content
     * For approved templates, this is just for reference
     * Supports variables: {{1}}, {{2}}, {{3}} for WhatsApp template parameters
     */
    @Column(name = "whatsapp_message", columnDefinition = "TEXT")
    private String whatsappMessage;

    /**
     * JSON array of variable names for template
     * Example: ["customerName", "signingUrl", "expiryDate"]
     */
    @Column(name = "variables", columnDefinition = "TEXT")
    private String variables;

    /**
     * Whether this template is currently active
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * Category for organization (SIGNATURE, PAYMENT, DESIGN, GENERAL)
     */
    @Column(name = "category", length = 50)
    private String category;

    /**
     * Language code (en, hi, etc.)
     */
    @Column(name = "language_code", length = 10)
    private String languageCode = "en";

    /**
     * Version number for template tracking
     */
    @Column(name = "version")
    private Integer version = 1;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Check if template has email content
     */
    public boolean hasEmailTemplate() {
        return emailSubject != null && !emailSubject.isEmpty() &&
               emailBody != null && !emailBody.isEmpty();
    }

    /**
     * Check if template has WhatsApp content
     */
    public boolean hasWhatsAppTemplate() {
        return whatsappTemplateName != null && !whatsappTemplateName.isEmpty() &&
               whatsappMessage != null && !whatsappMessage.isEmpty();
    }

    /**
     * Replace variables in email subject
     */
    public String replaceEmailSubjectVariables(java.util.Map<String, String> variableMap) {
        if (emailSubject == null) return null;

        String result = emailSubject;
        for (java.util.Map.Entry<String, String> entry : variableMap.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return result;
    }

    /**
     * Replace variables in email body
     */
    public String replaceEmailBodyVariables(java.util.Map<String, String> variableMap) {
        if (emailBody == null) return null;

        String result = emailBody;
        for (java.util.Map.Entry<String, String> entry : variableMap.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return result;
    }

    /**
     * Replace variables in WhatsApp message
     */
    public String replaceWhatsAppVariables(java.util.Map<String, String> variableMap) {
        if (whatsappMessage == null) return null;

        String result = whatsappMessage;
        for (java.util.Map.Entry<String, String> entry : variableMap.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return result;
    }
}
