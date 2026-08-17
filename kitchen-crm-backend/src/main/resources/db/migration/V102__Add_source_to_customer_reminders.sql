-- The bell pools reminders from four modules with no way to tell them apart: production-task
-- reminders and auto follow-ups are byte-identical to hand-written customer reminders. Add the
-- discriminator the UI needs. Additive only — the previous jar does not map this column, so a
-- jar-only rollback still boots under ddl-auto: validate.

ALTER TABLE customer_reminders
    ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'MANUAL';

-- Production reminders are identified exactly: V98's production_custom_tasks.reminder_id is
-- written only when a reminder is created from a production task.
UPDATE customer_reminders r
  JOIN production_custom_tasks t ON t.reminder_id = r.id
   SET r.source = 'PRODUCTION';

-- Follow-up reminders: only CustomerFollowUpServiceImpl writes this title shape. A manual
-- reminder someone happened to title the same way is mislabelled harmlessly — same chip, and
-- the caption is the only difference.
UPDATE customer_reminders
   SET source = 'FOLLOW_UP'
 WHERE source = 'MANUAL'
   AND title LIKE 'Follow up: %';
