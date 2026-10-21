-- Margin codes: the administrator names each margin percentage with a code (for example R = 45%).
-- Staff allowed to see margins see, and choose, the code only; the percentage stays with the
-- administrator. Quotations keep storing the percentage; the code is looked up from it.
--
--   code        unique (case-insensitive by the collation), letters/digits, e.g. "R", "K2"
--   percentage  unique: one code per percentage, so a quotation's margin shows one code
--   active      switched off = no longer offered to staff; quotations using it still show it
--
-- Rollback safety: additive only, numbered above V160 (highest applied). A new table the previous
-- jar has no entity for, so it validates and runs unchanged against this schema.

CREATE TABLE margin_codes (
    id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(12)   NOT NULL,
    percentage  DECIMAL(6, 2) NOT NULL,
    active      BOOLEAN       NOT NULL DEFAULT TRUE,
    note        VARCHAR(255)  NULL,
    created_at  DATETIME      NOT NULL,
    updated_at  DATETIME      NULL,
    CONSTRAINT uq_margin_codes_code UNIQUE (code),
    CONSTRAINT uq_margin_codes_percentage UNIQUE (percentage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Codes standing for margin percentages, shown to staff instead of the percentage';
