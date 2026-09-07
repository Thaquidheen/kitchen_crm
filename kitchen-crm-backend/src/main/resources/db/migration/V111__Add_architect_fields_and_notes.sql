-- Architects & Builders: email, location, a highlight flag, and an append-only notes feed.
--
-- email/location are ordinary nullable contact fields. `highlighted` lets the team star key
-- partners so they float to the top of the list — additive NOT NULL DEFAULT FALSE, matching how
-- partner_type was added in V91. architect_notes is a running note history (one row per note),
-- mirroring how customer notes append to workflow_history rather than overwriting a text column.
--
-- All additive and nullable/defaulted, so the previously deployed jar (which maps none of these)
-- keeps working against this schema — rollback stays jar-only.

ALTER TABLE architects
    ADD COLUMN email VARCHAR(255) NULL COMMENT 'Contact email',
    ADD COLUMN location VARCHAR(255) NULL COMMENT 'City / area',
    ADD COLUMN highlighted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Starred to float to the top of the list';

CREATE INDEX idx_architects_highlighted ON architects (highlighted);

CREATE TABLE architect_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    architect_id BIGINT NOT NULL,
    note TEXT NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_architect_notes_architect FOREIGN KEY (architect_id)
        REFERENCES architects (id) ON DELETE CASCADE,
    INDEX idx_architect_notes_architect (architect_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
