package com.fleetmanagement.kitchencrmbackend.modules.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * DTO for email sending requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailRequest {

    /**
     * Recipient email address
     */
    private String to;

    /**
     * List of CC recipients
     */
    private List<String> cc;

    /**
     * List of BCC recipients
     */
    private List<String> bcc;

    /**
     * Email subject line
     */
    private String subject;

    /**
     * HTML content of the email
     */
    private String htmlContent;

    /**
     * Plain text content (fallback)
     */
    private String textContent;

    /**
     * Reply-to email address
     */
    private String replyTo;

    /**
     * Attachments (filename -> base64 content)
     */
    private Map<String, String> attachments;

    /**
     * Custom headers
     */
    private Map<String, String> customHeaders;

    /**
     * Template variables for dynamic content replacement
     */
    private Map<String, String> templateVariables;

    /**
     * Enable click tracking (default: true)
     */
    @Builder.Default
    private boolean trackClicks = true;

    /**
     * Enable open tracking (default: true)
     */
    @Builder.Default
    private boolean trackOpens = true;

    /**
     * Priority (1-5, where 1 is highest)
     */
    @Builder.Default
    private int priority = 3;

    /**
     * Helper method to add CC recipient
     */
    public void addCc(String email) {
        if (this.cc == null) {
            this.cc = new ArrayList<>();
        }
        this.cc.add(email);
    }

    /**
     * Helper method to add BCC recipient
     */
    public void addBcc(String email) {
        if (this.bcc == null) {
            this.bcc = new ArrayList<>();
        }
        this.bcc.add(email);
    }
}
