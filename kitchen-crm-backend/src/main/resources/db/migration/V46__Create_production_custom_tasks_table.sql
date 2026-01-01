-- V46: Create production custom tasks table for user-defined checklist items

CREATE TABLE IF NOT EXISTS production_custom_tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    production_installation_id BIGINT NOT NULL,
    task_title VARCHAR(255) NOT NULL,
    task_description TEXT,
    phase ENUM('PRODUCTION', 'SITE_PREPARATION', 'DELIVERY', 'INSTALLATION', 'COMPLETION', 'CUSTOM') DEFAULT 'CUSTOM',
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completion_date DATE,
    completed_at DATETIME,
    completed_by_user_id BIGINT,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    sort_order INT DEFAULT 0,
    notes TEXT,
    created_by_user_id BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),

    CONSTRAINT fk_production_custom_task_installation
        FOREIGN KEY (production_installation_id)
        REFERENCES production_installation(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_production_custom_task_completed_by
        FOREIGN KEY (completed_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_production_custom_task_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better query performance
CREATE INDEX idx_production_custom_task_installation ON production_custom_tasks(production_installation_id);
CREATE INDEX idx_production_custom_task_phase ON production_custom_tasks(phase);
CREATE INDEX idx_production_custom_task_completed ON production_custom_tasks(completed);
CREATE INDEX idx_production_custom_task_sort ON production_custom_tasks(sort_order);
