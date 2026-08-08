-- V100: A personal to-do may be a plain checklist item with no date.
-- Dated to-dos join the notification bell; undated ones just sit on the list.
ALTER TABLE admin_todos MODIFY COLUMN todo_date DATE NULL COMMENT 'Optional due date; NULL = undated checklist item';
