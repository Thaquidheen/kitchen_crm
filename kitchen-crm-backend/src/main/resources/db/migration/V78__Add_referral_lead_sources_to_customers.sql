-- V78: Add referrer details for Builder Referral / Manual Referral lead sources.
-- lead_source_type is VARCHAR (not a DB enum), so the new values
-- WALK_IN, SCOUTING, BUILDER_REFERRAL, MANUAL_REFERRAL need no schema change.

ALTER TABLE customers
    ADD COLUMN referral_name VARCHAR(255) NULL COMMENT 'Referrer name (builder/manual referral)',
    ADD COLUMN referral_contact VARCHAR(50) NULL COMMENT 'Referrer phone number',
    ADD COLUMN referral_location VARCHAR(255) NULL COMMENT 'Referrer location',
    ADD COLUMN referral_designation VARCHAR(255) NULL COMMENT 'Referrer designation';

-- Migrate legacy "Enter Lead Manually" (MANUAL) records into the new "Manual Referral"
-- type, carrying their name/contact into the referral fields. Old manual_lead_* columns
-- are left intact (non-destructive).
UPDATE customers
SET referral_name = manual_lead_name,
    referral_contact = manual_lead_contact,
    lead_source_type = 'MANUAL_REFERRAL'
WHERE lead_source_type = 'MANUAL';
