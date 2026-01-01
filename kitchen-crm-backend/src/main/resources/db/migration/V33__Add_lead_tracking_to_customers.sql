-- V33: Add lead tracking fields to customers table

ALTER TABLE customers
    ADD COLUMN architect_id BIGINT NULL COMMENT 'Reference to architect if lead came from architect',
    ADD COLUMN lead_source_type VARCHAR(20) DEFAULT 'NONE' COMMENT 'Source type: NONE, ARCHITECT, MANUAL',
    ADD COLUMN manual_lead_name VARCHAR(255) NULL COMMENT 'Manual lead name if not from architect',
    ADD COLUMN manual_lead_contact VARCHAR(20) NULL COMMENT 'Manual lead contact number if not from architect',
    
    ADD INDEX idx_customers_architect (architect_id),
    ADD INDEX idx_customers_lead_source (lead_source_type),
    
    ADD CONSTRAINT fk_customers_architect
        FOREIGN KEY (architect_id)
        REFERENCES architects(id)
        ON DELETE SET NULL;




