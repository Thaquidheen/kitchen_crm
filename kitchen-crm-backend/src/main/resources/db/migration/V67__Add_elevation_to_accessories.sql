-- Add elevation support to quotation_accessories table
ALTER TABLE quotation_accessories ADD COLUMN elevation_id BIGINT NULL;
ALTER TABLE quotation_accessories ADD COLUMN elevation_name VARCHAR(100) NULL;

-- Add index for better query performance
CREATE INDEX idx_accessory_elevation ON quotation_accessories(elevation_id);
