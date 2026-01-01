-- Add staff_assigned_id column if it does not exist (MySQL-compatible)
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'design_phase' AND column_name = 'staff_assigned_id'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE design_phase ADD COLUMN staff_assigned_id BIGINT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add foreign key only if it does not exist
SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.table_constraints tc
  WHERE tc.table_schema = DATABASE() AND tc.table_name = 'design_phase' AND tc.constraint_type = 'FOREIGN KEY' AND tc.constraint_name = 'fk_design_phase_staff_assigned'
);
SET @sql := IF(@fk_exists = 0, 'ALTER TABLE design_phase ADD CONSTRAINT fk_design_phase_staff_assigned FOREIGN KEY (staff_assigned_id) REFERENCES users(id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Create index only if it does not exist
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'design_phase' AND index_name = 'idx_design_phase_staff_assigned_id'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_design_phase_staff_assigned_id ON design_phase(staff_assigned_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Note: The designer_id column is kept for backward compatibility





