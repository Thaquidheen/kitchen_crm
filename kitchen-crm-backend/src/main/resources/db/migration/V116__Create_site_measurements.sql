-- Site Measurement Mode: structured, per-value room measurements captured on site (laser meter
-- over Bluetooth, laser meter in keyboard mode, or typed by hand).
--
-- site_measurements is one row per customer holding the room layout (wall count, openings,
-- service points) as JSON — the layout decides which field keys exist, and it evolves with the
-- measuring UI, so it is not normalised. site_measurement_values is one row per measured field,
-- always in integer millimetres, with provenance metadata:
--   source               laser_ble | laser_hid | manual
--   device_adapter_id    the laser meter adapter that decoded a Bluetooth reading (NULL otherwise)
--   raw                  the raw payload (hex packet or typed text) the value was parsed from
--   captured_at          when it was captured (naive business-timezone wall-clock, like reminders)
--   edited_after_capture a device reading that was later corrected by hand
--
-- All additive: new tables only, so the previous jar validates unchanged (rollback stays
-- jar-only). No CHECK constraints (MySQL 3823, see V88); the service validates instead.

CREATE TABLE site_measurements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    layout JSON NULL COMMENT 'Room layout: wallCount, includeCeiling, openings[], servicePoints[]',
    notes TEXT NULL,
    updated_by VARCHAR(255) NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    CONSTRAINT uk_site_measurements_customer UNIQUE (customer_id),
    CONSTRAINT fk_site_measurements_customer FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE site_measurement_values (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    site_measurement_id BIGINT NOT NULL,
    field_key VARCHAR(120) NOT NULL COMMENT 'e.g. wall.1.length, opening.w1.sill',
    value_mm INT NOT NULL,
    source VARCHAR(20) NOT NULL COMMENT 'laser_ble | laser_hid | manual',
    device_adapter_id VARCHAR(64) NULL,
    raw VARCHAR(500) NULL,
    captured_at DATETIME NOT NULL,
    edited_after_capture BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_site_measurement_values_key UNIQUE (site_measurement_id, field_key),
    CONSTRAINT fk_site_measurement_values_parent FOREIGN KEY (site_measurement_id)
        REFERENCES site_measurements (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
