-- Align signature_audit_log table with entity definition
-- The entity has different columns than originally created

-- Add missing columns from entity (MySQL syntax - separate ALTER statements)
ALTER TABLE signature_audit_log ADD COLUMN browser VARCHAR(50) NULL;
ALTER TABLE signature_audit_log ADD COLUMN operating_system VARCHAR(50) NULL;
ALTER TABLE signature_audit_log ADD COLUMN location VARCHAR(200) NULL;
ALTER TABLE signature_audit_log ADD COLUMN device_type VARCHAR(20) NULL;
ALTER TABLE signature_audit_log ADD COLUMN previous_status VARCHAR(30) NULL;
ALTER TABLE signature_audit_log ADD COLUMN new_status VARCHAR(30) NULL;
ALTER TABLE signature_audit_log ADD COLUMN performed_by_user_id BIGINT NULL;
ALTER TABLE signature_audit_log ADD COLUMN performed_by_user_name VARCHAR(200) NULL;
ALTER TABLE signature_audit_log ADD COLUMN metadata TEXT NULL;
