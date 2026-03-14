/**
 * SelectedProductsList
 * Sidebar summary of selected products grouped by elevation
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pencil, ChevronDown, ChevronRight, Layers, Receipt, X } from 'lucide-react';
import { useState } from 'react';
import type { QuotationElevation, QuotationOtherExpense } from '../types';

interface AccessoryItem {
  id?: number;
  name?: string;
  description?: string;
  totalPrice?: number;
  price?: number;
  quantity?: number;
  elevationId?: number;
  elevationName?: string;
}

interface CabinetItem {
  id?: number;
  name?: string;
  cabinetTypeName?: string;
  description?: string;
  widthMm?: number;
  heightMm?: number;
  depthMm?: number;
  totalPrice?: number;
  price?: number;
  quantity?: number;
  elevationId?: number;
  elevationName?: string;
  _tempPairId?: number;
}

interface DoorItem {
  id?: number;
  name?: string;
  doorTypeName?: string;
  description?: string;
  widthMm?: number;
  heightMm?: number;
  totalPrice?: number;
  price?: number;
  quantity?: number;
  elevationId?: number;
  elevationName?: string;
  _tempPairId?: number;
}

interface LightingItem {
  id?: number;
  name?: string;
  description?: string;
  totalPrice?: number;
  price?: number;
  quantity?: number;
}

export interface SelectedProductsListProps {
  accessories: AccessoryItem[];
  cabinets: CabinetItem[];
  doors: DoorItem[];
  lighting: LightingItem[];
  otherExpenses?: QuotationOtherExpense[];
  availableElevations?: QuotationElevation[];
  accessoriesMarginPercentage?: number;
  cabinetsMarginPercentage?: number;
  doorsMarginPercentage?: number;
  lightingMarginPercentage?: number;
  accessoriesTaxPercentage?: number;
  cabinetsTaxPercentage?: number;
  doorsTaxPercentage?: number;
  lightingTaxPercentage?: number;
  miscellaneousMarginPercentage?: number;
  miscellaneousTaxPercentage?: number;
  onRemove?: (category: 'accessories' | 'cabinets' | 'doors' | 'lighting', index: number) => void;
  onRemoveOtherExpense?: (index: number) => void;
  onClearCategory?: (category: 'accessories' | 'cabinets' | 'doors' | 'lighting') => void;
  onClearOtherExpenses?: () => void;
  onEditCabinet?: (index: number) => void;
  onEditDoor?: (index: number) => void;
}

interface ElevationGroup {
  elevationName: string;
  elevationId?: number;
  accessories: { item: AccessoryItem; originalIndex: number }[];
  cabinets: { item: CabinetItem; originalIndex: number }[];
  doors: { item: DoorItem; originalIndex: number }[];
  lighting: { item: LightingItem; originalIndex: number }[];
  subtotal: number;
}

export function SelectedProductsList({
  accessories,
  cabinets,
  doors,
  lighting,
  otherExpenses = [],
  availableElevations = [],
  accessoriesMarginPercentage = 0,
  cabinetsMarginPercentage = 0,
  doorsMarginPercentage = 0,
  lightingMarginPercentage = 0,
  accessoriesTaxPercentage = 0,
  cabinetsTaxPercentage = 0,
  doorsTaxPercentage = 0,
  lightingTaxPercentage = 0,
  miscellaneousMarginPercentage = 0,
  miscellaneousTaxPercentage = 18,
  onRemove,
  onRemoveOtherExpense,
  onClearCategory,
  onClearOtherExpenses,
  onEditCabinet,
  onEditDoor
}: SelectedProductsListProps) {
  const [expandedElevations, setExpandedElevations] = useState<Record<string, boolean>>({});

  // Group all items by elevation
  const elevationGroups = useMemo(() => {
    const groups: Map<string, ElevationGroup> = new Map();

    // Initialize "No Elevation" group
    const NO_ELEVATION = 'No Elevation';
    groups.set(NO_ELEVATION, {
      elevationName: NO_ELEVATION,
      accessories: [],
      cabinets: [],
      doors: [],
      lighting: [],
      subtotal: 0,
    });

    // Initialize groups from available elevations
    availableElevations.forEach(el => {
      if (el.name && !groups.has(el.name)) {
        groups.set(el.name, {
          elevationName: el.name,
          elevationId: el.id,
          accessories: [],
          cabinets: [],
          doors: [],
          lighting: [],
          subtotal: 0,
        });
      }
    });

    // Group accessories
    accessories.forEach((item, index) => {
      const key = item.elevationName || NO_ELEVATION;
      if (!groups.has(key)) {
        groups.set(key, {
          elevationName: key,
          elevationId: item.elevationId,
          accessories: [],
          cabinets: [],
          doors: [],
          lighting: [],
          subtotal: 0,
        });
      }
      const group = groups.get(key)!;
      group.accessories.push({ item, originalIndex: index });
      group.subtotal += item.totalPrice ?? item.price ?? 0;
    });

    // Group cabinets
    cabinets.forEach((item, index) => {
      const key = item.elevationName || NO_ELEVATION;
      if (!groups.has(key)) {
        groups.set(key, {
          elevationName: key,
          elevationId: item.elevationId,
          accessories: [],
          cabinets: [],
          doors: [],
          lighting: [],
          subtotal: 0,
        });
      }
      const group = groups.get(key)!;
      group.cabinets.push({ item, originalIndex: index });
      group.subtotal += item.totalPrice ?? item.price ?? 0;
    });

    // Group doors
    doors.forEach((item, index) => {
      const key = item.elevationName || NO_ELEVATION;
      if (!groups.has(key)) {
        groups.set(key, {
          elevationName: key,
          elevationId: item.elevationId,
          accessories: [],
          cabinets: [],
          doors: [],
          lighting: [],
          subtotal: 0,
        });
      }
      const group = groups.get(key)!;
      group.doors.push({ item, originalIndex: index });
      group.subtotal += item.totalPrice ?? item.price ?? 0;
    });

    // Lighting always goes to "No Elevation"
    lighting.forEach((item, index) => {
      const group = groups.get(NO_ELEVATION)!;
      group.lighting.push({ item, originalIndex: index });
      group.subtotal += item.totalPrice ?? item.price ?? 0;
    });

    // Sort: named elevations first (A, B, C...), then "No Elevation" last
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      if (a.elevationName === NO_ELEVATION) return 1;
      if (b.elevationName === NO_ELEVATION) return -1;
      return a.elevationName.localeCompare(b.elevationName);
    });

    // Filter out empty groups (except "No Elevation" if it has items)
    return sortedGroups.filter(g =>
      g.accessories.length > 0 ||
      g.cabinets.length > 0 ||
      g.doors.length > 0 ||
      g.lighting.length > 0
    );
  }, [accessories, cabinets, doors, lighting, availableElevations]);

  const calcCategoryFinal = (items: any[], marginPct: number, taxPct: number) => {
    const base = items.reduce((sum: number, i: any) => sum + (i.totalPrice ?? i.price ?? 0), 0);
    const withMargin = base + (base * marginPct) / 100;
    return withMargin + (withMargin * taxPct) / 100;
  };
  const productTotal = calcCategoryFinal(accessories, accessoriesMarginPercentage, accessoriesTaxPercentage)
    + calcCategoryFinal(cabinets, cabinetsMarginPercentage, cabinetsTaxPercentage)
    + calcCategoryFinal(doors, doorsMarginPercentage, doorsTaxPercentage)
    + calcCategoryFinal(lighting, lightingMarginPercentage, lightingTaxPercentage);
  const otherExpensesBase = otherExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const miscMargin = (otherExpensesBase * miscellaneousMarginPercentage) / 100;
  const miscWithMargin = otherExpensesBase + miscMargin;
  const miscTax = (miscWithMargin * miscellaneousTaxPercentage) / 100;
  const otherExpensesTotal = miscWithMargin + miscTax;
  const grandTotal = productTotal + otherExpensesTotal;

  const toggleElevation = (elevationName: string) => {
    setExpandedElevations(prev => ({
      ...prev,
      [elevationName]: !prev[elevationName],
    }));
  };

  const renderItem = (
    item: any,
    category: 'accessories' | 'cabinets' | 'doors' | 'lighting',
    originalIndex: number
  ) => {
    const displayName = item.description || item.cabinetTypeName || item.doorTypeName || item.name || `Item ${originalIndex + 1}`;
    const uniqueKey = `${category}-${originalIndex}-${item.id || item.cabinetTypeId || item.doorTypeId || item._tempPairId || originalIndex}`;

    const showEdit = (category === 'cabinets' && onEditCabinet) || (category === 'doors' && onEditDoor);
    const handleEdit = () => {
      if (category === 'cabinets' && onEditCabinet) onEditCabinet(originalIndex);
      if (category === 'doors' && onEditDoor) onEditDoor(originalIndex);
    };

    return (
      <div key={uniqueKey} className="text-xs text-text-700 p-2 bg-background-700/50 rounded-lg relative group">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="break-words leading-tight">{displayName}</span>
            {category === 'cabinets' && item.materialName && (
              <span className="text-text-500 ml-1">- {item.materialName}</span>
            )}
            {item.quantity && item.quantity > 1 && (
              <span className="text-text-600 ml-1">× {item.quantity}</span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="font-semibold whitespace-nowrap text-primary-400">
              ₹{(item.totalPrice ?? item.price ?? 0).toLocaleString('en-IN')}
            </span>
            {showEdit && (
              <button
                onClick={handleEdit}
                className="p-0.5 rounded hover:bg-background-600 text-text-600 hover:text-primary-400 transition-colors"
                title="Edit"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(category, originalIndex)}
                className="p-0.5 rounded hover:bg-background-600 text-text-600 hover:text-error transition-colors"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCategorySection = (
    label: string,
    items: { item: any; originalIndex: number }[],
    category: 'accessories' | 'cabinets' | 'doors' | 'lighting'
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="ml-3 mt-2">
        <div className="text-sm font-semibold text-primary-400 mb-2 mt-3 pb-1 border-b border-background-600 flex items-center justify-between">
          <span>{label} ({items.length})</span>
          {onClearCategory && (
            <button
              onClick={() => onClearCategory(category)}
              className="text-xs text-error hover:text-error/80 font-normal transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="space-y-1">
          {items.map(({ item, originalIndex }) => renderItem(item, category, originalIndex))}
        </div>
      </div>
    );
  };

  // If no items at all, show empty state
  const totalItems = accessories.length + cabinets.length + doors.length + lighting.length;
  if (totalItems === 0) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <Card className="p-3 sm:p-4 bg-background-800 border-background-600 text-center">
          <div className="text-xs sm:text-sm text-text-600">No products selected</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {elevationGroups.map((group) => {
        const isExpanded = expandedElevations[group.elevationName] !== false; // Default to expanded
        const itemCount = group.accessories.length + group.cabinets.length + group.doors.length + group.lighting.length;

        return (
          <Card key={group.elevationName} className="p-3 sm:p-4 bg-background-800 border-background-600">
            {/* Elevation Header */}
            <button
              onClick={() => toggleElevation(group.elevationName)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary-500" />
                <span className="text-xs sm:text-sm font-semibold text-text-800">
                  {group.elevationName}
                </span>
                <span className="text-xs text-text-600">
                  ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-primary-400">
                  ₹{group.subtotal.toLocaleString('en-IN')}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-text-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-text-600" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-3 pt-2 border-t border-background-600">
                {renderCategorySection('Accessories', group.accessories, 'accessories')}
                {renderCategorySection('Cabinets', group.cabinets, 'cabinets')}
                {renderCategorySection('Doors', group.doors, 'doors')}
                {renderCategorySection('Lighting', group.lighting, 'lighting')}
              </div>
            )}
          </Card>
        );
      })}

      {/* Other Expenses */}
      {otherExpenses.length > 0 && otherExpenses.some(e => e.amount > 0) && (
        <Card className="p-3 sm:p-4 bg-background-800 border-background-600">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-text-600" />
              <span className="text-xs sm:text-sm font-semibold text-text-800">Other Expenses</span>
            </div>
            {onClearOtherExpenses && (
              <button
                onClick={onClearOtherExpenses}
                className="text-xs text-error hover:text-error/80 font-normal transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="space-y-1">
            {otherExpenses.filter(e => e.amount > 0).map((expense, index) => (
              <div key={`expense-${index}`} className="text-xs text-text-700 p-2 bg-background-700/50 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex-1">{expense.name}</span>
                  <span className="font-semibold text-primary-400">
                    ₹{expense.amount.toLocaleString('en-IN')}
                  </span>
                  {!expense.isDefault && onRemoveOtherExpense && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => onRemoveOtherExpense(index)}
                      className="flex-shrink-0 text-xs px-2 py-1 text-error hover:text-error"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-3 sm:p-4 bg-background-800 border-background-600 border-2 border-primary-700/50">
        <div className="text-xs sm:text-sm font-semibold text-text-800 mb-1">Grand Total</div>
        <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-400 break-all">
          ₹{grandTotal.toLocaleString('en-IN')}
        </div>
      </Card>
    </div>
  );
}

export default SelectedProductsList;
