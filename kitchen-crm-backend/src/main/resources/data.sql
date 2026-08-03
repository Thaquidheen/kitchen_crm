-- Insert default roles
INSERT INTO roles (name, created_at, updated_at) VALUES
                                                     ('ROLE_SUPER_ADMIN', NOW(), NOW()),
                                                     ('ROLE_STAFF', NOW(), NOW())
    ON DUPLICATE KEY UPDATE name = name;

-- NOTE: this file no longer seeds user accounts.
--
-- It used to create 'admin@kitchen-crm.com' and 'staff@kitchen-crm.com' with fixed bcrypt
-- hashes whose plaintext was written in the comment above each INSERT — i.e. a known-password
-- super admin on every deployment, with the credentials in version control.
--
-- Accounts are now provisioned deliberately: the first super admin is inserted by hand, and
-- staff are created from the Staff page (POST /api/v1/users/staff, SUPER_ADMIN only), which
-- emails the new user their credentials.
--
-- V6__Insert_initial_data.sql still contains those INSERTs and is deliberately NOT edited:
-- Flyway runs with validate-on-migrate=true, so changing an applied migration's checksum
-- would stop the application booting.

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