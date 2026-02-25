ALTER TABLE quotation_cabinets ADD COLUMN linked_door_type_id BIGINT NULL;
ALTER TABLE quotation_cabinets ADD CONSTRAINT fk_cabinet_linked_door_type
    FOREIGN KEY (linked_door_type_id) REFERENCES door_types(id);
