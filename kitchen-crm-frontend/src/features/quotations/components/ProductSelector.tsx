/**
 * ProductSelector
 * Category tabs with search that lets users add items to a quotation
 */

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { CategoryProducts } from './CategoryProducts';
import { OtherExpensesTab } from './OtherExpensesTab';
import type {
  QuotationAccessory,
  QuotationCabinet,
  QuotationDoor,
  QuotationLighting,
  QuotationOtherExpense,
  QuotationElevation,
} from '../types';

export interface ProductSelectorProps {
  selectedProducts: {
    accessories: QuotationAccessory[];
    cabinets: QuotationCabinet[];
    doors: QuotationDoor[];
    lighting: QuotationLighting[];
    otherExpenses?: QuotationOtherExpense[];
  };
  onProductsChange: (products: Partial<ProductSelectorProps['selectedProducts']>) => void;
  availableElevations?: QuotationElevation[];
  miscellaneousMarginPercentage?: number;
  miscellaneousTaxPercentage?: number;
  onMiscellaneousMarginChange?: (value: number) => void;
  onMiscellaneousTaxChange?: (value: number) => void;
}

export function ProductSelector({
  selectedProducts,
  onProductsChange,
  availableElevations = [],
  miscellaneousMarginPercentage = 0,
  miscellaneousTaxPercentage = 18,
  onMiscellaneousMarginChange,
  onMiscellaneousTaxChange,
}: ProductSelectorProps) {
  const [search, setSearch] = useState('');

  const productTabs = useMemo(
    () => [
      { key: 'accessories', label: 'Accessories' },
      { key: 'cabinets', label: 'Cabinets' },
      { key: 'doors', label: 'Doors' },
      { key: 'lighting', label: 'Lighting' },
    ],
    []
  );

  const getQuantity = (
    category: 'accessories' | 'cabinets' | 'doors' | 'lighting',
    itemId: number,
    itemType?: string
  ) => {
    const list = (selectedProducts as any)[category] || [];
    if (category === 'cabinets') {
      // Cabinets are dimensioned; quantity is per added entry (not per catalog id)
      return 0;
    }
    if (category === 'doors') {
      // Doors added via modal; treat as unique entries
      return 0;
    }
    // For lighting, items come from multiple sub-types; differentiate by id+type if present
    const found = list.find((x: any) => {
      if (category === 'lighting' && itemType) {
        return (x.itemType || x.type) === itemType && (x.id === itemId);
      }
      return x.id === itemId;
    });
    return found?.quantity || 0;
  };

  const updateListWithQuantity = (
    list: any[],
    matchId: number,
    unitPrice: number,
    mode: 'inc' | 'dec' | 'set',
    initialItem?: any,
    matchType?: string
  ) => {
    const index = list.findIndex((x: any) => {
      if (matchType) {
        const xType = x.itemType || x.type || x.raw?.itemType;
        return x.id === matchId && xType === matchType;
      }
      return x.id === matchId;
    });
    if (index === -1) {
      if (mode === 'inc' || mode === 'set') {
        const quantity = initialItem?.quantity || 1;
        const nextItem = {
          ...initialItem,
          // Ensure sidebar has a readable name
          description: initialItem?.description || initialItem?.name || initialItem?.cabinetTypeName,
          itemType: initialItem?.raw?.itemType || initialItem?.itemType,
          quantity,
          totalPrice: unitPrice * quantity,
          price: unitPrice,
        };
        return [...list, nextItem];
      }
      return list;
    }
    const current = list[index];
    let quantity = current.quantity || 1;
    if (mode === 'inc') quantity += 1;
    if (mode === 'dec') quantity -= 1;
    if (quantity <= 0) {
      return list.filter((_, i) => i !== index);
    }
    const updated = { ...current, quantity, totalPrice: (current.price ?? unitPrice) * quantity };
    const clone = [...list];
    clone[index] = updated;
    return clone;
  };

  const handleAdd = (category: 'accessories' | 'cabinets' | 'doors' | 'lighting', item: any) => {
    const next = { ...selectedProducts } as any;

    // Handle cabinets with dimensions
    if (category === 'cabinets' && item.cabinetTypeId) {
      const pairId = Date.now() + Math.random();

      const cabinetItem: QuotationCabinet = {
        cabinetTypeId: item.cabinetTypeId,
        cabinetTypeName: item.cabinetTypeName || item.cabinetType?.name,
        brandName: item.cabinetType?.brandName,
        materialName: item.materialName || item.cabinetType?.materialName,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        depthMm: item.depthMm,
        quantity: item.quantity,
        calculatedSqft: item.calculatedSqft || item.surfaceArea,
        // Use prices from AddCabinetModal (includes material, lighting, accessories)
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
        customDimensions: true,
        description: item.description || `${item.cabinetTypeName || item.cabinetType?.name} (${item.widthMm}×${item.depthMm}×${item.heightMm}mm)`,
        // Material, lighting, and accessories fields
        materialId: item.materialId,
        materialRate: item.materialRate,
        materialCalculationType: item.materialCalculationType,
        lightingCost: item.lightingCost,
        accessoriesCost: item.accessoriesCost,
        powderCoating: item.powderCoating,
        powderCoatingCost: item.powderCoatingCost,
        // Inner panel fields
        innerPanelTypeId: item.innerPanelTypeId,
        innerPanelTypeName: item.innerPanelTypeName,
        innerPanelRate: item.innerPanelRate,
        innerPanelMultiplier: item.innerPanelMultiplier,
        innerPanelCost: item.innerPanelCost,
        innerPanelQuantity: item.innerPanelQuantity,
        // Elevation fields
        elevationId: item.elevationId,
        elevationName: item.elevationName,
        // Preserve linked door data for edit modal
        linkedDoor: item.linkedDoor,
        // @ts-ignore temporary pair id for removal linkage
        _tempPairId: pairId,
      };
      next[category] = [...(next[category] || []), cabinetItem];
      
      // Add linked door if present
      if (item.linkedDoor) {
        // Calculate estimated price using Excel formula
        const doorArea = item.linkedDoor.faceArea || 0;
        const doorPrice = item.linkedDoor.doorType?.companyPrice || 0;
        const estimatedPrice = doorArea * doorPrice * item.linkedDoor.quantity;
        
        const doorItem: QuotationDoor = {
          doorTypeId: item.linkedDoor.doorTypeId,
          doorTypeName: item.linkedDoor.doorType?.name,
          brandName: item.linkedDoor.doorType?.brandName,
          material: item.linkedDoor.doorType?.material,
          widthMm: item.linkedDoor.widthMm,
          heightMm: item.linkedDoor.heightMm,
          quantity: item.linkedDoor.quantity,
          unitPrice: item.linkedDoor.doorType?.companyPrice || 0,
          totalPrice: estimatedPrice, // Use estimated price for display
          customDimensions: true,
          description: `${item.linkedDoor.doorType?.name} (${item.linkedDoor.widthMm}×${item.linkedDoor.heightMm}mm)`,
          // Elevation fields (same as linked cabinet)
          elevationId: item.elevationId,
          elevationName: item.elevationName,
          // @ts-ignore link to cabinet for removal
          _tempPairId: pairId,
        };
        next.doors = [...(next.doors || []), doorItem];
      }
    }
    // Handle standalone doors with dimensions
    else if (category === 'doors' && item.doorTypeId) {
      // Calculate estimated price using Excel formula
      const doorArea = item.faceArea || 0;
      const doorPrice = item.doorType?.companyPrice || 0;
      const estimatedPrice = doorArea * doorPrice * item.quantity;

      const doorItem: QuotationDoor = {
        doorTypeId: item.doorTypeId,
        doorTypeName: item.doorType?.name,
        brandName: item.doorType?.brandName,
        material: item.doorType?.material,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        quantity: item.quantity,
        unitPrice: item.doorType?.companyPrice || 0,
        totalPrice: estimatedPrice, // Use estimated price for display
        customDimensions: true,
        description: `${item.doorType?.name} (${item.widthMm}×${item.heightMm}mm)`,
        // Elevation fields
        elevationId: item.elevationId,
        elevationName: item.elevationName,
      };
      next[category] = [...(next[category] || []), doorItem];
    }
    // Handle accessories from modal (with elevation data).
    // Merge into an existing row for the same accessory on the same elevation instead of
    // appending a duplicate row (e.g. "C GOLA × 3" + "C GOLA" -> "C GOLA × 4").
    else if (category === 'accessories' && item.accessoryId) {
      const list = [...(next[category] || [])];
      const addQty = item.quantity || 1;
      // Merge with an existing row of the same accessory. Elevation only separates rows
      // when BOTH sides explicitly chose different elevations; a row without an elevation
      // (e.g. loaded from an older save) merges with any add of the same accessory.
      const newElev = item.elevationId ?? null;
      const existingIndex = list.findIndex((x: any) => {
        if ((x.accessoryId ?? x.id) !== item.accessoryId) return false;
        const curElev = x.elevationId ?? null;
        return curElev === newElev || curElev === null || newElev === null;
      });
      if (existingIndex >= 0) {
        const current: any = list[existingIndex];
        const quantity = (current.quantity || 1) + addQty;
        const unitPrice = Number(current.price ?? current.unitPrice ?? item.unitPrice ?? 0);
        list[existingIndex] = { ...current, quantity, totalPrice: unitPrice * quantity };
      } else {
        const accessoryItem: QuotationAccessory = {
          id: item.id,
          accessoryId: item.accessoryId,
          description: item.name || item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          price: item.price || item.unitPrice,
          brandName: item.brandName || item.raw?.brandName,
          // Elevation fields
          elevationId: item.elevationId,
          elevationName: item.elevationName,
        };
        list.push(accessoryItem);
      }
      next[category] = list;
    }
    // Handle lighting with quantity aggregation (no elevation)
    else {
      const unitPrice = Number(item.price || item.unitPrice || item.totalPrice || 0);
      const currentList = next[category] || [];
      const typeKey = item?.raw?.itemType || item?.itemType; // important for lighting
      next[category] = updateListWithQuantity(currentList, item.id, unitPrice, 'inc', item, typeKey);
    }
    onProductsChange(next);
  };

  const handleRemove = (
    category: 'accessories' | 'cabinets' | 'doors' | 'lighting',
    index: number
  ) => {
    const next = { ...selectedProducts } as any;
    const list = (next[category] || []).slice();
    const removed = list[index];
    list.splice(index, 1);
    next[category] = list;

    // When removing a cabinet, also remove linked door if paired
    // and when removing a door that was linked, do not touch cabinet (only cabinet-triggered removal cascades)
    // @ts-ignore
    const pairId = removed?._tempPairId;
    if (category === 'cabinets' && pairId && Array.isArray(next.doors)) {
      next.doors = next.doors.filter((d: any) => d._tempPairId !== pairId);
    }

    onProductsChange(next);
  };

  const handleIncrement = (
    category: 'accessories' | 'lighting',
    itemId: number,
    unitPrice: number,
    initialItem: any
  ) => {
    const next = { ...selectedProducts } as any;
    const currentList = next[category] || [];
    const typeKey = initialItem?.raw?.itemType || initialItem?.itemType;
    next[category] = updateListWithQuantity(currentList, itemId, unitPrice, 'inc', initialItem, typeKey);
    onProductsChange(next);
  };

  const handleDecrement = (
    category: 'accessories' | 'lighting',
    itemId: number,
    unitPrice: number,
    itemType?: string
  ) => {
    const next = { ...selectedProducts } as any;
    let currentList = next[category] || [];
    if (category === 'lighting' && itemType) {
      // Ensure we decrement the matching type entry if duplicates of same id across types
      currentList = currentList.map((x: any) => ({ ...x }));
    }
    next[category] = updateListWithQuantity(currentList, itemId, unitPrice, 'dec', undefined, itemType);
    onProductsChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-600 pointer-events-none" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Tabs */}
      <Card className="p-0 bg-background-800 border-background-600">
        <Tabs
          tabs={[
            ...productTabs.map((t) => ({
              label: t.label,
              content: (
                <CategoryProducts
                  category={t.key as any}
                  search={search}
                  onAdd={(item) => handleAdd(t.key as any, item)}
                  getQuantity={(id: number, itemType?: string) => getQuantity(t.key as any, id, itemType)}
                  onIncrement={(id: number, unitPrice: number, initial: any) => handleIncrement(t.key as any, id, unitPrice, initial)}
                  onDecrement={(id: number, unitPrice: number) => handleDecrement(t.key as any, id, unitPrice)}
                  selectedAccessories={selectedProducts.accessories}
                  selectedCabinets={selectedProducts.cabinets}
                  selectedDoors={selectedProducts.doors}
                  selectedLighting={selectedProducts.lighting}
                  availableElevations={availableElevations}
                />
              ),
            })),
            {
              label: 'Other Expenses',
              content: (
                <OtherExpensesTab
                  expenses={selectedProducts.otherExpenses || []}
                  onChange={(otherExpenses) => onProductsChange({ otherExpenses })}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

export default ProductSelector;


