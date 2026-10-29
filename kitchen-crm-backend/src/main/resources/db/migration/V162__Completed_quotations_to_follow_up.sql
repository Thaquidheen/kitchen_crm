-- Completed quotations from before the release, and quotations reopened for editing right now.
--
-- Since 2026-10-29 a quotation set to Completed moves its customer on to Follow Up; since this
-- release one reopened for editing moves them back to Quotation Stage and puts the quotation back in
-- a person's list on the work board (QuotationCompletedEffects, QuotationReopenedEffects). This
-- brings what came before in line once:
--
--  0. Reopenings that are over: an approved request to edit a quotation that is Completed or
--     Approved again, or whose re-edit was saved as a newer version that is ("Save as New", same
--     folder). Until now only "Mark completed" closed them; they are done, as the application now
--     marks them.
--  1. Customers still in Lead, Potential or Quotation Stage whose newest quotation (cancelled ones
--     aside) is Completed move on to Follow Up. Not when somebody is preparing a quotation for them
--     (open work on the board), a quotation of theirs is reopened for editing, or they moved into
--     their stage after anything was last done about a quotation for them (one made, work handed
--     out or finished): the work board's To assign rule, under which that move asks for a new one.
--     Design Stage stays, as in the application.
--  2. Quotations reopened for editing right now (Draft, request approved in the last 90 days, as the
--     lists mark them): back first in a person's list, Waiting — the work that handed one in, open
--     again, or for one never handed in on the board, new work for whoever last prepared a quotation
--     for the customer there. Not when somebody already has open work for the customer or the
--     person is no longer active; one per customer. The customer, when in Follow Up since before the
--     approval, back in Quotation Stage.
--
-- Every stage move writes a line in the customer's stage history, as the application does.
--
-- Times: customers, quotations and workflow_history have TIMESTAMP columns, written with NOW();
-- quotation_jobs and quotation_edit_requests have DATETIME columns holding the application's local
-- time (Asia/Kolkata, UTC+05:30), written with UTC_TIMESTAMP() + 330 minutes. Where the two are
-- compared, both become seconds since 1970, so the session's time zone does not matter.
--
-- Rollback safety: data only, no schema change; DONE, FOLLOW_UP, QUOTE_GIVEN and WAITING are values
-- every earlier version knows.

-- 0. Reopenings that are over.

CREATE TEMPORARY TABLE v162_answered AS
SELECT r.id
FROM quotation_edit_requests r
JOIN quotations q ON q.id = r.quotation_id
WHERE r.status = 'APPROVED'
  AND (q.status IN ('COMPLETE', 'APPROVED')
       OR (q.status = 'DRAFT' AND q.folder_id IS NOT NULL
           AND EXISTS (SELECT 1 FROM quotations v
                       WHERE v.folder_id = q.folder_id AND v.id > q.id AND v.status IN ('COMPLETE', 'APPROVED'))));

UPDATE quotation_edit_requests r
JOIN v162_answered a ON a.id = r.id
SET r.status = 'DONE',
    r.requester_seen_at = IFNULL(r.requester_seen_at, UTC_TIMESTAMP() + INTERVAL 330 MINUTE),
    r.updated_at = UTC_TIMESTAMP() + INTERVAL 330 MINUTE;

-- 1. Completed quotations: customers on to Follow Up.

CREATE TEMPORARY TABLE v162_follow_up AS
SELECT c.id AS customer_id, CAST(c.status AS CHAR(32)) AS previous_state, q.quotation_number
FROM customers c
JOIN quotations q ON q.id = (SELECT MAX(q2.id) FROM quotations q2
                             WHERE q2.customer_id = c.id AND (q2.status IS NULL OR q2.status <> 'CANCELLED'))
WHERE c.status IN ('LEAD', 'POTENTIAL', 'QUOTE_GIVEN')
  AND q.status = 'COMPLETE'
  AND NOT EXISTS (SELECT 1 FROM quotation_jobs j
                  WHERE j.customer_id = c.id AND j.status IN ('WAITING', 'IN_PROGRESS'))
  AND NOT EXISTS (SELECT 1 FROM quotation_edit_requests r JOIN quotations q3 ON q3.id = r.quotation_id
                  WHERE q3.customer_id = c.id AND q3.status = 'DRAFT' AND r.status = 'APPROVED'
                    AND r.decided_at >= UTC_TIMESTAMP() + INTERVAL 330 MINUTE - INTERVAL 90 DAY)
  -- When they last moved into their stage (from another one), against the last time anything was
  -- done about a quotation for them — as QuotationWorkServiceImpl.unassigned() weighs them.
  AND IFNULL((SELECT MAX(UNIX_TIMESTAMP(h.timestamp)) FROM workflow_history h
              WHERE h.customer_id = c.id AND h.new_state = c.status
                AND (h.previous_state IS NULL OR h.previous_state <> h.new_state)), 0)
      <= GREATEST(
           IFNULL((SELECT MAX(UNIX_TIMESTAMP(q4.created_at)) FROM quotations q4
                   WHERE q4.customer_id = c.id AND (q4.status IS NULL OR q4.status <> 'CANCELLED')), 0),
           IFNULL((SELECT MAX(TIMESTAMPDIFF(SECOND, '1970-01-01 05:30:00', j2.assigned_at)) FROM quotation_jobs j2
                   WHERE j2.customer_id = c.id), 0),
           IFNULL((SELECT MAX(TIMESTAMPDIFF(SECOND, '1970-01-01 05:30:00', j3.completed_at)) FROM quotation_jobs j3
                   WHERE j3.customer_id = c.id), 0));

INSERT INTO workflow_history (customer_id, previous_state, new_state, changed_by, change_reason, timestamp, created_at, updated_at)
SELECT t.customer_id, t.previous_state, 'FOLLOW_UP', 'System',
       CONCAT('Quotation ', IFNULL(CONCAT(t.quotation_number, ' '), ''), 'completed'), NOW(), NOW(), NOW()
FROM v162_follow_up t;

UPDATE customers c
JOIN v162_follow_up t ON t.customer_id = c.id
SET c.status = 'FOLLOW_UP', c.updated_at = NOW();

-- 2. Quotations reopened for editing right now.

CREATE TEMPORARY TABLE v162_reopened AS
SELECT q.id AS quotation_id, q.customer_id, q.quotation_number,
       (SELECT MAX(j.id) FROM quotation_jobs j WHERE j.quotation_id = q.id AND j.status = 'COMPLETED') AS linked_job_id,
       (SELECT MAX(j.id) FROM quotation_jobs j WHERE j.customer_id = q.customer_id AND j.status = 'COMPLETED') AS last_job_id,
       r.decision_note, r.decided_by_user_id, r.decided_by_name, r.decided_at
FROM quotations q
JOIN quotation_edit_requests r ON r.id = (SELECT MAX(r2.id) FROM quotation_edit_requests r2
                                          WHERE r2.quotation_id = q.id AND r2.status = 'APPROVED'
                                            AND r2.decided_at >= UTC_TIMESTAMP() + INTERVAL 330 MINUTE - INTERVAL 90 DAY)
WHERE q.status = 'DRAFT';

-- Whoever handed it in; for one never handed in on the board, whoever last prepared one for the customer there.
CREATE TEMPORARY TABLE v162_candidates AS
SELECT t.quotation_id, t.customer_id, t.linked_job_id, j.assignee_user_id, u.name AS assignee_name,
       t.decision_note, t.decided_by_user_id, t.decided_by_name
FROM v162_reopened t
JOIN quotation_jobs j ON j.id = IFNULL(t.linked_job_id, t.last_job_id)
JOIN users u ON u.id = j.assignee_user_id AND u.active = 1
WHERE NOT EXISTS (SELECT 1 FROM quotation_jobs o
                  WHERE o.customer_id = t.customer_id AND o.status IN ('WAITING', 'IN_PROGRESS'));

-- One per customer (the newest quotation): the board keeps one piece of open work per customer.
CREATE TEMPORARY TABLE v162_newest AS
SELECT MAX(quotation_id) AS quotation_id FROM v162_candidates GROUP BY customer_id;

CREATE TEMPORARY TABLE v162_work AS
SELECT c.quotation_id, c.customer_id, c.linked_job_id, c.assignee_user_id, c.assignee_name,
       c.decided_by_user_id, c.decided_by_name,
       (SELECT IFNULL(MIN(o.queue_position), 1) - 1 FROM quotation_jobs o
        WHERE o.assignee_user_id = c.assignee_user_id AND o.status IN ('WAITING', 'IN_PROGRESS')) AS first_position,
       LEFT(CONCAT('Reopened for editing',
                   IF(TRIM(IFNULL(c.decision_note, '')) = '', '', CONCAT(': ', TRIM(c.decision_note)))), 255) AS news
FROM v162_candidates c
JOIN v162_newest n ON n.quotation_id = c.quotation_id;

UPDATE quotation_jobs j
JOIN v162_work w ON w.linked_job_id = j.id
SET j.status = 'WAITING',
    j.queue_position = w.first_position,
    j.started_at = NULL,
    j.completed_at = NULL,
    j.completed_by_user_id = NULL,
    j.completed_by_name = NULL,
    j.due_date = GREATEST(IFNULL(j.due_date, DATE('1970-01-01')),
                          DATE(UTC_TIMESTAMP() + INTERVAL 330 MINUTE) + INTERVAL 7 DAY),
    j.assignee_news = w.news,
    j.assignee_seen_at = NULL,
    j.admin_seen_at = NULL,
    j.coordinator_seen_at = NULL,
    j.updated_at = UTC_TIMESTAMP() + INTERVAL 330 MINUTE;

INSERT INTO quotation_jobs (customer_id, assignee_user_id, assignee_name, status, priority, due_date, queue_position,
                            quotation_id, assigned_by_user_id, assigned_by_name, assigned_at, assignee_news,
                            created_at, updated_at)
SELECT w.customer_id, w.assignee_user_id, w.assignee_name, 'WAITING', 'MEDIUM',
       DATE(UTC_TIMESTAMP() + INTERVAL 330 MINUTE) + INTERVAL 7 DAY, w.first_position,
       w.quotation_id, w.decided_by_user_id, w.decided_by_name, UTC_TIMESTAMP() + INTERVAL 330 MINUTE, w.news,
       UTC_TIMESTAMP() + INTERVAL 330 MINUTE, UTC_TIMESTAMP() + INTERVAL 330 MINUTE
FROM v162_work w
WHERE w.linked_job_id IS NULL;

-- Back to Quotation Stage: in Follow Up since before the approval (not moved there on purpose after it).
CREATE TEMPORARY TABLE v162_back AS
SELECT t.customer_id, MAX(t.quotation_number) AS quotation_number
FROM v162_reopened t
JOIN customers c ON c.id = t.customer_id
WHERE c.status = 'FOLLOW_UP'
  AND IFNULL((SELECT MAX(UNIX_TIMESTAMP(h.timestamp)) FROM workflow_history h
              WHERE h.customer_id = c.id AND h.new_state = 'FOLLOW_UP'
                AND (h.previous_state IS NULL OR h.previous_state <> h.new_state)), 0)
      <= TIMESTAMPDIFF(SECOND, '1970-01-01 05:30:00', t.decided_at)
GROUP BY t.customer_id;

INSERT INTO workflow_history (customer_id, previous_state, new_state, changed_by, change_reason, timestamp, created_at, updated_at)
SELECT b.customer_id, 'FOLLOW_UP', 'QUOTE_GIVEN', 'System',
       CONCAT('Quotation ', IFNULL(CONCAT(b.quotation_number, ' '), ''), 'reopened for editing'), NOW(), NOW(), NOW()
FROM v162_back b;

UPDATE customers c
JOIN v162_back b ON b.customer_id = c.id
SET c.status = 'QUOTE_GIVEN', c.updated_at = NOW();

DROP TEMPORARY TABLE IF EXISTS v162_answered, v162_follow_up, v162_reopened, v162_candidates, v162_newest, v162_work, v162_back;
