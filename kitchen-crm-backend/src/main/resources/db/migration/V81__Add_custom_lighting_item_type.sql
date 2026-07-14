-- The quotation builder allows custom lighting items (itemType CUSTOM, manual name/price),
-- but the column enum only allowed the four master-backed types, so saving one failed.
ALTER TABLE quotation_lighting
    MODIFY COLUMN item_type ENUM('LIGHT_PROFILE', 'DRIVER', 'CONNECTOR', 'SENSOR', 'CUSTOM') NOT NULL;
