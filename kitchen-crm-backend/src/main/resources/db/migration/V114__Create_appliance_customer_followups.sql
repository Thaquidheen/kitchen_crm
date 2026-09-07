-- Appliance & Quartz: an append-only follow-up (call) history plus a denormalised "last called" stamp.
--
-- appliance_customer_followups is one row per call, mirroring architect_notes (V111): the existing
-- appliance_customers.notes column is overwritten on every edit, so it cannot serve as a history.
-- called_at is the user-entered call time (DATETIME, naive business-timezone wall-clock like
-- customer_reminders.remind_at). appliance_customers.last_called_at is MAX(called_at) maintained by
-- the service on every add/delete, the same way architects.last_visit_date is kept, so the list
-- can show and sort by it without a join. No CHECK constraints (MySQL 3823, see V88).
--
-- All additive: a new table plus one nullable column. The previously deployed jar maps neither, so
-- it validates and runs unchanged against this schema — rollback stays jar-only.

CREATE TABLE appliance_customer_followups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appliance_customer_id BIGINT NOT NULL,
    called_at DATETIME NOT NULL COMMENT 'When the customer was called (user-entered, business timezone)',
    note TEXT NOT NULL,
    created_by VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appliance_followups_customer FOREIGN KEY (appliance_customer_id)
        REFERENCES appliance_customers (id) ON DELETE CASCADE,
    INDEX idx_appliance_followups_customer_called (appliance_customer_id, called_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE appliance_customers
    ADD COLUMN last_called_at DATETIME NULL COMMENT 'MAX(called_at), maintained by the service';
