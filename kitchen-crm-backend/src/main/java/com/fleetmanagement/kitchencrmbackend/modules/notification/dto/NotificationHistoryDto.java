package com.fleetmanagement.kitchencrmbackend.modules.notification.dto;

import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.NotificationPriority;
import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.NotificationType;
import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.ReferenceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for displaying notification history
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationHistoryDto {

    /**
     * Notification log ID
     */
    private Long id;

    /**
     * Type of notification
     */
    private NotificationType notificationType;

    /**
     * Reference type
     */
    private ReferenceType referenceType;

    /**
     * Reference ID
     */
    private Long referenceId;

    /**
     * Customer ID
     */
    private Long customerId;

    /**
     * Customer name
     */
    private String customerName;

    /**
     * Recipient email
     */
    private String recipientEmail;

    /**
     * Priority level
     */
    private NotificationPriority priority;

    // Email status
    private Boolean emailSent;
    private LocalDateTime emailSentAt;
    private Boolean emailDelivered;
    private LocalDateTime emailDeliveredAt;
    private Boolean emailOpened;
    private LocalDateTime emailOpenedAt;
    private Boolean emailBounced;
    private String emailErrorMessage;

    /**
     * Overall delivery status
     */
    private String deliveryStatus;

    /**
     * Created timestamp
     */
    private LocalDateTime createdAt;

    /**
     * Updated timestamp
     */
    private LocalDateTime updatedAt;

    /**
     * Get email status summary
     */
    public String getChannelStatusSummary() {
        if (emailSent != null && emailSent) {
            if (emailDelivered) {
                return "Email: Delivered";
            } else if (emailBounced) {
                return "Email: Bounced";
            } else {
                return "Email: Sent";
            }
        } else if (emailSent != null) {
            return "Email: Failed";
        }
        return "Not Sent";
    }

    /**
     * Check if email is delivered
     */
    public boolean isFullyDelivered() {
        return (emailDelivered != null && emailDelivered);
    }

    /**
     * Check if customer engaged with email
     */
    public boolean isEngaged() {
        return (emailOpened != null && emailOpened);
    }
}
