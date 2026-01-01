-- V41: Add kitchen_tax_percentages column to customer_projects table
-- Purpose: Store per-kitchen tax percentages as JSON for multi-kitchen cash calculations
-- Author: HOCH Team
-- Date: 2025-11-09

-- Add kitchen_tax_percentages column if it doesn't exist
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'customer_projects' AND column_name = 'kitchen_tax_percentages'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE customer_projects ADD COLUMN kitchen_tax_percentages TEXT NULL COMMENT ''JSON map of kitchenId to KitchenTaxPercentages for per-kitchen tax percentages''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

