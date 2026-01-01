-- V15__Create_customer_projects_table.sql
-- Create customer_projects table for tracking project financials

CREATE TABLE IF NOT EXISTS customer_projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    quotation_id BIGINT NULL,
    project_name VARCHAR(255) NULL,

    -- Amounts
    total_amount DECIMAL(12,2) DEFAULT 0,
    total_tax_amount DECIMAL(12,2) DEFAULT 0,

    -- Commitment (what customer promised)
    committed_in_hand DECIMAL(12,2) DEFAULT 0,
    committed_in_account DECIMAL(12,2) DEFAULT 0,

    -- Received (what customer paid)
    received_in_hand DECIMAL(12,2) DEFAULT 0,
    received_in_account DECIMAL(12,2) DEFAULT 0,
    received_amount_total DECIMAL(12,2) DEFAULT 0,

    -- Computed balance columns
    balance_in_hand DECIMAL(12,2) GENERATED ALWAYS AS (committed_in_hand - received_in_hand) STORED,
    balance_in_account DECIMAL(12,2) GENERATED ALWAYS AS (committed_in_account - received_in_account) STORED,
    total_balance DECIMAL(12,2) GENERATED ALWAYS AS ((committed_in_hand - received_in_hand) + (committed_in_account - received_in_account)) STORED,

    -- Expenses
    total_expense DECIMAL(12,2) DEFAULT 0,

    -- Computed profit
    profit_amount DECIMAL(12,2) GENERATED ALWAYS AS (received_amount_total - total_expense) STORED,

    -- Status and dates
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    start_date DATE NULL,
    expected_completion_date DATE NULL,
    actual_completion_date DATE NULL,
    project_description TEXT NULL,
    created_by VARCHAR(255) NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_project_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL,

    -- Indexes
    INDEX idx_projects_customer (customer_id),
    INDEX idx_projects_quotation (quotation_id),
    INDEX idx_projects_status (status)
);
