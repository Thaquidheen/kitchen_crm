-- Add calculation_type to materials: BOX_AREA (full cabinet) or FACE_AREA (front face only)
ALTER TABLE materials
    ADD COLUMN calculation_type VARCHAR(20) NOT NULL DEFAULT 'BOX_AREA';

-- Set PLY and WPC to FACE_AREA
UPDATE materials SET calculation_type = 'FACE_AREA' WHERE LOWER(name) LIKE '%ply%' OR LOWER(name) LIKE '%wpc%';

-- Store the material calculation type on quotation_cabinets for pricing
ALTER TABLE quotation_cabinets
    ADD COLUMN material_calculation_type VARCHAR(20) NULL;

-- Add inner panel quantity to quotation_cabinets
ALTER TABLE quotation_cabinets
    ADD COLUMN inner_panel_quantity INT NULL DEFAULT 0;
