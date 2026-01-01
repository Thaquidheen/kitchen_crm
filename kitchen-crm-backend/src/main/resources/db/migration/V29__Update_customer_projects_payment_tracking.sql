-- V29: Update customer_projects table for proper payment tracking
-- Rename existing fields and add new fields for commitment and received tracking

-- Step 1: Rename existing fields to clarify purpose
ALTER TABLE customer_projects
    CHANGE COLUMN cash_in_hand committed_in_hand DECIMAL(12,2) DEFAULT 0 COMMENT 'Amount customer committed to pay in cash',
    CHANGE COLUMN cash_in_account committed_in_account DECIMAL(12,2) DEFAULT 0 COMMENT 'Amount customer committed to pay via account';

-- Step 2: Add new fields for tracking received amounts
ALTER TABLE customer_projects
    ADD COLUMN received_in_hand DECIMAL(12,2) DEFAULT 0 COMMENT 'Actual cash payments received from customer',
    ADD COLUMN received_in_account DECIMAL(12,2) DEFAULT 0 COMMENT 'Actual account payments received from customer';

-- Step 3: Add computed columns for balances
-- Note: MySQL computed columns are supported in MySQL 5.7+
ALTER TABLE customer_projects
    ADD COLUMN balance_in_hand DECIMAL(12,2) GENERATED ALWAYS AS (committed_in_hand - received_in_hand) STORED COMMENT 'Balance customer owes in cash',
    ADD COLUMN balance_in_account DECIMAL(12,2) GENERATED ALWAYS AS (committed_in_account - received_in_account) STORED COMMENT 'Balance customer owes in account',
    ADD COLUMN total_balance DECIMAL(12,2) GENERATED ALWAYS AS ((committed_in_hand - received_in_hand) + (committed_in_account - received_in_account)) STORED COMMENT 'Total balance customer owes';

-- Step 4: Update total_amount to be based on commitment (if not already)
-- Note: We'll keep total_amount as a regular column since it may come from quotation
-- and might be set before commitment breakdown is decided

-- Step 5: Add profit calculation (existing received_amount_total and total_expense)
ALTER TABLE customer_projects
    ADD COLUMN profit_amount DECIMAL(12,2) GENERATED ALWAYS AS (received_amount_total - total_expense) STORED COMMENT 'Current profit (received - expenses)';

-- Step 6: Add indexes for better query performance
CREATE INDEX idx_customer_projects_balance ON customer_projects(total_balance);
CREATE INDEX idx_customer_projects_profit ON customer_projects(profit_amount);

-- Step 7: Add comments to existing columns for clarity
ALTER TABLE customer_projects
    MODIFY COLUMN received_amount_total DECIMAL(12,2) DEFAULT 0 COMMENT 'Total amount received from customer (sum of hand + account)',
    MODIFY COLUMN total_expense DECIMAL(12,2) DEFAULT 0 COMMENT 'Total expenses paid to vendors',
    MODIFY COLUMN total_amount DECIMAL(12,2) COMMENT 'Total project amount (should equal committed_in_hand + committed_in_account)';
