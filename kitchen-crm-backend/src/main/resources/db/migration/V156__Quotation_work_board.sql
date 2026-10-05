-- Quotation work board: who prepares which customer's quotation, in which order.
--
-- One row per piece of quotation work handed to a person. The admin (or Admin staff) assigns it
-- with a priority and a due date and orders each person's queue; the assignee marks it completed
-- and the admin is told. There is no approval step.
--
--   status              WAITING | IN_PROGRESS | COMPLETED | CANCELLED (plain text, not an ENUM)
--   queue_position      order in the assignee's queue; 1 = do first
--   quotation_id        the quotation handed in at completion (no FK: deleting a quotation must
--                       never be blocked by this history)
--   assignee_seen_at    NULL = news for the assignee (new work, or the admin changed something;
--                       assignee_news says what)
--   admin_seen_at       NULL on a completed row = news for the admin
--   coordinator_seen_at NULL on a completed row = news for Admin staff
--
-- Rollback safety: additive only, numbered above V155 (highest applied). A new table that the
-- previous jar has no entity for, so it validates and runs unchanged against this schema.

CREATE TABLE quotation_jobs (
    id                   BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    customer_id          BIGINT       NOT NULL,
    assignee_user_id     BIGINT       NOT NULL COMMENT 'No FK, so deleting staff is never blocked by history',
    assignee_name        VARCHAR(255) NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'WAITING',
    priority             VARCHAR(20)  NULL COMMENT 'LOW | MEDIUM | HIGH | URGENT; NULL = MEDIUM',
    due_date             DATE         NULL,
    note                 TEXT         NULL COMMENT 'What the admin asked for',
    queue_position       INT          NULL,
    quotation_id         BIGINT       NULL COMMENT 'Quotation handed in at completion',
    assigned_by_user_id  BIGINT       NULL,
    assigned_by_name     VARCHAR(255) NULL,
    assigned_at          DATETIME     NOT NULL,
    started_at           DATETIME     NULL,
    completed_at         DATETIME     NULL,
    completed_by_user_id BIGINT       NULL,
    completed_by_name    VARCHAR(255) NULL,
    assignee_seen_at     DATETIME     NULL,
    assignee_news        VARCHAR(255) NULL,
    admin_seen_at        DATETIME     NULL,
    coordinator_seen_at  DATETIME     NULL,
    created_at           DATETIME     NOT NULL,
    updated_at           DATETIME     NULL,
    CONSTRAINT fk_quotation_jobs_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    INDEX idx_quotation_jobs_customer (customer_id),
    INDEX idx_quotation_jobs_assignee (assignee_user_id, status),
    INDEX idx_quotation_jobs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Quotation work assigned to a person, in queue order';
