-- Migration: Add missing columns to signed_documents table
-- Purpose: Add columns for signature tracking and workflow history
-- Author: HOCH Team
-- Date: 2026-01-29

-- Add missing columns to signed_documents table
ALTER TABLE signed_documents
ADD COLUMN last_reminder_at TIMESTAMP NULL,
ADD COLUMN reminder_count INT NOT NULL DEFAULT 0,
ADD COLUMN signed_from_ip VARCHAR(50) NULL,
ADD COLUMN signed_user_agent TEXT NULL;

-- Add created_at and updated_at to workflow_history if they don't exist
-- (workflow_history table should already exist from V1)
ALTER TABLE workflow_history
ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN change_reason TEXT;
