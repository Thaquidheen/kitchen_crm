-- Fix: deleting a customer failed with HTTP 500 / MySQL error 1451.
--
--   Cannot delete or update a parent row: a foreign key constraint fails
--   (`kitchen_crm`.`quotation_folders`, CONSTRAINT `fk_quotation_folders_customer`
--    FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`))
--
-- V82 created quotation_folders.customer_id with no ON DELETE action, so it defaulted to
-- RESTRICT while every other customer child table cascades. Any customer that had ever had
-- a quotation owned a folder, and so could never be deleted.

ALTER TABLE quotation_folders DROP FOREIGN KEY fk_quotation_folders_customer;
ALTER TABLE quotation_folders
    ADD CONSTRAINT fk_quotation_folders_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- quotations is reachable from customers by two cascade paths: directly via customer_id,
-- and via customers -> quotation_folders -> quotations. InnoDB does not define the order
-- it walks sibling cascade paths, and on this schema it reaches quotation_folders first —
-- so deleting the folder tripped fk_quotations_folder's RESTRICT while the quotation rows
-- were still present, failing the delete for the same reason one constraint later.
--
-- Cascading here matches what the application already does by hand in
-- QuotationServiceImpl.deleteFolder (delete every version, then the folder), so the
-- observable behaviour of deleting a folder is unchanged. The business guard that matters
-- — refusing to delete a folder holding an approved quotation — lives in that service
-- method and is unaffected.
ALTER TABLE quotations DROP FOREIGN KEY fk_quotations_folder;
ALTER TABLE quotations
    ADD CONSTRAINT fk_quotations_folder
    FOREIGN KEY (folder_id) REFERENCES quotation_folders(id) ON DELETE CASCADE;
