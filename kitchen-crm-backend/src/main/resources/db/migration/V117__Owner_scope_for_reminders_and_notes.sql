-- Private-by-creator for reminders and notes: a staff member sees only what they created;
-- a super admin sees everything and can filter by staff.
--
-- Each of these tables already stored `created_by` as the user's DISPLAY NAME, which is not
-- unique and changes when a user is renamed - too weak to gate visibility on. This adds a real
-- FK to users and backfills it by matching that name, which is exact here (only a handful of
-- users, all distinct names).
--
-- Additive and rollback-safe: every column is nullable with no default, nothing is renamed or
-- dropped, and the previously deployed jar neither reads nor writes these columns - Hibernate
-- validate ignores columns an entity does not map. Rollback stays jar-only.

ALTER TABLE customer_reminders
    ADD COLUMN created_by_user_id BIGINT NULL COMMENT 'Creator; NULL = legacy row, visible to super admin only';
ALTER TABLE architect_notes
    ADD COLUMN created_by_user_id BIGINT NULL COMMENT 'Creator; NULL = legacy row, visible to super admin only';
ALTER TABLE appliance_customer_followups
    ADD COLUMN created_by_user_id BIGINT NULL COMMENT 'Creator; NULL = legacy row, visible to super admin only';
ALTER TABLE customer_followups
    ADD COLUMN created_by_user_id BIGINT NULL COMMENT 'Creator; NULL = legacy row, visible to super admin only';

-- Every read path filters on the creator, so each table needs it indexed.
CREATE INDEX idx_customer_reminders_creator ON customer_reminders (created_by_user_id);
CREATE INDEX idx_architect_notes_creator ON architect_notes (created_by_user_id);
CREATE INDEX idx_appliance_followups_creator ON appliance_customer_followups (created_by_user_id);
CREATE INDEX idx_customer_followups_creator ON customer_followups (created_by_user_id);

-- Backfill from the stored display name, but ONLY where that name maps to exactly one user.
-- An ambiguous or unknown name leaves NULL, which reads as "legacy, super admin only" rather
-- than being guessed at and handed to the wrong person.
UPDATE customer_reminders r
    JOIN (SELECT name, MIN(id) AS uid FROM users GROUP BY name HAVING COUNT(*) = 1) u
      ON u.name = r.created_by
SET r.created_by_user_id = u.uid
WHERE r.created_by IS NOT NULL AND r.created_by_user_id IS NULL;

UPDATE architect_notes n
    JOIN (SELECT name, MIN(id) AS uid FROM users GROUP BY name HAVING COUNT(*) = 1) u
      ON u.name = n.created_by
SET n.created_by_user_id = u.uid
WHERE n.created_by IS NOT NULL AND n.created_by_user_id IS NULL;

UPDATE appliance_customer_followups f
    JOIN (SELECT name, MIN(id) AS uid FROM users GROUP BY name HAVING COUNT(*) = 1) u
      ON u.name = f.created_by
SET f.created_by_user_id = u.uid
WHERE f.created_by IS NOT NULL AND f.created_by_user_id IS NULL;

UPDATE customer_followups f
    JOIN (SELECT name, MIN(id) AS uid FROM users GROUP BY name HAVING COUNT(*) = 1) u
      ON u.name = f.created_by
SET f.created_by_user_id = u.uid
WHERE f.created_by IS NOT NULL AND f.created_by_user_id IS NULL;
