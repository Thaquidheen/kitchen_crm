-- V70__Delete_all_seeded_data.sql
-- Purpose: Delete all seeded/sample data from product and quotation tables
-- Note: This preserves all table structures, constraints, and indexes

-- Step 1: Delete all quotation-related data (respects foreign key constraints)
DELETE FROM quotation_kitchen_scope_details;
DELETE FROM quotation_kitchen_plan_images;
DELETE FROM quotation_elevations;
DELETE FROM quotation_lighting;
DELETE FROM quotation_accessories;
DELETE FROM quotation_doors;
DELETE FROM quotation_cabinets;
DELETE FROM quotation_kitchens;
DELETE FROM quotations;

-- Step 2: Delete all product data (respects foreign key constraints)
DELETE FROM accessories;
DELETE FROM door_types;
DELETE FROM cabinet_types;
DELETE FROM sensors;
DELETE FROM connectors;
DELETE FROM drivers;
DELETE FROM light_profiles;
DELETE FROM materials;
DELETE FROM categories;
DELETE FROM brands;

-- Step 3: Reset auto-increment IDs to start from 1 (optional, for clean start)
ALTER TABLE brands AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE materials AUTO_INCREMENT = 1;
ALTER TABLE cabinet_types AUTO_INCREMENT = 1;
ALTER TABLE door_types AUTO_INCREMENT = 1;
ALTER TABLE accessories AUTO_INCREMENT = 1;
ALTER TABLE light_profiles AUTO_INCREMENT = 1;
ALTER TABLE drivers AUTO_INCREMENT = 1;
ALTER TABLE connectors AUTO_INCREMENT = 1;
ALTER TABLE sensors AUTO_INCREMENT = 1;
ALTER TABLE quotations AUTO_INCREMENT = 1;
ALTER TABLE quotation_cabinets AUTO_INCREMENT = 1;
ALTER TABLE quotation_doors AUTO_INCREMENT = 1;
ALTER TABLE quotation_accessories AUTO_INCREMENT = 1;
ALTER TABLE quotation_lighting AUTO_INCREMENT = 1;
ALTER TABLE quotation_kitchens AUTO_INCREMENT = 1;
ALTER TABLE quotation_elevations AUTO_INCREMENT = 1;

-- Note: All tables remain intact with their schemas, constraints, and indexes
-- Users, customers, design phases, production data, and other modules are NOT affected
