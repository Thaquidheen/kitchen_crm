-- Admin -> staff task assignment (employee_tasks, V34) gains two "seen" stamps so the bell can
-- carry the news both ways:
--   acknowledged_at     the assignee has opened their list since this was assigned (null = "New")
--   completion_seen_at  the assigner has seen that it was completed (null on a done task = awaiting review)
-- Both nullable, unset by default, never written by the previously deployed jar, and Hibernate
-- validate ignores columns an entity does not map - so rollback stays jar-only.
ALTER TABLE employee_tasks
    ADD COLUMN acknowledged_at DATETIME NULL COMMENT 'When the assignee first saw this task; null = new to them',
    ADD COLUMN completion_seen_at DATETIME NULL COMMENT 'When the assigner saw it was completed; null on a done task = unreviewed';

-- The two bell feeds filter by owner + completed + stamp.
CREATE INDEX idx_employee_tasks_by_completed_seen ON employee_tasks (assigned_by_user_id, completed, completion_seen_at);
CREATE INDEX idx_employee_tasks_to_completed_ack ON employee_tasks (assigned_to_user_id, completed, acknowledged_at);
