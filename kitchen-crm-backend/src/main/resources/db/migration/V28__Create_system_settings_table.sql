-- Create system_settings table for global application settings
CREATE TABLE system_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default margin values for all product categories
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('accessories_margin_percentage', '20.00', 'Default margin percentage for accessories category'),
('cabinets_margin_percentage', '20.00', 'Default margin percentage for cabinets category'),
('doors_margin_percentage', '20.00', 'Default margin percentage for doors category'),
('lighting_margin_percentage', '20.00', 'Default margin percentage for lighting category');


