package com.fleetmanagement.kitchencrmbackend.modules.signature.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity for maintaining complete audit trail of signature-related events
 * Provides legal compliance and tracking for all document interactions
 */
@Entity
@Table(name = "signature_audit_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignatureAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Reference to the signed document
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signed_document_id", nullable = false)
    private SignedDocument signedDocument;

    /**
     * Type of event being logged
     * Examples: CREATED, SENT, OPENED, SIGNED, REJECTED, EXPIRED, REMINDER_SENT
     */
    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    /**
     * Detailed description of the event
     */
    @Column(name = "event_description", columnDefinition = "TEXT")
    private String eventDescription;

    /**
     * Previous status (if status changed)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 30)
    private SignatureStatus previousStatus;

    /**
     * New status (if status changed)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", length = 30)
    private SignatureStatus newStatus;

    /**
     * IP address from which the action occurred
     */
    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    /**
     * Browser user agent string
     */
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    /**
     * Device type (Desktop, Mobile, Tablet)
     */
    @Column(name = "device_type", length = 20)
    private String deviceType;

    /**
     * Browser name (Chrome, Firefox, Safari, etc.)
     */
    @Column(name = "browser", length = 50)
    private String browser;

    /**
     * Operating system
     */
    @Column(name = "operating_system", length = 50)
    private String operatingSystem;

    /**
     * Geographic location (if available from IP)
     */
    @Column(name = "location", length = 200)
    private String location;

    /**
     * User ID if action was performed by admin
     */
    @Column(name = "performed_by_user_id")
    private Long performedByUserId;

    /**
     * User name if action was performed by admin
     */
    @Column(name = "performed_by_user_name", length = 200)
    private String performedByUserName;

    /**
     * Additional metadata as JSON
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Constructor for quick event logging
     */
    public SignatureAuditLog(SignedDocument signedDocument, String eventType, String eventDescription) {
        this.signedDocument = signedDocument;
        this.eventType = eventType;
        this.eventDescription = eventDescription;
    }

    /**
     * Constructor with status change
     */
    public SignatureAuditLog(SignedDocument signedDocument, String eventType,
                            SignatureStatus previousStatus, SignatureStatus newStatus) {
        this.signedDocument = signedDocument;
        this.eventType = eventType;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.eventDescription = "Status changed from " + previousStatus + " to " + newStatus;
    }

    /**
     * Constructor with IP and user agent
     */
    public SignatureAuditLog(SignedDocument signedDocument, String eventType,
                            String eventDescription, String ipAddress, String userAgent) {
        this.signedDocument = signedDocument;
        this.eventType = eventType;
        this.eventDescription = eventDescription;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }

    /**
     * Check if this is a customer-initiated event
     */
    public boolean isCustomerEvent() {
        return performedByUserId == null;
    }

    /**
     * Check if this is an admin-initiated event
     */
    public boolean isAdminEvent() {
        return performedByUserId != null;
    }

    /**
     * Common event type constants
     */
    public static class EventType {
        public static final String CREATED = "CREATED";
        public static final String SENT = "SENT";
        public static final String OPENED = "OPENED";
        public static final String SIGNED = "SIGNED";
        public static final String REJECTED = "REJECTED";
        public static final String EXPIRED = "EXPIRED";
        public static final String REMINDER_SENT = "REMINDER_SENT";
        public static final String EMAIL_SENT = "EMAIL_SENT";
        public static final String WHATSAPP_SENT = "WHATSAPP_SENT";
        public static final String EMAIL_DELIVERED = "EMAIL_DELIVERED";
        public static final String EMAIL_OPENED = "EMAIL_OPENED";
        public static final String LINK_CLICKED = "LINK_CLICKED";
        public static final String DOCUMENT_DOWNLOADED = "DOCUMENT_DOWNLOADED";
        public static final String STATUS_CHANGED = "STATUS_CHANGED";

        // Token Security Events
        public static final String ACCESS_GRANTED = "ACCESS_GRANTED";
        public static final String ACCESS_DENIED = "ACCESS_DENIED";
        public static final String TOKEN_VALIDATED = "TOKEN_VALIDATED";
        public static final String TOKEN_EXPIRED = "TOKEN_EXPIRED";
        public static final String TOKEN_NOT_FOUND = "TOKEN_NOT_FOUND";
        public static final String INVALID_TOKEN_ATTEMPT = "INVALID_TOKEN_ATTEMPT";
    }
}
