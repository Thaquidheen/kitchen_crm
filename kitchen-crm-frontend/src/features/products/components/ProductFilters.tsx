import React, { useState } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { ListParams } from '../types';
import {
  useGetActiveCategoriesQuery,
  useGetActiveBrandsQuery,
  useGetActiveMaterialsQuery,
} from '../productsAPI';

export interface ProductFiltersProps {
  filters: ListParams;
  onFiltersChange: (filters: ListParams) => void;
  showCategoryFilter?: boolean;
  showBrandFilter?: boolean;
  showMaterialFilter?: boolean;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
  showCategoryFilter = true,
  showBrandFilter = true,
  showMaterialFilter = true,
}) => {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: categories } = useGetActiveCategoriesQuery(undefined, {
    skip: !showCategoryFilter,
  });
  const { data: brands } = useGetActiveBrandsQuery(undefined, {
    skip: !showBrandFilter,
  });
  const { data: materials } = useGetActiveMaterialsQuery(undefined, {
    skip: !showMaterialFilter,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: localSearch, page: 0 });
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    onFiltersChange({
      page: 0,
      size: filters.size || 12,
      sortBy: 'name',
      sortDir: 'asc',
    });
  };

  const activeFilterCount = [
    filters.search,
    filters.categoryId,
    filters.brandId,
    filters.materialId,
    filters.active !== undefined ? true : false,
  ].filter(Boolean).length;

  return (
    <div className="bg-background-800 border border-background-600 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
      {/* Quick Search */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-500" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search products by name..."
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 bg-background-900 border border-background-600 rounded-md text-text-900 placeholder-text-500 focus:border-primary-600 focus:outline-none text-sm sm:text-base"
          />
        </div>
        <button
          type="submit"
          className="px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-text-900 rounded-md transition-colors text-sm sm:text-base font-medium whitespace-nowrap"
        >
          Search
        </button>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="p-2 text-text-600 hover:text-text-900 transition-colors"
            title="Clear all filters"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </form>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs sm:text-sm text-text-600 hover:text-text-900 transition-colors"
        >
          {showAdvanced ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Hide Filters</span>
              <span className="xs:hidden">Hide</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">More Filters</span>
              <span className="xs:hidden">Filters</span>
            </>
          )}
        </button>
        {activeFilterCount > 0 && (
          <span className="px-2 py-1 bg-primary-900/20 text-primary-400 text-xs rounded border border-primary-600">
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </span>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-background-600">
          {/* Category Filter */}
          {showCategoryFilter && categories && categories.length > 0 && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
                Category
              </label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    categoryId: e.target.value ? Number(e.target.value) : undefined,
                    page: 0,
                  })
                }
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-background-900 border border-background-600 rounded-md text-text-900 focus:border-primary-600 focus:outline-none text-sm sm:text-base"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Brand Filter */}
          {showBrandFilter && brands && brands.length > 0 && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
                Brand
              </label>
              <select
                value={filters.brandId || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    brandId: e.target.value ? Number(e.target.value) : undefined,
                    page: 0,
                  })
                }
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-background-900 border border-background-600 rounded-md text-text-900 focus:border-primary-600 focus:outline-none text-sm sm:text-base"
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Material Filter */}
          {showMaterialFilter && materials && materials.length > 0 && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
                Material
              </label>
              <select
                value={filters.materialId || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    materialId: e.target.value ? Number(e.target.value) : undefined,
                    page: 0,
                  })
                }
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-background-900 border border-background-600 rounded-md text-text-900 focus:border-primary-600 focus:outline-none text-sm sm:text-base"
              >
                <option value="">All Materials</option>
                {materials.map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active Status Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
              Status
            </label>
            <select
              value={
                filters.active === undefined ? 'all' : filters.active ? 'active' : 'inactive'
              }
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  active:
                    e.target.value === 'all'
                      ? undefined
                      : e.target.value === 'active',
                  page: 0,
                })
              }
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-background-900 border border-background-600 rounded-md text-text-900 focus:border-primary-600 focus:outline-none text-sm sm:text-base"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
