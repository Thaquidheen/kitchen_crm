-- Fields from the sales Excel tracker that were missing on customers:
-- SQFT, PLACE, CONTACTING PERSON AND DESIGNATION, FOLLOW UP NOTES.
ALTER TABLE customers
    ADD COLUMN sqft VARCHAR(100) NULL,
    ADD COLUMN place VARCHAR(255) NULL,
    ADD COLUMN contact_person VARCHAR(255) NULL,
    ADD COLUMN follow_up_notes TEXT NULL;
