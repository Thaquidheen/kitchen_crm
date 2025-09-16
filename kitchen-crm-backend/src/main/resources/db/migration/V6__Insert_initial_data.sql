-- V6__Insert_initial_data.sql

-- Create auth tables if they don't exist
CREATE TABLE IF NOT EXISTS roles (
                                     id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                     name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS users (
                                     id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                     name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS user_roles (
                                          user_id BIGINT NOT NULL,
                                          role_id BIGINT NOT NULL,
                                          PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );

-- Insert default roles
INSERT INTO roles (name, created_at, updated_at) VALUES
                                                     ('ROLE_SUPER_ADMIN', NOW(), NOW()),
                                                     ('ROLE_STAFF', NOW(), NOW())
    ON DUPLICATE KEY UPDATE name = name;

-- Insert default super admin user (password: admin123)
INSERT INTO users (name, email, password, phone_number, active, created_at, updated_at) VALUES
    ('Super Admin', 'admin@kitchen-crm.com', '$2a$10$SlXF3x8.j1aSjtKYf2ZxZu1LrqGDk2qXlFGR2k0K9V4kf5SomTuiy', '1234567890', true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE email = email;

-- Insert default staff user (password: staff123)
INSERT INTO users (name, email, password, phone_number, active, created_at, updated_at) VALUES
    ('Staff User', 'staff@kitchen-crm.com', '$2a$10$wI4ky8FQRhNqx8fP6LW5HeR9oQF5xRG.8RGzpXZQ7V5mYo7kTZR7e', '0987654321', true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE email = email;

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@kitchen-crm.com' AND r.name = 'ROLE_SUPER_ADMIN'
    ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'staff@kitchen-crm.com' AND r.name = 'ROLE_STAFF'
    ON DUPLICATE KEY UPDATE user_id = user_id;

