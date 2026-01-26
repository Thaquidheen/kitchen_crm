/**
 * SelectedProductsList
 * Sidebar summary of selected products grouped by elevation
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pencil, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { useState } from 'react';
import type { QuotationElevation } from '../types';

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
  availableElevations?: QuotationElevation[];
  onRemove?: (category: 'accessories' | 'cabinets' | 'doors' | 'lighting', index: number) => void;
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
  availableElevations = [],
  onRemove,
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

  const grandTotal = [...accessories, ...cabinets, ...doors, ...lighting].reduce(
    (sum, i) => sum + ((i as any).totalPrice ?? (i as any).price ?? 0),
    0
  );

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

    return (
      <div key={uniqueKey} className="text-xs text-text-700 p-2 bg-background-700/50 rounded-lg">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <span className="flex-1 min-w-0 break-words leading-tight">{displayName}</span>
            <span className="font-semibold whitespace-nowrap text-primary-400">
              ₹{(item.totalPrice ?? item.price ?? 0).toLocaleString('en-IN')}
            </span>
          </div>

          {item.quantity && item.quantity > 1 && (
            <div className="text-xs text-text-600">Qty: {item.quantity}</div>
          )}

          <div className="flex items-center justify-end gap-1 mt-1 pt-1 border-t border-background-600">
            {category === 'cabinets' && onEditCabinet && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => onEditCabinet(originalIndex)}
                className="flex-shrink-0 text-xs px-2 py-1"
                title="Edit"
              >
                <Pencil className="w-3 h-3 mr-1" />
                <span>Edit</span>
              </Button>
            )}
            {category === 'doors' && onEditDoor && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => onEditDoor(originalIndex)}
                className="flex-shrink-0 text-xs px-2 py-1"
                title="Edit"
              >
                <Pencil className="w-3 h-3 mr-1" />
                <span>Edit</span>
              </Button>
            )}
            {onRemove && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => onRemove(category, originalIndex)}
                className="flex-shrink-0 text-xs px-2 py-1 text-error hover:text-error"
              >
                Remove
              </Button>
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
        <div className="text-xs font-medium text-text-600 mb-1">
          {label} ({items.length})
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
