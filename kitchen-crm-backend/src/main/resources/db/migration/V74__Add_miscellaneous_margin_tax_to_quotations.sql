-- Add miscellaneous (other expenses) margin and tax percentage columns to quotations
ALTER TABLE quotations ADD COLUMN miscellaneous_margin_percentage DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE quotations ADD COLUMN miscellaneous_tax_percentage DECIMAL(5,2) DEFAULT 18.00;
