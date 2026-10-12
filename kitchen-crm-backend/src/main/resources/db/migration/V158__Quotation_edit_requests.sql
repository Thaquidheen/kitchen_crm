-- Requests to reopen a completed quotation.
--
-- Staff who may not change a quotation's status ask the admin to put a completed quotation back
-- to Draft so they can edit it. One row per request; the admin approves or refuses it.
--
--   status   PENDING | APPROVED | REFUSED | DONE (plain text, not an ENUM); DONE = approved,
--            edited and marked completed again
--   requester_seen_at   NULL on a decided row = news for the person who asked
--   quotation_id        no FK: deleting a quotation must never be blocked by this history
--
-- Rollback safety: additive only, numbered above V157 (highest applied). A new table the previous
-- jar has no entity for, so it validates and runs unchanged against this schema.

CREATE TABLE quotation_edit_requests (
    id                   BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    quotation_id         BIGINT       NOT NULL,
    requested_by_user_id BIGINT       NOT NULL,
    requested_by_name    VARCHAR(255) NULL,
    reason               VARCHAR(500) NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    decided_by_user_id   BIGINT       NULL,
    decided_by_name      VARCHAR(255) NULL,
    decided_at           DATETIME     NULL,
    decision_note        VARCHAR(500) NULL,
    requester_seen_at    DATETIME     NULL,
    created_at           DATETIME     NOT NULL,
    updated_at           DATETIME     NULL,
    INDEX idx_qer_quotation (quotation_id, status),
    INDEX idx_qer_requester (requested_by_user_id, status),
    INDEX idx_qer_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Requests to reopen a completed quotation for editing';
