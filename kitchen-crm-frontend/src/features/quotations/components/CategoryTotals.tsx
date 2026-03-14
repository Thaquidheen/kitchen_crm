/**
 * CategoryTotals Component
 * Displays category-wise breakdown of totals including base, margin, tax, and final amounts
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Package, DoorClosed, Lightbulb, Wrench, Receipt } from 'lucide-react';
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
  kitchenName,
}: CategoryTotalsProps) {
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

  const categories = useMemo(() => {
    return [
      {
        label: 'Accessories',
        icon: Wrench,
        color: 'text-info',
        items: accessories,
        breakdown: calculateCategoryTotal(accessories, accessoriesMarginPercentage, accessoriesTaxPercentage),
        marginPercentage: accessoriesMarginPercentage,
        taxPercentage: accessoriesTaxPercentage,
      },
      {
        label: 'Cabinets',
        icon: Package,
        color: 'text-success',
        items: cabinets,
        breakdown: calculateCategoryTotal(cabinets, cabinetsMarginPercentage, cabinetsTaxPercentage),
        marginPercentage: cabinetsMarginPercentage,
        taxPercentage: cabinetsTaxPercentage,
      },
      {
        label: 'Doors',
        icon: DoorClosed,
        color: 'text-purple-500',
        items: doors,
        breakdown: calculateCategoryTotal(doors, doorsMarginPercentage, doorsTaxPercentage),
        marginPercentage: doorsMarginPercentage,
        taxPercentage: doorsTaxPercentage,
      },
      {
        label: 'Lighting',
        icon: Lightbulb,
        color: 'text-accent-500',
        items: lighting,
        breakdown: calculateCategoryTotal(lighting, lightingMarginPercentage, lightingTaxPercentage),
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
  const grandTotal = categories.reduce((sum, cat) => sum + cat.breakdown.finalTotal, 0) + otherExpensesFinal;

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
        <h3 className="text-base sm:text-lg font-bold text-text-900 mb-3 sm:mb-4">
          Category Breakdown{kitchenName ? ` - ${kitchenName}` : ''}
        </h3>

        <div className="space-y-3 sm:space-y-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const hasItems = category.items.length > 0;

            return (
              <div
                key={category.label}
                className="p-3 sm:p-4 rounded-lg bg-background-700 border border-background-600"
              >
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${category.color}`} />
                  <span className="font-semibold text-xs sm:text-sm text-text-900">{category.label}</span>
                  <span className="text-xs text-text-600 ml-auto">
                    {category.items.length} item{category.items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {hasItems ? (
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-700">Base Total</span>
                      <span className="text-text-800">
                        ₹{category.breakdown.baseTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-700">Margin ({category.marginPercentage}%)</span>
                      <span className="text-text-800">
                        ₹{category.breakdown.marginAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-700">Tax ({category.taxPercentage}%)</span>
                      <span className="text-text-800">
                        ₹{category.breakdown.taxAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-background-600">
                      <span className="font-semibold text-text-800">Category Total</span>
                      <span className="font-bold text-text-900">
                        ₹{category.breakdown.finalTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-text-600 text-center py-2">No items added</div>
                )}
              </div>
            );
          })}
          {/* Miscellaneous (Other Expenses) */}
          {otherExpenses.length > 0 && otherExpensesBase > 0 && (
            <div className="p-3 sm:p-4 rounded-lg bg-background-700 border border-background-600">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-text-600" />
                <span className="font-semibold text-xs sm:text-sm text-text-900">Miscellaneous</span>
                <span className="text-xs text-text-600 ml-auto">
                  {otherExpenses.filter(e => e.amount > 0).length} item{otherExpenses.filter(e => e.amount > 0).length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-text-700">Base Total</span>
                  <span className="text-text-800">
                    ₹{otherExpensesBase.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-700">Margin ({miscellaneousMarginPercentage}%)</span>
                  <span className="text-text-800">
                    ₹{miscMargin.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-700">Tax ({miscellaneousTaxPercentage}%)</span>
                  <span className="text-text-800">
                    ₹{miscTax.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-background-600">
                  <span className="font-semibold text-text-800">Miscellaneous Total</span>
                  <span className="font-bold text-text-900">
                    ₹{otherExpensesFinal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t-2 border-primary-700">
          <div className="flex justify-between items-center">
            <span className="text-base sm:text-lg font-bold text-text-900">Grand Total</span>
            <span className="text-xl sm:text-2xl font-bold text-primary-600">
              ₹{grandTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default CategoryTotals;
