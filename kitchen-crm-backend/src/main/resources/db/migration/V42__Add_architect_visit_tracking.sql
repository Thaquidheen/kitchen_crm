-- V42: Add visit tracking to architects module

-- Add last_visit_date column to architects table
ALTER TABLE architects 
ADD COLUMN last_visit_date TIMESTAMP NULL COMMENT 'Date of the most recent visit';

-- Create architect_visits table for visit history
CREATE TABLE architect_visits (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    architect_id BIGINT NOT NULL COMMENT 'Reference to architect',
    visit_date TIMESTAMP NOT NULL COMMENT 'Date and time of the visit',
    notes TEXT COMMENT 'Notes about the visit',
    visited_by VARCHAR(100) COMMENT 'Name of person who visited',
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- Foreign key constraint
    CONSTRAINT fk_architect_visits_architect 
        FOREIGN KEY (architect_id) REFERENCES architects(id) 
        ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_architect_visits_architect_id (architect_id),
    INDEX idx_architect_visits_visit_date (visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Visit history for architects';







