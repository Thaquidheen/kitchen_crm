-- Sub-stages for the production checklist.
--
-- "Stage 1/2/3" were never hardcoded: they are ordinary rows in production_task_groups, seeded per
-- job from ProductionStageTemplate and editable afterwards. The only thing missing was depth — a
-- group could not sit inside another, so a stage could hold tasks but not sub-stages.
--
-- One nullable self-reference adds that: parent_group_id NULL means the row is a stage, and a row
-- with a parent is a sub-stage of it. Deliberately nullable and additive, so the previously
-- deployed jar keeps working against this schema (it simply never maps the column and renders
-- every group flat) and no existing job is rewritten.
--
-- ON DELETE CASCADE mirrors the JPA orphanRemoval on the entity: removing a stage removes the
-- sub-stages beneath it, rather than leaving them orphaned and invisible.

ALTER TABLE production_task_groups
    ADD COLUMN parent_group_id BIGINT NULL,
    ADD CONSTRAINT fk_ptg_parent FOREIGN KEY (parent_group_id)
        REFERENCES production_task_groups (id) ON DELETE CASCADE,
    ADD INDEX idx_ptg_parent (parent_group_id);
