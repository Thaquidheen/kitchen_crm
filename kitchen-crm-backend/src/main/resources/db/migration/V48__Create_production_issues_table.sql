-- Create production_issues table for tracking issues during production/installation
CREATE TABLE IF NOT EXISTS production_issues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    production_installation_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('MATERIAL_DEFECT', 'MEASUREMENT_ERROR', 'INSTALLATION_DAMAGE', 'DELIVERY_DELAY', 'QUALITY_ISSUE', 'SITE_ISSUE', 'DESIGN_CHANGE', 'OTHER') NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    reported_by VARCHAR(255),
    assigned_to VARCHAR(255),
    resolution TEXT,
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_production_issue_installation FOREIGN KEY (production_installation_id) REFERENCES production_installation(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for faster queries
CREATE INDEX idx_production_issues_customer ON production_issues(production_installation_id);
CREATE INDEX idx_production_issues_status ON production_issues(status);
CREATE INDEX idx_production_issues_priority ON production_issues(priority);
