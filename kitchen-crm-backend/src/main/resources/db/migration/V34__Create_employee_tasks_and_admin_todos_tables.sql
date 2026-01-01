-- V34: Create employee_tasks and admin_todos tables for task assignment and daily activity tracking

-- Employee Tasks Table
-- Allows super admin/admin to assign daily tasks to staff members
CREATE TABLE IF NOT EXISTS employee_tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Assignment Information
    assigned_to_user_id BIGINT NOT NULL COMMENT 'Staff member who receives the task',
    assigned_by_user_id BIGINT NOT NULL COMMENT 'Admin/Super Admin who assigned the task',
    
    -- Task Details
    task_title VARCHAR(255) NOT NULL COMMENT 'Title of the task',
    task_description TEXT COMMENT 'Detailed description of the task',
    task_date DATE NOT NULL COMMENT 'The date the task is assigned for',
    
    -- Task Status
    completed BOOLEAN DEFAULT FALSE COMMENT 'Whether the task is completed',
    completed_at TIMESTAMP NULL COMMENT 'When staff marked as complete',
    
    -- Additional Information
    notes TEXT COMMENT 'Separate notes field for the task',
    priority VARCHAR(20) DEFAULT 'MEDIUM' COMMENT 'Task priority: LOW, MEDIUM, HIGH, URGENT',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT 'Task status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED',
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_employee_tasks_assigned_to (assigned_to_user_id),
    INDEX idx_employee_tasks_assigned_by (assigned_by_user_id),
    INDEX idx_employee_tasks_date (task_date),
    INDEX idx_employee_tasks_status (status),
    INDEX idx_employee_tasks_completed (completed),
    INDEX idx_employee_tasks_date_status (task_date, status),
    
    -- Foreign Keys
    CONSTRAINT fk_employee_tasks_assigned_to
        FOREIGN KEY (assigned_to_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_employee_tasks_assigned_by
        FOREIGN KEY (assigned_by_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Daily tasks assigned to staff members by admin';

-- Admin Todos Table
-- Allows super admin/admin to track their own daily activities and todos
CREATE TABLE IF NOT EXISTS admin_todos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Ownership
    user_id BIGINT NOT NULL COMMENT 'Admin/Super Admin who created this todo',
    
    -- Todo Details
    todo_title VARCHAR(255) NOT NULL COMMENT 'Title of the todo item',
    todo_description TEXT COMMENT 'Detailed description',
    todo_date DATE NOT NULL COMMENT 'The date for tracking this todo',
    
    -- Status
    completed BOOLEAN DEFAULT FALSE COMMENT 'Whether the todo is completed',
    completed_at TIMESTAMP NULL COMMENT 'When todo was marked as complete',
    
    -- Additional Information
    notes TEXT COMMENT 'Notes for the todo item',
    priority VARCHAR(20) DEFAULT 'MEDIUM' COMMENT 'Todo priority: LOW, MEDIUM, HIGH, URGENT',
    category VARCHAR(100) COMMENT 'Optional category for organization',
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_admin_todos_user (user_id),
    INDEX idx_admin_todos_date (todo_date),
    INDEX idx_admin_todos_completed (completed),
    INDEX idx_admin_todos_user_date (user_id, todo_date),
    
    -- Foreign Keys
    CONSTRAINT fk_admin_todos_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Admin todo items for daily activity tracking and monitoring';




