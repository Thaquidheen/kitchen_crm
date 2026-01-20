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
                <div key={uniqueKey} className="text-xs sm:text-sm text-text-700">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex-1 min-w-0 break-words">{displayName}</span>
                    <span className="ml-2 font-semibold whitespace-nowrap">₹{(i.totalPrice ?? i.price ?? 0).toLocaleString('en-IN')}</span>
                    {s.key === 'cabinets' && onEditCabinet && (
                      <Button size="xs" variant="ghost" onClick={() => onEditCabinet(idx)} className="flex-shrink-0" title="Edit">
                        <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    )}
                    {onRemove && (
                      <Button size="xs" variant="ghost" onClick={() => onRemove(s.key as any, idx)} className="flex-shrink-0">
                        <span className="hidden sm:inline">Remove</span>
                        <span className="sm:hidden">×</span>
                      </Button>
                    )}
                  </div>
                  {i.quantity && i.quantity > 1 && (
                    <div className="text-xs text-text-600 mt-0.5">Qty: {i.quantity}</div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <Card className="p-3 sm:p-4 bg-background-800 border-background-600">
        <div className="text-xs sm:text-sm font-semibold text-text-800 mb-2">Grand Total</div>
        <div className="text-xl sm:text-2xl font-bold text-text-900">₹{grandTotal.toLocaleString('en-IN')}</div>
      </Card>
    </div>
  );
}

export default SelectedProductsList;


