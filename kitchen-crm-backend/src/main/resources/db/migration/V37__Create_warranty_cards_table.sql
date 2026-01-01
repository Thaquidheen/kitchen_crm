-- V37: Create warranty_cards table
-- Purpose: Store warranty card information for customers
-- Author: HOCH Team
-- Date: 2025-01-20

CREATE TABLE IF NOT EXISTS warranty_cards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    project_id BIGINT NULL,
    
    -- Certificate Information
    certificate_number VARCHAR(50) UNIQUE,
    issue_date DATE,
    
    -- Project Information
    project_completion_date DATE,
    project_address TEXT,
    project_description VARCHAR(500) DEFAULT 'Modular Kitchen Design, Supply & Installation',
    
    -- Authorized Signatory
    authorized_name VARCHAR(255),
    authorized_designation VARCHAR(255),
    signature_date DATE,
    
    -- PDF and Email Tracking
    pdf_file_path VARCHAR(500),
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP NULL,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- Foreign key constraints
    CONSTRAINT fk_warranty_cards_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_warranty_cards_project
        FOREIGN KEY (project_id) REFERENCES customer_projects(id)
        ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_warranty_cards_customer_id (customer_id),
    INDEX idx_warranty_cards_project_id (project_id),
    INDEX idx_warranty_cards_certificate_number (certificate_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


