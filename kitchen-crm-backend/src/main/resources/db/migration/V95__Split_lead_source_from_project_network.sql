-- "Lead source" was doing two jobs at once: recording how a customer found us (one choice) and
-- recording who is involved in the project (several people). They are now separate fields.
--
-- The channel goes back to customers.lead_source_type, which V92 demoted to a mirror.
-- customer_lead_sources keeps the people, and is read through the CustomerProjectNetworkMember
-- entity from here on.
--
-- NOTHING IS RENAMED, DELIBERATELY. Production runs ddl-auto: validate, and the rollback path is
-- "new schema + previous jar" (Flyway has no down migrations). That jar maps
-- @Table(name = "customer_lead_sources") with an @Enumerated source_type, so renaming the table
-- or the column would stop it booting — the exact failure the nine dead columns kept on
-- `customers` exist to avoid. For the same reason the values written here stay inside the
-- previous jar's enum: REFERRAL is persisted under its old spelling MANUAL_REFERRAL and mapped
-- back by CustomerProjectNetworkMember.MemberTypeConverter.

-- The V92 mirror only ever copied the FIRST row, so a customer whose channel row was not first
-- has it recorded nowhere else. Promote it before deleting anything. Customers whose scalar is
-- already set keep it — that is the value the old UI showed them.
UPDATE customers c
  JOIN (
        SELECT ls.customer_id, MIN(ls.sort_order) AS first_order
          FROM customer_lead_sources ls
         WHERE ls.source_type IN ('ONLINE', 'WALK_IN', 'SCOUTING')
         GROUP BY ls.customer_id
       ) pick ON pick.customer_id = c.id
  JOIN customer_lead_sources src
    ON src.customer_id = pick.customer_id AND src.sort_order = pick.first_order
   SET c.lead_source_type = src.source_type
 WHERE c.lead_source_type IS NULL OR c.lead_source_type = 'NONE';

-- Rows whose type describes a channel rather than a person do not belong in the network. Every
-- one of them is a bare marker — none carries an architect link or any referrer text — and the
-- value now lives on customers.lead_source_type, so nothing is lost. Deleting rows (rather than
-- changing their shape) is also safe for the previous jar: it simply shows fewer entries.
DELETE FROM customer_lead_sources
 WHERE source_type NOT IN ('ARCHITECT', 'BUILDER', 'MANUAL_REFERRAL', 'BUILDER_REFERRAL', 'CONSULTED', 'MANUAL');

-- The free-text types were only ever "some person who referred them". Collapse them onto
-- MANUAL_REFERRAL, which is what MemberType.REFERRAL persists as.
UPDATE customer_lead_sources
   SET source_type = 'MANUAL_REFERRAL'
 WHERE source_type IN ('BUILDER_REFERRAL', 'CONSULTED', 'MANUAL');

-- A linked row whose architect has since been deleted (the FK is ON DELETE SET NULL) would
-- render as a nameless entry the form then refuses to save. Demote those to a referral where
-- there is text to show, and drop the rest.
UPDATE customer_lead_sources
   SET source_type = 'MANUAL_REFERRAL'
 WHERE source_type IN ('ARCHITECT', 'BUILDER')
   AND architect_id IS NULL
   AND referral_name IS NOT NULL AND referral_name <> '';

DELETE FROM customer_lead_sources
 WHERE source_type IN ('ARCHITECT', 'BUILDER')
   AND architect_id IS NULL;

-- The channel is filtered by an exact match now, so the stored values have to be ones the form
-- offers. BUILDER_REFERRAL is what the V92 mirror wrote for a builder (the jar of the day had no
-- BUILDER constant) and MANUAL is the pre-V33 spelling of MANUAL_REFERRAL; both mean the same
-- channel as the value that replaced them. All three remain valid in the previous jar's enum.
UPDATE customers SET lead_source_type = 'BUILDER'         WHERE lead_source_type = 'BUILDER_REFERRAL';
UPDATE customers SET lead_source_type = 'MANUAL_REFERRAL' WHERE lead_source_type = 'MANUAL';
UPDATE customers SET lead_source_type = 'NONE'            WHERE lead_source_type IS NULL;
