-- V35: Add category tax percentages to customer_projects table
-- Purpose: Store edited tax percentages per category for cash calculation in projects
-- Author: HOCH Team
-- Date: 2025-01-20

-- Add accessories_tax_percentage column if it doesn't exist
SET @col1 := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'customer_projects' AND column_name = 'accessories_tax_percentage'
);
SET @sql := IF(@col1 = 0, 'ALTER TABLE customer_projects ADD COLUMN accessories_tax_percentage DECIMAL(5, 2) NULL COMMENT ''Edited tax percentage for accessories category''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add cabinets_tax_percentage column if it doesn't exist
SET @col2 := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'customer_projects' AND column_name = 'cabinets_tax_percentage'
);
SET @sql := IF(@col2 = 0, 'ALTER TABLE customer_projects ADD COLUMN cabinets_tax_percentage DECIMAL(5, 2) NULL COMMENT ''Edited tax percentage for cabinets category''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add doors_tax_percentage column if it doesn't exist
SET @col3 := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'customer_projects' AND column_name = 'doors_tax_percentage'
);
SET @sql := IF(@col3 = 0, 'ALTER TABLE customer_projects ADD COLUMN doors_tax_percentage DECIMAL(5, 2) NULL COMMENT ''Edited tax percentage for doors category''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add lighting_tax_percentage column if it doesn't exist
SET @col4 := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'customer_projects' AND column_name = 'lighting_tax_percentage'
);
SET @sql := IF(@col4 = 0, 'ALTER TABLE customer_projects ADD COLUMN lighting_tax_percentage DECIMAL(5, 2) NULL COMMENT ''Edited tax percentage for lighting category''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add index for better query performance if it doesn't exist
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'customer_projects' AND index_name = 'idx_projects_category_taxes'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_projects_category_taxes ON customer_projects(accessories_tax_percentage, cabinets_tax_percentage, doors_tax_percentage, lighting_tax_percentage)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

