-- V54__Create_payments_table.sql
-- Create payments table for project payment tracking

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    reference_number VARCHAR(255) NULL,
    notes TEXT NULL,
    received_by VARCHAR(255) NULL,
    payment_status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL,

    CONSTRAINT fk_payment_project
        FOREIGN KEY (project_id)
        REFERENCES customer_projects(id)
        ON DELETE CASCADE,

    INDEX idx_payments_project (project_id),
    INDEX idx_payments_date (payment_date),
    INDEX idx_payments_status (payment_status)
);
