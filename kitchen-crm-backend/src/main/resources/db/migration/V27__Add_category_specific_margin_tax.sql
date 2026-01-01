-- Add category-specific margin and tax percentages to quotations table
-- This allows different margin and tax rates for Accessories, Cabinets, Doors, and Lighting

-- Add category-specific margin percentages
ALTER TABLE quotations 
ADD COLUMN accessories_margin_percentage DECIMAL(5,2) DEFAULT 20.00 COMMENT 'Margin percentage for accessories category',
ADD COLUMN cabinets_margin_percentage DECIMAL(5,2) DEFAULT 20.00 COMMENT 'Margin percentage for cabinets category',
ADD COLUMN doors_margin_percentage DECIMAL(5,2) DEFAULT 20.00 COMMENT 'Margin percentage for doors category',
ADD COLUMN lighting_margin_percentage DECIMAL(5,2) DEFAULT 20.00 COMMENT 'Margin percentage for lighting category';

-- Add category-specific tax percentages
ALTER TABLE quotations
ADD COLUMN accessories_tax_percentage DECIMAL(5,2) DEFAULT 18.00 COMMENT 'Tax percentage for accessories category',
ADD COLUMN cabinets_tax_percentage DECIMAL(5,2) DEFAULT 18.00 COMMENT 'Tax percentage for cabinets category',
ADD COLUMN doors_tax_percentage DECIMAL(5,2) DEFAULT 18.00 COMMENT 'Tax percentage for doors category',
ADD COLUMN lighting_tax_percentage DECIMAL(5,2) DEFAULT 18.00 COMMENT 'Tax percentage for lighting category';

-- Migrate existing data: copy global margin_percentage and tax_percentage to all category-specific columns
UPDATE quotations 
SET accessories_margin_percentage = COALESCE(margin_percentage, 20.00),
    cabinets_margin_percentage = COALESCE(margin_percentage, 20.00),
    doors_margin_percentage = COALESCE(margin_percentage, 20.00),
    lighting_margin_percentage = COALESCE(margin_percentage, 20.00),
    accessories_tax_percentage = COALESCE(tax_percentage, 18.00),
    cabinets_tax_percentage = COALESCE(tax_percentage, 18.00),
    doors_tax_percentage = COALESCE(tax_percentage, 18.00),
    lighting_tax_percentage = COALESCE(tax_percentage, 18.00);

-- Note: Keeping margin_percentage and tax_percentage columns for backward compatibility
-- They can be used as defaults when creating new quotations


