/**
 * CategoryProducts
 * Product cards grid for a specific category
 */

import { useState, useEffect } from 'react';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/shared/Pagination';
import { getImageUrl } from '@/utils/imageUtils';
import {
  useGetAccessoriesPaginatedQuery,
  useGetActiveCategoriesQuery,
  useGetCabinetsQuery as useGetCabinetsArray,
  useGetDoorsQuery as useGetDoorsArray,
} from '@/features/products/productsAPI';
import { 
  useGetLightProfilesQuery,
  useGetDriversQuery,
  useGetConnectorsQuery,
  useGetSensorsQuery,
} from '@/features/products/lightingAPI';
import { AddCabinetModal } from './AddCabinetModal';
import { AddDoorModal } from './AddDoorModal';
import { AddAccessoryModal } from './AddAccessoryModal';
import type { CabinetType, DoorType } from '../../products/types';
import type { QuotationElevation } from '../types';

export interface CategoryProductsProps {
  category: 'accessories' | 'cabinets' | 'doors' | 'lighting';
  search?: string;
  onAdd: (item: any) => void;
  getQuantity?: (id: number, itemType?: string) => number; // accessories: by id, lighting: by id+type
  onIncrement?: (id: number, unitPrice: number, initial?: any) => void;
  onDecrement?: (id: number, unitPrice: number, itemType?: string) => void;
  // Selected lists to show indicator
  selectedAccessories?: any[];
  selectedCabinets?: any[];
  selectedDoors?: any[];
  selectedLighting?: any[];
  // Available elevations for the current kitchen
  availableElevations?: QuotationElevation[];
}

export function CategoryProducts({ category, search, onAdd, getQuantity, onIncrement, onDecrement, selectedAccessories = [], selectedCabinets = [], selectedDoors = [], selectedLighting = [], availableElevations = [] }: CategoryProductsProps) {
  // Modal state
  const [cabinetModalOpen, setCabinetModalOpen] = useState(false);
  const [doorModalOpen, setDoorModalOpen] = useState(false);
  const [accessoryModalOpen, setAccessoryModalOpen] = useState(false);
  const [selectedCabinet, setSelectedCabinet] = useState<CabinetType | null>(null);
  const [selectedDoor, setSelectedDoor] = useState<DoorType | null>(null);
  const [selectedAccessory, setSelectedAccessory] = useState<{ id: number; name: string; price: number; raw?: any } | null>(null);

  // Custom lighting item state
  const [customLightName, setCustomLightName] = useState('');
  const [customLightPrice, setCustomLightPrice] = useState('');
  const [customLightQty, setCustomLightQty] = useState('1');

  // Pagination & category filter state for accessories
  const [accessoriesPage, setAccessoriesPage] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const ACCESSORIES_PAGE_SIZE = 12; // Divisible by 1, 2, 3 for responsive grid

  // Fetch categories for filter
  const { data: categories } = useGetActiveCategoriesQuery();

  // Fetch accessories with pagination and category filter
  const { data: accessoriesPaginated } = useGetAccessoriesPaginatedQuery(
    { page: accessoriesPage, size: ACCESSORIES_PAGE_SIZE, name: search || undefined, categoryId: selectedCategoryId }
  );
  const accessories = accessoriesPaginated?.content || [];
  const accessoriesTotalPages = accessoriesPaginated?.totalPages || 0;
  const { data: cabinets } = useGetCabinetsArray({ page: 0, size: 100 });
  const { data: doors } = useGetDoorsArray({ page: 0, size: 100 });
  const { data: profiles } = useGetLightProfilesQuery();
  const { data: drivers } = useGetDriversQuery();
  const { data: connectors } = useGetConnectorsQuery();
  const { data: sensors } = useGetSensorsQuery();

  // Reset pagination when search or category changes
  useEffect(() => {
    setAccessoriesPage(0);
  }, [search, selectedCategoryId]);

  // Map into generic items with id, name, price
  let base: Array<{ id: number; name: string; price: number; raw?: any }> = [];
  if (category === 'accessories') {
    base = (accessories || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      price: Number(a.companyPrice ?? a.mrp ?? 0),
      raw: a,
    }));
  } else if (category === 'cabinets') {
    base = (cabinets || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      price: -1, // Price varies based on material selection
      raw: c,
    }));
  } else if (category === 'doors') {
    base = (doors || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      price: Number(d.companyPrice ?? d.mrp ?? 0),
      raw: d,
    }));
  } else if (category === 'lighting') {
    base = [
      ...(profiles || []).map((p: any) => ({
        id: p.id,
        name: `Profile ${p.profileType}`,
        price: Number(p.companyPrice ?? p.mrp ?? p.pricePerMeter ?? 0),
        raw: { ...p, itemType: 'LIGHT_PROFILE' },
      })),
      ...(drivers || []).map((d: any) => ({
        id: d.id,
        name: `${d.wattage}W Driver`,
        price: Number(d.companyPrice ?? d.mrp ?? d.price ?? 0),
        raw: { ...d, itemType: 'DRIVER' },
      })),
      ...(connectors || []).map((c: any) => ({
        id: c.id,
        name: String(c.type).replace(/_/g, ' '),
        price: Number(c.companyPrice ?? c.mrp ?? c.pricePerPiece ?? 0),
        raw: { ...c, itemType: 'CONNECTOR' },
      })),
      ...(sensors || []).map((s: any) => ({
        id: s.id,
        name: String(s.type).replace(/_/g, ' '),
        price: Number(s.companyPrice ?? s.mrp ?? s.pricePerPiece ?? 0),
        raw: { ...s, itemType: 'SENSOR' },
      })),
    ];
  }

  // For accessories, use server-side filtering (already done via API param)
  // For other categories, filter client-side
  const items = category === 'accessories'
    ? base
    : base.filter((i) => !search ? true : i.name?.toLowerCase().includes(search.toLowerCase()));

  const isTypeSelected = (item: any) => {
    if (category === 'cabinets') {
      return (selectedCabinets || []).some((c: any) => c.cabinetTypeId === item.raw?.id || c.cabinetTypeId === item.id);
    }
    if (category === 'doors') {
      return (selectedDoors || []).some((d: any) => d.doorTypeId === item.raw?.id || d.doorTypeId === item.id);
    }
    return false;
  };

  // Handle add button click
  const handleAddClick = (item: any) => {
    if (category === 'cabinets') {
      setSelectedCabinet(item.raw);
      setCabinetModalOpen(true);
    } else if (category === 'doors') {
      setSelectedDoor(item.raw);
      setDoorModalOpen(true);
    } else if (category === 'accessories') {
      // Open modal for accessories with elevation selection
      setSelectedAccessory(item);
      setAccessoryModalOpen(true);
    } else {
      // Direct add for lighting (no elevation)
      onAdd(item);
    }
  };

  const handleAddCustomLighting = () => {
    const name = customLightName.trim();
    if (!name) return;
    const unitPrice = customLightPrice === '' ? 0 : parseFloat(customLightPrice);
    if (isNaN(unitPrice)) return;
    const qty = customLightQty === '' ? 1 : parseInt(customLightQty) || 1;

    // Add as a single item with quantity already set
    // Use a unique negative ID so it doesn't conflict with catalog items
    onAdd({
      id: -Date.now(),
      name,
      price: Math.max(0, unitPrice),
      quantity: qty,
      totalPrice: Math.max(0, unitPrice) * qty,
      raw: { itemType: 'CUSTOM' },
    });
    setCustomLightName('');
    setCustomLightPrice('');
    setCustomLightQty('1');
  };

  return (
    <>
    {/* Category filter dropdown for accessories */}
    {category === 'accessories' && categories && categories.length > 0 && (
      <div className="px-3 sm:px-4 pt-3 sm:pt-4">
        <select
          value={selectedCategoryId || ''}
          onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full sm:w-64 px-3 py-2 bg-background-900 border border-background-600 rounded-md text-text-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          <option value="">All Categories</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
    )}

    <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {items.map((item) => {
        // Generate unique key: for lighting items, combine itemType with id to avoid collisions
        const uniqueKey = item.raw?.itemType ? `${item.raw.itemType}-${item.id}` : `${category}-${item.id}`;
        return (
        <Card key={uniqueKey} className={`${category === 'accessories' ? 'p-0 overflow-hidden' : 'p-3 sm:p-4'} bg-background-800 border-background-600`}>
          {/* Image section - only for accessories */}
          {category === 'accessories' && (
            <div className="relative h-28 sm:h-32 bg-background-700">
              {item.raw?.imageUrl ? (
                <img
                  src={getImageUrl(item.raw.imageUrl)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`absolute inset-0 flex items-center justify-center bg-background-700 ${item.raw?.imageUrl ? 'hidden' : ''}`}>
                <Package className="w-10 h-10 sm:w-12 sm:h-12 text-text-500" />
              </div>
              {(() => {
                const qty = (getQuantity ? getQuantity(item.id, item.raw?.itemType) : 0) || 0;
                return qty > 0 ? (
                  <span className="absolute top-2 right-2 inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-success text-text-900">
                    ✓ Added ({qty})
                  </span>
                ) : null;
              })()}
            </div>
          )}

          {/* Content section */}
          <div className={category === 'accessories' ? 'p-3 sm:p-4' : ''}>
            {/* Name - show badge inline for non-accessories */}
            <div className="text-xs sm:text-sm text-text-900 font-semibold flex items-center gap-2">
              {category !== 'accessories' && isTypeSelected(item) && (
                <span className="inline-flex items-center text-xs px-1.5 sm:px-2 py-0.5 rounded bg-success text-text-900">✓ Added</span>
              )}
              <span className="line-clamp-2" title={item.name}>{item.name}</span>
            </div>
            {category === 'accessories' && item.raw?.brandName && (
              <div className="text-xs text-text-600 mt-0.5">{item.raw.brandName}</div>
            )}

            {/* Price */}
            <div className="text-xs sm:text-sm text-text-700 mt-1">
              {item.price === -1 ? (
                <span className="text-primary-400">Select to configure</span>
              ) : (
                <>₹{item.price.toLocaleString('en-IN')}</>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-2 sm:mt-3">
              {category === 'accessories' || category === 'lighting' ? (
                (() => {
                  const qty = (getQuantity ? getQuantity(item.id, item.raw?.itemType) : 0) || 0;
                  if (!qty) {
                    return (
                      <Button size="sm" variant="primary" onClick={() => handleAddClick(item)} className="w-full sm:w-auto">
                        Add
                      </Button>
                    );
                  }
                  const unitPrice = Number(item.price || 0);
                  return (
                    <div className="inline-flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => onDecrement && onDecrement(item.id, unitPrice, item.raw?.itemType)}>
                        −
                      </Button>
                      <span className="text-text-900 font-semibold w-6 text-center text-xs sm:text-sm">{qty}</span>
                      <Button size="sm" variant="secondary" onClick={() => onIncrement && onIncrement(item.id, unitPrice, item)}>
                        +
                      </Button>
                    </div>
                  );
                })()
              ) : (
                <Button size="sm" variant="primary" onClick={() => handleAddClick(item)} className="w-full sm:w-auto">
                  Add
                </Button>
              )}
            </div>
          </div>
        </Card>
        );
      })}
      {items.length === 0 && (
        <div className="col-span-full text-center text-text-600 py-6 sm:py-8 text-xs sm:text-sm">No products found</div>
      )}
    </div>

    {/* Pagination for Accessories */}
    {category === 'accessories' && accessoriesTotalPages > 1 && (
      <div className="border-t border-background-600 px-4 py-3">
        <Pagination
          currentPage={accessoriesPage + 1}
          totalPages={accessoriesTotalPages}
          onPageChange={(page) => setAccessoriesPage(page - 1)}
        />
      </div>
    )}

    {/* Custom Lighting Item */}
    {category === 'lighting' && (
      <div className="mx-3 sm:mx-4 mb-4 p-3 sm:p-4 border border-background-600 rounded-lg bg-background-800">
        <h4 className="text-xs font-semibold text-text-700 mb-3">Add Custom Lighting Item</h4>
        <div className="flex flex-col sm:flex-row items-end gap-2">
          <div className="flex-1 w-full">
            <Input
              type="text"
              value={customLightName}
              onChange={(e) => setCustomLightName(e.target.value)}
              placeholder="Item name"
              className="text-sm"
            />
          </div>
          <div className="w-full sm:w-32">
            <Input
              type="text"
              inputMode="decimal"
              value={customLightPrice}
              onChange={(e) => setCustomLightPrice(e.target.value)}
              placeholder="Price"
              className="text-sm"
            />
          </div>
          <div className="w-full sm:w-24">
            <Input
              type="text"
              inputMode="numeric"
              value={customLightQty}
              onChange={(e) => setCustomLightQty(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Qty"
              className="text-sm"
            />
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleAddCustomLighting}
            disabled={!customLightName.trim()}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    )}

    {/* Modals */}
    {cabinetModalOpen && selectedCabinet && (
      <AddCabinetModal
        isOpen={cabinetModalOpen}
        onClose={() => setCabinetModalOpen(false)}
        cabinet={selectedCabinet}
        availableDoors={doors || []}
        availableElevations={availableElevations}
        onAdd={(data) => {
          onAdd(data);
          setCabinetModalOpen(false);
        }}
      />
    )}

    {doorModalOpen && selectedDoor && (
      <AddDoorModal
        isOpen={doorModalOpen}
        onClose={() => setDoorModalOpen(false)}
        door={selectedDoor}
        availableElevations={availableElevations}
        onAdd={(data) => {
          onAdd(data);
          setDoorModalOpen(false);
        }}
      />
    )}

    {accessoryModalOpen && selectedAccessory && (
      <AddAccessoryModal
        isOpen={accessoryModalOpen}
        onClose={() => setAccessoryModalOpen(false)}
        accessory={selectedAccessory}
        availableElevations={availableElevations}
        onAdd={(data) => {
          onAdd(data);
          setAccessoryModalOpen(false);
        }}
      />
    )}
    </>
  );
}

export default CategoryProducts;


