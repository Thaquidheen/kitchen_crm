/**
 * ProductsPage
 * Product catalog shell in the HOCH idiom: compact page header, then a chip-style tab row
 * (matching the filter chips on Customers/Vendors), each tab a self-contained manager.
 *
 * The active tab lives in the URL (/products/:tab) so refresh and deep links keep their place —
 * the old useState version always snapped back to Categories.
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Layers, Package, Wrench, Archive, DoorOpen, Lightbulb, PanelTop } from 'lucide-react';
import { CategoryManager } from '../../features/products/components/CategoryManager';
import { BrandManager } from '../../features/products/components/BrandManager';
import { MaterialManager } from '../../features/products/components/MaterialManager';
import { InnerPanelManager } from '../../features/products/components/InnerPanelManager';
import { AccessoryManager } from '../../features/products/components/AccessoryManager';
import { CabinetsManager } from '../../features/products/components/CabinetsManager';
import { DoorsManager } from '../../features/products/components/DoorsManager';
import { LightingManager } from '../../features/products/components/LightingManager';

type TabType =
  | 'categories'
  | 'brands'
  | 'materials'
  | 'inner-panels'
  | 'accessories'
  | 'cabinets'
  | 'doors'
  | 'lighting';

const TABS: Array<{ id: TabType; label: string; icon: React.ElementType; el: React.ReactNode }> = [
  { id: 'categories', label: 'Categories', icon: Layers, el: <CategoryManager /> },
  { id: 'brands', label: 'Brands', icon: Package, el: <BrandManager /> },
  { id: 'materials', label: 'Materials', icon: Box, el: <MaterialManager /> },
  { id: 'inner-panels', label: 'Inner Panels', icon: PanelTop, el: <InnerPanelManager /> },
  { id: 'accessories', label: 'Accessories', icon: Wrench, el: <AccessoryManager /> },
  { id: 'cabinets', label: 'Cabinets', icon: Archive, el: <CabinetsManager /> },
  { id: 'doors', label: 'Doors', icon: DoorOpen, el: <DoorsManager /> },
  { id: 'lighting', label: 'Lighting', icon: Lightbulb, el: <LightingManager /> },
];

const isTab = (v: string | undefined): v is TabType => TABS.some((t) => t.id === v);

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const activeTab: TabType = isTab(tab) ? tab : 'categories';
  const active = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div>
          <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">Products</h1>
          <p className="mt-[5px] mb-0 text-[13px] text-text-700">
            The catalog behind quotations — categories, brands, materials, cabinets, doors,
            accessories and lighting.
          </p>
        </div>
        <div className="flex-1" />
      </div>

      {/* Tab chips */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = t.id === activeTab;
          return (
            <button
              key={t.id}
              onClick={() => navigate(`/products/${t.id}`, { replace: false })}
              className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
              style={
                isActive
                  ? {
                      borderColor: 'var(--color-primary-600)',
                      background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
                    }
                  : {
                      borderColor: 'var(--color-background-600)',
                      background: 'var(--color-background-800)',
                    }
              }
            >
              <Icon
                size={14}
                className={isActive ? 'text-primary-600' : 'text-text-500'}
              />
              <span
                className={`text-[12.5px] whitespace-nowrap ${
                  isActive ? 'font-semibold text-text-900' : 'font-medium text-text-700'
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active tab */}
      <div className="w-full">{active.el}</div>
    </div>
  );
};

export default ProductsPage;
