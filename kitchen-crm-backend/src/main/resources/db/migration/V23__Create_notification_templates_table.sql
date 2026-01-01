-- Migration: Create notification_templates table
-- Purpose: Store reusable templates for email and WhatsApp notifications
-- Author: HOCH Team
-- Date: 2025-01-15

CREATE TABLE IF NOT EXISTS notification_templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Template Identity
    template_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'Unique identifier for template',
    template_name VARCHAR(100) NOT NULL,
    template_category VARCHAR(50) COMMENT 'SIGNATURE, PAYMENT, GENERAL, DESIGN',

    -- Email Template
    email_subject VARCHAR(200) COMMENT 'Email subject with variable placeholders',
    email_body TEXT COMMENT 'HTML email body with variable placeholders',
    email_template_id VARCHAR(100) COMMENT 'SendGrid dynamic template ID (if using)',

    -- WhatsApp Template
    whatsapp_template_name VARCHAR(100) COMMENT 'Approved template name in Gupshup/Twilio',
    whatsapp_message TEXT COMMENT 'Template structure for reference',
    whatsapp_template_params TEXT COMMENT 'JSON: mapping of variables to template params',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE COMMENT 'If WhatsApp template needs approval',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),

    -- Indexes
    INDEX idx_code (template_code),
    INDEX idx_category (template_category),
    INDEX idx_active (is_active)
);

-- Comments for documentation
ALTER TABLE notification_templates COMMENT = 'Reusable templates for email and WhatsApp notifications';
