-- A customer's requirement sheet: the company's paper checklist (cabinet material, units,
-- accessories, sink, appliances, design, doors, finishes, special requests), filled in per customer.
--
-- One row per item that something was entered for. The list of items itself lives in the
-- application (RequirementSheetCatalogue), so an item with no row is simply not marked yet, and a
-- checklist item that is cleared again loses its row. Rows staff add themselves ("+ Add item") are
-- custom rows: their key is custom.<random>, they carry their own label and keep their place in the
-- section by sort_order.
--
--   item_key     e.g. appliances.burner, or custom.1a2b3c4d — one row per item per customer
--   section_key  e.g. appliances; the section a custom row was added to
--   label        the name of a custom row; null for checklist items (the application names them)
--   status       NEEDED | NOT_NEEDED; null while the item is not marked
--   choice       the quick options chosen, e.g. "60 cm,Built-in", in the order the options are listed
--   quantity     how many, when it matters
--   note         anything else about the item
--
-- Plain VARCHAR rather than ENUM for status, so a later value is never a schema change.
--
-- Rollback safety: additive only, numbered above V165 (highest applied). A new table the previous
-- jar has no entity for, so it validates and runs unchanged against this schema. The foreign key
-- cascades, so the previous jar's "delete customer" still works: it takes the sheet with it. Rolled
-- back, the sheet is not shown anywhere but nothing in it is lost.

CREATE TABLE customer_requirement_items (
    id                 BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    customer_id        BIGINT        NOT NULL,
    item_key           VARCHAR(80)   NOT NULL,
    section_key        VARCHAR(40)   NOT NULL,
    label              VARCHAR(255)  NULL,
    status             VARCHAR(12)   NULL,
    choice             VARCHAR(160)  NULL,
    quantity           DECIMAL(10,2) NULL,
    note               VARCHAR(1000) NULL,
    sort_order         INT           NULL,
    updated_by_user_id BIGINT        NULL,
    updated_by_name    VARCHAR(255)  NULL,
    updated_at         DATETIME      NOT NULL,
    CONSTRAINT uk_customer_requirement_item UNIQUE (customer_id, item_key),
    CONSTRAINT fk_customer_requirement_items_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='What each customer needs, item by item, from the requirement checklist';
