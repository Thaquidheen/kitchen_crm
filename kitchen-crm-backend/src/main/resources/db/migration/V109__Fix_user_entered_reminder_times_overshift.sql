-- Undo the timezone over-shift on USER-ENTERED reminder times.
--
-- V108 shifted every DATETIME column +330 to move machine-written wall-clocks from UTC to IST.
-- That was right for machine-set columns (task created/updated/completed, upload and notified
-- timestamps) but WRONG for the times a person types: a reminder set for "10:00 AM" is already in
-- the user's local clock, so +330 pushed every reminder and follow-up 5h30m late (10:00 -> 15:30).
--
-- These three columns hold user-entered wall-clock times, not machine instants, so revert them:
--   customer_reminders.remind_at
--   customer_followups.next_follow_up_at
--   design_phase.meeting_scheduled
--
-- On a fresh environment V108 (+330) then this (-330) net to zero, leaving the user's times exactly
-- as entered. On the already-migrated production database the same -330 was applied out of band as a
-- hotfix; when reconciling prod's flyway history, mark this version applied so it does not run twice.

UPDATE customer_reminders   SET remind_at         = remind_at         - INTERVAL 330 MINUTE WHERE remind_at         IS NOT NULL;
UPDATE customer_followups   SET next_follow_up_at = next_follow_up_at - INTERVAL 330 MINUTE WHERE next_follow_up_at IS NOT NULL;
UPDATE design_phase         SET meeting_scheduled = meeting_scheduled - INTERVAL 330 MINUTE WHERE meeting_scheduled IS NOT NULL;
