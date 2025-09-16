-- Insert materials data (matching the actual table structure)
INSERT INTO materials (name, description, unit_rate_per_sqft, active, created_at, updated_at) VALUES
-- Wood Materials
('Marine Plywood 18mm', 'BWR grade marine plywood for humid conditions', 180.00, true, NOW(), NOW()),
('Commercial Plywood 18mm', 'Standard commercial grade plywood', 145.00, true, NOW(), NOW()),
('BWR Plywood 18mm', 'Boiling Water Resistant plywood', 165.00, true, NOW(), NOW()),
('Particle Board 18mm', 'Pre-laminated particle board', 85.00, true, NOW(), NOW()),
('MDF 18mm', 'Medium Density Fiberboard', 95.00, true, NOW(), NOW()),
('HDF 6mm', 'High Density Fiberboard for shutters', 65.00, true, NOW(), NOW()),

-- Laminate Materials
('Merino High Gloss Laminate', 'Premium high gloss decorative laminate', 125.00, true, NOW(), NOW()),
('Merino Matte Finish Laminate', 'Anti-fingerprint matte laminate', 110.00, true, NOW(), NOW()),
('Action Tesa Glossy Laminate', 'High gloss decorative surface', 95.00, true, NOW(), NOW()),
('Advance Laminate Wood Grain', 'Natural wood texture laminate', 105.00, true, NOW(), NOW()),

-- Countertop Materials
('Granite Absolute Black', 'Premium black granite countertop', 185.00, true, NOW(), NOW()),
('Quartz Engineered Stone', 'Artificial quartz stone surface', 285.00, true, NOW(), NOW()),
('Marble Italian Carrara', 'Premium Italian marble', 350.00, true, NOW(), NOW()),
('Solid Surface Corian', 'DuPont Corian solid surface', 425.00, true, NOW(), NOW()),

-- Edge Banding (price per running meter, but stored as sqft rate)
('PVC Edge Band 1mm', 'Standard PVC edge banding', 15.00, true, NOW(), NOW()),
('ABS Edge Band 1mm', 'Premium ABS edge banding', 22.00, true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE name = name;