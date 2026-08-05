-- Appliance & Quartz entries can carry an uploaded quotation PDF once they reach the
-- QUOTATION stage. The file itself lives on disk under uploads/appliance-quotations;
-- only its public URL and original filename are stored here.

ALTER TABLE appliance_customers
    ADD COLUMN quotation_file_url VARCHAR(500) NULL AFTER notes,
    ADD COLUMN quotation_file_name VARCHAR(255) NULL AFTER quotation_file_url,
    ADD COLUMN quotation_uploaded_at DATETIME NULL AFTER quotation_file_name;
