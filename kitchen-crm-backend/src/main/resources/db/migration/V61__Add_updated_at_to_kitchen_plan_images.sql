-- Add missing updated_at column to quotation_kitchen_plan_images table
-- The entity extends Auditable which requires both created_at and updated_at

ALTER TABLE quotation_kitchen_plan_images
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
