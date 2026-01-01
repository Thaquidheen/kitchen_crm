package com.fleetmanagement.kitchencrmbackend.modules.notification.entity;

/**
 * Enum representing the priority level of a notification
 */
public enum NotificationPriority {
    /**
     * Low priority - general updates
     */
    LOW,

    /**
     * Normal priority - standard notifications
     */
    MEDIUM,

    /**
     * High priority - requires attention
     */
    HIGH,

    /**
     * Critical priority - urgent action required
     */
    CRITICAL
}
