-- Lead-source details panel gains Firm name and Email (Architect/Builder/Consulted/Manual
-- sources all share the referral_* fields). lead_source_type is VARCHAR, so the new
-- CONSULTED value needs no schema change.
ALTER TABLE customers
    ADD COLUMN referral_firm VARCHAR(255) NULL,
    ADD COLUMN referral_email VARCHAR(255) NULL;
