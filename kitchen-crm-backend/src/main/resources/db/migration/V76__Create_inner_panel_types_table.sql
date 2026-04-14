-- Inner Panel Types master table
CREATE TABLE inner_panel_types (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    rate_per_sqft DECIMAL(10,2) NOT NULL,
    multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_inner_panel_types_active ON inner_panel_types(active);

-- Add inner panel fields to quotation_cabinets
ALTER TABLE quotation_cabinets
    ADD COLUMN inner_panel_type_id BIGINT NULL,
    ADD COLUMN inner_panel_rate DECIMAL(10,2) NULL,
    ADD COLUMN inner_panel_multiplier DECIMAL(5,2) NULL DEFAULT 1.0,
    ADD COLUMN inner_panel_cost DECIMAL(10,2) NULL DEFAULT 0;

-- Seed default inner panel types
INSERT INTO inner_panel_types (name, rate_per_sqft, multiplier, description) VALUES
    ('Middle Shelf', 745.00, 1.0, 'Single middle shelf panel'),
    ('2 Drawer', 745.00, 1.0, 'Two drawer inner panel'),
    ('3 Drawer', 745.00, 1.5, 'Three drawer inner panel');
