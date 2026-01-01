package com.fleetmanagement.kitchencrmbackend.modules.notification.entity;

/**
 * Enum representing the type of entity being referenced in a notification
 */
public enum ReferenceType {
    /**
     * Reference to a quotation
     */
    QUOTATION,

    /**
     * Reference to a work completion report
     */
    WORK_COMPLETION,

    /**
     * Reference to a final bill
     */
    FINAL_BILL,

    /**
     * Reference to a design phase
     */
    DESIGN_PHASE,

    /**
     * Reference to a payment
     */
    PAYMENT
}
