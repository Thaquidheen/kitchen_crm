-- V13__Insert_lighting_data.sql

-- Insert light profiles (only using existing columns)
INSERT INTO light_profiles (profile_type, price_per_meter, mrp, discount_percentage, active) VALUES
                                                                                                 ('A', 180.00, 220.00, 10.0, true),
                                                                                                 ('B', 220.00, 260.00, 10.0, true),
                                                                                                 ('C', 285.00, 330.00, 10.0, true),
                                                                                                 ('D', 350.00, 400.00, 10.0, true)
    ON DUPLICATE KEY UPDATE profile_type = profile_type;

-- Insert drivers (only using existing columns)
INSERT INTO drivers (wattage, price, mrp, discount_percentage, active) VALUES
                                                                           (20, 550.00, 650.00, 10.0, true),
                                                                           (30, 650.00, 750.00, 10.0, true),
                                                                           (60, 950.00, 1150.00, 10.0, true),
                                                                           (100, 1450.00, 1650.00, 10.0, true)
    ON DUPLICATE KEY UPDATE wattage = wattage;

-- Insert connectors (only using existing columns)
INSERT INTO connectors (type, price_per_piece, mrp, discount_percentage, active) VALUES
                                                                                     ('DRIVER_CONNECTOR', 15.00, 20.00, 8.0, true),
                                                                                     ('STRIP_CONNECTOR', 25.00, 35.00, 8.0, true)
    ON DUPLICATE KEY UPDATE type = type;

-- Insert sensors (only using existing columns)
INSERT INTO sensors (type, price_per_piece, mrp, discount_percentage, active) VALUES
                                                                                  ('NORMAL_SENSOR', 425.00, 485.00, 8.0, true),
                                                                                  ('DRAWER_SENSOR', 285.00, 325.00, 8.0, true)
    ON DUPLICATE KEY UPDATE type = type;