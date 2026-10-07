-- Permissions the administrator sets per staff type (Settings > Permissions).
--
-- One row per (staff type, permission) the administrator has decided on. A permission with no
-- row uses its built-in default, so a permission added later needs no migration and nothing
-- changes for anyone until the administrator touches it.
--
--   staff_type      ADMIN_STAFF | DESIGNER | SALES | NONE (staff whose type is not set)
--   permission_key  e.g. customers.delete — the catalogue lives in the application
--
-- Super admins are not in this table: they always have every permission.
--
-- Rollback safety: additive only, numbered above V156 (highest applied). A new table the previous
-- jar has no entity for, so it validates and runs unchanged against this schema.

CREATE TABLE staff_type_permissions (
    id                 BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    staff_type         VARCHAR(20)  NOT NULL,
    permission_key     VARCHAR(60)  NOT NULL,
    allowed            BOOLEAN      NOT NULL,
    updated_by_user_id BIGINT       NULL,
    updated_by_name    VARCHAR(255) NULL,
    updated_at         DATETIME     NOT NULL,
    CONSTRAINT uk_staff_type_permission UNIQUE (staff_type, permission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='What each staff type may do, as set by the administrator';
