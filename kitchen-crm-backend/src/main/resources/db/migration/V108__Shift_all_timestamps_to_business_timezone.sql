-- Put the whole app on the business timezone (Asia/Kolkata). Companion to two config changes in
-- the same release: TZ=Asia/Kolkata on the container (JVM clock) and serverTimezone=Asia/Kolkata on
-- the JDBC URL (connection clock).
--
-- WHY THIS IS SMALL. MySQL TIMESTAMP columns store an instant (UTC internally) and convert on read
-- using the connection's session timezone. So flipping the JDBC serverTimezone from UTC to
-- Asia/Kolkata makes ALL 149 TIMESTAMP columns — customers, finance, quotations, reminders,
-- production groups, everything — read 5h30m later, i.e. in IST, for existing AND new rows, with no
-- data change. That single connection flip fixes the bulk of the app.
--
-- This migration handles only the two things the connection flip does NOT fix:
--
-- 1. activity_logs.created_at is TIMESTAMP and was already shifted +330 by V105 (a data shift made
--    while the connection still read UTC). Once the connection reads IST, that stored shift double
--    counts and the log would read 5h30m ahead. Undo V105 here (-330); the connection's own +5:30
--    on read then lands it back on the correct IST value.
--
-- 2. DATETIME columns store a literal wall-clock and are NOT affected by the session timezone, so
--    the connection flip leaves their existing rows at the old UTC wall-clock. Shift those +330.
--    New DATETIME writes are already correct: the JVM now runs in IST, so LocalDateTime.now() is
--    IST and is stored verbatim. These 13 columns across 9 base tables are the only ones touched.
--
-- +330 / -330 is Asia/Kolkata's fixed offset (India has no DST). Fully reversible.

DROP TABLE IF EXISTS _tz_before_deploy;

-- (1) undo V105 so activity_logs is not double-shifted once the connection reads IST
UPDATE activity_logs SET created_at = created_at - INTERVAL 330 MINUTE WHERE created_at IS NOT NULL;

-- (2) shift existing DATETIME wall-clocks (the connection flip does not touch these)
UPDATE appliance_quotation_files SET uploaded_at = uploaded_at + INTERVAL 330 MINUTE;
UPDATE customer_followups SET next_follow_up_at = next_follow_up_at + INTERVAL 330 MINUTE;
UPDATE customer_reminders SET notified_at = notified_at + INTERVAL 330 MINUTE, remind_at = remind_at + INTERVAL 330 MINUTE;
UPDATE design_phase SET meeting_scheduled = meeting_scheduled + INTERVAL 330 MINUTE;
UPDATE finance_receipt_files SET uploaded_at = uploaded_at + INTERVAL 330 MINUTE;
UPDATE password_reset_tokens SET expiry_date = expiry_date + INTERVAL 330 MINUTE;
UPDATE production_custom_tasks SET completed_at = completed_at + INTERVAL 330 MINUTE, created_at = created_at + INTERVAL 330 MINUTE, updated_at = updated_at + INTERVAL 330 MINUTE;
UPDATE quotation_other_expenses SET created_at = created_at + INTERVAL 330 MINUTE, updated_at = updated_at + INTERVAL 330 MINUTE;
UPDATE quotations SET quotation_signed_at = quotation_signed_at + INTERVAL 330 MINUTE;
