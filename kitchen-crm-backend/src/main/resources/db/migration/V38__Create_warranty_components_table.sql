-- V38: Create warranty_components table
-- Purpose: Store user-configurable warranty components and their periods
-- Author: HOCH Team
-- Date: 2025-01-20

CREATE TABLE IF NOT EXISTS warranty_components (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    component_name VARCHAR(255) NOT NULL,
    warranty_period VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_warranty_components_active (active),
    INDEX idx_warranty_components_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

