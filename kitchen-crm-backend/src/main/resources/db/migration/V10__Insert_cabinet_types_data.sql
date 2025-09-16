INSERT INTO cabinet_types (name, category_id, brand_id, material_id, base_price, mrp, discount_percentage, active, created_at, updated_at) VALUES
-- Base Cabinets (assuming category_id=1, brand_id=1, material_id=1 exist)
('Base Cabinet 300mm', 1, 1, 1, 1000.00, 1200.00, 10.0, true, NOW(), NOW()),
('Base Cabinet 450mm', 1, 1, 1, 1050.00, 1250.00, 10.0, true, NOW(), NOW()),
('Base Cabinet 600mm', 1, 1, 1, 1100.00, 1300.00, 10.0, true, NOW(), NOW()),
('Base Cabinet 750mm', 1, 1, 1, 1150.00, 1350.00, 10.0, true, NOW(), NOW()),
('Base Cabinet 900mm', 1, 1, 1, 1200.00, 1400.00, 10.0, true, NOW(), NOW()),

-- Wall Cabinets
('Wall Cabinet 300mm', 1, 1, 1, 950.00, 1150.00, 10.0, true, NOW(), NOW()),
('Wall Cabinet 450mm', 1, 1, 1, 1000.00, 1200.00, 10.0, true, NOW(), NOW()),
('Wall Cabinet 600mm', 1, 1, 1, 1050.00, 1250.00, 10.0, true, NOW(), NOW()),
('Wall Cabinet 750mm', 1, 1, 1, 1100.00, 1300.00, 10.0, true, NOW(), NOW()),
('Wall Cabinet 900mm', 1, 1, 1, 1150.00, 1350.00, 10.0, true, NOW(), NOW()),

-- Tall Units
('Tall Unit 450mm', 1, 1, 1, 1300.00, 1500.00, 10.0, true, NOW(), NOW()),
('Tall Unit 600mm', 1, 1, 1, 1350.00, 1550.00, 10.0, true, NOW(), NOW()),
('Appliance Tall Unit 600mm', 1, 1, 1, 1400.00, 1600.00, 10.0, true, NOW(), NOW()),

-- Specialty Cabinets
('Corner Base Lazy Susan', 1, 1, 1, 1600.00, 1800.00, 10.0, true, NOW(), NOW()),
('Corner Wall Cabinet', 1, 1, 1, 1450.00, 1650.00, 10.0, true, NOW(), NOW()),
('Sink Base Cabinet 600mm', 1, 1, 1, 1050.00, 1250.00, 10.0, true, NOW(), NOW()),
('Sink Base Cabinet 750mm', 1, 1, 1, 1100.00, 1300.00, 10.0, true, NOW(), NOW()),

-- Drawer Units
('3 Drawer Base 450mm', 1, 1, 1, 1250.00, 1450.00, 10.0, true, NOW(), NOW()),
('4 Drawer Base 600mm', 1, 1, 1, 1350.00, 1550.00, 10.0, true, NOW(), NOW()),
('Cutlery Drawer Insert', 1, 1, 1, 700.00, 850.00, 10.0, true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE name = name;