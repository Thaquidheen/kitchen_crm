-- Remove the concealed module's existing footprint from the activity log.
--
-- From this release the module is hidden: absent from the sidebar, its route behaves like a typo,
-- and its API answers 404 without an unlock key. None of that matters while its own history still
-- names it — the log currently holds rows like
--     Finance | DELETE /api/v1/customer-finance/releases/8
-- which the Settings > Activity Log screen shows to any super admin, and whose module also feeds
-- the log's module filter dropdown. The concealment is only as good as its quietest trace.
--
-- Matched three ways because a row can carry the module, the path, or both, depending on which
-- code wrote it:
--   * module = 'finance'  — set from the handler's package by ActivityLogInterceptor
--   * summary naming the customer-finance API
--   * summary naming the unlock endpoint (its controller lives in the finance package, so its rows
--     would be labelled 'finance' too, but match the path as well in case that ever changes)
--
-- Only audit rows are touched. No financial record, expense, release or payment is affected.

DELETE FROM activity_logs
 WHERE module = 'finance'
    OR summary LIKE '%/api/v1/customer-finance%'
    OR summary LIKE '%/api/v1/reporting-access%';
