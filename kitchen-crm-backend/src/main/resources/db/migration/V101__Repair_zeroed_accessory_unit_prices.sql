-- Repair accessory lines whose unit price was silently zeroed.
--
-- Cause: staff are not sent unitPrice (it is withheld in loadAccessories so employees cannot see
-- cost). The quotation builder coerced that missing value to 0, sent the 0 back on the next save,
-- and resolveAccessoryUnitPrice accepted it because its guard was a plain != null check. Any
-- quotation a staff member opened and saved had every accessory price overwritten with zero, and
-- the line totals recomputed from it. Cabinets and doors were unaffected because PricingServiceImpl
-- recomputes their unit price from dimensions; accessories persist the client value verbatim.
--
-- Both ends are fixed in this release (the builder keeps the absence as undefined, and the resolver
-- treats a non-positive price as "not supplied"). This migration heals the rows already damaged.
--
-- Only catalogued lines are touched: a custom line with no accessory_id may legitimately be zero,
-- so it is left exactly as it is.

UPDATE quotation_accessories qa
  JOIN accessories a ON a.id = qa.accessory_id
   SET qa.unit_price = CASE
                          WHEN a.company_price IS NOT NULL AND a.company_price > 0 THEN a.company_price
                          ELSE COALESCE(a.mrp, 0)
                       END
 WHERE COALESCE(qa.unit_price, 0) <= 0
   AND qa.accessory_id IS NOT NULL
   AND COALESCE(a.company_price, a.mrp, 0) > 0;

-- Recompute the line totals for exactly those rows, mirroring
-- PricingServiceImpl.calculateAccessoryLineTotal: base = unit_price x quantity, then margin, then
-- tax on the margined amount. The percentage divisions are rounded to 4dp there, so they are here.
UPDATE quotation_accessories qa
  JOIN quotations q ON q.id = qa.quotation_id
   SET qa.total_price =
         (qa.unit_price * qa.quantity)
         * (1 + ROUND(COALESCE(q.accessories_margin_percentage, 0) / 100, 4))
         * (1 + ROUND(COALESCE(q.accessories_tax_percentage, 0) / 100, 4))
 WHERE COALESCE(qa.total_price, 0) <= 0
   AND COALESCE(qa.unit_price, 0) > 0
   AND qa.quantity IS NOT NULL;

-- The per-category aggregates on quotations were computed from the zeroed lines, so accessories
-- currently contribute exactly nothing to them. That makes this a clean delta: recompute the four
-- accessories_* columns from the repaired lines and add the same figures to the quotation-level
-- subtotal / margin / tax / total. Guarded on accessories_final_total = 0 so a quotation whose
-- accessories were always priced correctly is never touched, and no value is ever double-counted.
UPDATE quotations q
  JOIN (
        SELECT qa.quotation_id AS qid, SUM(qa.unit_price * qa.quantity) AS base
          FROM quotation_accessories qa
         WHERE COALESCE(qa.unit_price, 0) > 0
         GROUP BY qa.quotation_id
       ) s ON s.qid = q.id
   SET q.accessories_base_total   = s.base,
       q.accessories_margin_amount = s.base * ROUND(COALESCE(q.accessories_margin_percentage, 0) / 100, 4),
       q.accessories_tax_amount    = (s.base * (1 + ROUND(COALESCE(q.accessories_margin_percentage, 0) / 100, 4)))
                                     * ROUND(COALESCE(q.accessories_tax_percentage, 0) / 100, 4),
       q.accessories_final_total   = s.base
                                     * (1 + ROUND(COALESCE(q.accessories_margin_percentage, 0) / 100, 4))
                                     * (1 + ROUND(COALESCE(q.accessories_tax_percentage, 0) / 100, 4)),
       q.subtotal      = COALESCE(q.subtotal, 0) + s.base,
       q.margin_amount = COALESCE(q.margin_amount, 0)
                         + s.base * ROUND(COALESCE(q.accessories_margin_percentage, 0) / 100, 4),
       q.tax_amount    = COALESCE(q.tax_amount, 0)
                         + (s.base * (1 + ROUND(COALESCE(q.accessories_margin_percentage, 0) / 100, 4)))
                           * ROUND(COALESCE(q.accessories_tax_percentage, 0) / 100, 4),
       q.total_amount  = COALESCE(q.total_amount, 0)
                         + s.base
                           * (1 + ROUND(COALESCE(q.accessories_margin_percentage, 0) / 100, 4))
                           * (1 + ROUND(COALESCE(q.accessories_tax_percentage, 0) / 100, 4))
 WHERE COALESCE(q.accessories_final_total, 0) = 0;

-- Same treatment for the per-kitchen aggregates, which carry the identical column set.
UPDATE quotation_kitchens k
  JOIN quotations q ON q.id = k.quotation_id
  JOIN (
        SELECT qa.kitchen_id AS kid, SUM(qa.unit_price * qa.quantity) AS base
          FROM quotation_accessories qa
         WHERE COALESCE(qa.unit_price, 0) > 0 AND qa.kitchen_id IS NOT NULL
         GROUP BY qa.kitchen_id
       ) s ON s.kid = k.id
   SET k.accessories_base_total    = s.base,
       k.accessories_margin_amount = s.base * ROUND(COALESCE(q.accessories_margin_percentage, 0) / 100, 4),
       k.accessories_tax_amount    = (s.base * (1 + ROUND(COALESCE(q.accessories_margin_percentage, 0) / 100, 4)))
                                     * ROUND(COALESCE(q.accessories_tax_percentage, 0) / 100, 4),
       k.accessories_final_total   = s.base
                                     * (1 + ROUND(COALESCE(q.accessories_margin_percentage, 0) / 100, 4))
                                     * (1 + ROUND(COALESCE(q.accessories_tax_percentage, 0) / 100, 4)),
       k.subtotal      = COALESCE(k.subtotal, 0) + s.base,
       k.margin_amount = COALESCE(k.margin_amount, 0)
                         + s.base * ROUND(COALESCE(q.accessories_margin_percentage, 0) / 100, 4),
       k.tax_amount    = COALESCE(k.tax_amount, 0)
                         + (s.base * (1 + ROUND(COALESCE(q.accessories_margin_percentage, 0) / 100, 4)))
                           * ROUND(COALESCE(q.accessories_tax_percentage, 0) / 100, 4),
       k.total_amount  = COALESCE(k.total_amount, 0)
                         + s.base
                           * (1 + ROUND(COALESCE(q.accessories_margin_percentage, 0) / 100, 4))
                           * (1 + ROUND(COALESCE(q.accessories_tax_percentage, 0) / 100, 4))
 WHERE COALESCE(k.accessories_final_total, 0) = 0;
