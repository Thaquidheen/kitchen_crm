-- Let a reminder belong to an architect/builder, alongside customers and appliance entries.
--
-- Reminders are one table (customer_reminders) discriminated by a `source` enum plus which owner FK
-- is set. V88 added appliance_customer_id the same way; this adds architect_id for the Architects &
-- Builders module. Exactly one owner is set per row, enforced in the service (a DB CHECK across
-- cascading FKs trips MySQL ERROR 3823, per the V88 note).
--
-- The new source value 'ARCHITECT' needs no schema change — `source` is VARCHAR(20) and already
-- accepts it; only the Java enum is extended. Nullable + additive, so the previously deployed jar,
-- which never maps architect_id, keeps working.

ALTER TABLE customer_reminders
    ADD COLUMN architect_id BIGINT NULL,
    ADD CONSTRAINT fk_reminders_architect FOREIGN KEY (architect_id)
        REFERENCES architects (id) ON DELETE CASCADE,
    ADD INDEX idx_reminders_architect (architect_id);
