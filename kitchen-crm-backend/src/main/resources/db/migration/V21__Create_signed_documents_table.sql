-- Migration: Create signed_documents table
-- Purpose: Store digital signature/approval records for quotations, work completion, and final bills
-- Author: HOCH Team
-- Date: 2025-01-15

CREATE TABLE IF NOT EXISTS signed_documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Document Information
    document_type VARCHAR(50) NOT NULL COMMENT 'QUOTATION, WORK_COMPLETION, FINAL_BILL',
    reference_id BIGINT NOT NULL COMMENT 'ID of quotation, work_completion_report, etc',
    document_number VARCHAR(50) COMMENT 'e.g., QT-2024-001, WCR-2024-001',

    -- Customer Information
    customer_id BIGINT NOT NULL,
    customer_name VARCHAR(100),
    customer_email VARCHAR(100),
    customer_phone VARCHAR(20),

    -- Document URLs
    original_document_url VARCHAR(500) COMMENT 'Path to original PDF',
    signed_document_url VARCHAR(500) COMMENT 'Path to signed/approved PDF',
    signature_image_url VARCHAR(500) COMMENT 'Path to signature image (if drawn)',

    -- Signature/Approval Data
    signature_data TEXT COMMENT 'Base64 signature image or approval data',
    signature_type VARCHAR(30) COMMENT 'DRAWN, UPLOADED, TYPED, CHECKBOX',

    -- Signature Metadata (JSON)
    signature_metadata TEXT COMMENT 'IP, device, location, timestamp - stored as JSON',

    -- Status & Workflow
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, SENT, OPENED, SIGNED, REJECTED, EXPIRED',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP COMMENT 'When signing request was sent',
    opened_at TIMESTAMP COMMENT 'When customer opened signing link',
    signed_at TIMESTAMP COMMENT 'When customer signed/approved',
    expires_at TIMESTAMP COMMENT 'Link expiration time (default: 7 days)',

    -- Security
    signing_token VARCHAR(100) UNIQUE COMMENT 'UUID for secure signing link',
    signing_ip_address VARCHAR(50) COMMENT 'IP address used for signing',

    -- Signer Details
    signer_name VARCHAR(100) COMMENT 'Name entered by signer',
    signer_email VARCHAR(100) COMMENT 'Email entered by signer',
    signer_phone VARCHAR(20) COMMENT 'Phone entered by signer',

    -- Additional Fields
    remarks TEXT COMMENT 'Customer comments during signing',
    rejection_reason TEXT COMMENT 'Reason if rejected by customer',

    -- Audit Trail
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_customer (customer_id),
    INDEX idx_reference (document_type, reference_id),
    INDEX idx_status (status),
    INDEX idx_token (signing_token),
    INDEX idx_created (created_at),
    INDEX idx_expires (expires_at),

    -- Foreign Keys
    CONSTRAINT fk_signed_documents_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE
);

-- Comments for documentation
ALTER TABLE signed_documents COMMENT = 'Stores digital signature and approval records for all document types';
