-- Who brought in a design file, by account rather than by display name.
--
-- Admin staff may take back a design file they brought in themselves while its version is being
-- worked on. That was decided by comparing display names, which are not unique and can be changed.
-- New uploads now record the uploader's user id; older files keep the name comparison.
--
-- Rollback safety: one nullable column added, nothing renamed; earlier versions do not read it.

ALTER TABLE design_phase_files ADD COLUMN uploaded_by_user_id BIGINT NULL;
