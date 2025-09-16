-- V1__Create_base_tables.sql

-- Create customers table
CREATE TABLE customers (
                           id BIGINT PRIMARY KEY AUTO_INCREMENT,
                           name VARCHAR(255) NOT NULL,
                           contact VARCHAR(20),
                           email VARCHAR(255),
                           address TEXT,
                           kitchen_types VARCHAR(100),
                           status ENUM('LEAD', 'PROSPECT', 'ACTIVE', 'COMPLETED', 'INACTIVE') DEFAULT 'LEAD',
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create brands table
CREATE TABLE brands (
                        id BIGINT PRIMARY KEY AUTO_INCREMENT,
                        name VARCHAR(255) NOT NULL UNIQUE,
                        description TEXT,
                        active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
                            id BIGINT PRIMARY KEY AUTO_INCREMENT,
                            name VARCHAR(255) NOT NULL UNIQUE,
                            description TEXT,
                            active BOOLEAN DEFAULT TRUE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create customer_pipeline table
CREATE TABLE customer_pipeline (
                                   id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                   customer_id BIGINT NOT NULL,
                                   site_measurements TEXT,
                                   site_photos_uploaded BOOLEAN DEFAULT FALSE,
                                   requirements_fulfilled BOOLEAN DEFAULT FALSE,
                                   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                   FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Create workflow_history table
CREATE TABLE workflow_history (
                                  id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                  customer_id BIGINT NOT NULL,
                                  previous_state VARCHAR(100),
                                  new_state VARCHAR(100),
                                  changed_by VARCHAR(255),
                                  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Create design_phase table
CREATE TABLE design_phase (
                              id BIGINT PRIMARY KEY AUTO_INCREMENT,
                              customer_id BIGINT NOT NULL,
                              plan TEXT,
                              quotation_id BIGINT,
                              design TEXT,
                              submitted_to_client BOOLEAN DEFAULT FALSE,
                              client_feedback TEXT,
                              meeting_scheduled DATETIME,
                              design_amount_frozen BOOLEAN DEFAULT FALSE,
                              client_group_created BOOLEAN DEFAULT FALSE,
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                              FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Create production_installation table
CREATE TABLE production_installation (
                                         id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                         customer_id BIGINT NOT NULL,
                                         epd_received BOOLEAN DEFAULT FALSE,
                                         site_visit_marking BOOLEAN DEFAULT FALSE,
                                         flooring_completed BOOLEAN DEFAULT FALSE,
                                         ceiling_completed BOOLEAN DEFAULT FALSE,
                                         carcass_at_site BOOLEAN DEFAULT FALSE,
                                         countertop_at_site BOOLEAN DEFAULT FALSE,
                                         shutters_at_site BOOLEAN DEFAULT FALSE,
                                         carcass_installed BOOLEAN DEFAULT FALSE,
                                         countertop_installed BOOLEAN DEFAULT FALSE,
                                         shutters_installed BOOLEAN DEFAULT FALSE,
                                         appliances_received BOOLEAN DEFAULT FALSE,
                                         appliances_installed BOOLEAN DEFAULT FALSE,
                                         lights_installed BOOLEAN DEFAULT FALSE,
                                         handover_to_client BOOLEAN DEFAULT FALSE,
                                         client_feedback_photography TEXT,
                                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                         FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_created ON customers(created_at);
CREATE INDEX idx_brands_active ON brands(active);
CREATE INDEX idx_categories_active ON categories(active);