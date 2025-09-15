-- V4__Insert_master_data.sql

-- Insert sample materials
INSERT INTO materials (name, unit_rate_per_sqft, description, active) VALUES
                                                                          ('Plywood 18mm', 125.00, 'High quality commercial plywood', true),
                                                                          ('MDF 18mm', 95.00, 'Medium Density Fiberboard', true),
                                                                          ('Particle Board 18mm', 75.00, 'Economic particle board', true),
                                                                          ('Marine Plywood 18mm', 185.00, 'Waterproof marine grade plywood', true);

-- Insert sample accessories (if accessories depend on categories/brands, you might need to create those first)
INSERT INTO accessories (name, material_code, width_mm, height_mm, depth_mm, color, mrp, discount_percentage, active) VALUES
                                                                                                                          ('Soft Close Hinge', 'SCH001', 35, 110, 15, 'Silver', 250.00, 10.00, true),
                                                                                                                          ('Pull Out Basket 450mm', 'POB450', 450, 150, 500, 'Chrome', 1200.00, 15.00, true),
                                                                                                                          ('LED Strip Light 1m', 'LED001', 1000, 8, 2, 'White', 450.00, 8.00, true),
                                                                                                                          ('Handle - Cabinet', 'HDL001', 128, 25, 15, 'Black', 85.00, 12.00, true),
                                                                                                                          ('Drawer Slide 450mm', 'DS450', 450, 35, 12, 'Silver', 320.00, 10.00, true);

-- Insert sample cabinet types
INSERT INTO cabinet_types (name, base_price, mrp, discount_percentage, active) VALUES
                                                                                   ('Base Cabinet Standard', 1200.00, 1500.00, 15.00, true),
                                                                                   ('Wall Cabinet Standard', 900.00, 1200.00, 15.00, true),
                                                                                   ('Tall Cabinet Standard', 1800.00, 2200.00, 15.00, true),
                                                                                   ('Corner Cabinet', 1400.00, 1750.00, 15.00, true);

-- Insert sample door types
INSERT INTO door_types (name, material, mrp, discount_percentage, active) VALUES
                                                                              ('Shaker Style Door', 'MDF with Laminate', 185.00, 12.00, true),
                                                                              ('Flat Panel Door', 'Plywood with Veneer', 220.00, 12.00, true),
                                                                              ('Raised Panel Door', 'Solid Wood', 350.00, 15.00, true),
                                                                              ('Glass Panel Door', 'MDF with Glass Insert', 285.00, 12.00, true);

-- Insert sample lighting components
INSERT INTO light_profiles (profile_type, price_per_meter, mrp, discount_percentage, active) VALUES
                                                                                                 ('A', 120.00, 150.00, 10.00, true),
                                                                                                 ('B', 145.00, 180.00, 10.00, true),
                                                                                                 ('C', 185.00, 220.00, 10.00, true),
                                                                                                 ('D', 225.00, 275.00, 10.00, true);

INSERT INTO drivers (wattage, price, mrp, discount_percentage, active) VALUES
                                                                           (20, 850.00, 1000.00, 8.00, true),
                                                                           (40, 1200.00, 1400.00, 8.00, true),
                                                                           (60, 1650.00, 1900.00, 8.00, true);

INSERT INTO connectors (type, price_per_piece, mrp, discount_percentage, active) VALUES
                                                                                     ('DRIVER_CONNECTOR', 25.00, 35.00, 5.00, true),
                                                                                     ('STRIP_CONNECTOR', 18.00, 25.00, 5.00, true);

INSERT INTO sensors (type, price_per_piece, mrp, discount_percentage, active) VALUES
                                                                                  ('NORMAL_SENSOR', 185.00, 220.00, 8.00, true),
                                                                                  ('DRAWER_SENSOR', 225.00, 275.00, 8.00, true);