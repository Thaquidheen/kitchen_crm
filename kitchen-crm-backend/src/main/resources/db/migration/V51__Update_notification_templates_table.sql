-- V51__Update_notification_templates_table.sql
-- Add missing columns to notification_templates table

ALTER TABLE notification_templates
ADD COLUMN category VARCHAR(50) NULL,
ADD COLUMN description TEXT NULL,
ADD COLUMN email_plain_text TEXT NULL,
ADD COLUMN variables TEXT NULL,
ADD COLUMN language_code VARCHAR(10) DEFAULT 'en',
ADD COLUMN version INT DEFAULT 1;
