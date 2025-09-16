-- V12__Insert_accessories_data.sql

-- Insert accessories data (matching the actual table structure)
INSERT INTO accessories (name, category_id, brand_id, material_code, width_mm, height_mm, depth_mm, color, mrp, discount_percentage, active, created_at, updated_at) VALUES

-- Hinges
('Blum Clip Top 110° Hinge', 1, 2, 'BLM-71T1550', 35, 110, 15, 'Silver', 285.00, 10.0, true, NOW(), NOW()),
('Hafele Soft Close Hinge', 1, 1, 'HAF-311.95.510', 35, 110, 15, 'Silver', 265.00, 8.0, true, NOW(), NOW()),
('Hettich Sensys 110°', 1, 3, 'HET-9239990', 35, 110, 15, 'Silver', 295.00, 12.0, true, NOW(), NOW()),
('Ebco Soft Close Hinge', 1, 7, 'EBC-SCH110', 35, 110, 15, 'Silver', 185.00, 5.0, true, NOW(), NOW()),

-- Drawer Systems
('Blum Tandem Full Extension 450mm', 2, 2, 'BLM-560H4500B', 450, 45, 12, 'Silver', 1250.00, 15.0, true, NOW(), NOW()),
('Blum Tandem Full Extension 500mm', 2, 2, 'BLM-560H5000B', 500, 45, 12, 'Silver', 1350.00, 15.0, true, NOW(), NOW()),
('Hafele Ball Bearing Slide', 2, 1, 'HAF-432.05.463', 450, 42, 12, 'Silver', 850.00, 10.0, true, NOW(), NOW()),
('Hettich Quadro V6', 2, 3, 'HET-9241985', 450, 45, 12, 'Silver', 1450.00, 18.0, true, NOW(), NOW()),

-- Handles and Knobs
('Hafele SS Bar Handle 128mm', 3, 1, 'HAF-111.35.128', 128, 12, 25, 'Steel', 125.00, 8.0, true, NOW(), NOW()),
('Hafele SS Bar Handle 160mm', 3, 1, 'HAF-111.35.160', 160, 12, 25, 'Steel', 145.00, 8.0, true, NOW(), NOW()),
('Ebco Designer Handle Black', 3, 7, 'EBC-DH128B', 128, 15, 30, 'Black', 85.00, 5.0, true, NOW(), NOW()),
('Hafele Round Knob Chrome', 3, 1, 'HAF-110.72.001', 25, 25, 20, 'Chrome', 95.00, 8.0, true, NOW(), NOW()),

-- Storage Solutions
('Hafele Magic Corner Right', 4, 1, 'HAF-545.13.817', 800, 720, 500, 'Steel', 18500.00, 20.0, true, NOW(), NOW()),
('Blum Space Corner', 4, 2, 'BLM-20S2900', 900, 720, 500, 'Steel', 22500.00, 22.0, true, NOW(), NOW()),
('Hafele Tandem Pantry', 4, 1, 'HAF-546.63.797', 450, 1800, 500, 'Steel', 15500.00, 18.0, true, NOW(), NOW()),
('Ebco Kitchen Basket 450mm', 4, 7, 'EBC-KB450', 450, 150, 500, 'Steel', 1250.00, 8.0, true, NOW(), NOW()),
('Ebco Kitchen Basket 600mm', 4, 7, 'EBC-KB600', 600, 150, 500, 'Steel', 1450.00, 8.0, true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE name = name;