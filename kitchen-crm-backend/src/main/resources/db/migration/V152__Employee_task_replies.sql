-- Replies on assigned tasks (Team Tasks): the assignee can ask about a task ("which customer?"),
-- the assigner answers, and each side's bell announces replies it has not seen yet.
--
--   employee_task_replies      one message per row; from_assignee tells whose side wrote it, so the
--                              unread count per side needs no role lookup. Deleting a task (or the
--                              user, which already cascades to their tasks) removes its thread.
--   assigner_replies_seen_at   last time the assigner viewed the thread; assignee replies after it
--                              are unread for them (null = never viewed).
--   assignee_replies_seen_at   same, for the assignee and the assigner's replies.
--
-- Rollback safety: additive only. The previously deployed jar does not map the new table or the
-- two nullable columns, and Hibernate validate ignores what an entity does not map.
CREATE TABLE employee_task_replies (
    id             BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    task_id        BIGINT       NOT NULL,
    author_user_id BIGINT       NULL COMMENT 'Writer (no FK: the task FK already cascades on user delete)',
    author_name    VARCHAR(255) NULL COMMENT 'Display name at the time of writing',
    from_assignee  BOOLEAN      NOT NULL COMMENT 'true = written by the assignee, false = by the assigner',
    message        TEXT         NOT NULL,
    created_at     DATETIME     NOT NULL,
    CONSTRAINT fk_etr_task FOREIGN KEY (task_id) REFERENCES employee_tasks (id) ON DELETE CASCADE,
    INDEX idx_etr_task_created (task_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Reply thread on an assigned task';

ALTER TABLE employee_tasks
    ADD COLUMN assigner_replies_seen_at DATETIME NULL COMMENT 'When the assigner last read the reply thread',
    ADD COLUMN assignee_replies_seen_at DATETIME NULL COMMENT 'When the assignee last read the reply thread';
