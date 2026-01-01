package com.fleetmanagement.kitchencrmbackend.modules.signature.dto;

import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for displaying signature audit log entries
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignatureAuditLogDto {

    /**
     * Log entry ID
     */
    private Long id;

    /**
     * Document ID
     */
    private Long documentId;

    /**
     * Event type
     */
    private String eventType;

    /**
     * Event description
     */
    private String eventDescription;

    /**
     * Previous status (if status changed)
     */
    private SignatureStatus previousStatus;

    /**
     * New status (if status changed)
     */
    private SignatureStatus newStatus;

    /**
     * IP address
     */
    private String ipAddress;

    /**
     * User agent
     */
    private String userAgent;

    /**
     * Device type
     */
    private String deviceType;

    /**
     * Browser
     */
    private String browser;

    /**
     * Operating system
     */
    private String operatingSystem;

    /**
     * Geographic location
     */
    private String location;

    /**
     * Performed by (admin)
     */
    private Long performedByUserId;
    private String performedByUserName;

    /**
     * Is this a customer event?
     */
    private Boolean customerEvent;

    /**
     * Timestamp
     */
    private LocalDateTime createdAt;

    /**
     * Get human-readable event summary
     */
    public String getEventSummary() {
        if (performedByUserName != null) {
            return String.format("%s by %s", eventType, performedByUserName);
        } else {
            return String.format("%s by customer", eventType);
        }
    }
}
