package com.fleetmanagement.kitchencrmbackend.modules.signature.entity;

/**
 * Enum representing how the signature was captured
 */
public enum SignatureType {
    /**
     * Signature drawn on canvas (touch/mouse)
     */
    DRAWN,

    /**
     * Signature image uploaded by customer
     */
    UPLOADED,

    /**
     * Typed signature converted to image
     */
    TYPED,

    /**
     * Simple checkbox approval (no actual signature image)
     */
    CHECKBOX
}
