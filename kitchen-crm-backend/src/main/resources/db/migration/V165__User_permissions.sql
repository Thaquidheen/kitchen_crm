-- Permissions the administrator sets for one person, on top of their staff type (Permissions >
-- One person).
--
-- One row per (person, permission) the administrator decided differently for that person. A
-- permission with no row follows the person's staff type (staff_type_permissions, then the built-in
-- default), so a person with no rows has exactly what their staff type has. Taking a row away puts
-- the person back on their staff type for that permission.
--
--   user_id         the staff member; their rows go when the account is deleted for good
--   permission_key  e.g. designs.view — the catalogue lives in the application
--
-- A row for a permission that no longer applies to the person's staff type (their type changed) is
-- kept but ignored, so changing the type back brings it back. Super admins are not in this table:
-- they always have every permission.
--
-- Rollback safety: additive only, numbered above V164 (highest applied). A new table the previous
-- jar has no entity for, so it validates and runs unchanged against this schema. The foreign key
-- cascades, so the previous jar's "delete staff for good" still works: it takes these rows with it.
-- The previous jar never reads this table, though: rolled back, everyone gets their staff type's
-- permissions again (a person limited here is no longer limited) until this version is back.

CREATE TABLE user_permissions (
    id                 BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id            BIGINT       NOT NULL,
    permission_key     VARCHAR(60)  NOT NULL,
    allowed            BOOLEAN      NOT NULL,
    updated_by_user_id BIGINT       NULL,
    updated_by_name    VARCHAR(255) NULL,
    updated_at         DATETIME     NOT NULL,
    CONSTRAINT uk_user_permission UNIQUE (user_id, permission_key),
    CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Permissions set for one person on top of their staff type';
