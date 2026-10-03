-- Staff types + design jobs (designer assignment, queue, notes, notifications).
--
--   users.staff_type        SALES | DESIGNER | ADMIN_STAFF — a label, NOT a login role (roles stay
--                           SUPER_ADMIN / STAFF), so permissions and the previous jar are unaffected.
--   users.designer_status   availability an admin sets for a designer: AVAILABLE | BUSY | ON_LEAVE.
--   design_phase            (existing, empty, already mapped) becomes the design job: one per customer,
--                           assigned to a designer (staff_assigned_id). New columns order the designer's
--                           queue and drive the bell: *_seen_at null = news for that side.
--   design_phase_notes      admin <-> designer note thread on a design job.
--
-- Rollback safety: additive only. Every new column is nullable and unmapped by the previous jar
-- (Hibernate validate ignores unmapped columns and tables); design_status keeps using only values the
-- deployed DesignStatus enum already has. Numbered above V152 (highest applied) on purpose.
ALTER TABLE users
    ADD COLUMN staff_type      VARCHAR(20) NULL COMMENT 'SALES | DESIGNER | ADMIN_STAFF (label, not a role)',
    ADD COLUMN designer_status VARCHAR(20) NULL COMMENT 'Admin-set designer availability: AVAILABLE | BUSY | ON_LEAVE';

ALTER TABLE design_phase
    ADD COLUMN queue_position         INT         NULL COMMENT 'Order in the designer queue, 1 = do first',
    ADD COLUMN due_date               DATE        NULL,
    ADD COLUMN priority               VARCHAR(20) NULL COMMENT 'LOW | MEDIUM | HIGH | URGENT',
    ADD COLUMN assigned_at            DATETIME    NULL,
    ADD COLUMN assigned_by_user_id    BIGINT      NULL,
    ADD COLUMN started_at             DATETIME    NULL,
    ADD COLUMN completed_at           DATETIME    NULL COMMENT 'Designer marked the design complete',
    ADD COLUMN completion_seen_at     DATETIME    NULL COMMENT 'Admin has seen the completion (null = news for admin)',
    ADD COLUMN designer_seen_at       DATETIME    NULL COMMENT 'Designer has seen the assignment / latest change (null = news)',
    ADD COLUMN admin_notes_seen_at    DATETIME    NULL COMMENT 'Admin last read the designer''s notes',
    ADD COLUMN designer_notes_seen_at DATETIME    NULL COMMENT 'Designer last read the admin''s notes';

CREATE INDEX idx_design_phase_queue ON design_phase (staff_assigned_id, design_status, queue_position);

CREATE TABLE design_phase_notes (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    design_phase_id BIGINT       NOT NULL,
    author_user_id  BIGINT       NULL COMMENT 'Writer (no FK, so deleting staff is never blocked by notes)',
    author_name     VARCHAR(255) NULL,
    from_designer   BOOLEAN      NOT NULL COMMENT 'true = the assigned designer wrote it, false = admin',
    message         TEXT         NOT NULL,
    created_at      DATETIME     NOT NULL,
    CONSTRAINT fk_dpn_design_phase FOREIGN KEY (design_phase_id) REFERENCES design_phase (id) ON DELETE CASCADE,
    INDEX idx_dpn_phase_created (design_phase_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Admin <-> designer notes on a design job';
