-- Appliance & Quartz sales module: customers buying appliances (hob/hood/fridge...)
-- or quartz, quoted separately from kitchen quotations. Items are free-text rows.
CREATE TABLE appliance_customers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(50) NOT NULL,
    category ENUM('APPLIANCE', 'QUARTZ') NOT NULL DEFAULT 'APPLIANCE',
    brand VARCHAR(255) NULL,
    amount DECIMAL(12,2) NULL,
    status ENUM('ENQUIRY', 'ORDERED', 'DELIVERED') NOT NULL DEFAULT 'ENQUIRY',
    notes TEXT NULL,
    created_by VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_appliance_customers_category (category),
    INDEX idx_appliance_customers_status (status)
);

CREATE TABLE appliance_customer_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    appliance_customer_id BIGINT NOT NULL,
    item_name VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_appliance_items_customer FOREIGN KEY (appliance_customer_id)
        REFERENCES appliance_customers(id) ON DELETE CASCADE,
    INDEX idx_appliance_items_customer (appliance_customer_id)
);
