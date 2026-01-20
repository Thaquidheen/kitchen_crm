import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
} from '../productsAPI';
import type { Material } from '../types';
import { ProductForm } from './ProductForm';

export const MaterialManager: React.FC = () => {
  const { data: materials, isLoading } = useGetMaterialsQuery();
  const [createMaterial, { isLoading: isCreating }] = useCreateMaterialMutation();
  const [updateMaterial, { isLoading: isUpdating }] = useUpdateMaterialMutation();
  const [deleteMaterial, { isLoading: isDeleting }] = useDeleteMaterialMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const handleCreate = async (values: Omit<Material, 'id'>) => {
    try {
      await createMaterial(values).unwrap();
      toast.success('Material created successfully');
      setShowForm(false);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to create material');
    }
  };

  const handleUpdate = async (values: Material) => {
    try {
      await updateMaterial(values).unwrap();
      toast.success('Material updated successfully');
      setEditingMaterial(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update material');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete material "${name}"?`)) {
      return;
    }

    try {
      await deleteMaterial(id).unwrap();
      toast.success('Material deleted successfully');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete material');
    }
  };

  const handleToggleActive = async (material: Material) => {
    try {
      await updateMaterial({ ...material, active: !material.active }).unwrap();
      toast.success(`Material ${!material.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update material');
    }
  };

  if (showForm || editingMaterial) {
    return (
      <div>
        <div className="mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-text-900">
            {editingMaterial ? 'Edit Material' : 'New Material'}
          </h2>
        </div>
        <ProductForm
          initialValues={editingMaterial || undefined}
          onSubmit={editingMaterial ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingMaterial(null);
          }}
          isLoading={isCreating || isUpdating}
          entityType="material"
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
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-text-900">Materials</h2>
          <p className="text-xs sm:text-sm text-text-600 mt-1">
            {materials?.length || 0} material{materials?.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-text-900 rounded-md transition-colors text-sm sm:text-base font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Add Material</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>

      {/* Materials List */}
      {!materials || materials.length === 0 ? (
        <div className="bg-background-800 border border-background-600 rounded-lg p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-text-600 mb-4">No materials found</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-text-900 rounded-md transition-colors text-sm sm:text-base font-medium"
          >
            <Plus className="w-4 h-4" />
            Create First Material
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {materials.map((material) => (
            <div
              key={material.id}
              className={`bg-background-800 border rounded-lg p-3 sm:p-4 transition-colors ${
                material.active ? 'border-background-600 hover:border-primary-600' : 'border-background-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-text-900 mb-1 line-clamp-1">{material.name}</h3>
                  <p className="text-xs sm:text-sm text-text-600 line-clamp-2">
                    {material.description || 'No description'}
                  </p>
                  {material.unitRatePerSqft !== undefined && (
                    <p className="text-xs sm:text-sm text-primary-400 font-medium mt-1">
                      Rs. {material.unitRatePerSqft.toFixed(2)}/sqft
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(material)}
                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                      material.active
                        ? 'text-success hover:bg-success/20'
                        : 'text-text-500 hover:bg-background-700'
                    }`}
                    title={material.active ? 'Active' : 'Inactive'}
                    disabled={isUpdating || isDeleting}
                  >
                    {material.active ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-3 border-t border-background-600">
                <button
                  onClick={() => setEditingMaterial(material)}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-text-900 hover:bg-background-700 rounded-md transition-colors flex-1 justify-center"
                  disabled={isDeleting}
                >
                  <Edit2 className="w-3 h-3" />
                  <span className="hidden xs:inline">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(material.id, material.name)}
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

export default MaterialManager;
