-- V14__Create_customer_plan_images_table.sql
-- Create customer_plan_images table for storing customer plan/design images

CREATE TABLE IF NOT EXISTS customer_plan_images (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(50) DEFAULT 'FLOOR_PLAN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL,

    CONSTRAINT fk_plan_image_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE,

    INDEX idx_plan_images_customer (customer_id)
);
