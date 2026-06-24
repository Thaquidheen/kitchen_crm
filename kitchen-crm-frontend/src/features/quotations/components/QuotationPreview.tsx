/**
 * QuotationPreview Component
 * Final review screen showing complete quotation details before submission
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { User, Package, DollarSign, Calculator, Home, Image as ImageIcon } from 'lucide-react';
import type { QuotationKitchenFormData, QuotationOtherExpense } from '@/features/quotations/types';
import { getImageUrl } from '@/utils/imageUtils';

export interface QuotationPreviewProps {
  customer?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  accessories: Array<{ id?: number; name?: string; totalPrice?: number; price?: number; quantity?: number }>;
  cabinets: Array<{ id?: number; name?: string; totalPrice?: number; price?: number; quantity?: number }>;
  doors: Array<{ id?: number; name?: string; totalPrice?: number; price?: number; quantity?: number }>;
  lighting: Array<{ id?: number; name?: string; totalPrice?: number; price?: number; quantity?: number }>;
  transportationPrice: number;
  installationPrice: number;
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
  miscellaneousMarginPercentage: number;
  miscellaneousTaxPercentage: number;
  // MRP (list price) — per-category margin & tax (mirrors the offer per-category rates)
  accessoriesMrpMarginPercentage: number;
  cabinetsMrpMarginPercentage: number;
  doorsMrpMarginPercentage: number;
  lightingMrpMarginPercentage: number;
  accessoriesMrpTaxPercentage: number;
  cabinetsMrpTaxPercentage: number;
  doorsMrpTaxPercentage: number;
  lightingMrpTaxPercentage: number;
  miscellaneousMrpMarginPercentage: number;
  miscellaneousMrpTaxPercentage: number;
  // Multi-kitchen support
  kitchens?: QuotationKitchenFormData[];
}

export function QuotationPreview({
  customer,
  accessories,
  cabinets,
  doors,
  lighting,
  transportationPrice,
  installationPrice,
  otherExpenses: otherExpensesProp,
  accessoriesMarginPercentage,
  cabinetsMarginPercentage,
  doorsMarginPercentage,
  lightingMarginPercentage,
  accessoriesTaxPercentage,
  cabinetsTaxPercentage,
  doorsTaxPercentage,
  lightingTaxPercentage,
  miscellaneousMarginPercentage,
  miscellaneousTaxPercentage,
  accessoriesMrpMarginPercentage,
  cabinetsMrpMarginPercentage,
  doorsMrpMarginPercentage,
  lightingMrpMarginPercentage,
  accessoriesMrpTaxPercentage,
  cabinetsMrpTaxPercentage,
  doorsMrpTaxPercentage,
  lightingMrpTaxPercentage,
  miscellaneousMrpMarginPercentage,
  miscellaneousMrpTaxPercentage,
  kitchens,
}: QuotationPreviewProps) {
  // Check if this is a multi-kitchen quotation
  const isMultiKitchen = kitchens && kitchens.length > 0;
  const calculations = useMemo(() => {
    // Calculate category subtotals (base totals)
    const accessoriesSubtotal = accessories.reduce((sum, item) => sum + (item.totalPrice ?? item.price ?? 0), 0);
    const cabinetsSubtotal = cabinets.reduce((sum, item) => sum + (item.totalPrice ?? item.price ?? 0), 0);
    const doorsSubtotal = doors.reduce((sum, item) => sum + (item.totalPrice ?? item.price ?? 0), 0);
    const lightingSubtotal = lighting.reduce((sum, item) => sum + (item.totalPrice ?? item.price ?? 0), 0);

    // Calculate category totals with margin and tax (same logic as CategoryPricingPanel)
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

    const accessoriesTotal = calculateCategoryTotal(accessoriesSubtotal, accessoriesMarginPercentage, accessoriesTaxPercentage);
    const cabinetsTotal = calculateCategoryTotal(cabinetsSubtotal, cabinetsMarginPercentage, cabinetsTaxPercentage);
    const doorsTotal = calculateCategoryTotal(doorsSubtotal, doorsMarginPercentage, doorsTaxPercentage);
    const lightingTotal = calculateCategoryTotal(lightingSubtotal, lightingMarginPercentage, lightingTaxPercentage);

    // Sum up category base totals
    const productsSubtotal = accessoriesSubtotal + cabinetsSubtotal + doorsSubtotal + lightingSubtotal;

    // Sum up category margin amounts
    const totalMarginAmount = accessoriesTotal.marginAmount + cabinetsTotal.marginAmount + doorsTotal.marginAmount + lightingTotal.marginAmount;

    // Sum up category tax amounts
    const totalTaxAmount = accessoriesTotal.taxAmount + cabinetsTotal.taxAmount + doorsTotal.taxAmount + lightingTotal.taxAmount;

    // Sum up category final totals
    const categoriesFinalTotal = accessoriesTotal.finalTotal + cabinetsTotal.finalTotal + doorsTotal.finalTotal + lightingTotal.finalTotal;

    // Other expenses with margin + tax
    const otherExpensesBase = otherExpensesProp && otherExpensesProp.length > 0
      ? otherExpensesProp.reduce((sum, e) => sum + (e.amount || 0), 0)
      : transportationPrice + installationPrice;
    const miscMargin = (otherExpensesBase * miscellaneousMarginPercentage) / 100;
    const miscWithMargin = otherExpensesBase + miscMargin;
    const miscTax = (miscWithMargin * miscellaneousTaxPercentage) / 100;
    const otherExpensesFinal = miscWithMargin + miscTax;
    const grandTotal = categoriesFinalTotal + otherExpensesFinal;

    return {
      productsSubtotal,
      otherExpensesBase,
      totalMarginAmount,
      totalTaxAmount,
      grandTotal,
      categoryTotals: {
        accessories: accessoriesTotal,
        cabinets: cabinetsTotal,
        doors: doorsTotal,
        lighting: lightingTotal,
      },
    };
  }, [
    accessories,
    cabinets,
    doors,
    lighting,
    transportationPrice,
    installationPrice,
    otherExpensesProp,
    accessoriesMarginPercentage,
    accessoriesTaxPercentage,
    cabinetsMarginPercentage,
    cabinetsTaxPercentage,
    doorsMarginPercentage,
    doorsTaxPercentage,
    lightingMarginPercentage,
    lightingTaxPercentage,
    miscellaneousMarginPercentage,
    miscellaneousTaxPercentage,
  ]);

  const allProducts = useMemo(() => {
    return [
      { category: 'Accessories', items: accessories },
      { category: 'Cabinets', items: cabinets },
      { category: 'Doors', items: doors },
      { category: 'Lighting', items: lighting },
    ].filter((cat) => cat.items.length > 0);
  }, [accessories, cabinets, doors, lighting]);

  // Multi-kitchen calculations
  const kitchenCalculations = useMemo(() => {
    if (!isMultiKitchen || !kitchens) return null;

    return kitchens.map((kitchen) => {
      // Calculate kitchen product totals
      const kAccessoriesSubtotal = (kitchen.accessories || []).reduce(
        (sum, item) => sum + (item.totalPrice ?? item.price ?? 0),
        0
      );
      const kCabinetsSubtotal = (kitchen.cabinets || []).reduce(
        (sum, item) => sum + (item.totalPrice ?? item.price ?? 0),
        0
      );
      const kDoorsSubtotal = (kitchen.doors || []).reduce(
        (sum, item) => sum + (item.totalPrice ?? item.price ?? 0),
        0
      );
      const kLightingSubtotal = (kitchen.lighting || []).reduce(
        (sum, item) => sum + (item.totalPrice ?? item.price ?? 0),
        0
      );

      const calculateCategoryTotal = (subtotal: number, marginPercent: number, taxPercent: number) => {
        const marginAmount = (subtotal * marginPercent) / 100;
        const totalBeforeTax = subtotal + marginAmount;
        const taxAmount = (totalBeforeTax * taxPercent) / 100;
        return {
          subtotal,
          marginAmount,
          taxAmount,
          finalTotal: totalBeforeTax + taxAmount,
        };
      };

      const kAccessoriesTotal = calculateCategoryTotal(
        kAccessoriesSubtotal,
        accessoriesMarginPercentage,
        accessoriesTaxPercentage
      );
      const kCabinetsTotal = calculateCategoryTotal(
        kCabinetsSubtotal,
        cabinetsMarginPercentage,
        cabinetsTaxPercentage
      );
      const kDoorsTotal = calculateCategoryTotal(
        kDoorsSubtotal,
        doorsMarginPercentage,
        doorsTaxPercentage
      );
      const kLightingTotal = calculateCategoryTotal(
        kLightingSubtotal,
        lightingMarginPercentage,
        lightingTaxPercentage
      );

      const kitchenSubtotal =
        kAccessoriesTotal.finalTotal +
        kCabinetsTotal.finalTotal +
        kDoorsTotal.finalTotal +
        kLightingTotal.finalTotal;
      // Other Expenses with margin + tax (per-kitchen). Transportation is excluded here — it is a
      // single common charge added once at the quotation level (see grandTotal below).
      const otherExpensesBase = (kitchen.otherExpenses || [])
        .filter((e) => e.name !== 'Transportation')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const kMiscMargin = (otherExpensesBase * miscellaneousMarginPercentage) / 100;
      const kMiscWithMargin = otherExpensesBase + kMiscMargin;
      const kMiscTax = (kMiscWithMargin * miscellaneousTaxPercentage) / 100;
      const otherExpenses = kMiscWithMargin + kMiscTax;
      const kitchenTotal = kitchenSubtotal + otherExpenses;

      // Per-kitchen margin/tax (products only — matches the aggregate "Total Margin" in Quick Stats,
      // which sums the four category margins). Shown separately for each kitchen in the Review step.
      const kitchenMarginAmount =
        kAccessoriesTotal.marginAmount +
        kCabinetsTotal.marginAmount +
        kDoorsTotal.marginAmount +
        kLightingTotal.marginAmount;
      const kitchenTaxAmount =
        kAccessoriesTotal.taxAmount +
        kCabinetsTotal.taxAmount +
        kDoorsTotal.taxAmount +
        kLightingTotal.taxAmount;
      // Products subtotal before margin & tax (for context in the breakdown).
      const kitchenProductsBase =
        kAccessoriesSubtotal + kCabinetsSubtotal + kDoorsSubtotal + kLightingSubtotal;

      return {
        kitchen,
        subtotal: kitchenSubtotal,
        otherExpenses,
        otherExpensesBase,
        total: kitchenTotal,
        marginAmount: kitchenMarginAmount,
        taxAmount: kitchenTaxAmount,
        productsBase: kitchenProductsBase,
        categoryTotals: {
          accessories: kAccessoriesTotal,
          cabinets: kCabinetsTotal,
          doors: kDoorsTotal,
          lighting: kLightingTotal,
        },
      };
    });
  }, [isMultiKitchen, kitchens, accessoriesMarginPercentage, cabinetsMarginPercentage, doorsMarginPercentage, lightingMarginPercentage, accessoriesTaxPercentage, cabinetsTaxPercentage, doorsTaxPercentage, lightingTaxPercentage, miscellaneousMarginPercentage, miscellaneousTaxPercentage]);

  // Common transportation: a single charge for the whole quotation (multi-kitchen),
  // with miscellaneous margin/tax applied — matches the backend pricing.
  const commonTransportFinal = useMemo(() => {
    const base = transportationPrice || 0;
    const margin = (base * miscellaneousMarginPercentage) / 100;
    const withMargin = base + margin;
    const tax = (withMargin * miscellaneousTaxPercentage) / 100;
    return withMargin + tax;
  }, [transportationPrice, miscellaneousMarginPercentage, miscellaneousTaxPercentage]);

  const grandTotal = useMemo(() => {
    if (isMultiKitchen && kitchenCalculations) {
      const kitchensTotal = kitchenCalculations.reduce((sum, k) => sum + k.total, 0);
      // Installation is already inside each kitchen's total; add common transportation once.
      return kitchensTotal + commonTransportFinal;
    }
    return calculations.grandTotal;
  }, [isMultiKitchen, kitchenCalculations, commonTransportFinal, calculations.grandTotal]);

  // MRP (list price): one common margin + tax applied to the full BASE sum of products
  // (pre per-category margin/tax) + installation + custom other-expenses + common transportation.
  // Single figure for the whole quotation (common across kitchens). Shown alongside the Offer
  // Price (= grandTotal). Note: grandTotal IS the "Offer Price".
  const mrpFinal = useMemo(() => {
    const applyMT = (base: number, m: number, t: number) => {
      const withMargin = base + (base * (m || 0)) / 100;
      return withMargin + (withMargin * (t || 0)) / 100;
    };
    let accBase: number, cabBase: number, doorBase: number, lightBase: number, miscBase: number;
    if (isMultiKitchen && kitchenCalculations) {
      accBase = kitchenCalculations.reduce((s, k) => s + k.categoryTotals.accessories.subtotal, 0);
      cabBase = kitchenCalculations.reduce((s, k) => s + k.categoryTotals.cabinets.subtotal, 0);
      doorBase = kitchenCalculations.reduce((s, k) => s + k.categoryTotals.doors.subtotal, 0);
      lightBase = kitchenCalculations.reduce((s, k) => s + k.categoryTotals.lighting.subtotal, 0);
      // otherExpensesBase per kitchen excludes transportation (installation + custom);
      // add the single common transportation base once.
      miscBase = kitchenCalculations.reduce((s, k) => s + k.otherExpensesBase, 0) + (transportationPrice || 0);
    } else {
      accBase = calculations.categoryTotals.accessories.subtotal;
      cabBase = calculations.categoryTotals.cabinets.subtotal;
      doorBase = calculations.categoryTotals.doors.subtotal;
      lightBase = calculations.categoryTotals.lighting.subtotal;
      miscBase = calculations.otherExpensesBase;
    }
    return applyMT(accBase, accessoriesMrpMarginPercentage, accessoriesMrpTaxPercentage)
      + applyMT(cabBase, cabinetsMrpMarginPercentage, cabinetsMrpTaxPercentage)
      + applyMT(doorBase, doorsMrpMarginPercentage, doorsMrpTaxPercentage)
      + applyMT(lightBase, lightingMrpMarginPercentage, lightingMrpTaxPercentage)
      + applyMT(miscBase, miscellaneousMrpMarginPercentage, miscellaneousMrpTaxPercentage);
  }, [isMultiKitchen, kitchenCalculations, transportationPrice, calculations,
      accessoriesMrpMarginPercentage, cabinetsMrpMarginPercentage, doorsMrpMarginPercentage, lightingMrpMarginPercentage,
      accessoriesMrpTaxPercentage, cabinetsMrpTaxPercentage, doorsMrpTaxPercentage, lightingMrpTaxPercentage,
      miscellaneousMrpMarginPercentage, miscellaneousMrpTaxPercentage]);

  return (
    <div className="space-y-4 sm:space-y-6 bg-background-900 p-4 sm:p-6 rounded-lg">
      {/* Customer Information */}
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
          <h3 className="text-base sm:text-lg font-bold text-text-900">Customer Information</h3>
        </div>

        {customer ? (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-xs sm:text-sm text-text-700">Name:</span>
              <span className="font-medium text-xs sm:text-sm text-text-900">{customer.name}</span>
            </div>
            {customer.email && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-text-700">Email:</span>
                <span className="font-medium text-xs sm:text-sm text-text-900 break-all">{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-text-700">Phone:</span>
                <span className="font-medium text-xs sm:text-sm text-text-900">{customer.phone}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-text-700">Address:</span>
                <span className="font-medium text-xs sm:text-sm text-text-900 text-right max-w-xs break-words">{customer.address}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-text-600">No customer selected</div>
        )}
      </Card>

      {/* Multi-Kitchen View */}
      {isMultiKitchen && kitchenCalculations ? (
        <>
          {kitchenCalculations.map((kitchenCalc, kitchenIndex) => (
            <Card key={kitchenIndex} className="p-4 sm:p-6 bg-background-800 border-background-600">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Home className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                <h3 className="text-base sm:text-lg font-bold text-text-900">
                  {kitchenCalc.kitchen.kitchenName}
                </h3>
              </div>

              {/* Scope of Work */}
              {kitchenCalc.kitchen.scopeDetails && kitchenCalc.kitchen.scopeDetails.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-xs sm:text-sm font-semibold text-text-800 mb-2 sm:mb-3">Scope of Work</h4>
                  <div className="bg-background-700 rounded-lg p-3 sm:p-4 overflow-x-auto">
                    <table className="w-full min-w-[300px]">
                      <tbody className="space-y-2">
                        {kitchenCalc.kitchen.scopeDetails.map((detail, idx) => (
                          <tr key={idx} className="border-b border-background-600 last:border-b-0">
                            <td className="py-2 text-xs sm:text-sm font-medium text-text-700 w-1/3">
                              {detail.fieldName}
                            </td>
                            <td className="py-2 text-xs sm:text-sm text-text-900">{detail.fieldValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Plan Images */}
              {kitchenCalc.kitchen.planImages && kitchenCalc.kitchen.planImages.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-xs sm:text-sm font-semibold text-text-800 mb-2 sm:mb-3">Plan Images</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                    {kitchenCalc.kitchen.planImages.map((planImage, idx) => (
                      <div key={idx} className="relative">
                        <div className="aspect-square rounded-lg overflow-hidden bg-background-700 border border-background-600">
                          <img
                            src={getImageUrl(planImage.imageUrl)}
                            alt={planImage.imageName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                        <p className="text-xs text-text-600 mt-1 truncate">
                          {planImage.imageName}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kitchen Products */}
              <div className="mb-4 sm:mb-6">
                <h4 className="text-xs sm:text-sm font-semibold text-text-800 mb-2 sm:mb-3">Products</h4>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { category: 'Accessories', items: kitchenCalc.kitchen.accessories || [] },
                    { category: 'Cabinets', items: kitchenCalc.kitchen.cabinets || [] },
                    { category: 'Doors', items: kitchenCalc.kitchen.doors || [] },
                    { category: 'Lighting', items: kitchenCalc.kitchen.lighting || [] },
                  ]
                    .filter((cat) => cat.items.length > 0)
                    .map((category) => (
                      <div key={category.category} className="border-b border-background-600 pb-2 last:border-b-0">
                        <h5 className="text-xs font-semibold text-text-700 mb-1">
                          {category.category}
                        </h5>
                        <div className="space-y-1">
                          {category.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <div className="flex-1 min-w-0">
                                <span className="text-text-600">
                                  {item.name || item.description || `Item ${idx + 1}`}
                                  {item.quantity && item.quantity > 1 && ` × ${item.quantity}`}
                                </span>
                                {category.category === 'Cabinets' && item.materialName && (
                                  <span className="text-text-500 ml-1">({item.materialName})</span>
                                )}
                                {category.category === 'Accessories' && item.brandName && (
                                  <span className="text-text-500 ml-1">({item.brandName})</span>
                                )}
                              </div>
                              <span className="font-medium text-text-900 flex-shrink-0">
                                ₹{(item.totalPrice ?? item.price ?? 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Kitchen Totals */}
              <div className="border-t border-background-600 pt-3 sm:pt-4">
                <div className="space-y-2 text-xs sm:text-sm">
                  {/* Per-kitchen pricing breakdown (margin shown separately for each kitchen) */}
                  <div className="flex justify-between">
                    <span className="text-text-700">Subtotal (before margin &amp; tax)</span>
                    <span className="font-medium text-text-900">
                      ₹{kitchenCalc.productsBase.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-700">Margin</span>
                    <span className="font-medium text-success">
                      ₹{kitchenCalc.marginAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-700">Tax</span>
                    <span className="font-medium text-warning">
                      ₹{kitchenCalc.taxAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {kitchenCalc.otherExpenses > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-700">Other Expenses</span>
                        <span className="font-medium text-text-900">
                          ₹{kitchenCalc.otherExpenses.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {(kitchenCalc.kitchen.otherExpenses || [])
                        .filter((e) => (e.amount || 0) > 0)
                        .map((expense, idx) => (
                          <div key={idx} className="flex justify-between pl-3">
                            <span className="text-text-600 text-xs">{expense.name}</span>
                            <span className="text-text-700 text-xs">
                              ₹{(expense.amount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                    </>
                  )}
                  <div className="flex justify-between border-t border-background-600 pt-2">
                    <span className="font-semibold text-text-900">Kitchen Total</span>
                    <span className="font-bold text-primary-600">
                      ₹{kitchenCalc.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Grand Total Summary */}
          <Card className="p-4 sm:p-6 bg-background-800 border-background-600 border-2 border-primary-600">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
              <h3 className="text-base sm:text-lg font-bold text-text-900">Grand Total Summary</h3>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {kitchenCalculations.map((kitchenCalc, idx) => (
                <div key={idx} className="flex justify-between text-xs sm:text-sm">
                  <span className="text-text-700">{kitchenCalc.kitchen.kitchenName}</span>
                  <span className="font-medium text-text-900">
                    ₹{kitchenCalc.total.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              {commonTransportFinal > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-text-700">Transportation (common)</span>
                  <span className="font-medium text-text-900">
                    ₹{commonTransportFinal.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <div className="border-t-2 border-primary-700 pt-2 sm:pt-3 mt-2 sm:mt-3 space-y-1">
                {mrpFinal > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-text-600">MRP</span>
                    <span className={`text-sm sm:text-base ${mrpFinal > grandTotal ? 'text-text-500 line-through' : 'text-text-700'}`}>
                      ₹{mrpFinal.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-xl font-bold text-text-900">Offer Price</span>
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-600">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Products Summary - Single Quotation */}
          <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
              <h3 className="text-base sm:text-lg font-bold text-text-900">Products Summary</h3>
            </div>

            {allProducts.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {allProducts.map((category) => (
                  <div key={category.category} className="border-b border-background-600 pb-2 sm:pb-3 last:border-b-0">
                    <h4 className="font-semibold text-xs sm:text-sm text-text-800 mb-2">{category.category}</h4>
                    <div className="space-y-1 sm:space-y-2">
                      {category.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs sm:text-sm">
                          <div className="flex-1 min-w-0 flex flex-wrap gap-1 sm:gap-2">
                            <span className="text-text-700">{item.name ?? `Item ${idx + 1}`}</span>
                            {item.quantity && item.quantity > 1 && (
                              <span className="text-text-600">× {item.quantity}</span>
                            )}
                            {category.category === 'Cabinets' && item.materialName && (
                              <span className="text-text-500">({item.materialName})</span>
                            )}
                            {category.category === 'Accessories' && item.brandName && (
                              <span className="text-text-500">({item.brandName})</span>
                            )}
                          </div>
                          <span className="font-medium text-text-900 flex-shrink-0">
                            ₹{(item.totalPrice ?? item.price ?? 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-text-600">No products added</div>
            )}
          </Card>
        </>
      )}

      {/* Pricing Breakdown - Single Quotation Only */}
      {!isMultiKitchen && (
        <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
            <h3 className="text-base sm:text-lg font-bold text-text-900">Pricing Breakdown</h3>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {calculations.categoryTotals.cabinets.finalTotal > 0 && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-text-700">Cabinets</span>
                <span className="font-medium text-text-900">
                  ₹{calculations.categoryTotals.cabinets.finalTotal.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {calculations.categoryTotals.doors.finalTotal > 0 && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-text-700">Doors</span>
                <span className="font-medium text-text-900">
                  ₹{calculations.categoryTotals.doors.finalTotal.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {calculations.categoryTotals.accessories.finalTotal > 0 && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-text-700">Accessories</span>
                <span className="font-medium text-text-900">
                  ₹{calculations.categoryTotals.accessories.finalTotal.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {calculations.categoryTotals.lighting.finalTotal > 0 && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-text-700">Lighting</span>
                <span className="font-medium text-text-900">
                  ₹{calculations.categoryTotals.lighting.finalTotal.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {(otherExpensesProp && otherExpensesProp.length > 0 ? otherExpensesProp : [
              { name: 'Transportation', amount: transportationPrice },
              { name: 'Installation', amount: installationPrice },
            ]).filter((expense) => (expense.amount || 0) > 0).map((expense, idx) => (
              <div key={idx} className="flex justify-between text-xs sm:text-sm">
                <span className="text-text-700">{expense.name}</span>
                <span className="font-medium text-text-900">
                  ₹{(expense.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            ))}

            {/* MRP + Offer Price */}
            <div className="border-t-2 border-primary-700 pt-2 sm:pt-3 mt-2 sm:mt-3 space-y-1">
              {mrpFinal > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-text-600">MRP</span>
                  <span className={`text-sm sm:text-base ${mrpFinal > calculations.grandTotal ? 'text-text-500 line-through' : 'text-text-700'}`}>
                    ₹{mrpFinal.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-base sm:text-lg font-bold text-text-900">Offer Price</span>
                <span className="text-xl sm:text-2xl font-bold text-primary-600">
                  ₹{calculations.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
          <h3 className="text-base sm:text-lg font-bold text-text-900">Quick Stats</h3>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="text-center p-2 sm:p-3 bg-background-700 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-text-900">
              {isMultiKitchen && kitchenCalculations
                ? kitchenCalculations.reduce((sum, k) => sum + (k.kitchen.accessories?.length || 0) + (k.kitchen.cabinets?.length || 0) + (k.kitchen.doors?.length || 0) + (k.kitchen.lighting?.length || 0), 0)
                : accessories.length + cabinets.length + doors.length + lighting.length}
            </div>
            <div className="text-xs sm:text-sm text-text-600">Total Items</div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-background-700 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-success">
              ₹{(isMultiKitchen && kitchenCalculations
                ? kitchenCalculations.reduce((sum, k) => sum + k.categoryTotals.accessories.marginAmount + k.categoryTotals.cabinets.marginAmount + k.categoryTotals.doors.marginAmount + k.categoryTotals.lighting.marginAmount, 0)
                : calculations.totalMarginAmount
              ).toLocaleString('en-IN')}
            </div>
            <div className="text-xs sm:text-sm text-text-600">Total Margin</div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-background-700 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-warning">
              ₹{(isMultiKitchen && kitchenCalculations
                ? kitchenCalculations.reduce((sum, k) => sum + k.categoryTotals.accessories.taxAmount + k.categoryTotals.cabinets.taxAmount + k.categoryTotals.doors.taxAmount + k.categoryTotals.lighting.taxAmount, 0)
                : calculations.totalTaxAmount
              ).toLocaleString('en-IN')}
            </div>
            <div className="text-xs sm:text-sm text-text-600">Total Tax</div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-background-700 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-info">
              ₹{grandTotal.toLocaleString('en-IN')}
            </div>
            <div className="text-xs sm:text-sm text-text-600">Grand Total</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default QuotationPreview;
