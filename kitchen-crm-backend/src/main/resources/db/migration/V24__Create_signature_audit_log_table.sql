-- Migration: Create signature_audit_log table
-- Purpose: Maintain detailed audit trail for all signature-related events
-- Author: HOCH Team
-- Date: 2025-01-15

CREATE TABLE IF NOT EXISTS signature_audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Reference
    signed_document_id BIGINT NOT NULL,

    -- Event Information
    event_type VARCHAR(50) NOT NULL COMMENT 'CREATED, SENT, OPENED, SIGNED, REJECTED, EXPIRED, DOWNLOADED',
    event_description TEXT COMMENT 'Detailed description of the event',

    -- Actor Information
    actor_type VARCHAR(30) COMMENT 'SYSTEM, ADMIN, CUSTOMER',
    actor_id BIGINT COMMENT 'User ID if applicable',
    actor_name VARCHAR(100),

    -- Technical Details
    ip_address VARCHAR(50),
    user_agent TEXT COMMENT 'Browser/device information',
    device_info TEXT COMMENT 'Device type, OS, browser',
    geo_location VARCHAR(200) COMMENT 'City, State, Country from IP',

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_document (signed_document_id),
    INDEX idx_event (event_type),
    INDEX idx_timestamp (created_at),
    INDEX idx_actor (actor_type, actor_id),

    -- Foreign Keys
    CONSTRAINT fk_signature_audit_signed_document
        FOREIGN KEY (signed_document_id)
        REFERENCES signed_documents(id)
        ON DELETE CASCADE
);

-- Comments for documentation
ALTER TABLE signature_audit_log COMMENT = 'Audit trail for all signature and approval events';
