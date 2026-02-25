-- V71__Insert_excel_product_data.sql
-- Purpose: Insert product catalog data from Excel quotation spreadsheet
-- Data source: latest_quote__1_.xlsx (RATE sheet)

-- ============================================================
-- 1. BRANDS
-- ============================================================
INSERT INTO brands (id, name, description, active) VALUES
(1, 'BLUM', 'Premium international hardware brand', TRUE),
(2, 'HAFELE', 'Premium international hardware brand', TRUE),
(3, 'HETTICH', 'International hardware brand', TRUE),
(4, 'FLUID', 'Hardware brand', TRUE),
(5, 'EBCO', 'Indian hardware brand', TRUE),
(6, 'SINCORE', 'Sink and basin brand', TRUE);

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
INSERT INTO categories (id, name, description, active) VALUES
(1, 'Base Cabinets', 'Floor-standing kitchen base cabinets', TRUE),
(2, 'Wall Cabinets', 'Wall-mounted kitchen cabinets', TRUE),
(3, 'Tall Cabinets', 'Full-height tall kitchen cabinets', TRUE),
(4, 'Specialty Cabinets', 'Special purpose cabinets and panels', TRUE),
(5, 'Waste Management', 'Waste bins and disposal accessories', TRUE),
(6, 'Storage Solutions', 'Corner units, pantry systems, and storage', TRUE),
(7, 'Drawer Systems', 'Tandem boxes and drawer organization', TRUE),
(8, 'Kitchen Utilities', 'Kitchen functional accessories and mechanisms', TRUE);

-- ============================================================
-- 3. MATERIALS (Cabinet Body + Countertop)
-- ============================================================

-- Cabinet Body Materials (from Excel RATE sheet - Luxury pricing)
INSERT INTO materials (id, name, unit_rate_per_sqft, description, active) VALUES
(1, 'SS 304', 675.00, 'Stainless Steel 304 - Cabinet Body Material', TRUE),
(2, 'SS 202', 550.00, 'Stainless Steel 202 - Cabinet Body Material', TRUE),
(3, 'PLY', 185.00, 'Plywood - Cabinet Body Material', TRUE),
(4, 'WPC', 220.00, 'Wood Plastic Composite - Cabinet Body Material', TRUE);

-- Countertop Materials (from Excel RATE sheet - Top Material Rates)
INSERT INTO materials (id, name, unit_rate_per_sqft, description, active) VALUES
(5, 'GRANITE', 425.00, 'Granite Countertop', TRUE),
(6, 'KALINGA STONE', 775.00, 'Kalinga Stone Countertop', TRUE),
(7, 'SPECTA', 800.00, 'Specta Countertop', TRUE),
(8, 'SS 304 TOP', 750.00, 'Stainless Steel 304 Countertop', TRUE);

-- ============================================================
-- 4. CABINET TYPES (20 types × 2 brand groups = 40 entries)
-- Schema: name, category_id, brand_id, material_id, fixed_price
-- Fixed price = Standard Accessories Cost per cabinet type
-- ============================================================

-- BLUM brand entries (brand_id = 1)
INSERT INTO cabinet_types (name, category_id, brand_id, fixed_price, active) VALUES
('Storage Base Cabinet', 1, 1, 3000.00, TRUE),
('Sink Base with Hinged Doors', 1, 1, 2000.00, TRUE),
('Sink Base with Drawer', 1, 1, 6000.00, TRUE),
('Pull Out Base Cabinet', 1, 1, 1000.00, TRUE),
('Corner Base Cabinet', 1, 1, 3000.00, TRUE),
('Pentagon Base Cabinet', 1, 1, 3000.00, TRUE),
('3 Drawer Base Cabinet', 1, 1, 12000.00, TRUE),
('2 Drawer Base Cabinet', 1, 1, 8500.00, TRUE),
('1 Drawer Base Cabinet', 1, 1, 5000.00, TRUE),
('Dish Washer/Washing Machine', 4, 1, 500.00, TRUE),
('Storage Tall Cabinet', 3, 1, 8000.00, TRUE),
('Oven Tall Cabinet', 3, 1, 7000.00, TRUE),
('Pantry Tall Cabinet', 3, 1, 3000.00, TRUE),
('Wall Cabinet with Hinge Door', 2, 1, 6000.00, TRUE),
('Wall Cabinet with Lift Up', 2, 1, 5500.00, TRUE),
('Shutter Cabinet', 2, 1, 4500.00, TRUE),
('Open/Dummy Cabinet', 4, 1, 1000.00, TRUE),
('Loft Cabinet', 2, 1, 1200.00, TRUE),
('Open Shelf', 4, 1, 1200.00, TRUE),
('Side Panel', 4, 1, 500.00, TRUE);

-- HETTICH brand entries (brand_id = 3)
INSERT INTO cabinet_types (name, category_id, brand_id, fixed_price, active) VALUES
('Storage Base Cabinet', 1, 3, 2500.00, TRUE),
('Sink Base with Hinged Doors', 1, 3, 2500.00, TRUE),
('Sink Base with Drawer', 1, 3, 6000.00, TRUE),
('Pull Out Base Cabinet', 1, 3, 1500.00, TRUE),
('Corner Base Cabinet', 1, 3, 2500.00, TRUE),
('Pentagon Base Cabinet', 1, 3, 3000.00, TRUE),
('3 Drawer Base Cabinet', 1, 3, 12000.00, TRUE),
('2 Drawer Base Cabinet', 1, 3, 8500.00, TRUE),
('1 Drawer Base Cabinet', 1, 3, 5000.00, TRUE),
('Dish Washer/Washing Machine', 4, 3, 500.00, TRUE),
('Storage Tall Cabinet', 3, 3, 7500.00, TRUE),
('Oven Tall Cabinet', 3, 3, 6500.00, TRUE),
('Pantry Tall Cabinet', 3, 3, 2500.00, TRUE),
('Wall Cabinet with Hinge Door', 2, 3, 6000.00, TRUE),
('Wall Cabinet with Lift Up', 2, 3, 5500.00, TRUE),
('Shutter Cabinet', 2, 3, 4500.00, TRUE),
('Open/Dummy Cabinet', 4, 3, 1000.00, TRUE),
('Loft Cabinet', 2, 3, 1000.00, TRUE),
('Open Shelf', 4, 3, 1000.00, TRUE),
('Side Panel', 4, 3, 500.00, TRUE);

-- ============================================================
-- 5. DOOR TYPES (21 entries from Excel RATE sheet)
-- company_price auto-calculated by trigger: mrp * (1 - discount/100)
-- discount_percentage = 0 since Excel prices are direct rates
-- ============================================================
INSERT INTO door_types (name, material, mrp, discount_percentage, active) VALUES
('SS 304', 'SS 304', 1000.00, 0, TRUE),
('PU ON SS', 'PU ON SS', 1220.00, 0, TRUE),
('PU ON WPC', 'PU ON WPC', 750.00, 0, TRUE),
('PU ON PLY GLOSSY', 'PU ON PLY GLOSSY', 700.00, 0, TRUE),
('GLASS ON SS', 'GLASS ON SS', 1450.00, 0, TRUE),
('GLASS ON FRAME MATT', 'GLASS ON FRAME MATT', 1150.00, 0, TRUE),
('GLASS ON FRAME GLOSSY', 'GLASS ON FRAME GLOSSY', 1080.00, 0, TRUE),
('GLAX ON SS 3MM', 'GLAX ON SS 3MM', 1150.00, 0, TRUE),
('GLAX ON SS 2MM', 'GLAX ON SS 2MM', 1050.00, 0, TRUE),
('GLAX ON WPC 3MM', 'GLAX ON WPC 3MM', 790.00, 0, TRUE),
('GLAX ON WPC 2MM', 'GLAX ON WPC 2MM', 750.00, 0, TRUE),
('GLAX ON PLY 3MM', 'GLAX ON PLY 3MM', 725.00, 0, TRUE),
('GLAX ON PLY 2MM', 'GLAX ON PLY 2MM', 690.00, 0, TRUE),
('CERAMIC ON SS', 'CERAMIC ON SS', 1500.00, 0, TRUE),
('CERAMIC ON FRAME', 'CERAMIC ON FRAME', 1200.00, 0, TRUE),
('LAMINATE ON WPC HIGH', 'LAMINATE ON WPC HIGH', 900.00, 0, TRUE),
('LAMINATE ON PLY HIGH', 'LAMINATE ON PLY HIGH', 850.00, 0, TRUE),
('LAMINATE ON WPC MEDIUM', 'LAMINATE ON WPC MEDIUM', 650.00, 0, TRUE),
('LAMINATE ON PLY MEDIUM', 'LAMINATE ON PLY MEDIUM', 600.00, 0, TRUE),
('LAMINATE ON WPC LAW', 'LAMINATE ON WPC LAW', 500.00, 0, TRUE),
('LAMINATE ON PLY LAW', 'LAMINATE ON PLY LAW', 450.00, 0, TRUE);

-- ============================================================
-- 6. ACCESSORIES (26 entries from Excel Special Accessories)
-- company_price auto-calculated by trigger: mrp * (1 - discount/100)
-- discount_percentage = 0 since Excel prices are direct rates
-- ============================================================

-- Waste Management (category_id = 5)
INSERT INTO accessories (name, category_id, mrp, discount_percentage, active) VALUES
('MULLBOY WASTEBIN', 5, 2600.00, 0, TRUE),
('PULLOUT WASTEBIN', 5, 8800.00, 0, TRUE),
('DRAWER WASTEBIN', 5, 15000.00, 0, TRUE);

-- Kitchen Utilities (category_id = 8)
INSERT INTO accessories (name, category_id, mrp, discount_percentage, active) VALUES
('CLEANING AGENT', 8, 9000.00, 0, TRUE),
('SPICE RACK', 8, 5500.00, 0, TRUE),
('ROLLING SHUTTER', 8, 26000.00, 0, TRUE),
('KITCHEN AGENT', 8, 11500.00, 0, TRUE),
('CARYSIL UNIT', 8, 16000.00, 0, TRUE),
('HINGED DOOR + PLATE & GLASS DRAINER', 8, 4100.00, 0, TRUE),
('BI FOLDING DOOR + PLATE & GLASS DRAINER', 8, 17200.00, 0, TRUE),
('BI FOLDING DOOR', 8, 13000.00, 0, TRUE),
('LIFT UP', 8, 10500.00, 0, TRUE),
('LIFT UP + PLATE & GLASS DRAINER', 8, 14200.00, 0, TRUE);

-- Storage Solutions (category_id = 6)
INSERT INTO accessories (name, category_id, mrp, discount_percentage, active) VALUES
('LEMONCE CORNER', 6, 20500.00, 0, TRUE),
('MAGIC CORNER', 6, 24000.00, 0, TRUE),
('SILVER PANTRY UNIT', 6, 38000.00, 0, TRUE),
('GLASS PANTRY UNIT', 6, 43000.00, 0, TRUE),
('CONVOY LAVIDO', 6, 75000.00, 0, TRUE),
('WICKER BASKET/DRY VEG BASKET', 6, 13000.00, 0, TRUE);

-- Drawer Systems (category_id = 7)
INSERT INTO accessories (name, category_id, mrp, discount_percentage, active) VALUES
('1 TANDOM BOX', 7, 7200.00, 0, TRUE),
('1 TANDOM BOX + CUTLERY + PLATE HOLDER', 7, 9500.00, 0, TRUE),
('2 TANDOM BOX', 7, 14000.00, 0, TRUE),
('2 TANDOM BOX + CUTLERY + PLATE HOLDER', 7, 16500.00, 0, TRUE),
('3 TANDOM BOX', 7, 20000.00, 0, TRUE),
('3 TANDOM BOX + CUTLERY + PLATE HOLDER', 7, 22500.00, 0, TRUE);

-- ============================================================
-- 7. LIGHTING
-- ============================================================

-- Light Profiles (company_price auto-calculated by trigger)
INSERT INTO light_profiles (profile_type, price_per_meter, mrp, discount_percentage, active) VALUES
('A', 180.00, 220.00, 10.00, TRUE),
('B', 220.00, 260.00, 10.00, TRUE),
('C', 285.00, 330.00, 10.00, TRUE),
('D', 350.00, 400.00, 10.00, TRUE);

-- Drivers (company_price auto-calculated by trigger)
INSERT INTO drivers (wattage, price, mrp, discount_percentage, active) VALUES
(20, 550.00, 650.00, 10.00, TRUE),
(30, 650.00, 750.00, 10.00, TRUE),
(60, 950.00, 1150.00, 10.00, TRUE),
(100, 1450.00, 1650.00, 10.00, TRUE);

-- Connectors (company_price auto-calculated by trigger)
INSERT INTO connectors (type, price_per_piece, mrp, discount_percentage, active) VALUES
('DRIVER_CONNECTOR', 15.00, 20.00, 8.00, TRUE),
('STRIP_CONNECTOR', 25.00, 35.00, 8.00, TRUE);

-- Sensors (company_price auto-calculated by trigger)
INSERT INTO sensors (type, price_per_piece, mrp, discount_percentage, active) VALUES
('NORMAL_SENSOR', 425.00, 485.00, 8.00, TRUE),
('DRAWER_SENSOR', 285.00, 325.00, 8.00, TRUE);
