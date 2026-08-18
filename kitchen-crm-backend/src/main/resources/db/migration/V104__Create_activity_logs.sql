-- Super-admin audit trail: who signed in (and failed to), from which IP, and every write
-- action per module. Schema modeled on signature_audit_log (V24), the house shape for
-- event + actor + ip/user-agent rows.
--
-- Deliberately FK-free: failed logins reference emails that may match no user row, and audit
-- rows must survive user deletion. Additive only — jar-only rollback stays safe.

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(20) NOT NULL COMMENT 'LOGIN | LOGIN_FAILED | LOGOUT | ACTION',
    actor_email VARCHAR(255) COMMENT 'email attempted/authenticated; null only for anonymous edge cases',
    actor_name VARCHAR(255),
    actor_role VARCHAR(30),
    module VARCHAR(40) COMMENT 'backend module package for ACTION rows (customer, quotation, ...)',
    http_method VARCHAR(10),
    summary VARCHAR(500) COMMENT 'e.g. "POST /api/v1/customers/12/expenses"',
    status_code INT,
    ip_address VARCHAR(50),
    user_agent VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_activity_created (created_at),
    INDEX idx_activity_actor (actor_email),
    INDEX idx_activity_module (module),
    INDEX idx_activity_event (event_type),
    -- The viewer's default query is an event chip plus a date range ordered by time; a composite
    -- serves it as an index range scan instead of a filesort over the whole table.
    INDEX idx_activity_event_created (event_type, created_at)
) COMMENT 'Login and write-action audit trail, surfaced on the Settings page for super admins';
