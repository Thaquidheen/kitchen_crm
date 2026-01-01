package com.fleetmanagement.kitchencrmbackend.modules.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO representing the response after sending a notification
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    /**
     * Notification log ID (for tracking)
     */
    private Long notificationLogId;

    /**
     * Overall success status
     */
    private Boolean success;

    /**
     * Overall message
     */
    private String message;

    // Email channel status
    /**
     * Whether email was sent successfully
     */
    private Boolean emailSent;

    /**
     * Email message ID from provider
     */
    private String emailMessageId;

    /**
     * Email error message (if failed)
     */
    private String emailError;

    /**
     * Email sent timestamp
     */
    private LocalDateTime emailSentAt;

    // Delivery summary
    /**
     * Overall delivery status (SENT, DELIVERED, FAILED, PENDING)
     */
    private String deliveryStatus;

    /**
     * Number of successful channels
     */
    private Integer successfulChannels;

    /**
     * Number of failed channels
     */
    private Integer failedChannels;

    /**
     * Total time taken to send (in milliseconds)
     */
    private Long processingTimeMs;

    /**
     * Timestamp of response
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * Check if email succeeded
     */
    public boolean isPartialSuccess() {
        return (emailSent != null && emailSent);
    }

    /**
     * Check if all requested channels succeeded
     */
    public boolean isFullSuccess() {
        return success != null && success;
    }

    /**
     * Check if email failed
     */
    public boolean isCompleteFailure() {
        return (emailSent != null && !emailSent);
    }

    /**
     * Get human-readable status summary
     */
    public String getStatusSummary() {
        if (isFullSuccess()) {
            return "Email notification sent successfully";
        } else if (isPartialSuccess()) {
            return String.format("Notification sent via %d channel(s), %d failed",
                successfulChannels, failedChannels);
        } else {
            return "Email notification failed";
        }
    }
}
