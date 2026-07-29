-- Customer reminders: per-customer follow-up reminders with date+time and in-app
-- notification (header bell). Visible to all staff; per-user visibility may come later.
CREATE TABLE customer_reminders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    notes TEXT NULL,
    remind_at DATETIME NOT NULL,
    status ENUM('PENDING', 'DUE', 'DONE') NOT NULL DEFAULT 'PENDING',
    notified_at DATETIME NULL,
    created_by VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_reminders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_reminders_customer (customer_id),
    INDEX idx_customer_reminders_status_time (status, remind_at)
);
