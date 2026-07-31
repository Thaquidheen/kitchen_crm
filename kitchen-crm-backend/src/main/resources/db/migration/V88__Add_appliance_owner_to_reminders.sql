-- Reminders can now belong to an Appliance & Quartz entry as well as to a customer.
-- Exactly one owner is set; the other column is NULL. customer_id therefore becomes
-- nullable, and a second nullable FK is added alongside it.
--
-- The "exactly one owner" invariant is enforced in the service layer
-- (CustomerReminderServiceImpl), NOT by a CHECK constraint here. Do not add one: MySQL
-- rejects a CHECK on a column that a foreign key uses in a referential action
-- (ERROR 3823), and both owner FKs below are ON DELETE CASCADE.

ALTER TABLE customer_reminders
    MODIFY COLUMN customer_id BIGINT NULL;

ALTER TABLE customer_reminders
    ADD COLUMN appliance_customer_id BIGINT NULL AFTER customer_id;

ALTER TABLE customer_reminders
    ADD CONSTRAINT fk_customer_reminders_appliance
        FOREIGN KEY (appliance_customer_id) REFERENCES appliance_customers(id) ON DELETE CASCADE;

CREATE INDEX idx_customer_reminders_appliance ON customer_reminders (appliance_customer_id);
