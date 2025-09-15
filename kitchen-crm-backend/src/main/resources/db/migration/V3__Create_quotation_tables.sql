-- V3__Create_quotation_tables.sql

-- Create quotations table
CREATE TABLE quotations (
                            id BIGINT PRIMARY KEY AUTO_INCREMENT,
                            customer_id BIGINT NOT NULL,
                            quotation_number VARCHAR(100) UNIQUE NOT NULL,
                            project_name VARCHAR(255),
                            transportation_price DECIMAL(10,2) DEFAULT 0.00,
                            installation_price DECIMAL(10,2) DEFAULT 0.00,
                            margin_percentage DECIMAL(5,2) DEFAULT 0.00,
                            tax_percentage DECIMAL(5,2) DEFAULT 0.00,
                            subtotal DECIMAL(12,2) DEFAULT 0.00,
                            margin_amount DECIMAL(12,2) DEFAULT 0.00,
                            tax_amount DECIMAL(12,2) DEFAULT 0.00,
                            total_amount DECIMAL(12,2) DEFAULT 0.00,
                            status ENUM('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'REVISED', 'EXPIRED') DEFAULT 'DRAFT',
                            valid_until DATE,
                            notes TEXT,
                            terms_conditions TEXT,
                            created_by VARCHAR(255),
                            approved_by VARCHAR(255),
                            approved_at DATE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                            INDEX idx_quotation_customer (customer_id),
                            INDEX idx_quotation_status (status),
                            INDEX idx_quotation_number (quotation_number),
                            INDEX idx_quotation_created (created_at)
);

-- Create quotation_accessories table
CREATE TABLE quotation_accessories (
                                       id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                       quotation_id BIGINT NOT NULL,
                                       accessory_id BIGINT,
                                       quantity INT NOT NULL,
                                       unit_price DECIMAL(10,2) NOT NULL,
                                       margin_amount DECIMAL(10,2) DEFAULT 0.00,
                                       tax_amount DECIMAL(10,2) DEFAULT 0.00,
                                       total_price DECIMAL(10,2) NOT NULL,
                                       description TEXT,
                                       custom_item BOOLEAN DEFAULT FALSE,
                                       custom_item_name VARCHAR(255),
                                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                       FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
                                       FOREIGN KEY (accessory_id) REFERENCES accessories(id) ON DELETE SET NULL,
                                       INDEX idx_quotation_accessories_quotation (quotation_id),
                                       INDEX idx_quotation_accessories_accessory (accessory_id)
);

-- Create quotation_cabinets table
CREATE TABLE quotation_cabinets (
                                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                    quotation_id BIGINT NOT NULL,
                                    cabinet_type_id BIGINT,
                                    quantity INT NOT NULL,
                                    width_mm INT,
                                    height_mm INT,
                                    depth_mm INT,
                                    calculated_sqft DECIMAL(10,4),
                                    unit_price DECIMAL(10,2) NOT NULL,
                                    margin_amount DECIMAL(10,2) DEFAULT 0.00,
                                    tax_amount DECIMAL(10,2) DEFAULT 0.00,
                                    total_price DECIMAL(10,2) NOT NULL,
                                    cabinet_finish VARCHAR(100),
                                    description TEXT,
                                    custom_dimensions BOOLEAN DEFAULT FALSE,
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
                                    FOREIGN KEY (cabinet_type_id) REFERENCES cabinet_types(id) ON DELETE SET NULL,
                                    INDEX idx_quotation_cabinets_quotation (quotation_id),
                                    INDEX idx_quotation_cabinets_cabinet_type (cabinet_type_id)
);

-- Create quotation_doors table
CREATE TABLE quotation_doors (
                                 id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                 quotation_id BIGINT NOT NULL,
                                 door_type_id BIGINT,
                                 quantity INT NOT NULL,
                                 width_mm INT,
                                 height_mm INT,
                                 calculated_sqft DECIMAL(10,4),
                                 unit_price DECIMAL(10,2) NOT NULL,
                                 margin_amount DECIMAL(10,2) DEFAULT 0.00,
                                 tax_amount DECIMAL(10,2) DEFAULT 0.00,
                                 total_price DECIMAL(10,2) NOT NULL,
                                 door_finish VARCHAR(100),
                                 door_style VARCHAR(100),
                                 description TEXT,
                                 custom_dimensions BOOLEAN DEFAULT FALSE,
                                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
                                 FOREIGN KEY (door_type_id) REFERENCES door_types(id) ON DELETE SET NULL,
                                 INDEX idx_quotation_doors_quotation (quotation_id),
                                 INDEX idx_quotation_doors_door_type (door_type_id)
);

-- Create quotation_lighting table
CREATE TABLE quotation_lighting (
                                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                    quotation_id BIGINT NOT NULL,
                                    item_type ENUM('LIGHT_PROFILE', 'DRIVER', 'CONNECTOR', 'SENSOR') NOT NULL,
                                    item_id BIGINT NOT NULL,
                                    item_name VARCHAR(255) NOT NULL,
                                    quantity DECIMAL(10,2) NOT NULL,
                                    unit VARCHAR(50) NOT NULL,
                                    unit_price DECIMAL(10,2) NOT NULL,
                                    margin_amount DECIMAL(10,2) DEFAULT 0.00,
                                    tax_amount DECIMAL(10,2) DEFAULT 0.00,
                                    total_price DECIMAL(10,2) NOT NULL,
                                    specifications TEXT,
                                    description TEXT,
                                    wattage INT,
                                    profile_type VARCHAR(10),
                                    sensor_type VARCHAR(50),
                                    connector_type VARCHAR(50),
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
                                    INDEX idx_quotation_lighting_quotation (quotation_id),
                                    INDEX idx_quotation_lighting_item (item_type, item_id)
);

-- Create indexes for performance
CREATE INDEX idx_quotations_customer_status ON quotations(customer_id, status);
CREATE INDEX idx_quotations_created_status ON quotations(created_at, status);
CREATE INDEX idx_quotations_valid_until ON quotations(valid_until);

-- Create triggers for automatic quotation number generation
DELIMITER //

CREATE TRIGGER quotation_number_trigger
    BEFORE INSERT ON quotations
    FOR EACH ROW
BEGIN
    IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
        SET NEW.quotation_number = CONCAT('QT-', YEAR(NOW()), '-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
END IF;
END//

DELIMITER ;

-- Create view for quotation summaries
CREATE VIEW quotation_summary AS
SELECT
    q.id,
    q.quotation_number,
    q.project_name,
    c.name as customer_name,
    q.total_amount,
    q.status,
    q.valid_until,
    q.created_at,
    q.created_by,
    q.approved_by,
    q.approved_at,
    CASE
        WHEN q.valid_until < CURDATE() AND q.status = 'SENT' THEN 'EXPIRED'
        ELSE q.status
        END as effective_status
FROM quotations q
         JOIN customers c ON q.customer_id = c.id;

-- Create view for quotation line item counts
CREATE VIEW quotation_line_counts AS
SELECT
    q.id as quotation_id,
    q.quotation_number,
    COALESCE(acc_count.item_count, 0) as accessory_count,
    COALESCE(cab_count.item_count, 0) as cabinet_count,
    COALESCE(door_count.item_count, 0) as door_count,
    COALESCE(light_count.item_count, 0) as lighting_count,
    (COALESCE(acc_count.item_count, 0) +
     COALESCE(cab_count.item_count, 0) +
     COALESCE(door_count.item_count, 0) +
     COALESCE(light_count.item_count, 0)) as total_line_items
FROM quotations q
         LEFT JOIN (
    SELECT quotation_id, COUNT(*) as item_count
    FROM quotation_accessories
    GROUP BY quotation_id
) acc_count ON q.id = acc_count.quotation_id
         LEFT JOIN (
    SELECT quotation_id, COUNT(*) as item_count
    FROM quotation_cabinets
    GROUP BY quotation_id
) cab_count ON q.id = cab_count.quotation_id
         LEFT JOIN (
    SELECT quotation_id, COUNT(*) as item_count
    FROM quotation_doors
    GROUP BY quotation_id
) door_count ON q.id = door_count.quotation_id
         LEFT JOIN (
    SELECT quotation_id, COUNT(*) as item_count
    FROM quotation_lighting
    GROUP BY quotation_id
) light_count ON q.id = light_count.quotation_id;