import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} from '../productsAPI';
import type { Brand } from '../types';
import { ProductForm } from './ProductForm';

export const BrandManager: React.FC = () => {
  const { data: brands, isLoading } = useGetBrandsQuery();
  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();
  const [deleteBrand, { isLoading: isDeleting }] = useDeleteBrandMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const handleCreate = async (values: Omit<Brand, 'id'>) => {
    try {
      await createBrand(values).unwrap();
      toast.success('Brand created successfully');
      setShowForm(false);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to create brand');
    }
  };

  const handleUpdate = async (values: Brand) => {
    try {
      await updateBrand(values).unwrap();
      toast.success('Brand updated successfully');
      setEditingBrand(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update brand');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete brand "${name}"?`)) {
      return;
    }

    try {
      await deleteBrand(id).unwrap();
      toast.success('Brand deleted successfully');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete brand');
    }
  };

  const handleToggleActive = async (brand: Brand) => {
    try {
      await updateBrand({ ...brand, active: !brand.active }).unwrap();
      toast.success(`Brand ${!brand.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update brand');
    }
  };

  if (showForm || editingBrand) {
    return (
      <div>
        <div className="mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-text-900">
            {editingBrand ? 'Edit Brand' : 'New Brand'}
          </h2>
        </div>
        <ProductForm
          initialValues={editingBrand || undefined}
          onSubmit={editingBrand ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingBrand(null);
          }}
          isLoading={isCreating || isUpdating}
          entityType="brand"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-background-800 border border-background-600 rounded-lg p-3 sm:p-4 animate-pulse">
            <div className="h-5 sm:h-6 bg-background-700 rounded w-1/3 mb-2"></div>
            <div className="h-3 sm:h-4 bg-background-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-text-900">Brands</h2>
          <p className="text-xs sm:text-sm text-text-600 mt-1">
            {brands?.length || 0} brand{brands?.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-text-900 rounded-md transition-colors text-sm sm:text-base font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Add Brand</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>

      {/* Brands List */}
      {!brands || brands.length === 0 ? (
        <div className="bg-background-800 border border-background-600 rounded-lg p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-text-600 mb-4">No brands found</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-text-900 rounded-md transition-colors text-sm sm:text-base font-medium"
          >
            <Plus className="w-4 h-4" />
            Create First Brand
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className={`bg-background-800 border rounded-lg p-3 sm:p-4 transition-colors ${
                brand.active ? 'border-background-600 hover:border-primary-600' : 'border-background-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-text-900 mb-1 line-clamp-1">{brand.name}</h3>
                  <p className="text-xs sm:text-sm text-text-600 line-clamp-2">
                    {brand.description || 'No description'}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(brand)}
                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                      brand.active
                        ? 'text-success hover:bg-success/20'
                        : 'text-text-500 hover:bg-background-700'
                    }`}
                    title={brand.active ? 'Active' : 'Inactive'}
                    disabled={isUpdating || isDeleting}
                  >
                    {brand.active ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-3 border-t border-background-600">
                <button
                  onClick={() => setEditingBrand(brand)}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-text-900 hover:bg-background-700 rounded-md transition-colors flex-1 justify-center"
                  disabled={isDeleting}
                >
                  <Edit2 className="w-3 h-3" />
                  <span className="hidden xs:inline">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(brand.id, brand.name)}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-error hover:bg-error/20 rounded-md transition-colors flex-1 justify-center"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden xs:inline">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrandManager;
