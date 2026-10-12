-- Quotations of customers who are already Lost.
--
-- Since V158's release, marking a customer Lost cancels that customer's open quotations. Customers
-- marked Lost before that still carry open quotations (Draft, On Hold, Completed); this brings them
-- in line once. Approved quotations are left alone, as the application leaves them.
--
-- Rollback safety: data only, no schema change; CANCELLED is a status every earlier version knows.

UPDATE quotations q
SET q.status = 'CANCELLED'
WHERE q.customer_id IN (SELECT c.id FROM customers c WHERE c.status = 'LOST')
  AND (q.status IS NULL OR q.status IN ('DRAFT', 'ON_HOLD', 'COMPLETE'));
