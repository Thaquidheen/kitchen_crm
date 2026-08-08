-- Income & Expenses module: customer-anchored finance tracking.
-- One header per customer; dated income payments; expense lines with C/H-C/A split;
-- vendor payment releases; shared receipt files (single-owner enforced in the service
-- layer because MySQL rejects CHECK constraints on FK-cascade columns, ERROR 3823).

CREATE TABLE customer_finance (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    committed_cash_in_hand DECIMAL(14,2) NOT NULL DEFAULT 0,
    committed_cash_in_account DECIMAL(14,2) NOT NULL DEFAULT 0,
    notes TEXT NULL,
    created_by VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_finance_customer FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT uq_customer_finance_customer UNIQUE (customer_id)
);

CREATE TABLE finance_income_payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    finance_id BIGINT NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    mode VARCHAR(20) NOT NULL,
    payment_date DATE NOT NULL,
    note VARCHAR(500) NULL,
    comment TEXT NULL,
    created_by VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fin_payments_finance FOREIGN KEY (finance_id)
        REFERENCES customer_finance(id) ON DELETE CASCADE,
    INDEX idx_fin_payments_finance (finance_id),
    INDEX idx_fin_payments_date (payment_date),
    INDEX idx_fin_payments_mode_date (mode, payment_date)
);

CREATE TABLE finance_expenses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    finance_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    cash_in_hand_pct DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    cash_in_account_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    quotation_id BIGINT NULL,
    expense_date DATE NULL,
    note VARCHAR(500) NULL,
    created_by VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fin_expenses_finance FOREIGN KEY (finance_id)
        REFERENCES customer_finance(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_expenses_quotation FOREIGN KEY (quotation_id)
        REFERENCES quotations(id) ON DELETE SET NULL,
    INDEX idx_fin_expenses_finance (finance_id),
    INDEX idx_fin_expenses_quotation (quotation_id)
);

CREATE TABLE finance_vendor_releases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    finance_id BIGINT NOT NULL,
    vendor_id BIGINT NOT NULL,
    expense_id BIGINT NULL,
    amount DECIMAL(14,2) NOT NULL,
    mode VARCHAR(20) NOT NULL,
    release_date DATE NOT NULL,
    note VARCHAR(500) NULL,
    created_by VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fin_releases_finance FOREIGN KEY (finance_id)
        REFERENCES customer_finance(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_releases_vendor FOREIGN KEY (vendor_id)
        REFERENCES vendors(id),
    CONSTRAINT fk_fin_releases_expense FOREIGN KEY (expense_id)
        REFERENCES finance_expenses(id) ON DELETE SET NULL,
    INDEX idx_fin_releases_finance (finance_id),
    INDEX idx_fin_releases_vendor (vendor_id),
    INDEX idx_fin_releases_expense (expense_id),
    INDEX idx_fin_releases_date (release_date)
);

CREATE TABLE finance_receipt_files (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    payment_id BIGINT NULL,
    expense_id BIGINT NULL,
    release_id BIGINT NULL,
    kind VARCHAR(20) NOT NULL DEFAULT 'RECEIPT',
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_at DATETIME NOT NULL,
    CONSTRAINT fk_fin_files_payment FOREIGN KEY (payment_id)
        REFERENCES finance_income_payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_files_expense FOREIGN KEY (expense_id)
        REFERENCES finance_expenses(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_files_release FOREIGN KEY (release_id)
        REFERENCES finance_vendor_releases(id) ON DELETE CASCADE,
    INDEX idx_fin_files_payment (payment_id),
    INDEX idx_fin_files_expense (expense_id),
    INDEX idx_fin_files_release (release_id)
);
