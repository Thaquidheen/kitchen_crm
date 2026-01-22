-- Create quotation_elevations table for organizing cabinets and doors by elevation
CREATE TABLE IF NOT EXISTS quotation_elevations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    quotation_kitchen_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_elevation_kitchen FOREIGN KEY (quotation_kitchen_id)
        REFERENCES quotation_kitchens(id) ON DELETE CASCADE
);

-- Add elevation columns to quotation_cabinets
ALTER TABLE quotation_cabinets ADD COLUMN elevation_id BIGINT NULL;
ALTER TABLE quotation_cabinets ADD COLUMN elevation_name VARCHAR(100) NULL;

-- Add elevation columns to quotation_doors
ALTER TABLE quotation_doors ADD COLUMN elevation_id BIGINT NULL;
ALTER TABLE quotation_doors ADD COLUMN elevation_name VARCHAR(100) NULL;

-- Add index for better query performance
CREATE INDEX idx_elevation_kitchen ON quotation_elevations(quotation_kitchen_id);
CREATE INDEX idx_cabinet_elevation ON quotation_cabinets(elevation_id);
CREATE INDEX idx_door_elevation ON quotation_doors(elevation_id);
