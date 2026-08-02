-- Builders are not a separate module: the architects table now holds both Architects and
-- Builders, distinguished by partner_type and filtered with chips in the Architects module.
--
-- VARCHAR, not a native MySQL ENUM, on purpose. V79 and V89 in this same migration set exist
-- only because ENUM columns drifted from their Java enums and started rejecting inserts under
-- STRICT_TRANS_TABLES. VARCHAR + @Enumerated(STRING) makes a future partner type (interior
-- designer, contractor, ...) a code-only change. V78's own comment makes the same point.
--
-- NOT NULL DEFAULT 'ARCHITECT' is itself the backfill: MySQL 8 stamps every pre-existing row as
-- ARCHITECT, and ADD COLUMN with a literal default is an INSTANT operation, so this neither
-- rebuilds nor long-locks the live table.
ALTER TABLE architects
    ADD COLUMN partner_type VARCHAR(20) NOT NULL DEFAULT 'ARCHITECT'
        COMMENT 'ARCHITECT or BUILDER';

-- Backs the module type filter and the inline-create duplicate lookup
-- (findFirstByPartnerTypeAndArchitectureNameIgnoreCase).
-- architects already has idx_architects_name (architecture_name) from V32.
CREATE INDEX idx_architects_partner_type_name ON architects (partner_type, architecture_name);
