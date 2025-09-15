-- Insert sample brands
INSERT INTO brands (name, description, active, created_at, updated_at) VALUES
                                                                           ('Hafele', 'Premium kitchen hardware and accessories', true, NOW(), NOW()),
                                                                           ('Blum', 'High-quality drawer systems and hinges', true, NOW(), NOW()),
                                                                           ('Hettich', 'Innovative furniture fittings', true, NOW(), NOW()),
                                                                           ('Godrej', 'Trusted Indian brand for home solutions', true, NOW(), NOW()),
                                                                           ('Sleek', 'Modern kitchen solutions', true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE name = name;

-- Insert sample categories
INSERT INTO categories (name, description, active, created_at, updated_at) VALUES
                                                                               ('Cabinet Hardware', 'Hinges, handles, and cabinet accessories', true, NOW(), NOW()),
                                                                               ('Drawer Systems', 'Soft-close drawers and slides', true, NOW(), NOW()),
                                                                               ('Kitchen Appliances', 'Built-in kitchen appliances', true, NOW(), NOW()),
                                                                               ('Lighting', 'LED strips and kitchen lighting solutions', true, NOW(), NOW()),
                                                                               ('Storage Solutions', 'Pull-out baskets and organizers', true, NOW(), NOW()),
                                                                               ('Countertops', 'Kitchen countertop materials', true, NOW(), NOW()),
                                                                               ('Shutters', 'Cabinet door materials', true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE name = name;

-- Insert sample materials
INSERT INTO materials (name, unit_rate_per_sqft, description, active, created_at, updated_at) VALUES
                                                                                                  ('Plywood BWP', 180.00, 'Boiling Water Proof plywood for humid conditions', true, NOW(), NOW()),
                                                                                                  ('Plywood BWR', 160.00, 'Boiling Water Resistant plywood for kitchen use', true, NOW(), NOW()),
                                                                                                  ('MDF', 120.00, 'Medium Density Fiberboard for smooth finishes', true, NOW(), NOW()),
                                                                                                  ('Particle Board', 100.00, 'Engineered wood for budget-friendly options', true, NOW(), NOW()),
                                                                                                  ('Marine Plywood', 220.00, 'High-quality waterproof plywood', true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE name = name;

-- Insert sample accessories
INSERT INTO accessories (name, category_id, brand_id, material_code, mrp, discount_percentage, company_price, active, created_at, updated_at) VALUES
                                                                                                                                                  ('Soft Close Hinge', 1, 1, 'HAF001', 450.00, 15.00, 382.50, true, NOW(), NOW()),
                                                                                                                                                  ('Cabinet Handle 128mm', 1, 1, 'HAF002', 250.00, 10.00, 225.00, true, NOW(), NOW()),
                                                                                                                                                  ('Drawer Slide 450mm', 2, 2, 'BLU001', 850.00, 20.00, 680.00, true, NOW(), NOW()),
                                                                                                                                                  ('Pull-out Basket 450mm', 5, 3, 'HET001', 2500.00, 12.00, 2200.00, true, NOW(), NOW()),
                                                                                                                                                  ('LED Strip Light 1m', 4, 4, 'GOD001', 180.00, 8.00, 165.60, true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE material_code = material_code;

-- Insert sample cabinet types
INSERT INTO cabinet_types (name, category_id, brand_id, material_id, base_price, mrp, discount_percentage, company_price, active, created_at, updated_at) VALUES
                                                                                                                                                              ('Base Cabinet 450mm', 1, 1, 1, 3500.00, 4200.00, 15.00, 3570.00, true, NOW(), NOW()),
                                                                                                                                                              ('Wall Cabinet 300mm', 1, 1, 1, 2800.00, 3400.00, 15.00, 2890.00, true, NOW(), NOW()),
                                                                                                                                                              ('Tall Unit 600mm', 1, 2, 2, 5500.00, 6800.00, 18.00, 5576.00, true, NOW(), NOW()),
                                                                                                                                                              ('Drawer Unit 450mm', 2, 2, 1, 4200.00, 5100.00, 16.00, 4284.00, true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE name = name;

-- Insert sample door types
INSERT INTO door_types (name, brand_id, material, mrp, discount_percentage, company_price, active, created_at, updated_at) VALUES
                                                                                                                               ('Glossy White Shutter', 1, 'PU GLOSSY', 320.00, 12.00, 281.60, true, NOW(), NOW()),
                                                                                                                               ('Matt Finish Shutter', 1, 'PU MATT', 300.00, 12.00, 264.00, true, NOW(), NOW()),
                                                                                                                               ('Membrane Shutter', 2, 'MEMBRANE', 180.00, 10.00, 162.00, true, NOW(), NOW()),
                                                                                                                               ('Laminate Shutter', 3, 'LAMINATE', 150.00, 8.00, 138.00, true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE name = name;

-- Insert sample lighting components
INSERT INTO light_profiles (profile_type, price_per_meter, mrp, discount_percentage, company_price, active, created_at, updated_at) VALUES
                                                                                                                                        ('A', 120.00, 150.00, 10.00, 135.00, true, NOW(), NOW()),
                                                                                                                                        ('B', 150.00, 180.00, 10.00, 162.00, true, NOW(), NOW()),
                                                                                                                                        ('C', 180.00, 220.00, 12.00, 193.60, true, NOW(), NOW()),
                                                                                                                                        ('D', 220.00, 280.00, 15.00, 238.00, true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE profile_type = profile_type;

INSERT INTO drivers (wattage, price, mrp, discount_percentage, company_price, active, created_at, updated_at) VALUES
                                                                                                                  (20, 450.00, 550.00, 10.00, 495.00, true, NOW(), NOW()),
                                                                                                                  (40, 650.00, 800.00, 12.00, 704.00, true, NOW(), NOW()),
                                                                                                                  (60, 850.00, 1050.00, 15.00, 892.50, true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE wattage = wattage;

INSERT INTO connectors (type, price_per_piece, mrp, discount_percentage, company_price, active, created_at, updated_at) VALUES
                                                                                                                            ('DRIVER_CONNECTOR', 25.00, 35.00, 8.00, 32.20, true, NOW(), NOW()),
                                                                                                                            ('STRIP_CONNECTOR', 15.00, 22.00, 8.00, 20.24, true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE type = type;

INSERT INTO sensors (type, price_per_piece, mrp, discount_percentage, company_price, active, created_at, updated_at) VALUES
                                                                                                                         ('NORMAL_SENSOR', 180.00, 220.00, 10.00, 198.00, true, NOW(), NOW()),
                                                                                                                         ('DRAWER_SENSOR', 250.00, 300.00, 12.00, 264.00, true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE type = type;