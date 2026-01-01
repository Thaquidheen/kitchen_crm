package com.fleetmanagement.kitchencrmbackend.modules.notification.entity;

/**
 * Enum representing different types of notifications
 */
public enum NotificationType {
    // Signature-related notifications
    QUOTATION_SIGNATURE_REQUEST,
    SIGNATURE_REMINDER_3_DAYS,
    SIGNATURE_REMINDER_6_DAYS,
    SIGNATURE_RECEIVED,
    WORK_COMPLETION_SIGNATURE,
    FINAL_BILL_SIGNATURE,

    // Design-related notifications
    DESIGN_APPROVAL,
    DESIGN_UPDATED,

    // Payment-related notifications
    PAYMENT_REMINDER,
    PAYMENT_RECEIVED,

    // General notifications
    GENERAL_UPDATE,
    PROJECT_STATUS_UPDATE
}
