-- Migration V68: Add company logo settings for PDF generation
-- This allows uploading a company logo that will appear in quotation PDF headers and footers

-- Add company logo URL setting (file path)
INSERT INTO system_settings (setting_key, setting_value, description, created_at, updated_at)
SELECT 'company.logo_url', '', 'Company logo image URL/path for quotation PDFs', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'company.logo_url');

-- Add company logo base64 setting (for PDF embedding)
INSERT INTO system_settings (setting_key, setting_value, description, created_at, updated_at)
SELECT 'company.logo_base64', '', 'Company logo as base64 encoded string for PDF embedding', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'company.logo_base64');
