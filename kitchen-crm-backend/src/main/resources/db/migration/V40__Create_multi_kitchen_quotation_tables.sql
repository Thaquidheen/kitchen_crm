-- V40__Create_multi_kitchen_quotation_tables.sql
-- Add support for multiple kitchens per quotation

-- Create quotation_kitchens table
CREATE TABLE quotation_kitchens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    quotation_id BIGINT NOT NULL,
    kitchen_name VARCHAR(255) NOT NULL COMMENT 'Kitchen name/type (e.g., OPEN KITCHEN, WORKING KITCHEN)',
    kitchen_order INT NOT NULL COMMENT 'Order of kitchen in quotation',
    
    -- Category totals (same structure as quotations table)
    accessories_base_total DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Base total for accessories category',
    accessories_margin_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Margin amount for accessories category',
    accessories_tax_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Tax amount for accessories category',
    accessories_final_total DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Final total for accessories category',
    
    cabinets_base_total DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Base total for cabinets category',
    cabinets_margin_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Margin amount for cabinets category',
    cabinets_tax_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Tax amount for cabinets category',
    cabinets_final_total DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Final total for cabinets category',
    
    doors_base_total DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Base total for doors category',
    doors_margin_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Margin amount for doors category',
    doors_tax_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Tax amount for doors category',
    doors_final_total DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Final total for doors category',
    
    lighting_base_total DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Base total for lighting category',
    lighting_margin_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Margin amount for lighting category',
    lighting_tax_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Tax amount for lighting category',
    lighting_final_total DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Final total for lighting category',
    
    -- Kitchen totals
    subtotal DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Kitchen subtotal (sum of category totals + transportation + installation)',
    margin_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Total margin amount for kitchen',
    tax_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Total tax amount for kitchen',
    total_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Kitchen total amount',
    
    -- Per-kitchen services
    transportation_price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Transportation price for this kitchen',
    installation_price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Installation price for this kitchen',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    INDEX idx_kitchen_quotation (quotation_id),
    INDEX idx_kitchen_order (quotation_id, kitchen_order)
) COMMENT='Kitchens within a quotation, each with its own products and totals';

-- Create quotation_kitchen_plan_images table
-- Note: CHECK constraint removed because MySQL doesn't allow CHECK on columns with ON DELETE SET NULL foreign keys
-- Validation is handled in application layer
CREATE TABLE quotation_kitchen_plan_images (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    kitchen_id BIGINT NOT NULL,

    -- Reference to existing customer files (one will be set)
    customer_plan_image_id BIGINT NULL COMMENT 'Reference to CustomerPlanImage if selected from plan images',
    design_phase_file_id BIGINT NULL COMMENT 'Reference to DesignPhaseFile if selected from design phase files (PLAN category)',

    -- Copied for reference and PDF generation
    image_name VARCHAR(255) NOT NULL COMMENT 'Image name for display',
    image_url VARCHAR(500) NOT NULL COMMENT 'Image URL path',
    image_order INT NOT NULL COMMENT 'Order of image (1-4)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (kitchen_id) REFERENCES quotation_kitchens(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_plan_image_id) REFERENCES customer_plan_images(id) ON DELETE SET NULL,
    FOREIGN KEY (design_phase_file_id) REFERENCES design_phase_files(id) ON DELETE SET NULL,
    INDEX idx_kitchen_plan_images_kitchen (kitchen_id),
    INDEX idx_kitchen_plan_images_order (kitchen_id, image_order)
) COMMENT='Plan images selected for each kitchen from customer design phase files';

-- Create quotation_kitchen_scope_details table
CREATE TABLE quotation_kitchen_scope_details (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    kitchen_id BIGINT NOT NULL,
    field_name VARCHAR(255) NOT NULL COMMENT 'Field name (e.g., Kitchen Shape, Material & Finish Details)',
    field_value TEXT COMMENT 'Field value/description',
    field_order INT NOT NULL COMMENT 'Display order',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (kitchen_id) REFERENCES quotation_kitchens(id) ON DELETE CASCADE,
    INDEX idx_scope_kitchen (kitchen_id),
    INDEX idx_scope_order (kitchen_id, field_order)
) COMMENT='Scope of work details for each kitchen (key-value pairs)';

-- Add kitchen_id to existing quotation line item tables (nullable for backward compatibility)
ALTER TABLE quotation_accessories 
ADD COLUMN kitchen_id BIGINT NULL COMMENT 'Reference to quotation_kitchens if product belongs to a specific kitchen',
ADD FOREIGN KEY (kitchen_id) REFERENCES quotation_kitchens(id) ON DELETE SET NULL,
ADD INDEX idx_quotation_accessories_kitchen (kitchen_id);

ALTER TABLE quotation_cabinets 
ADD COLUMN kitchen_id BIGINT NULL COMMENT 'Reference to quotation_kitchens if product belongs to a specific kitchen',
ADD FOREIGN KEY (kitchen_id) REFERENCES quotation_kitchens(id) ON DELETE SET NULL,
ADD INDEX idx_quotation_cabinets_kitchen (kitchen_id);

ALTER TABLE quotation_doors 
ADD COLUMN kitchen_id BIGINT NULL COMMENT 'Reference to quotation_kitchens if product belongs to a specific kitchen',
ADD FOREIGN KEY (kitchen_id) REFERENCES quotation_kitchens(id) ON DELETE SET NULL,
ADD INDEX idx_quotation_doors_kitchen (kitchen_id);

ALTER TABLE quotation_lighting 
ADD COLUMN kitchen_id BIGINT NULL COMMENT 'Reference to quotation_kitchens if product belongs to a specific kitchen',
ADD FOREIGN KEY (kitchen_id) REFERENCES quotation_kitchens(id) ON DELETE SET NULL,
ADD INDEX idx_quotation_lighting_kitchen (kitchen_id);


