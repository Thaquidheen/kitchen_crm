/**
 * CategoryPricingPanel Component
 * Shows separate margin and tax inputs for each product category
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Calculator, TrendingUp, Percent, Receipt } from 'lucide-react';
import clsx from 'clsx';
import type { QuotationOtherExpense } from '../types';

interface CategorySectionProps {
  label: string;
  icon: React.ReactNode;
  color: string;
  subtotal: number;
  marginPercent: number;
  taxPercent: number;
  onMarginChange?: (value: number) => void;
  onTaxChange: (value: number) => void;
  total: { marginAmount: number; finalTotal: number };
  showMargins: boolean;
}

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';

function CategorySection({
  label,
  icon,
  color,
  subtotal,
  marginPercent,
  taxPercent,
  onMarginChange,
  onTaxChange,
  total,
  showMargins,
}: CategorySectionProps) {
  const [marginStr, setMarginStr] = useState(marginPercent ? String(marginPercent) : '');
  const [taxStr, setTaxStr] = useState(taxPercent ? String(taxPercent) : '');

  useEffect(() => {
    const localNum = marginStr === '' ? 0 : parseFloat(marginStr);
    if (isNaN(localNum) || localNum !== marginPercent) {
      setMarginStr(marginPercent ? String(marginPercent) : '');
    }
  }, [marginPercent]);

  useEffect(() => {
    const localNum = taxStr === '' ? 0 : parseFloat(taxStr);
    if (isNaN(localNum) || localNum !== taxPercent) {
      setTaxStr(taxPercent ? String(taxPercent) : '');
    }
  }, [taxPercent]);

  const handleMarginInput = (value: string) => {
    setMarginStr(value);
    const num = value === '' ? 0 : parseFloat(value);
    if (!isNaN(num) && onMarginChange) {
      onMarginChange(Math.max(0, Math.min(num, 100)));
    }
  };

  const handleTaxInput = (value: string) => {
    setTaxStr(value);
    const num = value === '' ? 0 : parseFloat(value);
    if (!isNaN(num)) {
      onTaxChange(Math.max(0, Math.min(num, 100)));
    }
  };

  return (
    <div className="border border-background-600 rounded-xl p-3.5 bg-background-800/50">
      <div className="flex items-center gap-2 mb-2.5">
        <div className={clsx('flex h-7 w-7 items-center justify-center rounded-lg', color)}>
          {icon}
        </div>
        <h4 className="text-[13px] font-semibold text-text-900">{label}</h4>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-xs">
          <span className="text-text-600">Subtotal</span>
          <span className="font-medium text-text-900 tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
        </div>

        {/* Margin Input - Only visible to Super Admin */}
        {showMargins && (
          <div>
            <label className="block text-xs font-medium text-text-700 mb-1">
              Margin (%)
            </label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                value={marginStr}
                onChange={(e) => handleMarginInput(e.target.value)}
                placeholder="0"
                className="text-xs sm:text-sm"
                title="Adjust margin per quotation for discounts/alterations (Super Admin only)"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-600" />
            </div>
            <p className="text-[11px] text-text-500 mt-1">
              ₹{total.marginAmount.toLocaleString('en-IN')} margin added
            </p>
          </div>
        )}

        {/* Tax Input */}
        <div>
          <label className="block text-xs font-medium text-text-700 mb-1">
            Tax (%)
          </label>
          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              value={taxStr}
              onChange={(e) => handleTaxInput(e.target.value)}
              placeholder="0"
              className="text-xs sm:text-sm"
            />
            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-600" />
          </div>
        </div>

        {/* Category Total */}
        <div className="border-t border-background-600 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-600">Category Total</span>
            <span className="text-[13px] font-semibold text-text-900 tabular-nums">
              ₹{total.finalTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface CategoryPricingPanelProps {
  // Products per category
  accessories: any[];
  cabinets: any[];
  doors: any[];
  lighting: any[];

  // Category-specific margin percentages
  accessoriesMargin: number;
  cabinetsMargin: number;
  doorsMargin: number;
  lightingMargin: number;

  // Category-specific tax percentages
  accessoriesTax: number;
  cabinetsTax: number;
  doorsTax: number;
  lightingTax: number;

  // Callbacks for margin changes (optional for staff users)
  onAccessoriesMarginChange?: (value: number) => void;
  onCabinetsMarginChange?: (value: number) => void;
  onDoorsMarginChange?: (value: number) => void;
  onLightingMarginChange?: (value: number) => void;

  // Callbacks for tax changes
  onAccessoriesTaxChange: (value: number) => void;
  onCabinetsTaxChange: (value: number) => void;
  onDoorsTaxChange: (value: number) => void;
  onLightingTaxChange: (value: number) => void;

  // Other Expenses (Transportation, Installation, custom items)
  otherExpenses?: QuotationOtherExpense[];

  // Miscellaneous (Other Expenses) margin & tax
  miscellaneousMarginPercentage?: number;
  miscellaneousTaxPercentage?: number;

  // Callbacks for miscellaneous margin/tax changes
  onMiscellaneousMarginChange?: (value: number) => void;
  onMiscellaneousTaxChange?: (value: number) => void;

  // User role for conditional rendering
  userRole?: 'ROLE_SUPER_ADMIN' | 'ROLE_STAFF';

  // Optional kitchen name for context
  kitchenName?: string;
}

export function CategoryPricingPanel({
  accessories,
  cabinets,
  doors,
  lighting,
  accessoriesMargin,
  cabinetsMargin,
  doorsMargin,
  lightingMargin,
  accessoriesTax,
  cabinetsTax,
  doorsTax,
  lightingTax,
  onAccessoriesMarginChange,
  onCabinetsMarginChange,
  onDoorsMarginChange,
  onLightingMarginChange,
  onAccessoriesTaxChange,
  onCabinetsTaxChange,
  onDoorsTaxChange,
  onLightingTaxChange,
  otherExpenses = [],
  miscellaneousMarginPercentage = 0,
  miscellaneousTaxPercentage = 18,
  onMiscellaneousMarginChange,
  onMiscellaneousTaxChange,
  userRole = 'ROLE_SUPER_ADMIN',
  kitchenName,
}: CategoryPricingPanelProps) {

  const showMargins = userRole === 'ROLE_SUPER_ADMIN';

  const otherExpensesTotal = useMemo(() => {
    const base = otherExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const margin = (base * miscellaneousMarginPercentage) / 100;
    const withMargin = base + margin;
    const tax = (withMargin * miscellaneousTaxPercentage) / 100;
    return withMargin + tax;
  }, [otherExpenses, miscellaneousMarginPercentage, miscellaneousTaxPercentage]);

  const categorySubtotals = useMemo(() => {
    const accessoriesSubtotal = accessories.reduce((sum, item) => sum + (item.totalPrice ?? item.price ?? 0), 0);
    const cabinetsSubtotal = cabinets.reduce((sum, item) => sum + (item.totalPrice ?? item.price ?? 0), 0);
    const doorsSubtotal = doors.reduce((sum, item) => sum + (item.totalPrice ?? item.price ?? 0), 0);
    const lightingSubtotal = lighting.reduce((sum, item) => sum + (item.totalPrice ?? item.price ?? 0), 0);

    return {
      accessories: accessoriesSubtotal,
      cabinets: cabinetsSubtotal,
      doors: doorsSubtotal,
      lighting: lightingSubtotal,
    };
  }, [accessories, cabinets, doors, lighting]);

  const categoryTotals = useMemo(() => {
    const calculateCategoryTotal = (subtotal: number, marginPercent: number, taxPercent: number) => {
      const marginAmount = (subtotal * marginPercent) / 100;
      const totalBeforeTax = subtotal + marginAmount;
      const taxAmount = (totalBeforeTax * taxPercent) / 100;
      return {
        subtotal,
        marginAmount,
        totalBeforeTax,
        taxAmount,
        finalTotal: totalBeforeTax + taxAmount,
      };
    };

    return {
      accessories: calculateCategoryTotal(categorySubtotals.accessories, accessoriesMargin, accessoriesTax),
      cabinets: calculateCategoryTotal(categorySubtotals.cabinets, cabinetsMargin, cabinetsTax),
      doors: calculateCategoryTotal(categorySubtotals.doors, doorsMargin, doorsTax),
      lighting: calculateCategoryTotal(categorySubtotals.lighting, lightingMargin, lightingTax),
    };
  }, [categorySubtotals, accessoriesMargin, accessoriesTax, cabinetsMargin, cabinetsTax, doorsMargin, doorsTax, lightingMargin, lightingTax]);

  const grandTotal = categoryTotals.accessories.finalTotal +
    categoryTotals.cabinets.finalTotal +
    categoryTotals.doors.finalTotal +
    categoryTotals.lighting.finalTotal +
    otherExpensesTotal;

  return (
    <Card className="p-4 sm:p-5 bg-background-800 border-background-600 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-4 w-4 text-text-500" />
        <h3 className="text-sm font-[650] text-text-900">
          Pricing by Category{kitchenName ? ` — ${kitchenName}` : ''}
        </h3>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* Category Sections */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-600">Category Rates & Totals</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CategorySection
              label="Accessories"
              icon={<TrendingUp className="h-3.5 w-3.5 text-text-600" />}
              color="bg-background-700 border border-background-600"
              subtotal={categorySubtotals.accessories}
              marginPercent={accessoriesMargin}
              taxPercent={accessoriesTax}
              onMarginChange={onAccessoriesMarginChange}
              onTaxChange={onAccessoriesTaxChange}
              total={categoryTotals.accessories}
              showMargins={showMargins}
            />

            <CategorySection
              label="Cabinets"
              icon={<TrendingUp className="h-3.5 w-3.5 text-text-600" />}
              color="bg-background-700 border border-background-600"
              subtotal={categorySubtotals.cabinets}
              marginPercent={cabinetsMargin}
              taxPercent={cabinetsTax}
              onMarginChange={onCabinetsMarginChange}
              onTaxChange={onCabinetsTaxChange}
              total={categoryTotals.cabinets}
              showMargins={showMargins}
            />

            <CategorySection
              label="Doors"
              icon={<TrendingUp className="h-3.5 w-3.5 text-text-600" />}
              color="bg-background-700 border border-background-600"
              subtotal={categorySubtotals.doors}
              marginPercent={doorsMargin}
              taxPercent={doorsTax}
              onMarginChange={onDoorsMarginChange}
              onTaxChange={onDoorsTaxChange}
              total={categoryTotals.doors}
              showMargins={showMargins}
            />

            <CategorySection
              label="Lighting"
              icon={<TrendingUp className="h-3.5 w-3.5 text-text-600" />}
              color="bg-background-700 border border-background-600"
              subtotal={categorySubtotals.lighting}
              marginPercent={lightingMargin}
              taxPercent={lightingTax}
              onMarginChange={onLightingMarginChange}
              onTaxChange={onLightingTaxChange}
              total={categoryTotals.lighting}
              showMargins={showMargins}
            />
          </div>
        </div>

        {/* Miscellaneous (Other Expenses) */}
        {otherExpenses.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-600">Miscellaneous</h4>
            <CategorySection
              label="Other Expenses"
              icon={<Receipt className="h-3.5 w-3.5 text-text-600" />}
              color="bg-background-700 border border-background-600"
              subtotal={otherExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)}
              marginPercent={miscellaneousMarginPercentage}
              taxPercent={miscellaneousTaxPercentage}
              onMarginChange={onMiscellaneousMarginChange}
              onTaxChange={onMiscellaneousTaxChange || (() => {})}
              total={{
                marginAmount: otherExpenses.reduce((sum, e) => sum + (e.amount || 0), 0) * miscellaneousMarginPercentage / 100,
                finalTotal: otherExpensesTotal,
              }}
              showMargins={showMargins}
            />
          </div>
        )}

        {/* Grand Total */}
        <div className="border-t border-background-600 pt-3 mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-[650] text-text-900">Grand Total</span>
            <span className="text-xl font-bold text-primary-600 tabular-nums">
              ₹{grandTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default CategoryPricingPanel;
