-- Create production task groups table
CREATE TABLE IF NOT EXISTS production_task_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    production_installation_id BIGINT NOT NULL,
    group_title VARCHAR(255) NOT NULL,
    group_description TEXT,
    sort_order INT DEFAULT 0,
    is_expanded BOOLEAN DEFAULT TRUE,
    created_by_user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_group_production FOREIGN KEY (production_installation_id)
        REFERENCES production_installation(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_group_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES users(id) ON DELETE SET NULL
);

-- Add task_group_id column to production_custom_tasks table
ALTER TABLE production_custom_tasks
ADD COLUMN task_group_id BIGINT NULL,
ADD CONSTRAINT fk_custom_task_group FOREIGN KEY (task_group_id)
    REFERENCES production_task_groups(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_task_groups_production_id ON production_task_groups(production_installation_id);
CREATE INDEX idx_custom_tasks_group_id ON production_custom_tasks(task_group_id);
