-- Move each customer's single flat lead source into one customer_lead_sources row.
--
-- Every INSERT is guarded by NOT EXISTS so a re-run is a no-op (dev uses out-of-order
-- migrations), and every one filters lead_source_type through an explicit whitelist of the
-- Java enum names. That whitelist is load-bearing: lead_source_type is an unconstrained
-- VARCHAR(20) with no CHECK, and copying an unknown value into source_type would make
-- Hibernate throw "No enum constant LeadSourceType.<x>" on every read of that customer --
-- which fails the whole paginated /api/v1/customers list, not just the one record.
--
-- Customers sitting at NONE/NULL with no other data get ZERO rows on purpose: an empty list
-- is how "No Lead" is represented, so the filter for it is NOT EXISTS rather than a marker row.

-- 1) The main case -- one child row per customer that has a real typed source.
--    MANUAL is legacy; V78 already remapped most of it to MANUAL_REFERRAL, this catches any
--    stragglers and carries manual_lead_* across as a fallback for the referral fields.
INSERT INTO customer_lead_sources
    (customer_id, source_type, architect_id, referral_name, referral_contact,
     referral_location, referral_designation, referral_firm, referral_email, sort_order)
SELECT c.id,
       CASE WHEN c.lead_source_type = 'MANUAL' THEN 'MANUAL_REFERRAL' ELSE c.lead_source_type END,
       c.architect_id,
       CASE WHEN c.lead_source_type = 'MANUAL'
            THEN COALESCE(c.referral_name, c.manual_lead_name) ELSE c.referral_name END,
       CASE WHEN c.lead_source_type = 'MANUAL'
            THEN COALESCE(c.referral_contact, c.manual_lead_contact) ELSE c.referral_contact END,
       c.referral_location, c.referral_designation, c.referral_firm, c.referral_email,
       0
FROM customers c
WHERE c.lead_source_type IN ('ARCHITECT', 'MANUAL', 'ONLINE', 'WALK_IN', 'SCOUTING',
                             'BUILDER_REFERRAL', 'MANUAL_REFERRAL', 'CONSULTED')
  AND NOT EXISTS (SELECT 1 FROM customer_lead_sources s WHERE s.customer_id = c.id);

-- 2) Rescue rows that carry an architect link but no usable type. V33 shipped
--    lead_source_type with DEFAULT 'NONE', so a link written before the type was set
--    consistently would otherwise be silently dropped.
INSERT INTO customer_lead_sources (customer_id, source_type, architect_id, sort_order)
SELECT c.id, 'ARCHITECT', c.architect_id, 0
FROM customers c
WHERE c.architect_id IS NOT NULL
  AND (c.lead_source_type IS NULL OR c.lead_source_type = 'NONE')
  AND NOT EXISTS (SELECT 1 FROM customer_lead_sources s WHERE s.customer_id = c.id);

-- 3) Rescue pre-V78 manual leads that never got a type. V78's UPDATE only touched rows where
--    lead_source_type = 'MANUAL', so NULL-typed rows holding manual_lead_name were missed.
INSERT INTO customer_lead_sources
    (customer_id, source_type, referral_name, referral_contact, sort_order)
SELECT c.id, 'MANUAL_REFERRAL', c.manual_lead_name, c.manual_lead_contact, 0
FROM customers c
WHERE (c.lead_source_type IS NULL OR c.lead_source_type = 'NONE')
  AND c.architect_id IS NULL
  AND c.manual_lead_name IS NOT NULL AND c.manual_lead_name <> ''
  AND NOT EXISTS (SELECT 1 FROM customer_lead_sources s WHERE s.customer_id = c.id);

-- Reconciliation, expected to return 0 -- every customer that had a source now has a row:
--   SELECT COUNT(*) FROM customers c
--    WHERE (c.architect_id IS NOT NULL
--           OR (c.lead_source_type IS NOT NULL AND c.lead_source_type <> 'NONE'))
--      AND NOT EXISTS (SELECT 1 FROM customer_lead_sources s WHERE s.customer_id = c.id);
--
-- Deliberately NOT automated here: creating architects rows from free-text referral_name for
-- unlinked ARCHITECT sources. That would fabricate records from unnormalised text, duplicate
-- against existing architects, and is not cleanly reversible. Ops-run report instead:
--   SELECT s.id, s.referral_name, a.id AS architect_id, a.architecture_name
--     FROM customer_lead_sources s
--     JOIN architects a ON TRIM(a.architecture_name) = TRIM(s.referral_name)
--    WHERE s.source_type = 'ARCHITECT' AND s.architect_id IS NULL;
