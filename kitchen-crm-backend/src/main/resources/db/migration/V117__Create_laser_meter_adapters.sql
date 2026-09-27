-- Laser meter adapters: admin-managed, device-agnostic descriptions of how to talk to a model
-- of Bluetooth laser meter (GATT service/characteristics + how to decode a reading). The app
-- ships no device knowledge; admins create these from the Device Lab.
--
-- laser_meter_adapters.config holds the whole adapter JSON the browser runs on (filters, UUIDs,
-- parser, range). adapter_key / display_name / active are also columns (unique key, listing,
-- filtering) and the service keeps them in step with the JSON.
--
-- laser_meter_adapter_audit records every create/update/delete with the before/after JSON and
-- who did it. FK-free on purpose: audit rows must outlive a deleted adapter.
--
-- device_lab_logs stores Device Lab sessions exported for developers (raw packets + marks).
--
-- All additive: new tables only (rollback stays jar-only). No CHECK constraints (see V88).

CREATE TABLE laser_meter_adapters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    adapter_key VARCHAR(64) NOT NULL COMMENT 'Stable slug, also stored with measurements',
    display_name VARCHAR(120) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    config JSON NOT NULL,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    CONSTRAINT uk_laser_meter_adapters_key UNIQUE (adapter_key),
    INDEX idx_laser_meter_adapters_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE laser_meter_adapter_audit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    adapter_id BIGINT NULL,
    adapter_key VARCHAR(64) NOT NULL,
    action VARCHAR(20) NOT NULL COMMENT 'CREATE | UPDATE | DELETE',
    before_config JSON NULL,
    after_config JSON NULL,
    actor_email VARCHAR(255) NULL,
    actor_name VARCHAR(255) NULL,
    created_at DATETIME NULL,
    INDEX idx_laser_adapter_audit_adapter (adapter_id, created_at),
    INDEX idx_laser_adapter_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE device_lab_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    device_name VARCHAR(200) NULL,
    adapter_key VARCHAR(64) NULL COMMENT 'Adapter created from this session, if any',
    notes TEXT NULL,
    entry_count INT NOT NULL DEFAULT 0,
    log JSON NOT NULL,
    created_by VARCHAR(255) NULL,
    created_at DATETIME NULL,
    INDEX idx_device_lab_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
