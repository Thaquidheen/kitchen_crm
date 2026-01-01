-- V30: Create vendors table for managing project vendors/suppliers

CREATE TABLE vendors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    vendor_name VARCHAR(255) NOT NULL COMMENT 'Vendor/Supplier name',
    contact_person VARCHAR(255) COMMENT 'Primary contact person name',
    phone VARCHAR(20) COMMENT 'Contact phone number',
    email VARCHAR(255) COMMENT 'Contact email address',
    address TEXT COMMENT 'Vendor address',
    vendor_type VARCHAR(50) NOT NULL DEFAULT 'OTHER' COMMENT 'Type of vendor: MATERIAL_SUPPLIER, LABOR_CONTRACTOR, TRANSPORT_SERVICE, APPLIANCE_VENDOR, OTHER',
    active BOOLEAN DEFAULT TRUE COMMENT 'Is vendor active',
    notes TEXT COMMENT 'Additional notes about vendor',

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    -- Indexes
    INDEX idx_vendors_name (vendor_name),
    INDEX idx_vendors_type (vendor_type),
    INDEX idx_vendors_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Vendors/Suppliers for project expenses';

-- Insert some default vendors for testing
INSERT INTO vendors (vendor_name, vendor_type, phone, active, created_by) VALUES
('ABC Suppliers', 'MATERIAL_SUPPLIER', '9876543210', TRUE, 'system'),
('XYZ Hardware', 'MATERIAL_SUPPLIER', '9876543211', TRUE, 'system'),
('QuickTransport Services', 'TRANSPORT_SERVICE', '9876543212', TRUE, 'system'),
('Elite Labor Contractors', 'LABOR_CONTRACTOR', '9876543213', TRUE, 'system');
