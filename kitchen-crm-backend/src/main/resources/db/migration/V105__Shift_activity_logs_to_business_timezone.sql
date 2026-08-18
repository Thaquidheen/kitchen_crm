-- Move the activity log's existing timestamps from UTC to the business timezone.
--
-- Cause: ActivityLog stamped created_at with a bare LocalDateTime.now(), which takes the JVM
-- default. The backend container sets no TZ, so the JVM runs in UTC and every row landed 5h30m
-- behind the team in Asia/Kolkata. The viewer renders the stored value verbatim (deliberately, so
-- no browser-timezone shift can distort an audit trail), so the whole log read 5h30m early. The
-- same mismatch silently broke the date filter: a date chosen in IST was compared against
-- UTC-stamped rows, hiding the most recent 5h30m of activity from "today".
--
-- The code is fixed in this release: ActivityLogServiceImpl now stamps rows with
-- LocalDateTime.now(ZoneId.of(app.business-timezone)), matching the convention
-- CustomerReminderServiceImpl and AdminTodoServiceImpl already follow. This migration heals the
-- rows written before that fix.
--
-- Ordering is what makes this safe: Flyway runs at startup, before the application serves a single
-- request, so every row present at this moment was written by the previous jar and is therefore
-- UTC. Rows written afterwards are already in business time. Flyway's once-only guarantee means it
-- cannot double-apply.
--
-- +330 minutes is Asia/Kolkata's fixed offset from UTC. India observes no DST, so a constant is
-- correct here and CONVERT_TZ is avoided deliberately: it returns NULL when the MySQL timezone
-- tables are not loaded, which is the default in the official MySQL container, and that would
-- silently wipe every timestamp in the table.

UPDATE activity_logs
   SET created_at = created_at + INTERVAL 330 MINUTE
 WHERE created_at IS NOT NULL;
