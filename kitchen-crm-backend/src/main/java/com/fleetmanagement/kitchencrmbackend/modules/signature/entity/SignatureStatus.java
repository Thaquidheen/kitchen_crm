package com.fleetmanagement.kitchencrmbackend.modules.signature.entity;

/**
 * Enum representing the status of a signature/approval request
 */
public enum SignatureStatus {
    /**
     * Document created but not yet sent to customer
     */
    PENDING,

    /**
     * Notification sent to customer
     */
    SENT,

    /**
     * Customer opened the signing link
     */
    OPENED,

    /**
     * Customer signed/approved the document
     */
    SIGNED,

    /**
     * Customer rejected the document
     */
    REJECTED,

    /**
     * Signing link expired (after 7 days)
     */
    EXPIRED
}
