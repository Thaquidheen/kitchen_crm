-- A star on a customer, like the one on architects (V111): the team marks priority customers;
-- starred customers stay at the top of the customers list.
--
-- Rollback safety: additive only, numbered above V159 (highest applied). A new column with a
-- default; the previous jar has no field for it and validates and runs unchanged.

ALTER TABLE customers
    ADD COLUMN highlighted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Starred: a priority customer, kept at the top of the list';

CREATE INDEX idx_customers_highlighted ON customers (highlighted);
