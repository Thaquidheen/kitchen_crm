-- Create design_phase_files table
CREATE TABLE IF NOT EXISTS design_phase_files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    design_phase_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    file_category VARCHAR(50) DEFAULT 'DESIGN',
    description TEXT,
    uploaded_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),

    CONSTRAINT fk_design_phase_files_design_phase
        FOREIGN KEY (design_phase_id)
        REFERENCES design_phase(id)
        ON DELETE CASCADE,

    INDEX idx_design_phase_files_design_phase_id (design_phase_id),
    INDEX idx_design_phase_files_file_category (file_category),
    INDEX idx_design_phase_files_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
