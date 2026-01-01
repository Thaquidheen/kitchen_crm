/**
 * CabinetsManager Component
 * Manage cabinet types with material rates
 */

import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Archive } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useGetCategoriesQuery, useGetCabinetsQuery, useCreateCabinetMutation, useUpdateCabinetMutation, useDeleteCabinetMutation } from '../productsAPI';
import type { CabinetType } from '../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export const CabinetsManager = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState<CabinetType | null>(null);

  const { data: cabinetsData, isLoading } = useGetCabinetsQuery({
    name: search || undefined,
    page,
    size: 20,
  });

  const { data: categoriesResponse } = useGetCategoriesQuery();

  const [createCabinet, { isLoading: isCreating }] = useCreateCabinetMutation();
  const [updateCabinet, { isLoading: isUpdating }] = useUpdateCabinetMutation();
  const [deleteCabinet, { isLoading: isDeleting }] = useDeleteCabinetMutation();

  const cabinets = cabinetsData || [];
  const categories = categoriesResponse || [];

  const handleSubmit = async (values: Partial<CabinetType>) => {
    try {
      if (editingCabinet) {
        await updateCabinet({ ...editingCabinet, ...values } as CabinetType).unwrap();
        toast.success('Cabinet updated successfully');
      } else {
        await createCabinet(values as Omit<CabinetType, 'id'>).unwrap();
        toast.success('Cabinet created successfully');
      }
      setShowForm(false);
      setEditingCabinet(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save cabinet');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteCabinet(id).unwrap();
      toast.success('Cabinet deleted successfully');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete cabinet');
    }
  };

  const handleToggleActive = async (cabinet: CabinetType) => {
    try {
      await updateCabinet({ ...cabinet, active: !cabinet.active }).unwrap();
      toast.success(`Cabinet ${!cabinet.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update cabinet');
    }
  };

  if (showForm || editingCabinet) {
    return (
      <CabinetForm
        initialValues={editingCabinet || undefined}
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingCabinet(null);
        }}
        isLoading={isCreating || isUpdating}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="text-text-900 text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-text-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-text-900">Cabinet Types</h2>
          <p className="text-xs sm:text-sm text-text-600 mt-1">{cabinets.length} cabinet type{cabinets.length === 1 ? '' : 's'}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Add Cabinet Type</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-text-500 w-4 h-4 sm:w-5 sm:h-5" />
        <Input
          type="text"
          placeholder="Search cabinet types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 sm:pl-10 text-sm sm:text-base"
        />
      </div>

      {cabinets.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <Archive className="w-12 h-12 sm:w-16 sm:h-16 text-text-500 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-text-600 mb-4">No cabinet types found</p>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create First Cabinet Type
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {cabinets.map((cabinet) => (
            <Card
              key={cabinet.id}
              className={`p-3 sm:p-4 ${cabinet.active ? 'hover:border-primary-600' : 'opacity-60'}`}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-text-900 mb-1 line-clamp-1">{cabinet.name}</h3>
                  {cabinet.categoryName && <p className="text-xs sm:text-sm text-text-600 line-clamp-1">{cabinet.categoryName}</p>}
                  {cabinet.materialName && <p className="text-xs text-text-500 mt-1 line-clamp-1">Material: {cabinet.materialName}</p>}
                </div>
                <button
                  onClick={() => handleToggleActive(cabinet)}
                  className={`p-1.5 sm:p-2 rounded-md flex-shrink-0 ${cabinet.active ? 'text-success' : 'text-text-500'}`}
                  disabled={isUpdating || isDeleting}
                >
                  {cabinet.active ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>

              <div className="bg-background-700 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-text-600">Base Price:</span>
                  <span className="text-xs sm:text-sm font-semibold text-text-900">₹{cabinet.basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-text-600">MRP:</span>
                  <span className="text-xs sm:text-sm font-semibold text-text-900">₹{cabinet.mrp.toLocaleString()}</span>
                </div>
                {cabinet.companyPrice && (
                  <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-background-600">
                    <span className="text-xs sm:text-sm font-medium text-text-700">Company Price:</span>
                    <span className="text-sm sm:text-base font-bold text-success">₹{cabinet.companyPrice.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-3 border-t border-background-600">
                <Button variant="ghost" size="sm" onClick={() => setEditingCabinet(cabinet)} disabled={isDeleting} className="flex-1 text-xs sm:text-sm">
                  <Edit2 className="w-3 h-3 mr-1" />
                  <span className="hidden xs:inline">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cabinet.id, cabinet.name)}
                  disabled={isDeleting}
                  className="text-error flex-1 text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  <span className="hidden xs:inline">Delete</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface CabinetFormProps {
  initialValues?: CabinetType;
  categories: any[];
  onSubmit: (values: Partial<CabinetType>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function CabinetForm({ initialValues, categories, onSubmit, onCancel, isLoading }: CabinetFormProps) {
  const [formData, setFormData] = useState<Partial<CabinetType>>({
    name: initialValues?.name || '',
    categoryId: initialValues?.categoryId,
    basePrice: initialValues?.basePrice || 0,
    mrp: initialValues?.mrp || 0,
    discountPercentage: initialValues?.discountPercentage || 0,
    active: initialValues?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const companyPrice = formData.mrp && formData.discountPercentage
    ? formData.mrp - (formData.mrp * (formData.discountPercentage / 100))
    : formData.mrp;

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-text-900 mb-4 sm:mb-6">
        {initialValues ? 'Edit Cabinet Type' : 'New Cabinet Type'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
              Cabinet Name <span className="text-error">*</span>
            </label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Storage Base Cabinet"
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">Category</label>
            <select
              value={formData.categoryId || ''}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-background-900 border border-background-600 rounded-md text-text-900 text-sm sm:text-base focus:border-primary-600 focus:outline-none"
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
              Base Price (₹) <span className="text-error">*</span>
            </label>
            <Input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
              MRP (₹) <span className="text-error">*</span>
            </label>
            <Input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.mrp}
              onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">Discount (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.discountPercentage}
              onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">Company Price</label>
            <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-background-800 border border-background-600 rounded-md text-success font-semibold text-sm sm:text-base">
              ₹{companyPrice ? companyPrice.toLocaleString() : '0'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="w-4 h-4 text-primary-600 bg-background-900 border-background-600 rounded focus:ring-primary-600"
          />
          <label htmlFor="active" className="text-xs sm:text-sm font-medium text-text-700">Active</label>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-background-600">
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Saving...' : initialValues ? 'Update Cabinet' : 'Create Cabinet'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default CabinetsManager;
