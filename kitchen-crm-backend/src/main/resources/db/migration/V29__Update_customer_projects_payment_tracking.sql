-- V29: Update customer_projects table for proper payment tracking
-- This migration is now a no-op since V15 was updated to include the final schema
-- Keeping this file for Flyway history compatibility

-- The customer_projects table is now created with the correct schema in V15
-- No migration needed for fresh installations

SELECT 'V29: Migration skipped - customer_projects already has correct schema from V15' AS migration_status;
