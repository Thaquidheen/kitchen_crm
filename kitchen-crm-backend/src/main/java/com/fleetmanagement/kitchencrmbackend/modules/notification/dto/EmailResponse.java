package com.fleetmanagement.kitchencrmbackend.modules.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for email sending response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailResponse {

    /**
     * Whether the email was sent successfully
     */
    private boolean success;

    /**
     * Message ID from the email provider
     */
    private String messageId;

    /**
     * Status code from the provider
     */
    private int statusCode;

    /**
     * Response message
     */
    private String message;

    /**
     * Error message (if failed)
     */
    private String errorMessage;

    /**
     * Timestamp of sending
     */
    private long timestamp;

    /**
     * Create success response
     */
    public static EmailResponse success(String messageId, int statusCode) {
        return EmailResponse.builder()
                .success(true)
                .messageId(messageId)
                .statusCode(statusCode)
                .message("Email sent successfully")
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * Create failure response
     */
    public static EmailResponse failure(String errorMessage, int statusCode) {
        return EmailResponse.builder()
                .success(false)
                .statusCode(statusCode)
                .errorMessage(errorMessage)
                .message("Failed to send email")
                .timestamp(System.currentTimeMillis())
                .build();
    }
}
