import React, { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetCabinetsQuery,
  useCreateCabinetMutation,
  useUpdateCabinetMutation,
  useDeleteCabinetMutation,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useGetMaterialsQuery,
} from '../productsAPI';
import type { Cabinet, ListParams } from '../types';
import { ProductCard } from './ProductCard';
import { ProductFilters } from './ProductFilters';
import { AdvancedProductForm } from './AdvancedProductForm';

export const CabinetManager: React.FC = () => {
  const [filters, setFilters] = useState<ListParams>({
    page: 0,
    size: 12,
    sortBy: 'name',
    sortDir: 'asc',
  });

  const { data: cabinets, isLoading } = useGetCabinetsQuery(filters);
  const { data: categories } = useGetCategoriesQuery();
  const { data: brands } = useGetBrandsQuery();
  const { data: materials } = useGetMaterialsQuery();

  const [createCabinet, { isLoading: isCreating }] = useCreateCabinetMutation();
  const [updateCabinet, { isLoading: isUpdating }] = useUpdateCabinetMutation();
  const [deleteCabinet, { isLoading: isDeleting }] = useDeleteCabinetMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState<Cabinet | null>(null);

  // Calculate pagination (simulated client-side for now)
  const totalPages = useMemo(() => {
    if (!cabinets || cabinets.length === 0) return 1;
    // In real scenario, this would come from backend
    return Math.ceil(cabinets.length / (filters.size || 12));
  }, [cabinets, filters.size]);

  const handleCreate = async (values: Omit<Cabinet, 'id'>) => {
    try {
      await createCabinet(values).unwrap();
      toast.success('Cabinet created successfully');
      setShowForm(false);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to create cabinet');
    }
  };

  const handleUpdate = async (values: Cabinet) => {
    try {
      await updateCabinet(values).unwrap();
      toast.success('Cabinet updated successfully');
      setEditingCabinet(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update cabinet');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete cabinet "${name}"?`)) {
      return;
    }

    try {
      await deleteCabinet(id).unwrap();
      toast.success('Cabinet deleted successfully');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete cabinet');
    }
  };

  const handleToggleActive = async (cabinet: Cabinet) => {
    try {
      await updateCabinet({ ...cabinet, active: !cabinet.active }).unwrap();
      toast.success(`Cabinet ${!cabinet.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update cabinet');
    }
  };

  const handleSort = (sortBy: string) => {
    const newSortDir =
      filters.sortBy === sortBy && filters.sortDir === 'asc' ? 'desc' : 'asc';
    setFilters({ ...filters, sortBy, sortDir: newSortDir, page: 0 });
  };

  const getCategoryName = (id?: number) => {
    if (!id || !categories) return undefined;
    return categories.find((c) => c.id === id)?.name;
  };

  const getBrandName = (id?: number) => {
    if (!id || !brands) return undefined;
    return brands.find((b) => b.id === id)?.name;
  };

  const getMaterialName = (id?: number) => {
    if (!id || !materials) return undefined;
    return materials.find((m) => m.id === id)?.name;
  };

  if (showForm || editingCabinet) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">
            {editingCabinet ? 'Edit Cabinet' : 'New Cabinet'}
          </h2>
        </div>
        <AdvancedProductForm
          initialValues={editingCabinet || undefined}
          onSubmit={editingCabinet ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingCabinet(null);
          }}
          isLoading={isCreating || isUpdating}
          entityType="cabinet"
          showCategoryField
          showBrandField
          showMaterialField
          showPriceField
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Cabinets</h2>
          <p className="text-sm text-gray-400 mt-1">
            {cabinets?.length || 0} cabinet{cabinets?.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Cabinet
        </button>
      </div>

      {/* Filters */}
      <ProductFilters
        filters={filters}
        onFiltersChange={setFilters}
        showCategoryFilter
        showBrandFilter
        showMaterialFilter
      />

      {/* Sorting */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Sort by:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSort('name')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filters.sortBy === 'name'
                ? 'bg-red-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Name {filters.sortBy === 'name' && (filters.sortDir === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('price')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filters.sortBy === 'price'
                ? 'bg-red-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Price {filters.sortBy === 'price' && (filters.sortDir === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('createdAt')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filters.sortBy === 'createdAt'
                ? 'bg-red-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Date {filters.sortBy === 'createdAt' && (filters.sortDir === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-gray-800"></div>
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : !cabinets || cabinets.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-4">No cabinets found</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Cabinet
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cabinets.map((cabinet) => (
              <ProductCard
                key={cabinet.id}
                product={cabinet}
                onEdit={setEditingCabinet}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                isDeleting={isDeleting}
                isUpdating={isUpdating}
                categoryName={getCategoryName(cabinet.categoryId)}
                brandName={getBrandName(cabinet.brandId)}
                materialName={getMaterialName(cabinet.materialId)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: Math.max(0, (filters.page || 0) - 1) })}
                disabled={(filters.page || 0) === 0}
                className="p-2 text-white hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-400">
                Page {(filters.page || 0) + 1} of {totalPages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: (filters.page || 0) + 1 })}
                disabled={(filters.page || 0) >= totalPages - 1}
                className="p-2 text-white hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CabinetManager;
