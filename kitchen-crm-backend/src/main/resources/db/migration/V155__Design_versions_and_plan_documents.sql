-- Design versions (redesign after approval) and plan documents for the designer.
--
--   design_phase.current_version    version being worked on, or the last one approved (NULL = 1)
--   design_phase_files.version_no   the design version a file belongs to (NULL = 1)
--   design_phase_notes.version_no   the design version a note was written under (NULL = 1)
--   design_phase_versions           one row per version of a customer's design: who made it (a
--                                   designer, or uploaded as an already existing design), what
--                                   was asked for, when it was completed and approved.
--
-- Plan documents (what the admin hands to the designer) are rows of design_phase_files with the
-- existing file_category value PLAN; the designer's own output keeps DESIGN.
--
-- Rollback safety: additive only, numbered above V154 (highest applied). customers.status and
-- design_phase.design_status keep using only values the deployed jar already has. The previous
-- jar ignores the new columns and table; a design it creates meanwhile simply has no version row,
-- and the new code creates that row the first time it touches the design.

ALTER TABLE design_phase
    ADD COLUMN current_version INT NULL COMMENT 'Version in work or last approved; NULL = 1';

ALTER TABLE design_phase_files
    ADD COLUMN version_no INT NULL COMMENT 'Design version this file belongs to; NULL = 1';

ALTER TABLE design_phase_notes
    ADD COLUMN version_no INT NULL COMMENT 'Design version this note was written under; NULL = 1';

CREATE TABLE design_phase_versions (
    id                   BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    design_phase_id      BIGINT       NOT NULL,
    version_no           INT          NOT NULL,
    origin               VARCHAR(20)  NOT NULL COMMENT 'DESIGNER = made by an assigned designer, UPLOADED = existing design uploaded',
    designer_user_id     BIGINT       NULL COMMENT 'No FK, so deleting staff is never blocked by history',
    designer_name        VARCHAR(255) NULL,
    request_note         TEXT         NULL COMMENT 'Brief for version 1, what to change for later versions',
    requested_by_user_id BIGINT       NULL,
    requested_by_name    VARCHAR(255) NULL,
    requested_at         DATETIME     NOT NULL,
    completed_at         DATETIME     NULL COMMENT 'Designer marked it complete',
    approved_at          DATETIME     NULL COMMENT 'NULL = not approved (still open, or cancelled)',
    approved_by_user_id  BIGINT       NULL,
    approved_by_name     VARCHAR(255) NULL,
    CONSTRAINT fk_dpv_design_phase FOREIGN KEY (design_phase_id) REFERENCES design_phase (id) ON DELETE CASCADE,
    UNIQUE KEY uq_dpv_phase_version (design_phase_id, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='One row per version of a customer design';

-- Every design that already exists is version 1 of itself.
INSERT INTO design_phase_versions
    (design_phase_id, version_no, origin, designer_user_id, designer_name, request_note,
     requested_by_user_id, requested_at, completed_at, approved_at)
SELECT d.id, 1, 'DESIGNER', d.staff_assigned_id, u.name, d.design_requirements,
       d.assigned_by_user_id, COALESCE(d.assigned_at, d.created_at, NOW()), d.completed_at,
       CASE WHEN d.design_status IN ('APPROVED_BY_ADMIN', 'SUBMITTED', 'FEEDBACK_RECEIVED', 'APPROVED', 'FROZEN')
            THEN COALESCE(d.completed_at, d.updated_at) END
FROM design_phase d
LEFT JOIN users u ON u.id = d.staff_assigned_id;
