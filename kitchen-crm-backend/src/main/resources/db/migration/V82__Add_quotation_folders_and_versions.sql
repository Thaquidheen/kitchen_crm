-- Quotation folders: group all versions of a quotation (customer/project) in one folder.
-- "Save as New" files the copy into the source quotation's folder as the next version.

CREATE TABLE quotation_folders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    customer_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_quotation_folders_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    INDEX idx_quotation_folders_customer (customer_id)
);

ALTER TABLE quotations
    ADD COLUMN folder_id BIGINT NULL,
    ADD COLUMN version_number INT NOT NULL DEFAULT 1,
    ADD CONSTRAINT fk_quotations_folder FOREIGN KEY (folder_id) REFERENCES quotation_folders(id),
    ADD INDEX idx_quotations_folder (folder_id);

-- Backfill: one folder per (customer, project name) group of existing quotations.
INSERT INTO quotation_folders (name, customer_id, created_at)
SELECT CONCAT(c.name, IF(COALESCE(q.project_name, '') = '', '', CONCAT(' - ', q.project_name))) AS fname,
       q.customer_id,
       MIN(q.created_at)
FROM quotations q
JOIN customers c ON c.id = q.customer_id
GROUP BY q.customer_id,
         CONCAT(c.name, IF(COALESCE(q.project_name, '') = '', '', CONCAT(' - ', q.project_name)));

-- Link each quotation to its group's folder.
UPDATE quotations q
JOIN customers c ON c.id = q.customer_id
JOIN quotation_folders f
  ON f.customer_id = q.customer_id
 AND f.name = CONCAT(c.name, IF(COALESCE(q.project_name, '') = '', '', CONCAT(' - ', q.project_name)))
SET q.folder_id = f.id;

-- Number the versions inside each folder by creation order.
UPDATE quotations q
JOIN (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY folder_id ORDER BY created_at, id) AS rn
    FROM quotations
) x ON x.id = q.id
SET q.version_number = x.rn;
