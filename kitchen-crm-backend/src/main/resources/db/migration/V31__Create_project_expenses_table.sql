-- V31: Create project_expenses table for tracking vendor payments

CREATE TABLE project_expenses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL COMMENT 'Reference to customer_projects',
    vendor_id BIGINT NOT NULL COMMENT 'Reference to vendors',
    expense_category VARCHAR(50) NOT NULL DEFAULT 'MISCELLANEOUS' COMMENT 'Category: MATERIAL, LABOR, TRANSPORT, APPLIANCE, MISCELLANEOUS',
    description TEXT COMMENT 'Description of what was purchased/paid for',
    amount DECIMAL(12,2) NOT NULL COMMENT 'Amount paid to vendor',
    payment_method VARCHAR(50) NOT NULL COMMENT 'How payment was made: CASH, UPI, NEFT, etc.',
    payment_date DATE NOT NULL COMMENT 'Date payment was made',
    reference_number VARCHAR(100) COMMENT 'Transaction reference number',
    notes TEXT COMMENT 'Additional notes',
    paid_by VARCHAR(100) COMMENT 'Name of person who made the payment',
    status VARCHAR(20) DEFAULT 'PAID' COMMENT 'Status: PENDING, PAID, CANCELLED',

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    -- Foreign keys
    FOREIGN KEY (project_id) REFERENCES customer_projects(id) ON DELETE RESTRICT,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT,

    -- Indexes
    INDEX idx_project_expenses_project (project_id),
    INDEX idx_project_expenses_vendor (vendor_id),
    INDEX idx_project_expenses_category (expense_category),
    INDEX idx_project_expenses_date (payment_date),
    INDEX idx_project_expenses_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Project expenses and vendor payments';

-- Create trigger to update customer_projects.total_expense when expense is added/updated/deleted
DELIMITER $$

CREATE TRIGGER trg_update_project_expense_after_insert
AFTER INSERT ON project_expenses
FOR EACH ROW
BEGIN
    UPDATE customer_projects
    SET total_expense = (
        SELECT COALESCE(SUM(amount), 0)
        FROM project_expenses
        WHERE project_id = NEW.project_id
          AND status = 'PAID'
    )
    WHERE id = NEW.project_id;
END$$

CREATE TRIGGER trg_update_project_expense_after_update
AFTER UPDATE ON project_expenses
FOR EACH ROW
BEGIN
    UPDATE customer_projects
    SET total_expense = (
        SELECT COALESCE(SUM(amount), 0)
        FROM project_expenses
        WHERE project_id = NEW.project_id
          AND status = 'PAID'
    )
    WHERE id = NEW.project_id;
END$$

CREATE TRIGGER trg_update_project_expense_after_delete
AFTER DELETE ON project_expenses
FOR EACH ROW
BEGIN
    UPDATE customer_projects
    SET total_expense = (
        SELECT COALESCE(SUM(amount), 0)
        FROM project_expenses
        WHERE project_id = OLD.project_id
          AND status = 'PAID'
    )
    WHERE id = OLD.project_id;
END$$

DELIMITER ;
