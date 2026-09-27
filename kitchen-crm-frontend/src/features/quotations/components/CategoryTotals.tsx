/**
 * CategoryTotals Component
 * Category-wise breakdown of totals. Base and margin rows are internal and shown to super
 * admins only; tax and the category total are what the customer pays, so everyone sees them.
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Package, DoorClosed, Lightbulb, Wrench, Receipt } from 'lucide-react';
import { useIsSuperAdmin } from '@/features/auth/useIsSuperAdmin';
import type { QuotationOtherExpense } from '../types';

export interface CategoryTotalsProps {
  accessories: Array<{ id?: number; name?: string; totalPrice?: number; price?: number }>;
  cabinets: Array<{ id?: number; name?: string; totalPrice?: number; price?: number }>;
  doors: Array<{ id?: number; name?: string; totalPrice?: number; price?: number }>;
  lighting: Array<{ id?: number; name?: string; totalPrice?: number; price?: number }>;
  otherExpenses?: QuotationOtherExpense[];
  // Category-specific margin percentages
  accessoriesMarginPercentage: number;
  cabinetsMarginPercentage: number;
  doorsMarginPercentage: number;
  lightingMarginPercentage: number;
  // Category-specific tax percentages
  accessoriesTaxPercentage: number;
  cabinetsTaxPercentage: number;
  doorsTaxPercentage: number;
  lightingTaxPercentage: number;

  // Miscellaneous (Other Expenses) margin & tax
  miscellaneousMarginPercentage?: number;
  miscellaneousTaxPercentage?: number;
  /**
   * Per-category totals as computed by the SERVER (margin and tax already applied). Staff are
   * sent neither unit prices nor margins, so the client-side figure is 0 for them - these are
   * the only correct numbers. A super admin keeps the live calculation.
   */
  serverCategoryTotals?: {
    accessories?: number | null;
    cabinets?: number | null;
    doors?: number | null;
    lighting?: number | null;
  };
  // Optional kitchen name for context
  kitchenName?: string;
}

interface CategoryBreakdown {
  baseTotal: number;
  marginAmount: number;
  totalBeforeTax: number;
  taxAmount: number;
  finalTotal: number;
}

export function CategoryTotals({
  accessories,
  cabinets,
  doors,
  lighting,
  accessoriesMarginPercentage,
  cabinetsMarginPercentage,
  doorsMarginPercentage,
  lightingMarginPercentage,
  accessoriesTaxPercentage,
  cabinetsTaxPercentage,
  doorsTaxPercentage,
  otherExpenses = [],
  lightingTaxPercentage,
  miscellaneousMarginPercentage = 0,
  miscellaneousTaxPercentage = 18,
  serverCategoryTotals,
  kitchenName,
}: CategoryTotalsProps) {
  // Read the role here rather than threading a prop through every call site.
  const isSuperAdmin = useIsSuperAdmin();
  const calculateCategoryTotal = (
    items: Array<{ totalPrice?: number; price?: number }>,
    marginPercentage: number,
    taxPercentage: number
  ): CategoryBreakdown => {
    const baseTotal = items.reduce((sum, item) => sum + (item.totalPrice ?? item.price ?? 0), 0);
    const marginAmount = (baseTotal * marginPercentage) / 100;
    const totalBeforeTax = baseTotal + marginAmount;
    const taxAmount = (totalBeforeTax * taxPercentage) / 100;
    const finalTotal = totalBeforeTax + taxAmount;

    return {
      baseTotal,
      marginAmount,
      totalBeforeTax,
      taxAmount,
      finalTotal,
    };
  };

  /**
   * Swap in the server figure when the viewer cannot compute one. taxAmount is derived from the
   * final total and the rate, which needs neither cost nor margin. finalTotal null = genuinely
   * not known yet (an unsaved quotation).
   */
  const withServerTotal = (
    computed: CategoryBreakdown,
    server: number | null | undefined,
    taxPercentage: number,
    itemCount: number,
  ): Omit<CategoryBreakdown, 'finalTotal'> & { finalTotal: number | null } => {
    if (isSuperAdmin) return computed;
    if (server == null) {
      return { ...computed, taxAmount: 0, finalTotal: itemCount === 0 ? 0 : null };
    }
    const finalTotal = Number(server);
    const taxAmount = taxPercentage > 0 ? (finalTotal * taxPercentage) / (100 + taxPercentage) : 0;
    return { ...computed, taxAmount, finalTotal };
  };

  const categories = useMemo(() => {
    return [
      {
        label: 'Accessories',
        icon: Wrench,
        color: 'text-text-600',
        items: accessories,
        breakdown: withServerTotal(calculateCategoryTotal(accessories, accessoriesMarginPercentage, accessoriesTaxPercentage),
          serverCategoryTotals?.accessories, accessoriesTaxPercentage, accessories.length),
        marginPercentage: accessoriesMarginPercentage,
        taxPercentage: accessoriesTaxPercentage,
      },
      {
        label: 'Cabinets',
        icon: Package,
        color: 'text-text-600',
        items: cabinets,
        breakdown: withServerTotal(calculateCategoryTotal(cabinets, cabinetsMarginPercentage, cabinetsTaxPercentage),
          serverCategoryTotals?.cabinets, cabinetsTaxPercentage, cabinets.length),
        marginPercentage: cabinetsMarginPercentage,
        taxPercentage: cabinetsTaxPercentage,
      },
      {
        label: 'Doors',
        icon: DoorClosed,
        color: 'text-text-600',
        items: doors,
        breakdown: withServerTotal(calculateCategoryTotal(doors, doorsMarginPercentage, doorsTaxPercentage),
          serverCategoryTotals?.doors, doorsTaxPercentage, doors.length),
        marginPercentage: doorsMarginPercentage,
        taxPercentage: doorsTaxPercentage,
      },
      {
        label: 'Lighting',
        icon: Lightbulb,
        color: 'text-text-600',
        items: lighting,
        breakdown: withServerTotal(calculateCategoryTotal(lighting, lightingMarginPercentage, lightingTaxPercentage),
          serverCategoryTotals?.lighting, lightingTaxPercentage, lighting.length),
        marginPercentage: lightingMarginPercentage,
        taxPercentage: lightingTaxPercentage,
      },
    ];
  }, [
    accessories,
    cabinets,
    doors,
    lighting,
    accessoriesMarginPercentage,
    accessoriesTaxPercentage,
    cabinetsMarginPercentage,
    cabinetsTaxPercentage,
    doorsMarginPercentage,
    doorsTaxPercentage,
    lightingMarginPercentage,
    lightingTaxPercentage,
  ]);

  const otherExpensesBase = otherExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const miscMargin = (otherExpensesBase * miscellaneousMarginPercentage) / 100;
  const miscWithMargin = otherExpensesBase + miscMargin;
  const miscTax = (miscWithMargin * miscellaneousTaxPercentage) / 100;
  const otherExpensesFinal = miscWithMargin + miscTax;
  // One unknown category makes the whole figure unknown - better a dash than a number that
  // is quietly missing a category.
  const anyUnknown = categories.some((cat) => cat.breakdown.finalTotal == null);
  const grandTotal: number | null = anyUnknown
    ? null
    : categories.reduce((sum, cat) => sum + (cat.breakdown.finalTotal as number), 0) + otherExpensesFinal;

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="p-4 sm:p-5 bg-background-800 border-background-600 rounded-xl">
        <h3 className="text-sm font-[650] text-text-900 mb-4">
          Category Breakdown{kitchenName ? ` — ${kitchenName}` : ''}
        </h3>

        <div className="space-y-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const hasItems = category.items.length > 0;

            return (
              <div
                key={category.label}
                className="p-3.5 rounded-xl bg-background-700/40 border border-background-600"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <Icon className={`h-3.5 w-3.5 ${category.color}`} />
                  <span className="font-semibold text-[13px] text-text-900">{category.label}</span>
                  <span className="text-[11px] text-text-500 ml-auto">
                    {category.items.length} item{category.items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {hasItems ? (
                  <div className="space-y-1.5 text-xs">
                    {isSuperAdmin && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-text-600">Base Total</span>
                          <span className="text-text-900 font-medium tabular-nums">
                            ₹{category.breakdown.baseTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-600">Margin ({category.marginPercentage}%)</span>
                          <span className="text-text-900 font-medium tabular-nums">
                            ₹{category.breakdown.marginAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </>
                    )}
                    {category.breakdown.finalTotal != null && (
                      <div className="flex justify-between">
                        <span className="text-text-600">Tax ({category.taxPercentage}%)</span>
                        <span className="text-text-900 font-medium tabular-nums">
                          ₹{Math.round(category.breakdown.taxAmount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1.5 border-t border-background-600">
                      <span className="font-semibold text-text-800">Category Total</span>
                      <span className="font-semibold text-text-900 tabular-nums">
                        {category.breakdown.finalTotal == null
                          ? '—'
                          : `₹${category.breakdown.finalTotal.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-text-500 text-center py-2">No items added</div>
                )}
              </div>
            );
          })}
          {/* Miscellaneous (Other Expenses) */}
          {otherExpenses.length > 0 && otherExpensesBase > 0 && (
            <div className="p-3.5 rounded-xl bg-background-700/40 border border-background-600">
              <div className="flex items-center gap-2 mb-2.5">
                <Receipt className="h-3.5 w-3.5 text-text-600" />
                <span className="font-semibold text-[13px] text-text-900">Miscellaneous</span>
                <span className="text-[11px] text-text-500 ml-auto">
                  {otherExpenses.filter(e => e.amount > 0).length} item{otherExpenses.filter(e => e.amount > 0).length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                {isSuperAdmin && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-text-600">Base Total</span>
                      <span className="text-text-900 font-medium tabular-nums">
                        ₹{otherExpensesBase.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-600">Margin ({miscellaneousMarginPercentage}%)</span>
                      <span className="text-text-900 font-medium tabular-nums">
                        ₹{miscMargin.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-text-600">Tax ({miscellaneousTaxPercentage}%)</span>
                  <span className="text-text-900 font-medium tabular-nums">
                    ₹{miscTax.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-background-600">
                  <span className="font-semibold text-text-800">Miscellaneous Total</span>
                  <span className="font-semibold text-text-900 tabular-nums">
                    ₹{otherExpensesFinal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="mt-4 pt-3 border-t border-background-600">
          <div className="flex justify-between items-baseline">
            <span className="text-[13px] font-[650] text-text-900">Grand Total</span>
            <span className="text-xl font-bold text-primary-600 tabular-nums">
              {grandTotal == null ? '—' : `₹${grandTotal.toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default CategoryTotals;
