-- Appliance & Quartz entries now follow the same sales pipeline as kitchen customers:
-- Lead -> Potential -> Quotation -> Negotiation -> Confirmed (or Lost), replacing the
-- old fulfilment-oriented ENQUIRY/ORDERED/DELIVERED set.

-- 1. Widen the enum so old and new values coexist while the rows are remapped.
ALTER TABLE appliance_customers
    MODIFY COLUMN status ENUM('ENQUIRY', 'ORDERED', 'DELIVERED',
                              'LEAD', 'POTENTIAL', 'QUOTATION', 'NEGOTIATION', 'CONFIRMED', 'LOST')
    NOT NULL DEFAULT 'ENQUIRY';

-- 2. Remap existing rows. An enquiry is an untouched lead; anything already ordered or
--    delivered is a won deal, so both collapse to CONFIRMED.
UPDATE appliance_customers SET status = 'LEAD'      WHERE status = 'ENQUIRY';
UPDATE appliance_customers SET status = 'CONFIRMED' WHERE status IN ('ORDERED', 'DELIVERED');

-- 3. Narrow to the final pipeline set.
ALTER TABLE appliance_customers
    MODIFY COLUMN status ENUM('LEAD', 'POTENTIAL', 'QUOTATION', 'NEGOTIATION', 'CONFIRMED', 'LOST')
    NOT NULL DEFAULT 'LEAD';
