-- Add missing project_id column to quotations table
-- This links quotations to customer projects

ALTER TABLE quotations
ADD COLUMN project_id BIGINT NULL;

ALTER TABLE quotations
ADD CONSTRAINT fk_quotations_project
FOREIGN KEY (project_id) REFERENCES customer_projects(id) ON DELETE SET NULL;

CREATE INDEX idx_quotations_project ON quotations(project_id);
