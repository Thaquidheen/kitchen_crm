-- A planned/scheduled date for each production task, shown against the task in the checklist.
-- Additive and nullable, so existing tasks keep working and the previously deployed jar (which maps
-- none of this column) validates and reads the table unchanged — rollback stays jar-only.
ALTER TABLE production_custom_tasks
    ADD COLUMN task_date DATE NULL COMMENT 'Planned/scheduled date for the task';
