-- Alter custom_dimensions column from BOOLEAN to VARCHAR(255)
-- in quotation_doors table to match entity definition
-- (Similar to V57 which fixed quotation_cabinets)

ALTER TABLE quotation_doors
MODIFY COLUMN custom_dimensions VARCHAR(255) DEFAULT NULL;
