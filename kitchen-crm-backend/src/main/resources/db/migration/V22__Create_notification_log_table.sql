-- Migration: Create notification_log table
-- Purpose: Track all notifications sent via email and WhatsApp
-- Author: HOCH Team
-- Date: 2025-01-15

CREATE TABLE IF NOT EXISTS notification_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Notification Details
    notification_type VARCHAR(50) NOT NULL COMMENT 'QUOTATION_SIGNATURE_REQUEST, SIGNATURE_REMINDER, etc.',
    reference_type VARCHAR(50) NOT NULL COMMENT 'QUOTATION, WORK_COMPLETION, FINAL_BILL, DESIGN_PHASE',
    reference_id BIGINT NOT NULL COMMENT 'ID of the related entity',

    -- Recipient
    customer_id BIGINT,
    recipient_name VARCHAR(100),
    recipient_email VARCHAR(100),
    recipient_phone VARCHAR(20),

    -- Email Channel Status
    email_sent BOOLEAN DEFAULT FALSE,
    email_delivered BOOLEAN DEFAULT FALSE,
    email_opened BOOLEAN DEFAULT FALSE,
    email_clicked BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP,
    email_message_id VARCHAR(100) COMMENT 'SendGrid/SMTP message ID for tracking',
    email_error TEXT COMMENT 'Error message if email failed',

    -- WhatsApp Channel Status
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    whatsapp_delivered BOOLEAN DEFAULT FALSE,
    whatsapp_read BOOLEAN DEFAULT FALSE,
    whatsapp_replied BOOLEAN DEFAULT FALSE,
    whatsapp_sent_at TIMESTAMP,
    whatsapp_message_id VARCHAR(100) COMMENT 'Gupshup message ID for tracking',
    whatsapp_error TEXT COMMENT 'Error message if WhatsApp failed',

    -- Content
    subject VARCHAR(200) COMMENT 'Email subject line',
    email_body TEXT COMMENT 'Email body content',
    whatsapp_message TEXT COMMENT 'WhatsApp message content',

    -- Metadata
    sent_by VARCHAR(100) COMMENT 'SYSTEM, ADMIN, or username who triggered',
    priority VARCHAR(20) DEFAULT 'MEDIUM' COMMENT 'LOW, MEDIUM, HIGH, CRITICAL',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_customer (customer_id),
    INDEX idx_reference (reference_type, reference_id),
    INDEX idx_type (notification_type),
    INDEX idx_created (created_at),
    INDEX idx_email_status (email_sent, email_delivered),
    INDEX idx_whatsapp_status (whatsapp_sent, whatsapp_delivered),

    -- Foreign Keys
    CONSTRAINT fk_notification_log_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE SET NULL
);

-- Comments for documentation
ALTER TABLE notification_log COMMENT = 'Tracks all email and WhatsApp notifications sent to customers';
