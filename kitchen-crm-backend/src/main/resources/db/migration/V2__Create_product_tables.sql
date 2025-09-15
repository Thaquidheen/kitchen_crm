-- Create materials table
CREATE TABLE materials (
                           id BIGINT PRIMARY KEY AUTO_INCREMENT,
                           name VARCHAR(255) NOT NULL,
                           unit_rate_per_sqft DECIMAL(10,2) NOT NULL,
                           description TEXT,
                           active BOOLEAN DEFAULT TRUE,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create accessories table
CREATE TABLE accessories (
                             id BIGINT PRIMARY KEY AUTO_INCREMENT,
                             name VARCHAR(255) NOT NULL,
                             category_id BIGINT,
                             brand_id BIGINT,
                             material_code VARCHAR(50) UNIQUE,
                             width_mm INT,
                             height_mm INT,
                             depth_mm INT,
                             image_url VARCHAR(500),
                             color VARCHAR(100),
                             mrp DECIMAL(10,2) NOT NULL,
                             discount_percentage DECIMAL(5,2) DEFAULT 0,
                             company_price DECIMAL(10,2),
                             active BOOLEAN DEFAULT TRUE,
                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                             FOREIGN KEY (category_id) REFERENCES categories(id),
                             FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- Create cabinet_types table
CREATE TABLE cabinet_types (
                               id BIGINT PRIMARY KEY AUTO_INCREMENT,
                               name VARCHAR(255) NOT NULL,
                               category_id BIGINT,
                               brand_id BIGINT,
                               material_id BIGINT,
                               base_price DECIMAL(10,2) NOT NULL,
                               mrp DECIMAL(10,2) NOT NULL,
                               discount_percentage DECIMAL(5,2) DEFAULT 0,
                               company_price DECIMAL(10,2),
                               active BOOLEAN DEFAULT TRUE,
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                               FOREIGN KEY (category_id) REFERENCES categories(id),
                               FOREIGN KEY (brand_id) REFERENCES brands(id),
                               FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- Create door_types table
CREATE TABLE door_types (
                            id BIGINT PRIMARY KEY AUTO_INCREMENT,
                            name VARCHAR(255) NOT NULL,
                            brand_id BIGINT,
                            material VARCHAR(255),
                            mrp DECIMAL(10,2) NOT NULL,
                            discount_percentage DECIMAL(5,2) DEFAULT 0,
                            company_price DECIMAL(10,2),
                            active BOOLEAN DEFAULT TRUE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- Create light_profiles table
CREATE TABLE light_profiles (
                                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                profile_type ENUM('A', 'B', 'C', 'D') NOT NULL,
                                price_per_meter DECIMAL(10,2) NOT NULL,
                                mrp DECIMAL(10,2) NOT NULL,
                                discount_percentage DECIMAL(5,2) DEFAULT 0,
                                company_price DECIMAL(10,2),
                                active BOOLEAN DEFAULT TRUE,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create drivers table
CREATE TABLE drivers (
                         id BIGINT PRIMARY KEY AUTO_INCREMENT,
                         wattage INT NOT NULL,
                         price DECIMAL(10,2) NOT NULL,
                         mrp DECIMAL(10,2) NOT NULL,
                         discount_percentage DECIMAL(5,2) DEFAULT 0,
                         company_price DECIMAL(10,2),
                         active BOOLEAN DEFAULT TRUE,
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create connectors table
CREATE TABLE connectors (
                            id BIGINT PRIMARY KEY AUTO_INCREMENT,
                            type ENUM('DRIVER_CONNECTOR', 'STRIP_CONNECTOR') NOT NULL,
                            price_per_piece DECIMAL(10,2) NOT NULL,
                            mrp DECIMAL(10,2) NOT NULL,
                            discount_percentage DECIMAL(5,2) DEFAULT 0,
                            company_price DECIMAL(10,2),
                            active BOOLEAN DEFAULT TRUE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create sensors table
CREATE TABLE sensors (
                         id BIGINT PRIMARY KEY AUTO_INCREMENT,
                         type ENUM('NORMAL_SENSOR', 'DRAWER_SENSOR') NOT NULL,
                         price_per_piece DECIMAL(10,2) NOT NULL,
                         mrp DECIMAL(10,2) NOT NULL,
                         discount_percentage DECIMAL(5,2) DEFAULT 0,
                         company_price DECIMAL(10,2),
                         active BOOLEAN DEFAULT TRUE,
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_accessories_category ON accessories(category_id);
CREATE INDEX idx_accessories_brand ON accessories(brand_id);
CREATE INDEX idx_accessories_active ON accessories(active);
CREATE INDEX idx_accessories_material_code ON accessories(material_code);

CREATE INDEX idx_cabinet_types_category ON cabinet_types(category_id);
CREATE INDEX idx_cabinet_types_brand ON cabinet_types(brand_id);
CREATE INDEX idx_cabinet_types_material ON cabinet_types(material_id);
CREATE INDEX idx_cabinet_types_active ON cabinet_types(active);

CREATE INDEX idx_door_types_brand ON door_types(brand_id);
CREATE INDEX idx_door_types_active ON door_types(active);

CREATE INDEX idx_materials_active ON materials(active);
CREATE INDEX idx_light_profiles_active ON light_profiles(active);
CREATE INDEX idx_drivers_active ON drivers(active);
CREATE INDEX idx_connectors_active ON connectors(active);
CREATE INDEX idx_sensors_active ON sensors(active);