-- Powder coating replaces the cabinet-level "Include Lighting" option.
--
-- Cost = the cabinet's BOX surface area x a per-sqft rate set on the cabinet type, next to
-- its fixed price. Box area (2WD + 2DH + WH) is used regardless of the material's
-- calculation type, because the coating is applied to the whole carcass.

-- The rate lives on the catalog record, so it is set once and reused by every quotation.
ALTER TABLE cabinet_types
    ADD COLUMN powder_coating_rate_per_sqft DECIMAL(10,2) NOT NULL DEFAULT 0
        COMMENT 'Powder coating price per sqft; 0 disables the option for this cabinet type';

-- powder_coating is the user's per-line choice; powder_coating_cost is the resulting amount,
-- computed server-side from the catalog rate and stored so the quotation stays reproducible
-- even if the rate is edited later.
ALTER TABLE quotation_cabinets
    ADD COLUMN powder_coating BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN powder_coating_cost DECIMAL(10,2) NOT NULL DEFAULT 0;

-- quotation_cabinets.lighting_cost is deliberately NOT dropped. The checkbox that set it is
-- gone from the UI, but existing quotations keep their stored amount so their totals stay
-- exactly as quoted. New lines simply leave it at 0.
