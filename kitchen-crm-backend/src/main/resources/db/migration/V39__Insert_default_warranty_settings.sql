-- V39: Insert default warranty and company settings
-- Purpose: Add default company information and warranty settings for warranty card generation
-- Author: HOCH Team
-- Date: 2025-01-20

-- Company Information Settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('company.name', 'THE HOCH', 'Company name for warranty cards and documents')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('company.tagline', 'Modular Interiors & Design Solutions', 'Company tagline')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('company.address_line1', '[Address Line 1]', 'Company address line 1')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('company.address_line2', '[City, State, Zip Code]', 'Company address line 2')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('company.phone', '[Phone Number]', 'Company phone number')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('company.email', '[Email Address]', 'Company email address')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('company.website', '[Website URL]', 'Company website URL')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Warranty Settings
-- Note: warranty.terms_text is stored as a reference. Full terms are in PDF template.
-- Since setting_value is VARCHAR(255), we store a short reference. PDF service uses default terms.
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('warranty.terms_text', 'DEFAULT', 'Warranty terms reference - full terms in PDF template')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('warranty.authorized_name', '[Authorized Person Name]', 'Default authorized signatory name')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('warranty.authorized_designation', '[Position]', 'Default authorized signatory designation')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('warranty.last_certificate_number', 'WC-2025-0000', 'Last generated warranty certificate number for auto-increment')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

