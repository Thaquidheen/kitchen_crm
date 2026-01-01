package com.fleetmanagement.kitchencrmbackend.modules.notification.dto;

import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.NotificationPriority;
import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.NotificationType;
import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.ReferenceType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO for requesting a notification to be sent via email
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRequest {

    /**
     * Customer ID (required)
     */
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    /**
     * Type of notification (required)
     */
    @NotNull(message = "Notification type is required")
    private NotificationType notificationType;

    /**
     * Type of reference entity (required)
     */
    @NotNull(message = "Reference type is required")
    private ReferenceType referenceType;

    /**
     * ID of reference entity (required)
     */
    @NotNull(message = "Reference ID is required")
    private Long referenceId;

    /**
     * Optional: Signed document ID for signature-related notifications
     */
    private Long signedDocumentId;

    /**
     * Recipient email address
     */
    @Email(message = "Invalid email format")
    private String recipientEmail;

    /**
     * Priority level (default: MEDIUM)
     */
    @Builder.Default
    private NotificationPriority priority = NotificationPriority.MEDIUM;

    /**
     * Template code to use (e.g., "QUOTATION_SIGNATURE_REQUEST")
     * If not provided, service will auto-select based on notificationType
     */
    private String templateCode;

    /**
     * Variables to replace in template
     * Example: {"customerName": "John Doe", "quotationNumber": "Q-123"}
     */
    private Map<String, String> templateVariables;

    /**
     * Send via email (default: true)
     */
    @Builder.Default
    private Boolean sendEmail = true;

    /**
     * Optional metadata as JSON string
     */
    private String metadata;

    /**
     * Whether to retry on failure (default: true)
     */
    @Builder.Default
    private Boolean retryOnFailure = true;

    /**
     * Maximum retry attempts (default: 3)
     */
    @Builder.Default
    private Integer maxRetries = 3;
}
