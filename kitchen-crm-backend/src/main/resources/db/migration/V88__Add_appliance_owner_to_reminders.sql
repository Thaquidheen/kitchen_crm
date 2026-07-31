-- Reminders can now belong to an Appliance & Quartz entry as well as to a customer.
-- Exactly one owner is set; the other column is NULL. customer_id therefore becomes
-- nullable, and a second nullable FK is added alongside it.
--
-- MySQL cannot express "exactly one of two columns is non-null" portably before 8.0.16
-- CHECK enforcement, so the invariant is enforced in the service layer
-- (CustomerReminderServiceImpl) rather than by a constraint here.

ALTER TABLE customer_reminders
    MODIFY COLUMN customer_id BIGINT NULL;

ALTER TABLE customer_reminders
    ADD COLUMN appliance_customer_id BIGINT NULL AFTER customer_id;

ALTER TABLE customer_reminders
    ADD CONSTRAINT fk_customer_reminders_appliance
        FOREIGN KEY (appliance_customer_id) REFERENCES appliance_customers(id) ON DELETE CASCADE;

CREATE INDEX idx_customer_reminders_appliance ON customer_reminders (appliance_customer_id);
