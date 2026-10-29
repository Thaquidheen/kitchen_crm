-- Completed quotations from before the release, and quotations reopened for editing right now.
--
-- Since 2026-10-29 a quotation set to Completed moves its customer on to Follow Up; since this
-- release one reopened for editing moves them back to Quotation Stage and puts the work that
-- handed it in back on the board (QuotationCompletedEffects, QuotationReopenedEffects). This brings
-- what came before in line once:
--
--  1. Customers still in Lead, Potential or Quotation Stage whose newest quotation is Completed move
--     on to Follow Up. Not when somebody is preparing a quotation for them (open work on the
--     board), a quotation of theirs is reopened for editing, or they entered their stage after that
--     quotation was made: that move asks for a new one. Design Stage stays, as in the application.
--  2. Quotations reopened for editing right now (Draft, request approved in the last 90 days, as the
--     lists mark them): the work that handed one in is back first in that person's list, Waiting,
--     unless somebody already has open work for the customer or the person is no longer active; the
--     customer, when in Follow Up, is back in Quotation Stage.
--
-- Every stage move writes a line in the customer's stage history, as the application does.
--
-- Times: customers and workflow_history have TIMESTAMP columns, so NOW() (the session is UTC).
-- quotation_jobs and quotation_edit_requests have DATETIME columns holding the application's local
-- time (Asia/Kolkata, UTC+05:30): UTC_TIMESTAMP() + 330 minutes there.
--
-- Rollback safety: data only, no schema change; FOLLOW_UP, QUOTE_GIVEN and WAITING are values every
-- earlier version knows.

-- 1. Completed quotations: customers on to Follow Up.

CREATE TEMPORARY TABLE v162_follow_up AS
SELECT c.id AS customer_id, CAST(c.status AS CHAR(32)) AS previous_state, q.quotation_number
FROM customers c
JOIN quotations q ON q.id = (SELECT MAX(q2.id) FROM quotations q2 WHERE q2.customer_id = c.id)
WHERE c.status IN ('LEAD', 'POTENTIAL', 'QUOTE_GIVEN')
  AND q.status = 'COMPLETE'
  AND NOT EXISTS (SELECT 1 FROM quotation_jobs j
                  WHERE j.customer_id = c.id AND j.status IN ('WAITING', 'IN_PROGRESS'))
  AND NOT EXISTS (SELECT 1 FROM quotation_edit_requests r JOIN quotations q3 ON q3.id = r.quotation_id
                  WHERE q3.customer_id = c.id AND r.status = 'APPROVED')
  AND NOT EXISTS (SELECT 1 FROM workflow_history h
                  WHERE h.customer_id = c.id AND h.new_state = CAST(c.status AS CHAR(32)) AND h.timestamp > q.created_at);

INSERT INTO workflow_history (customer_id, previous_state, new_state, changed_by, change_reason, timestamp, created_at, updated_at)
SELECT t.customer_id, t.previous_state, 'FOLLOW_UP', 'System',
       CONCAT('Quotation ', IFNULL(CONCAT(t.quotation_number, ' '), ''), 'completed'), NOW(), NOW(), NOW()
FROM v162_follow_up t;

UPDATE customers c
JOIN v162_follow_up t ON t.customer_id = c.id
SET c.status = 'FOLLOW_UP', c.updated_at = NOW();

-- 2. Quotations reopened for editing: their work back on the board, their customer back in Quotation Stage.

CREATE TEMPORARY TABLE v162_reopened AS
SELECT q.id AS quotation_id, q.customer_id, q.quotation_number,
       (SELECT MAX(j.id) FROM quotation_jobs j WHERE j.quotation_id = q.id AND j.status = 'COMPLETED') AS job_id,
       (SELECT r.decision_note FROM quotation_edit_requests r
        WHERE r.quotation_id = q.id AND r.status = 'APPROVED' ORDER BY r.id DESC LIMIT 1) AS decision_note
FROM quotations q
WHERE q.status = 'DRAFT'
  AND EXISTS (SELECT 1 FROM quotation_edit_requests r
              WHERE r.quotation_id = q.id AND r.status = 'APPROVED'
                AND r.decided_at >= UTC_TIMESTAMP() + INTERVAL 330 MINUTE - INTERVAL 90 DAY);

CREATE TEMPORARY TABLE v162_candidates AS
SELECT j.id AS job_id, j.customer_id, j.assignee_user_id, t.decision_note
FROM v162_reopened t
JOIN quotation_jobs j ON j.id = t.job_id
JOIN users u ON u.id = j.assignee_user_id AND u.active = 1
WHERE NOT EXISTS (SELECT 1 FROM quotation_jobs o
                  WHERE o.customer_id = j.customer_id AND o.status IN ('WAITING', 'IN_PROGRESS'));

-- One piece of work per customer (the newest): the board keeps one open per customer.
CREATE TEMPORARY TABLE v162_newest AS
SELECT MAX(job_id) AS job_id FROM v162_candidates GROUP BY customer_id;

CREATE TEMPORARY TABLE v162_jobs AS
SELECT c.job_id,
       (SELECT IFNULL(MIN(o.queue_position), 1) - 1 FROM quotation_jobs o
        WHERE o.assignee_user_id = c.assignee_user_id AND o.status IN ('WAITING', 'IN_PROGRESS')) AS first_position,
       LEFT(CONCAT('Reopened for editing',
                   IF(TRIM(IFNULL(c.decision_note, '')) = '', '', CONCAT(': ', TRIM(c.decision_note)))), 255) AS news
FROM v162_candidates c
JOIN v162_newest n ON n.job_id = c.job_id;

UPDATE quotation_jobs j
JOIN v162_jobs t ON t.job_id = j.id
SET j.status = 'WAITING',
    j.queue_position = t.first_position,
    j.started_at = NULL,
    j.completed_at = NULL,
    j.completed_by_user_id = NULL,
    j.completed_by_name = NULL,
    j.due_date = GREATEST(IFNULL(j.due_date, DATE('1970-01-01')),
                          DATE(UTC_TIMESTAMP() + INTERVAL 330 MINUTE) + INTERVAL 7 DAY),
    j.assignee_news = t.news,
    j.assignee_seen_at = NULL,
    j.admin_seen_at = NULL,
    j.coordinator_seen_at = NULL,
    j.updated_at = UTC_TIMESTAMP() + INTERVAL 330 MINUTE;

CREATE TEMPORARY TABLE v162_back AS
SELECT c.id AS customer_id, MAX(t.quotation_number) AS quotation_number
FROM v162_reopened t
JOIN customers c ON c.id = t.customer_id
WHERE c.status = 'FOLLOW_UP'
GROUP BY c.id;

INSERT INTO workflow_history (customer_id, previous_state, new_state, changed_by, change_reason, timestamp, created_at, updated_at)
SELECT b.customer_id, 'FOLLOW_UP', 'QUOTE_GIVEN', 'System',
       CONCAT('Quotation ', IFNULL(CONCAT(b.quotation_number, ' '), ''), 'reopened for editing'), NOW(), NOW(), NOW()
FROM v162_back b;

UPDATE customers c
JOIN v162_back b ON b.customer_id = c.id
SET c.status = 'QUOTE_GIVEN', c.updated_at = NOW();

DROP TEMPORARY TABLE IF EXISTS v162_follow_up, v162_reopened, v162_candidates, v162_newest, v162_jobs, v162_back;
