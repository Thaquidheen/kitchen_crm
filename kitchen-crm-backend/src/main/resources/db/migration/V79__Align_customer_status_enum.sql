-- V79: Align the customers.status DB enum with the Java CustomerStatus enum.
-- Previously the column was ENUM('LEAD','POTENTIAL','PLANNING','CONFIRMED') (V55) while the
-- entity uses 8 values, so statuses like DESIGN_STAGE/QUOTE_GIVEN/FOLLOW_UP/NEGOTIATIONS/LOST
-- were rejected under STRICT_TRANS_TABLES. All existing rows are LEAD/POTENTIAL/CONFIRMED
-- (no PLANNING present), so widening the enum is safe with no data remap.

ALTER TABLE customers
    MODIFY COLUMN status
        ENUM('LEAD','POTENTIAL','DESIGN_STAGE','QUOTE_GIVEN','FOLLOW_UP','NEGOTIATIONS','CONFIRMED','LOST')
        NOT NULL DEFAULT 'LEAD';
