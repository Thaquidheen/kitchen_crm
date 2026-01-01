-- Create designers table (if not exists)
CREATE TABLE IF NOT EXISTS designers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    department VARCHAR(100) DEFAULT 'Design Team',
    specialization VARCHAR(255),
    experience_years INT DEFAULT 0,
    hourly_rate DOUBLE,
    active BOOLEAN DEFAULT TRUE,
    bio TEXT,
    skills TEXT,
    portfolio_url VARCHAR(500),
    max_concurrent_projects INT DEFAULT 5,
    average_completion_days INT DEFAULT 7,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample designers (idempotent)
INSERT IGNORE INTO designers (name, email, phone_number, department, specialization, experience_years, hourly_rate, bio, skills, portfolio_url, max_concurrent_projects, average_completion_days) VALUES
('John Smith', 'john.smith@company.com', '+91 98765 43210', 'Design Team', 'Kitchen Design', 5, 1500.00, 'Experienced kitchen designer with expertise in modern and traditional designs.', 'AutoCAD,SketchUp,3D Modeling,Space Planning', 'https://portfolio.johnsmith.com', 3, 5),
('Sarah Johnson', 'sarah.johnson@company.com', '+91 98765 43211', 'Design Team', 'Interior Design', 3, 1200.00, 'Creative interior designer specializing in residential projects.', 'Photoshop,Illustrator,Color Theory,Material Selection', 'https://portfolio.sarahjohnson.com', 4, 7),
('Mike Chen', 'mike.chen@company.com', '+91 98765 43212', 'Design Team', 'CAD Specialist', 7, 1800.00, 'Technical CAD specialist with extensive experience in detailed drawings.', 'AutoCAD,SolidWorks,Technical Drawing,Standards Compliance', 'https://portfolio.mikechen.com', 2, 4),
('Emily Davis', 'emily.davis@company.com', '+91 98765 43213', 'Design Team', '3D Visualization', 4, 1600.00, 'Expert in 3D visualization and rendering for client presentations.', '3ds Max,V-Ray,Blender,Photorealistic Rendering', 'https://portfolio.emilydavis.com', 3, 6),
('David Wilson', 'david.wilson@company.com', '+91 98765 43214', 'Design Team', 'Project Management', 6, 1400.00, 'Project manager with design background, ensuring timely delivery.', 'Project Management,Client Communication,Timeline Planning', 'https://portfolio.davidwilson.com', 5, 8);

-- Create indexes for better query performance
-- Note: email already has index from UNIQUE constraint
-- Create indexes only if they don't already exist (MySQL 8+)
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'designers' AND index_name = 'idx_designers_active'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_designers_active ON designers(active)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'designers' AND index_name = 'idx_designers_department'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_designers_department ON designers(department)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'designers' AND index_name = 'idx_designers_specialization'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_designers_specialization ON designers(specialization)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
