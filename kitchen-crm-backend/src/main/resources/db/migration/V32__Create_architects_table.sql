-- V32: Create architects table for managing architecture firms and architects

CREATE TABLE architects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    architecture_name VARCHAR(255) NOT NULL COMMENT 'Architecture name/firm name',
    firm VARCHAR(255) COMMENT 'Firm name',
    contact_number VARCHAR(20) COMMENT 'Contact phone number',
    principal_architect_name VARCHAR(255) COMMENT 'Principal architect name',
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- Indexes
    INDEX idx_architects_name (architecture_name),
    INDEX idx_architects_firm (firm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Architects and architecture firms';




