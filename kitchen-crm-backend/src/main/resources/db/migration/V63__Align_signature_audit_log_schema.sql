-- Align signature_audit_log table with entity definition
-- The entity has different columns than originally created

-- Add missing columns from entity
ALTER TABLE signature_audit_log
ADD COLUMN IF NOT EXISTS browser VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS operating_system VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS location VARCHAR(200) NULL,
ADD COLUMN IF NOT EXISTS device_type VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS previous_status VARCHAR(30) NULL,
ADD COLUMN IF NOT EXISTS new_status VARCHAR(30) NULL,
ADD COLUMN IF NOT EXISTS performed_by_user_id BIGINT NULL,
ADD COLUMN IF NOT EXISTS performed_by_user_name VARCHAR(200) NULL,
ADD COLUMN IF NOT EXISTS metadata TEXT NULL;
