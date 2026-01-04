-- Update customer status enum from (LEAD, PROSPECT, ACTIVE, COMPLETED, INACTIVE)
-- to (LEAD, POTENTIAL, PLANNING, CONFIRMED)

-- First, convert existing statuses to the new values
UPDATE customers SET status = 'POTENTIAL' WHERE status = 'PROSPECT';
UPDATE customers SET status = 'PLANNING' WHERE status = 'ACTIVE';
UPDATE customers SET status = 'CONFIRMED' WHERE status = 'COMPLETED';
-- Map INACTIVE to LEAD as a fallback
UPDATE customers SET status = 'LEAD' WHERE status = 'INACTIVE';

-- Also update workflow_history table if it has status values
UPDATE workflow_history SET previous_state = 'POTENTIAL' WHERE previous_state = 'PROSPECT';
UPDATE workflow_history SET previous_state = 'PLANNING' WHERE previous_state = 'ACTIVE';
UPDATE workflow_history SET previous_state = 'CONFIRMED' WHERE previous_state = 'COMPLETED';
UPDATE workflow_history SET previous_state = 'LEAD' WHERE previous_state = 'INACTIVE';

UPDATE workflow_history SET new_state = 'POTENTIAL' WHERE new_state = 'PROSPECT';
UPDATE workflow_history SET new_state = 'PLANNING' WHERE new_state = 'ACTIVE';
UPDATE workflow_history SET new_state = 'CONFIRMED' WHERE new_state = 'COMPLETED';
UPDATE workflow_history SET new_state = 'LEAD' WHERE new_state = 'INACTIVE';

-- Alter the enum type for the status column
ALTER TABLE customers MODIFY COLUMN status ENUM('LEAD', 'POTENTIAL', 'PLANNING', 'CONFIRMED') DEFAULT 'LEAD';
