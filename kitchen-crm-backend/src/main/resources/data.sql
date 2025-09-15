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

-- Insert sample brands
INSERT INTO brands (name, description, active, created_at, updated_at) VALUES
                                                                           ('Hafele', 'Premium kitchen hardware and accessories', true, NOW(), NOW()),
                                                                           ('Blum', 'High-quality drawer systems and hinges', true, NOW(), NOW()),
                                                                           ('Hettich', 'Innovative furniture fittings', true, NOW(), NOW()),
                                                                           ('Godrej', 'Trusted Indian brand for home solutions', true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE name = name;

-- Insert sample categories
INSERT INTO categories (name, description, active, created_at, updated_at) VALUES
                                                                               ('Cabinet Hardware', 'Hinges, handles, and cabinet accessories', true, NOW(), NOW()),
                                                                               ('Drawer Systems', 'Soft-close drawers and slides', true, NOW(), NOW()),
                                                                               ('Kitchen Appliances', 'Built-in kitchen appliances', true, NOW(), NOW()),
                                                                               ('Lighting', 'LED strips and kitchen lighting solutions', true, NOW(), NOW()),
                                                                               ('Storage Solutions', 'Pull-out baskets and organizers', true, NOW(), NOW())
    ON DUPLICATE KEY UPDATE name = name;