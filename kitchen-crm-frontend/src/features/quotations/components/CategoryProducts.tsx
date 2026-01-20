/**
 * CategoryProducts
 * Product cards grid for a specific category
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  useGetAccessoriesQuery as useGetAccessoriesArray,
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
import type { CabinetType, DoorType } from '../../products/types';

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
}

export function CategoryProducts({ category, search, onAdd, getQuantity, onIncrement, onDecrement, selectedAccessories = [], selectedCabinets = [], selectedDoors = [], selectedLighting = [] }: CategoryProductsProps) {
  // Modal state
  const [cabinetModalOpen, setCabinetModalOpen] = useState(false);
  const [doorModalOpen, setDoorModalOpen] = useState(false);
  const [selectedCabinet, setSelectedCabinet] = useState<CabinetType | null>(null);
  const [selectedDoor, setSelectedDoor] = useState<DoorType | null>(null);

  // Fetch real data per category
  const { data: accessories } = useGetAccessoriesArray(undefined);
  const { data: cabinets } = useGetCabinetsArray(undefined);
  const { data: doors } = useGetDoorsArray(undefined);
  const { data: profiles } = useGetLightProfilesQuery();
  const { data: drivers } = useGetDriversQuery();
  const { data: connectors } = useGetConnectorsQuery();
  const { data: sensors } = useGetSensorsQuery();

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

  const items = base.filter((i) =>
    !search ? true : i.name?.toLowerCase().includes(search.toLowerCase())
  );

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
    } else {
      // Direct add for accessories and lighting
      onAdd(item);
    }
  };

  return (
    <>
    <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {items.map((item) => {
        // Generate unique key: for lighting items, combine itemType with id to avoid collisions
        const uniqueKey = item.raw?.itemType ? `${item.raw.itemType}-${item.id}` : `${category}-${item.id}`;
        return (
        <Card key={uniqueKey} className="p-3 sm:p-4 bg-background-800 border-background-600">
          <div className="text-xs sm:text-sm text-text-900 font-semibold flex items-center gap-2">
            {isTypeSelected(item) && (
              <span className="inline-flex items-center text-xs px-1.5 sm:px-2 py-0.5 rounded bg-success text-text-900">✓ Added</span>
            )}
            <span className="truncate">{item.name}</span>
          </div>
          <div className="text-xs sm:text-sm text-text-700 mt-1">
            {item.price === -1 ? (
              <span className="text-primary-400">Select to configure</span>
            ) : (
              <>₹{item.price.toLocaleString('en-IN')}</>
            )}
          </div>
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
        </Card>
        );
      })}
      {items.length === 0 && (
        <div className="col-span-full text-center text-text-600 py-6 sm:py-8 text-xs sm:text-sm">No products found</div>
      )}
    </div>

    {/* Modals */}
    {cabinetModalOpen && selectedCabinet && (
      <AddCabinetModal
        isOpen={cabinetModalOpen}
        onClose={() => setCabinetModalOpen(false)}
        cabinet={selectedCabinet}
        availableDoors={doors || []}
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
        onAdd={(data) => {
          onAdd(data);
          setDoorModalOpen(false);
        }}
      />
    )}
    </>
  );
}

export default CategoryProducts;


