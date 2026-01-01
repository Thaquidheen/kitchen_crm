package com.fleetmanagement.kitchencrmbackend.modules.notification.entity;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignedDocument;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity for tracking notification delivery across Email and WhatsApp channels
 * Maintains complete audit trail of all notifications sent
 */
@Entity
@Table(name = "notification_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Type of notification being sent
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    private NotificationType notificationType;

    /**
     * Type of entity being referenced
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type", nullable = false, length = 30)
    private ReferenceType referenceType;

    /**
     * ID of the referenced entity
     */
    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    /**
     * Optional: Link to signed document if notification is signature-related
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signed_document_id")
    private SignedDocument signedDocument;

    /**
     * Customer who received the notification
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    /**
     * Recipient email address
     */
    @Column(name = "recipient_email", length = 200)
    private String recipientEmail;

    /**
     * Recipient phone number (with country code)
     */
    @Column(name = "recipient_phone", length = 20)
    private String recipientPhone;

    /**
     * Priority level of this notification
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private NotificationPriority priority = NotificationPriority.MEDIUM;

    // Email-specific fields
    @Column(name = "email_sent", nullable = false)
    private Boolean emailSent = false;

    @Column(name = "email_sent_at")
    private LocalDateTime emailSentAt;

    @Column(name = "email_delivered", nullable = false)
    private Boolean emailDelivered = false;

    @Column(name = "email_delivered_at")
    private LocalDateTime emailDeliveredAt;

    @Column(name = "email_opened", nullable = false)
    private Boolean emailOpened = false;

    @Column(name = "email_opened_at")
    private LocalDateTime emailOpenedAt;

    @Column(name = "email_clicked", nullable = false)
    private Boolean emailClicked = false;

    @Column(name = "email_clicked_at")
    private LocalDateTime emailClickedAt;

    @Column(name = "email_bounced", nullable = false)
    private Boolean emailBounced = false;

    @Column(name = "email_error_message", columnDefinition = "TEXT")
    private String emailErrorMessage;

    // WhatsApp-specific fields
    @Column(name = "whatsapp_sent", nullable = false)
    private Boolean whatsappSent = false;

    @Column(name = "whatsapp_sent_at")
    private LocalDateTime whatsappSentAt;

    @Column(name = "whatsapp_delivered", nullable = false)
    private Boolean whatsappDelivered = false;

    @Column(name = "whatsapp_delivered_at")
    private LocalDateTime whatsappDeliveredAt;

    @Column(name = "whatsapp_read", nullable = false)
    private Boolean whatsappRead = false;

    @Column(name = "whatsapp_read_at")
    private LocalDateTime whatsappReadAt;

    @Column(name = "whatsapp_failed", nullable = false)
    private Boolean whatsappFailed = false;

    @Column(name = "whatsapp_error_message", columnDefinition = "TEXT")
    private String whatsappErrorMessage;

    /**
     * Provider message ID for tracking (SendGrid message ID or Gupshup message ID)
     */
    @Column(name = "provider_message_id", length = 200)
    private String providerMessageId;

    /**
     * Complete request/response JSON for debugging
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Check if notification was successfully sent on at least one channel
     */
    public boolean isAnySent() {
        return emailSent || whatsappSent;
    }

    /**
     * Check if notification was successfully delivered on at least one channel
     */
    public boolean isAnyDelivered() {
        return emailDelivered || whatsappDelivered;
    }

    /**
     * Check if there were any failures
     */
    public boolean hasFailures() {
        return emailBounced || whatsappFailed;
    }

    /**
     * Get delivery status summary
     */
    public String getDeliveryStatus() {
        if (emailDelivered || whatsappDelivered) {
            return "DELIVERED";
        } else if (emailSent || whatsappSent) {
            return "SENT";
        } else if (hasFailures()) {
            return "FAILED";
        } else {
            return "PENDING";
        }
    }
}
