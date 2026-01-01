-- V52__Update_design_phase_table.sql
-- Add missing columns to design_phase table

ALTER TABLE design_phase
ADD COLUMN design_requirements TEXT NULL,
ADD COLUMN submission_date TIMESTAMP NULL,
ADD COLUMN feedback_date TIMESTAMP NULL,
ADD COLUMN meeting_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN meeting_notes TEXT NULL,
ADD COLUMN frozen_amount DECIMAL(12,2) NULL,
ADD COLUMN whatsapp_group_link VARCHAR(255) NULL,
ADD COLUMN design_status VARCHAR(50) DEFAULT 'PLANNING',
ADD COLUMN design_completion_percentage INT DEFAULT 0,
ADD COLUMN revision_count INT DEFAULT 0,
ADD COLUMN client_approval_date TIMESTAMP NULL,
ADD COLUMN design_files_path VARCHAR(500) NULL,
ADD COLUMN created_by VARCHAR(255) NULL,
ADD COLUMN updated_by VARCHAR(255) NULL;
