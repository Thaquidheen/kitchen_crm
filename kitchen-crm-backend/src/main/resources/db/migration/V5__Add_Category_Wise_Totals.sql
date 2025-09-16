-- Add category-wise total fields to quotations table
ALTER TABLE quotations ADD COLUMN accessories_base_total DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN accessories_margin_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN accessories_tax_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN accessories_final_total DECIMAL(12,2) DEFAULT 0;

ALTER TABLE quotations ADD COLUMN cabinets_base_total DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN cabinets_margin_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN cabinets_tax_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN cabinets_final_total DECIMAL(12,2) DEFAULT 0;

ALTER TABLE quotations ADD COLUMN doors_base_total DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN doors_margin_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN doors_tax_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN doors_final_total DECIMAL(12,2) DEFAULT 0;

ALTER TABLE quotations ADD COLUMN lighting_base_total DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN lighting_margin_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN lighting_tax_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN lighting_final_total DECIMAL(12,2) DEFAULT 0;

-- Remove individual margin/tax from line items (they're not needed now)
ALTER TABLE quotation_accessories DROP COLUMN margin_amount;
ALTER TABLE quotation_accessories DROP COLUMN tax_amount;

ALTER TABLE quotation_cabinets DROP COLUMN margin_amount;
ALTER TABLE quotation_cabinets DROP COLUMN tax_amount;

ALTER TABLE quotation_doors DROP COLUMN margin_amount;
ALTER TABLE quotation_doors DROP COLUMN tax_amount;

ALTER TABLE quotation_lighting DROP COLUMN margin_amount;
ALTER TABLE quotation_lighting DROP COLUMN tax_amount;