import React, { useState } from 'react';
import { Box, Layers, Package, Wrench, Archive, DoorOpen, Lightbulb } from 'lucide-react';
import { CategoryManager } from '../../features/products/components/CategoryManager';
import { BrandManager } from '../../features/products/components/BrandManager';
import { MaterialManager } from '../../features/products/components/MaterialManager';
import { AccessoryManager } from '../../features/products/components/AccessoryManager';
import { CabinetsManager } from '../../features/products/components/CabinetsManager';
import { DoorsManager } from '../../features/products/components/DoorsManager';
import { LightingManager } from '../../features/products/components/LightingManager';

type TabType = 'categories' | 'brands' | 'materials' | 'accessories' | 'cabinets' | 'doors' | 'lighting';

const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('categories');

  const tabs: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'brands', label: 'Brands', icon: Package },
    { id: 'materials', label: 'Materials', icon: Box },
    { id: 'accessories', label: 'Accessories', icon: Wrench },
    { id: 'cabinets', label: 'Cabinets', icon: Archive },
    { id: 'doors', label: 'Doors', icon: DoorOpen },
    { id: 'lighting', label: 'Lighting', icon: Lightbulb },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'categories':
        return <CategoryManager />;
      case 'brands':
        return <BrandManager />;
      case 'materials':
        return <MaterialManager />;
      case 'accessories':
        return <AccessoryManager />;
      case 'cabinets':
        return <CabinetsManager />;
      case 'doors':
        return <DoorsManager />;
      case 'lighting':
        return <LightingManager />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-900 p-2 sm:p-3 lg:p-4">
      <div className="w-full space-y-4 sm:space-y-5 lg:space-y-6">
        {/* Header */}
        <div className="mb-4 sm:mb-5 lg:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-primary-600/10 rounded-lg sm:rounded-xl">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-900">Product Catalog Management</h1>
            </div>
          </div>
          <p className="text-sm sm:text-base text-text-600 mt-1 sm:mt-2">
            Manage categories, brands, and materials for your product catalog
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-background-600 mb-4 sm:mb-5 lg:mb-6">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap
                    ${
                      isActive
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-text-600 hover:text-text-900 border-b-2 border-transparent'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">{tab.label}</span>
                  <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default ProductsPage;
