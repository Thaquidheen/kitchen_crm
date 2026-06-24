-- Per-category MRP (list price) margin & tax percentages.
-- MRP now mirrors the offer "Pricing by Category" structure: a margin% + tax% per category
-- (accessories, cabinets, doors, lighting) plus a miscellaneous (services) margin% + tax%.
-- Backfill each from the matching offer column so existing quotations keep MRP = Offer until edited.

ALTER TABLE quotations
    ADD COLUMN accessories_mrp_margin_percentage  DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    ADD COLUMN cabinets_mrp_margin_percentage     DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    ADD COLUMN doors_mrp_margin_percentage        DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    ADD COLUMN lighting_mrp_margin_percentage     DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    ADD COLUMN accessories_mrp_tax_percentage     DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    ADD COLUMN cabinets_mrp_tax_percentage        DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    ADD COLUMN doors_mrp_tax_percentage           DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    ADD COLUMN lighting_mrp_tax_percentage        DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    ADD COLUMN miscellaneous_mrp_margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN miscellaneous_mrp_tax_percentage    DECIMAL(5,2) NOT NULL DEFAULT 18.00;

UPDATE quotations SET
    accessories_mrp_margin_percentage  = accessories_margin_percentage,
    cabinets_mrp_margin_percentage     = cabinets_margin_percentage,
    doors_mrp_margin_percentage        = doors_margin_percentage,
    lighting_mrp_margin_percentage     = lighting_margin_percentage,
    accessories_mrp_tax_percentage     = accessories_tax_percentage,
    cabinets_mrp_tax_percentage        = cabinets_tax_percentage,
    doors_mrp_tax_percentage           = doors_tax_percentage,
    lighting_mrp_tax_percentage        = lighting_tax_percentage,
    miscellaneous_mrp_margin_percentage = miscellaneous_margin_percentage,
    miscellaneous_mrp_tax_percentage    = miscellaneous_tax_percentage;
