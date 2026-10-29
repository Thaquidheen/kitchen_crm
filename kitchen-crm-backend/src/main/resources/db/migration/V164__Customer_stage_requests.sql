-- Requests to move a customer back from Follow Up.
--
-- Staff who want a Follow Up customer back in Design Stage or Quotation Stage ask the admin; the
-- admin approves (the customer moves, continuing with their design or quotation) or refuses.
-- One row per request.
--
--   from_stage / to_stage   customer stage names (plain text, not an ENUM)
--   status                  PENDING | APPROVED | REFUSED | CANCELLED (plain text, not an ENUM)
--   requester_seen_at       NULL on a decided row = news for the person who asked
--
-- Rollback safety: additive only. A new table the previous jar has no entity for, so it validates
-- and runs unchanged against this schema.

CREATE TABLE customer_stage_requests (
    id                   BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    customer_id          BIGINT       NOT NULL,
    from_stage           VARCHAR(32)  NOT NULL,
    to_stage             VARCHAR(32)  NOT NULL,
    reason               VARCHAR(500) NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    requested_by_user_id BIGINT       NOT NULL,
    requested_by_name    VARCHAR(255) NULL,
    decided_by_user_id   BIGINT       NULL,
    decided_by_name      VARCHAR(255) NULL,
    decided_at           DATETIME     NULL,
    decision_note        VARCHAR(500) NULL,
    requester_seen_at    DATETIME     NULL,
    created_at           DATETIME     NOT NULL,
    updated_at           DATETIME     NULL,
    CONSTRAINT fk_csr_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    INDEX idx_csr_customer (customer_id, status),
    INDEX idx_csr_requester (requested_by_user_id, status),
    INDEX idx_csr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Requests to move a Follow Up customer back to Design or Quotation Stage';
