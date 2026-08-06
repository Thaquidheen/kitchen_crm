-- A production checklist task can carry the reminder set for it, so the UI can show a
-- persistent "Reminder · date" chip and the list can surface the next due item's date.
-- Deleting the reminder detaches it from the task (SET NULL) — the task itself survives.

ALTER TABLE production_custom_tasks
    ADD COLUMN reminder_id BIGINT NULL AFTER notes;

ALTER TABLE production_custom_tasks
    ADD CONSTRAINT fk_production_task_reminder
        FOREIGN KEY (reminder_id) REFERENCES customer_reminders(id) ON DELETE SET NULL;

CREATE INDEX idx_production_task_reminder ON production_custom_tasks (reminder_id);
