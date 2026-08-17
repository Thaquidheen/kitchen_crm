-- Expense lines carried only a free-text title while releases carried a vendor FK, so the two
-- sides of a vendor's money could never be compared. Optional vendor on the expense line closes
-- the loop: expensed-vs-released balances become derivable per vendor (per customer finance).
--
-- Nullable on purpose — existing rows have no vendor, and titles like "Installation" or
-- "Incentive" are not vendor purchases. Additive only: the previous jar does not map this
-- column, so a jar-only rollback still boots under ddl-auto: validate.

ALTER TABLE finance_expenses
    ADD COLUMN vendor_id BIGINT NULL,
    ADD CONSTRAINT fk_fin_expenses_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id)
        ON DELETE SET NULL,
    ADD INDEX idx_fin_expenses_vendor (vendor_id);
