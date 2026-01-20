-- Migration: Replace cabinet pricing fields with a single fixed_price field
-- This simplifies cabinet pricing from (base_price, mrp, discount_percentage, company_price) to just fixed_price

-- Step 1: Add the new fixed_price column
ALTER TABLE cabinet_types ADD COLUMN fixed_price DECIMAL(10,2) DEFAULT 0;

-- Step 2: Migrate existing data - use base_price as the fixed_price value
UPDATE cabinet_types SET fixed_price = COALESCE(base_price, 0);

-- Step 3: Drop the old pricing columns
ALTER TABLE cabinet_types DROP COLUMN base_price;
ALTER TABLE cabinet_types DROP COLUMN mrp;
ALTER TABLE cabinet_types DROP COLUMN discount_percentage;
ALTER TABLE cabinet_types DROP COLUMN company_price;

-- Step 4: Make fixed_price NOT NULL after data migration (MySQL syntax)
ALTER TABLE cabinet_types MODIFY COLUMN fixed_price DECIMAL(10,2) NOT NULL DEFAULT 0;
