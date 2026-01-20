-- Migration: Add custom_specifications column to quotation_cabinets table
-- This column was added to the entity but was missing from the database schema

ALTER TABLE quotation_cabinets
ADD COLUMN custom_specifications TEXT NULL COMMENT 'Custom specifications for the cabinet';
