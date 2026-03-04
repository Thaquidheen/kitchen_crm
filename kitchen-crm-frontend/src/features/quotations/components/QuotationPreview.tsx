/**
 * QuotationPreview Component
 * Final review screen showing complete quotation details before submission
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { User, Package, DollarSign, Calculator, Home, Image as ImageIcon } from 'lucide-react';
import type { QuotationKitchenFormData } from '@/features/quotations/types';
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
  accessoriesMarginPercentage,
  cabinetsMarginPercentage,
  doorsMarginPercentage,
  lightingMarginPercentage,
  accessoriesTaxPercentage,
  cabinetsTaxPercentage,
  doorsTaxPercentage,
  lightingTaxPercentage,
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

    // Grand total = sum of category final totals + transportation + installation
    const grandTotal = categoriesFinalTotal + transportationPrice + installationPrice;

    return {
      productsSubtotal,
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
    accessoriesMarginPercentage,
    accessoriesTaxPercentage,
    cabinetsMarginPercentage,
    cabinetsTaxPercentage,
    doorsMarginPercentage,
    doorsTaxPercentage,
    lightingMarginPercentage,
    lightingTaxPercentage,
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
      // Other Expenses = Transportation + Installation (per-kitchen)
      const otherExpenses = (kitchen.transportationPrice || 0) + (kitchen.installationPrice || 0);
      const kitchenTotal = kitchenSubtotal + otherExpenses;

      return {
        kitchen,
        subtotal: kitchenSubtotal,
        otherExpenses,
        total: kitchenTotal,
        categoryTotals: {
          accessories: kAccessoriesTotal,
          cabinets: kCabinetsTotal,
          doors: kDoorsTotal,
          lighting: kLightingTotal,
        },
      };
    });
  }, [isMultiKitchen, kitchens, accessoriesMarginPercentage, cabinetsMarginPercentage, doorsMarginPercentage, lightingMarginPercentage, accessoriesTaxPercentage, cabinetsTaxPercentage, doorsTaxPercentage, lightingTaxPercentage]);

  const grandTotal = useMemo(() => {
    if (isMultiKitchen && kitchenCalculations) {
      const kitchensTotal = kitchenCalculations.reduce((sum, k) => sum + k.total, 0);
      return kitchensTotal + transportationPrice + installationPrice;
    }
    return calculations.grandTotal;
  }, [isMultiKitchen, kitchenCalculations, transportationPrice, installationPrice, calculations.grandTotal]);

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
                              <span className="text-text-600">
                                {item.name || item.description || `Item ${idx + 1}`}
                                {item.quantity && item.quantity > 1 && ` × ${item.quantity}`}
                              </span>
                              <span className="font-medium text-text-900">
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
                  {kitchenCalc.otherExpenses > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-700">Other Expenses</span>
                        <span className="font-medium text-text-900">
                          ₹{kitchenCalc.otherExpenses.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {(kitchenCalc.kitchen.transportationPrice || 0) > 0 && (
                        <div className="flex justify-between pl-3">
                          <span className="text-text-600 text-xs">Transportation</span>
                          <span className="text-text-700 text-xs">
                            ₹{(kitchenCalc.kitchen.transportationPrice || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                      {(kitchenCalc.kitchen.installationPrice || 0) > 0 && (
                        <div className="flex justify-between pl-3">
                          <span className="text-text-600 text-xs">Installation</span>
                          <span className="text-text-700 text-xs">
                            ₹{(kitchenCalc.kitchen.installationPrice || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
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
              <div className="border-t-2 border-primary-700 pt-2 sm:pt-3 mt-2 sm:mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-xl font-bold text-text-900">Grand Total</span>
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
                      {category.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs sm:text-sm">
                          <div className="flex gap-1 sm:gap-2">
                            <span className="text-text-700">{item.name ?? `Item ${idx + 1}`}</span>
                            {item.quantity && item.quantity > 1 && (
                              <span className="text-text-600">× {item.quantity}</span>
                            )}
                          </div>
                          <span className="font-medium text-text-900">
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
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-text-700">Products Subtotal</span>
              <span className="font-medium text-text-900">
                ₹{calculations.productsSubtotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-text-700">Total Margin Amount</span>
              <span className="font-medium text-success">
                +₹{calculations.totalMarginAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-text-700">Total Tax Amount</span>
              <span className="font-medium text-warning">
                +₹{calculations.totalTaxAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-xs sm:text-sm border-t border-background-700 pt-2">
              <span className="text-text-800 font-medium">Subtotal (Categories)</span>
              <span className="font-semibold text-text-900">
                ₹{(calculations.productsSubtotal + calculations.totalMarginAmount + calculations.totalTaxAmount).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-text-700">Transportation Cost</span>
              <span className="font-medium text-text-900">
                ₹{transportationPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-text-700">Installation Cost</span>
              <span className="font-medium text-text-900">
                ₹{installationPrice.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Grand Total */}
            <div className="border-t-2 border-primary-700 pt-2 sm:pt-3 mt-2 sm:mt-3">
              <div className="flex justify-between items-center">
                <span className="text-base sm:text-lg font-bold text-text-900">Grand Total</span>
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
              {accessories.length + cabinets.length + doors.length + lighting.length}
            </div>
            <div className="text-xs sm:text-sm text-text-600">Total Items</div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-background-700 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-success">
              ₹{calculations.totalMarginAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-xs sm:text-sm text-text-600">Total Margin</div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-background-700 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-warning">
              ₹{calculations.totalTaxAmount.toLocaleString('en-IN')}
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
