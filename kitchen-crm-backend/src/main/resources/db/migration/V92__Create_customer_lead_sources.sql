-- A customer now has a free LIST of lead sources instead of the single set of flat columns
-- added by V33/V78/V86. Any mix is allowed, including duplicates of the same type (two
-- architects plus a builder), so there is deliberately NO unique key on
-- (customer_id, source_type) or (customer_id, architect_id).
--
-- The legacy customers.* lead-source columns are intentionally left in place this release --
-- production runs ddl-auto: validate, so dropping them would stop the previous jar from
-- booting and remove the rollback path. They are dropped in a later release.
CREATE TABLE customer_lead_sources (
    id                   BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id          BIGINT       NOT NULL,
    source_type          VARCHAR(30)  NOT NULL COMMENT 'Customer.LeadSourceType name',
    architect_id         BIGINT       NULL COMMENT 'Set for ARCHITECT / BUILDER sources',
    referral_name        VARCHAR(255) NULL,
    referral_contact     VARCHAR(50)  NULL,
    referral_location    VARCHAR(255) NULL,
    referral_designation VARCHAR(255) NULL,
    referral_firm        VARCHAR(255) NULL,
    referral_email       VARCHAR(255) NULL,
    sort_order           INT          NOT NULL DEFAULT 0,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- CASCADE, not the MySQL default RESTRICT. V90 is an entire migration written to fix
    -- exactly this: a child FK left at RESTRICT made customers undeletable with a 500.
    CONSTRAINT fk_customer_lead_sources_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,

    -- SET NULL preserves today's behaviour exactly: fk_customers_architect (V33) is already
    -- ON DELETE SET NULL, so deleting an architect has never been blocked by a linked customer.
    -- RESTRICT here would newly break architect deletion. The resulting row (typed source,
    -- null architect) is the same shape the service already handles for legacy records.
    CONSTRAINT fk_customer_lead_sources_architect
        FOREIGN KEY (architect_id) REFERENCES architects(id) ON DELETE SET NULL,

    INDEX idx_cls_customer (customer_id, sort_order),
    INDEX idx_cls_architect (architect_id),
    INDEX idx_cls_source_type (source_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
