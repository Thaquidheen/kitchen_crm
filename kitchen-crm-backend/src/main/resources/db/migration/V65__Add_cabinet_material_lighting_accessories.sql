-- Add material and pricing breakdown fields to quotation_cabinets
-- Material selection for sqft-based pricing
-- Lighting cost = Width (mm) x 2
-- Accessories cost = Fixed price (BLUM accessories)

ALTER TABLE quotation_cabinets ADD COLUMN material_id BIGINT NULL;
ALTER TABLE quotation_cabinets ADD COLUMN material_rate DECIMAL(10,2) DEFAULT 0;
ALTER TABLE quotation_cabinets ADD COLUMN lighting_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE quotation_cabinets ADD COLUMN accessories_cost DECIMAL(10,2) DEFAULT 0;

-- Add foreign key constraint (SET NULL on delete to preserve quotation history)
ALTER TABLE quotation_cabinets
ADD CONSTRAINT fk_quotation_cabinet_material
FOREIGN KEY (material_id) REFERENCES materials(id)
ON DELETE SET NULL;
