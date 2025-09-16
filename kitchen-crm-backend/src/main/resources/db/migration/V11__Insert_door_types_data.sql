-- V11__Insert_door_types_data.sql

-- Insert door types data (matching the actual table structure)
INSERT INTO door_types (name, brand_id, material, mrp, discount_percentage, active, created_at, updated_at) VALUES
-- Laminate Doors
('Shaker Style Laminate', 1, 'Laminate', 750.00, 10.0, true, NOW(), NOW()),
('Flat Panel Laminate', 1, 'Laminate', 650.00, 10.0, true, NOW(), NOW()),
('Raised Panel Laminate', 1, 'Laminate', 850.00, 10.0, true, NOW(), NOW()),

-- Membrane Doors
('Membrane PVC White', 2, 'PVC Membrane', 580.00, 8.0, true, NOW(), NOW()),
('Membrane Wood Grain', 2, 'PVC Membrane', 620.00, 8.0, true, NOW(), NOW()),

-- Acrylic Doors
('High Gloss Acrylic White', 3, 'Acrylic', 1250.00, 12.0, true, NOW(), NOW()),
('High Gloss Acrylic Colored', 3, 'Acrylic', 1350.00, 12.0, true, NOW(), NOW()),

-- Glass Doors
('Frosted Glass Aluminum Frame', 4, 'Glass', 1850.00, 15.0, true, NOW(), NOW()),
('Clear Glass Wooden Frame', 1, 'Glass', 1650.00, 15.0, true, NOW(), NOW()),

-- Solid Wood Doors
('Teak Veneer Natural', 5, 'Teak Veneer', 2250.00, 18.0, true, NOW(), NOW()),
('Oak Veneer Stained', 5, 'Oak Veneer', 2150.00, 18.0, true, NOW(), NOW()),

-- Metal Doors
('Stainless Steel Brushed', 6, 'Stainless Steel', 3250.00, 20.0, true, NOW(), NOW()),
('Aluminum Powder Coated', 6, 'Aluminum', 1950.00, 15.0, true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE name = name;