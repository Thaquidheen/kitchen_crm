-- Add signature integration fields to quotations table
-- This links quotations to their signed documents and tracks signing timestamp

-- Add columns if they don't exist
SET @col1 := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'quotations' AND column_name = 'signed_document_id'
);
SET @sql := IF(@col1 = 0, 'ALTER TABLE quotations ADD COLUMN signed_document_id BIGINT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col2 := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'quotations' AND column_name = 'quotation_signed_at'
);
SET @sql := IF(@col2 = 0, 'ALTER TABLE quotations ADD COLUMN quotation_signed_at DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add foreign key constraint to signed_documents table
-- Add FK if not exists
SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'quotations' AND constraint_name = 'fk_quotations_signed_document'
);
SET @sql := IF(@fk_exists = 0, 'ALTER TABLE quotations ADD CONSTRAINT fk_quotations_signed_document FOREIGN KEY (signed_document_id) REFERENCES signed_documents(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add index for faster lookups
-- Create indexes if not exist
SET @i1 := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'quotations' AND index_name = 'idx_quotations_signed_document_id'
);
SET @sql := IF(@i1 = 0, 'CREATE INDEX idx_quotations_signed_document_id ON quotations(signed_document_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @i2 := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'quotations' AND index_name = 'idx_quotations_signed_at'
);
SET @sql := IF(@i2 = 0, 'CREATE INDEX idx_quotations_signed_at ON quotations(quotation_signed_at)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add comments for documentation
ALTER TABLE quotations
MODIFY COLUMN signed_document_id BIGINT NULL COMMENT 'Reference to the signed document entity',
MODIFY COLUMN quotation_signed_at DATETIME NULL COMMENT 'Timestamp when the quotation was digitally signed';
