-- Alter custom_dimensions column from BOOLEAN to VARCHAR(255)
-- in quotation_cabinets table to match entity definition

ALTER TABLE quotation_cabinets
MODIFY COLUMN custom_dimensions VARCHAR(255) DEFAULT NULL;
