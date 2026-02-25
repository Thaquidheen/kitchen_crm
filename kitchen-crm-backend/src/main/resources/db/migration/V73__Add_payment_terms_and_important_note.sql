ALTER TABLE quotations ADD COLUMN important_note TEXT;
ALTER TABLE quotations ADD COLUMN payment_acceptance_pct DECIMAL(5,2) DEFAULT 60;
ALTER TABLE quotations ADD COLUMN payment_delivery_pct DECIMAL(5,2) DEFAULT 30;
ALTER TABLE quotations ADD COLUMN payment_installation_pct DECIMAL(5,2) DEFAULT 10;
