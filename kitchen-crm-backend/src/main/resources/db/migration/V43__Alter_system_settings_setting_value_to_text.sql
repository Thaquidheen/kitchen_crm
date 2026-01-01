-- Alter setting_value column to TEXT to support longer content like terms and conditions
ALTER TABLE system_settings MODIFY COLUMN setting_value TEXT NOT NULL;





