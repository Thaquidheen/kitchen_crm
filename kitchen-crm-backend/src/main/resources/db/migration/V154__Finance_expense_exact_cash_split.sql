-- Expense lines can now carry the exact cash-in-hand rupee amount instead of only a percentage.
-- NULL = the line is split by its percentages (every existing row stays that way).
-- Additive and nullable: the previous jar ignores the column and keeps using the percentages,
-- which are still written for every line.

ALTER TABLE finance_expenses
    ADD COLUMN cash_in_hand_amount DECIMAL(14,2) NULL AFTER cash_in_account_pct;
