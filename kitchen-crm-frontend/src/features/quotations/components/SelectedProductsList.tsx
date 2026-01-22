/**
 * SelectedProductsList
 * Sidebar summary of selected products for the quotation
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pencil } from 'lucide-react';

export interface SelectedProductsListProps {
  accessories: Array<{ id?: number; name?: string; description?: string; totalPrice?: number; price?: number }>;
  cabinets: Array<{ id?: number; name?: string; cabinetTypeName?: string; description?: string; widthMm?: number; heightMm?: number; depthMm?: number; totalPrice?: number; price?: number }>;
  doors: Array<{ id?: number; name?: string; doorTypeName?: string; description?: string; widthMm?: number; heightMm?: number; totalPrice?: number; price?: number }>;
  lighting: Array<{ id?: number; name?: string; description?: string; totalPrice?: number; price?: number }>;
  onRemove?: (category: 'accessories' | 'cabinets' | 'doors' | 'lighting', index: number) => void;
  onEditCabinet?: (index: number) => void;
}

export function SelectedProductsList({ accessories, cabinets, doors, lighting, onRemove, onEditCabinet }: SelectedProductsListProps) {
  const sections = [
    { label: 'Accessories', key: 'accessories', items: accessories },
    { label: 'Cabinets', key: 'cabinets', items: cabinets },
    { label: 'Doors', key: 'doors', items: doors },
    { label: 'Lighting', key: 'lighting', items: lighting },
  ];

  const grandTotal = [...accessories, ...cabinets, ...doors, ...lighting].reduce(
    (sum, i) => sum + (i.totalPrice ?? i.price ?? 0),
    0
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {sections.map((s) => (
        <Card key={s.label} className="p-3 sm:p-4 bg-background-800 border-background-600">
          <div className="text-xs sm:text-sm font-semibold text-text-800 mb-2">{s.label}</div>
          <div className="space-y-2">
            {s.items.length === 0 && (
              <div className="text-xs sm:text-sm text-text-600">No items</div>
            )}
            {s.items.map((i: any, idx) => {
              // Display name with dimensions for cabinets/doors
              let displayName = i.description || i.cabinetTypeName || i.doorTypeName || i.name || `Item ${idx + 1}`;

              // Generate unique key combining category, index, and item identifier
              const uniqueKey = `${s.key}-${idx}-${i.id || i.cabinetTypeId || i.doorTypeId || i._tempPairId || idx}`;

              return (
                <div key={uniqueKey} className="text-xs sm:text-sm text-text-700 p-2 bg-background-700/50 rounded-lg">
                  {/* Mobile: Stack layout, Desktop: Row layout */}
                  <div className="flex flex-col gap-1">
                    {/* Name and Price row */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex-1 min-w-0 break-words leading-tight">{displayName}</span>
                      <span className="font-semibold whitespace-nowrap text-primary-400">
                        ₹{(i.totalPrice ?? i.price ?? 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Quantity if > 1 */}
                    {i.quantity && i.quantity > 1 && (
                      <div className="text-xs text-text-600">Qty: {i.quantity}</div>
                    )}

                    {/* Action buttons row */}
                    <div className="flex items-center justify-end gap-1 mt-1 pt-1 border-t border-background-600">
                      {s.key === 'cabinets' && onEditCabinet && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => onEditCabinet(idx)}
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
                          onClick={() => onRemove(s.key as any, idx)}
                          className="flex-shrink-0 text-xs px-2 py-1 text-error hover:text-error"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

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


