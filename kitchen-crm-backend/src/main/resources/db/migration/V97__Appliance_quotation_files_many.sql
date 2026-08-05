-- An appliance/quartz entry can carry several quotation PDFs, not just one, so the single
-- set of columns added in V96 becomes a child table. Anything already uploaded is carried
-- across before those columns are dropped.

CREATE TABLE appliance_quotation_files (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    appliance_customer_id BIGINT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appliance_quotation_files_customer
        FOREIGN KEY (appliance_customer_id) REFERENCES appliance_customers(id) ON DELETE CASCADE,
    INDEX idx_appliance_quotation_files_customer (appliance_customer_id)
);

INSERT INTO appliance_quotation_files (appliance_customer_id, file_url, file_name, uploaded_at)
SELECT id,
       quotation_file_url,
       COALESCE(NULLIF(quotation_file_name, ''), 'Quotation.pdf'),
       COALESCE(quotation_uploaded_at, NOW())
FROM appliance_customers
WHERE quotation_file_url IS NOT NULL AND quotation_file_url <> '';

ALTER TABLE appliance_customers
    DROP COLUMN quotation_file_url,
    DROP COLUMN quotation_file_name,
    DROP COLUMN quotation_uploaded_at;
