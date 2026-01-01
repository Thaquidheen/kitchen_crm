-- Add designer_id column if it does not exist (MySQL-compatible)
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'design_phase' AND column_name = 'designer_id'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE design_phase ADD COLUMN designer_id BIGINT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add foreign key only if it does not exist
SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.table_constraints tc
  WHERE tc.table_schema = DATABASE() AND tc.table_name = 'design_phase' AND tc.constraint_type = 'FOREIGN KEY' AND tc.constraint_name = 'fk_design_phase_designer'
);
SET @sql := IF(@fk_exists = 0, 'ALTER TABLE design_phase ADD CONSTRAINT fk_design_phase_designer FOREIGN KEY (designer_id) REFERENCES designers(id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Create index only if it does not exist
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'design_phase' AND index_name = 'idx_design_phase_designer_id'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_design_phase_designer_id ON design_phase(designer_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Note: The designer_assigned column will be kept for backward compatibility
-- and can be removed in a future migration after data migration is complete
