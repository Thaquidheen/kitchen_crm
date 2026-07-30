/**
 * KitchenProductTabs Component
 * Tab-based interface for selecting products per kitchen
 * Each kitchen tab shows ProductSelector, CategoryPricingPanel, and CategoryTotals
 */

import { useState } from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { ProductSelector } from './ProductSelector';
import { CategoryPricingPanel } from './CategoryPricingPanel';
import { CategoryTotals } from './CategoryTotals';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { QuotationKitchenFormData } from '../types';

export interface KitchenProductTabsProps {
  kitchens: QuotationKitchenFormData[];
  onKitchensChange: (kitchens: QuotationKitchenFormData[]) => void;
  // Category-specific margin/tax percentages (from formData)
  accessoriesMarginPercentage: number;
  cabinetsMarginPercentage: number;
  doorsMarginPercentage: number;
  lightingMarginPercentage: number;
  accessoriesTaxPercentage: number;
  cabinetsTaxPercentage: number;
  doorsTaxPercentage: number;
  lightingTaxPercentage: number;
  // Miscellaneous (Other Expenses) margin & tax
  miscellaneousMarginPercentage?: number;
  miscellaneousTaxPercentage?: number;
  userRole: 'ROLE_SUPER_ADMIN' | 'ROLE_STAFF';
  // Callbacks for global margin/tax changes
  onAccessoriesTaxChange?: (value: number) => void;
  onCabinetsTaxChange?: (value: number) => void;
  onDoorsTaxChange?: (value: number) => void;
  onLightingTaxChange?: (value: number) => void;
  onAccessoriesMarginChange?: (value: number) => void;
  onCabinetsMarginChange?: (value: number) => void;
  onDoorsMarginChange?: (value: number) => void;
  onLightingMarginChange?: (value: number) => void;
  // Miscellaneous margin/tax callbacks
  onMiscellaneousMarginChange?: (value: number) => void;
  onMiscellaneousTaxChange?: (value: number) => void;
}

export function KitchenProductTabs({
  kitchens,
  onKitchensChange,
  accessoriesMarginPercentage,
  cabinetsMarginPercentage,
  doorsMarginPercentage,
  lightingMarginPercentage,
  accessoriesTaxPercentage,
  cabinetsTaxPercentage,
  doorsTaxPercentage,
  lightingTaxPercentage,
  miscellaneousMarginPercentage = 0,
  miscellaneousTaxPercentage = 18,
  userRole,
  onAccessoriesTaxChange,
  onCabinetsTaxChange,
  onDoorsTaxChange,
  onLightingTaxChange,
  onAccessoriesMarginChange,
  onCabinetsMarginChange,
  onDoorsMarginChange,
  onLightingMarginChange,
  onMiscellaneousMarginChange,
  onMiscellaneousTaxChange,
}: KitchenProductTabsProps) {
  // Track which pricing panels are expanded per kitchen
  const [expandedPanels, setExpandedPanels] = useState<Record<number, { pricing: boolean; totals: boolean }>>({});

  const togglePanel = (kitchenIndex: number, panel: 'pricing' | 'totals') => {
    setExpandedPanels((prev) => ({
      ...prev,
      [kitchenIndex]: {
        ...prev[kitchenIndex],
        [panel]: !prev[kitchenIndex]?.[panel],
      },
    }));
  };

  const handleKitchenProductsChange = (kitchenIndex: number, products: {
    accessories?: any[];
    cabinets?: any[];
    doors?: any[];
    lighting?: any[];
    otherExpenses?: any[];
  }) => {
    const updatedKitchens = [...kitchens];
    updatedKitchens[kitchenIndex] = {
      ...updatedKitchens[kitchenIndex],
      accessories: products.accessories ?? updatedKitchens[kitchenIndex].accessories,
      cabinets: products.cabinets ?? updatedKitchens[kitchenIndex].cabinets,
      doors: products.doors ?? updatedKitchens[kitchenIndex].doors,
      lighting: products.lighting ?? updatedKitchens[kitchenIndex].lighting,
      otherExpenses: products.otherExpenses ?? updatedKitchens[kitchenIndex].otherExpenses,
    };
    onKitchensChange(updatedKitchens);
  };


  const tabs = kitchens.map((kitchen, index) => ({
    label: kitchen.kitchenName,
    content: (
      <div className="space-y-6">
        {/* Product Selector */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-600 mb-3">
            Select Products — <span className="text-text-800">{kitchen.kitchenName}</span>
          </h4>
          <ProductSelector
            selectedProducts={{
              accessories: kitchen.accessories || [],
              cabinets: kitchen.cabinets || [],
              doors: kitchen.doors || [],
              lighting: kitchen.lighting || [],
              otherExpenses: kitchen.otherExpenses || [],
            }}
            onProductsChange={(products) => handleKitchenProductsChange(index, products)}
            availableElevations={kitchen.elevations || []}
            miscellaneousMarginPercentage={miscellaneousMarginPercentage}
            miscellaneousTaxPercentage={miscellaneousTaxPercentage}
            onMiscellaneousMarginChange={onMiscellaneousMarginChange}
            onMiscellaneousTaxChange={onMiscellaneousTaxChange}
          />
        </div>

        {/* Collapsible Pricing Panel */}
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => togglePanel(index, 'pricing')}
            className="w-full flex items-center justify-between px-4 py-3 bg-background-800 hover:bg-background-700 border border-background-600 rounded-xl"
          >
            <span className="text-sm font-[650] text-text-900">
              Pricing by Category — {kitchen.kitchenName}
            </span>
            {expandedPanels[index]?.pricing ? (
              <ChevronUp className="h-4 w-4 text-text-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-600" />
            )}
          </Button>
          {expandedPanels[index]?.pricing && (
            <div className="mt-4">
              <CategoryPricingPanel
                accessories={kitchen.accessories || []}
                cabinets={kitchen.cabinets || []}
                doors={kitchen.doors || []}
                lighting={kitchen.lighting || []}
                accessoriesMargin={accessoriesMarginPercentage}
                cabinetsMargin={cabinetsMarginPercentage}
                doorsMargin={doorsMarginPercentage}
                lightingMargin={lightingMarginPercentage}
                accessoriesTax={accessoriesTaxPercentage}
                cabinetsTax={cabinetsTaxPercentage}
                doorsTax={doorsTaxPercentage}
                lightingTax={lightingTaxPercentage}
                otherExpenses={kitchen.otherExpenses || []}
                miscellaneousMarginPercentage={miscellaneousMarginPercentage}
                miscellaneousTaxPercentage={miscellaneousTaxPercentage}
                onAccessoriesTaxChange={onAccessoriesTaxChange}
                onCabinetsTaxChange={onCabinetsTaxChange}
                onDoorsTaxChange={onDoorsTaxChange}
                onLightingTaxChange={onLightingTaxChange}
                onAccessoriesMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? onAccessoriesMarginChange : undefined}
                onCabinetsMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? onCabinetsMarginChange : undefined}
                onDoorsMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? onDoorsMarginChange : undefined}
                onLightingMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? onLightingMarginChange : undefined}
                onMiscellaneousMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? onMiscellaneousMarginChange : undefined}
                onMiscellaneousTaxChange={onMiscellaneousTaxChange}
                userRole={userRole}
                kitchenName={kitchen.kitchenName}
              />
            </div>
          )}
        </div>

        {/* Collapsible Category Totals */}
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => togglePanel(index, 'totals')}
            className="w-full flex items-center justify-between px-4 py-3 bg-background-800 hover:bg-background-700 border border-background-600 rounded-xl"
          >
            <span className="text-sm font-[650] text-text-900">
              Category Breakdown — {kitchen.kitchenName}
            </span>
            {expandedPanels[index]?.totals ? (
              <ChevronUp className="h-4 w-4 text-text-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-600" />
            )}
          </Button>
          {expandedPanels[index]?.totals && (
            <div className="mt-4">
              <CategoryTotals
                accessories={kitchen.accessories || []}
                cabinets={kitchen.cabinets || []}
                doors={kitchen.doors || []}
                lighting={kitchen.lighting || []}
                otherExpenses={kitchen.otherExpenses || []}
                accessoriesMarginPercentage={accessoriesMarginPercentage}
                cabinetsMarginPercentage={cabinetsMarginPercentage}
                doorsMarginPercentage={doorsMarginPercentage}
                lightingMarginPercentage={lightingMarginPercentage}
                accessoriesTaxPercentage={accessoriesTaxPercentage}
                cabinetsTaxPercentage={cabinetsTaxPercentage}
                doorsTaxPercentage={doorsTaxPercentage}
                lightingTaxPercentage={lightingTaxPercentage}
                miscellaneousMarginPercentage={miscellaneousMarginPercentage}
                miscellaneousTaxPercentage={miscellaneousTaxPercentage}
                kitchenName={kitchen.kitchenName}
              />
            </div>
          )}
        </div>
      </div>
    ),
  }));

  return <Tabs tabs={tabs} defaultIndex={0} />;
}

export default KitchenProductTabs;

