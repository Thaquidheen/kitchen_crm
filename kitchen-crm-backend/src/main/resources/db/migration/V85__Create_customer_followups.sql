-- Follow-up log per customer: each entry records a contact attempt (type + notes) and
-- optionally schedules the next follow-up, which auto-creates a customer reminder.
CREATE TABLE customer_followups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    followup_type ENUM('CALL', 'WHATSAPP', 'MEETING', 'SITE_VISIT', 'EMAIL', 'OTHER') NOT NULL DEFAULT 'CALL',
    notes TEXT NULL,
    next_follow_up_at DATETIME NULL,
    created_by VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_followups_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_followups_customer (customer_id)
);
