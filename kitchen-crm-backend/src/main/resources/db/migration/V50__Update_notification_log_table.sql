-- V50__Update_notification_log_table.sql
-- Add missing columns to notification_log table

ALTER TABLE notification_log
ADD COLUMN email_clicked_at TIMESTAMP NULL,
ADD COLUMN email_delivered_at TIMESTAMP NULL,
ADD COLUMN email_opened_at TIMESTAMP NULL,
ADD COLUMN email_bounced BOOLEAN DEFAULT FALSE,
ADD COLUMN email_error_message TEXT NULL,
ADD COLUMN whatsapp_delivered_at TIMESTAMP NULL,
ADD COLUMN whatsapp_read_at TIMESTAMP NULL,
ADD COLUMN whatsapp_failed BOOLEAN DEFAULT FALSE,
ADD COLUMN whatsapp_error_message TEXT NULL,
ADD COLUMN signed_document_id BIGINT NULL,
ADD COLUMN provider_message_id VARCHAR(200) NULL,
ADD COLUMN metadata TEXT NULL;

-- Add foreign key for signed_document_id
ALTER TABLE notification_log
ADD CONSTRAINT fk_notification_signed_document
    FOREIGN KEY (signed_document_id)
    REFERENCES signed_documents(id)
    ON DELETE SET NULL;
