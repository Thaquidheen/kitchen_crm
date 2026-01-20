-- Drop obsolete triggers that reference removed columns (mrp, discount_percentage, company_price)
-- These triggers were created in V2 but V58 removed the columns they depend on

DROP TRIGGER IF EXISTS cabinet_types_company_price_trigger;
DROP TRIGGER IF EXISTS cabinet_types_company_price_update_trigger;
