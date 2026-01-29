-- Migration: Add missing columns to signed_documents table
-- Purpose: Add columns for signature tracking and workflow history
-- Author: HOCH Team
-- Date: 2026-01-29

-- Add missing columns to signed_documents table
ALTER TABLE signed_documents
ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS reminder_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS signed_from_ip VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS signed_user_agent TEXT NULL;

-- Create workflow_history table if not exists
CREATE TABLE IF NOT EXISTS workflow_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    previous_state VARCHAR(100),
    new_state VARCHAR(100) NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    change_reason TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_workflow_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_workflow_customer (customer_id),
    INDEX idx_workflow_timestamp (timestamp)
);
