/**
 * AccessoryManager Component
 * Manage special accessories with CRUD operations
 */

import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Package, DollarSign, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useGetCategoriesQuery, useGetActiveBrandsQuery, useGetAccessoriesQuery, useCreateAccessoryMutation, useUpdateAccessoryMutation, useDeleteAccessoryMutation, useUploadAccessoryImageMutation } from '../productsAPI';
import type { Accessory } from '../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Card } from '@/components/ui/Card';
import { getImageUrl } from '@/utils/imageUtils';

export const AccessoryManager = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);

  // API hooks
  const { data: accessoriesData, isLoading } = useGetAccessoriesQuery({
    name: search || undefined,
    page,
    size: 20,
    sortBy: 'name',
    sortDir: 'asc',
  });

  const { data: categoriesResponse } = useGetCategoriesQuery();

  const [createAccessory, { isLoading: isCreating }] = useCreateAccessoryMutation();
  const [updateAccessory, { isLoading: isUpdating }] = useUpdateAccessoryMutation();
  const [deleteAccessory, { isLoading: isDeleting }] = useDeleteAccessoryMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadAccessoryImageMutation();

  const accessories = accessoriesData || [];
  const categories = categoriesResponse || [];

  const handleSubmit = async (values: Partial<Accessory>, imageFile?: File) => {
    try {
      let savedAccessory: Accessory;

      if (editingAccessory) {
        savedAccessory = await updateAccessory({ ...editingAccessory, ...values } as Accessory).unwrap();
        toast.success('Accessory updated successfully');
      } else {
        savedAccessory = await createAccessory(values as Omit<Accessory, 'id'>).unwrap();
        toast.success('Accessory created successfully');
      }

      // Upload image if provided
      if (imageFile && savedAccessory?.id) {
        try {
          await uploadImage({ id: savedAccessory.id, file: imageFile }).unwrap();
          toast.success('Image uploaded successfully');
        } catch (imgError: any) {
          toast.error(imgError?.data?.message || 'Failed to upload image');
        }
      }

      setShowForm(false);
      setEditingAccessory(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save accessory');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await deleteAccessory(id).unwrap();
      toast.success('Accessory deleted successfully');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete accessory');
    }
  };

  const handleToggleActive = async (accessory: Accessory) => {
    try {
      await updateAccessory({ ...accessory, active: !accessory.active }).unwrap();
      toast.success(`Accessory ${!accessory.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update accessory');
    }
  };

  if (showForm || editingAccessory) {
    return (
      <AccessoryForm
        initialValues={editingAccessory || undefined}
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingAccessory(null);
        }}
        isLoading={isCreating || isUpdating || isUploading}
      />
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
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-text-900">Accessories</h2>
          <p className="text-xs sm:text-sm text-text-600 mt-1">{accessories.length} accessory item{accessories.length === 1 ? '' : 's'}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Add Accessory</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-text-500 w-4 h-4 sm:w-5 sm:h-5" />
        <Input
          type="text"
          placeholder="Search accessories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 sm:pl-10 text-sm sm:text-base"
        />
      </div>

      {/* Accessories Grid */}
      {accessories.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-text-500 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-text-600 mb-4">No accessories found</p>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create First Accessory
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {accessories.map((accessory) => (
            <Card
              key={accessory.id}
              className={`p-3 sm:p-4 transition-colors ${
                accessory.active ? 'hover:border-primary-600' : 'opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-text-900 mb-1 line-clamp-1">{accessory.name}</h3>
                  {accessory.categoryName && (
                    <p className="text-xs sm:text-sm text-text-600 line-clamp-1">{accessory.categoryName}</p>
                  )}
                  {accessory.materialCode && (
                    <p className="text-xs text-text-500 mt-1 line-clamp-1">Code: {accessory.materialCode}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleActive(accessory)}
                  className={`p-1.5 sm:p-2 rounded-md transition-colors flex-shrink-0 ${
                    accessory.active
                      ? 'text-success hover:bg-success/20'
                      : 'text-text-500 hover:bg-background-700'
                  }`}
                  title={accessory.active ? 'Active' : 'Inactive'}
                  disabled={isUpdating || isDeleting}
                >
                  {accessory.active ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>

              {/* Pricing */}
              <div className="bg-background-700 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-xs sm:text-sm text-text-600">MRP:</span>
                  <span className="text-xs sm:text-sm font-semibold text-text-900">
                    ₹{accessory.mrp.toLocaleString()}
                  </span>
                </div>
                {accessory.discountPercentage && accessory.discountPercentage > 0 && (
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="text-xs sm:text-sm text-text-600">Discount:</span>
                    <span className="text-xs sm:text-sm text-success">
                      {accessory.discountPercentage}%
                    </span>
                  </div>
                )}
                {accessory.companyPrice && (
                  <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-background-600">
                    <span className="text-xs sm:text-sm font-medium text-text-700">Company Price:</span>
                    <span className="text-sm sm:text-base font-bold text-success">
                      ₹{accessory.companyPrice.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Width */}
              {accessory.widthMm && (
                <div className="text-xs text-text-500 mb-2 sm:mb-3">
                  Width: {accessory.widthMm} mm
                </div>
              )}

              {/* Image */}
              {accessory.imageUrl && (
                <div className="mb-2 sm:mb-3">
                  <img
                    src={getImageUrl(accessory.imageUrl)}
                    alt={accessory.name}
                    className="w-full h-24 object-cover rounded-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 sm:pt-3 border-t border-background-600">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAccessory(accessory)}
                  disabled={isDeleting}
                  className="flex-1 text-xs sm:text-sm"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  <span className="hidden xs:inline">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(accessory.id, accessory.name)}
                  disabled={isDeleting}
                  className="text-error hover:text-error/80 flex-1 text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  <span className="hidden xs:inline">Delete</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination removed for now since this data source returns an array. */}
    </div>
  );
};

// Accessory Form Component
interface AccessoryFormProps {
  initialValues?: Accessory;
  categories: any[];
  onSubmit: (values: Partial<Accessory>, imageFile?: File) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function AccessoryForm({ initialValues, categories, onSubmit, onCancel, isLoading }: AccessoryFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: brands } = useGetActiveBrandsQuery();

  const [formData, setFormData] = useState<Partial<Accessory>>({
    name: initialValues?.name || '',
    materialCode: initialValues?.materialCode || '',
    categoryId: initialValues?.categoryId,
    brandId: initialValues?.brandId,
    mrp: initialValues?.mrp || 0,
    discountPercentage: initialValues?.discountPercentage || 0,
    widthMm: initialValues?.widthMm,
    color: initialValues?.color || '',
    active: initialValues?.active ?? true,
    imageUrl: initialValues?.imageUrl || '',
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, imageFile || undefined);
  };

  const companyPrice = formData.mrp && formData.discountPercentage
    ? formData.mrp - (formData.mrp * (formData.discountPercentage / 100))
    : formData.mrp;

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-text-900">
          {initialValues ? 'Edit Accessory' : 'New Accessory'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
              Accessory Name <span className="text-error">*</span>
            </label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mullboy Wastebin"
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
              Material Code
            </label>
            <Input
              value={formData.materialCode}
              onChange={(e) => setFormData({ ...formData, materialCode: e.target.value })}
              placeholder="e.g., ACC-001"
              className="text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Category & Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
              Category
            </label>
            <select
              value={formData.categoryId || ''}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-background-900 border border-background-600 rounded-md text-text-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
              Brand
            </label>
            <select
              value={formData.brandId || ''}
              onChange={(e) => setFormData({ ...formData, brandId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-background-900 border border-background-600 rounded-md text-text-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">-- Select Brand --</option>
              {(brands || []).map((brand: any) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
              placeholder="2600"
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
              Discount (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.discountPercentage}
              onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
              placeholder="0"
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
              Company Price (₹)
            </label>
            <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-background-800 border border-background-600 rounded-md text-success font-semibold text-sm sm:text-base">
              {companyPrice ? `₹${companyPrice.toLocaleString()}` : '₹0'}
            </div>
          </div>
        </div>

        {/* Width */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
            Width (mm)
          </label>
          <Input
            type="number"
            min="0"
            value={formData.widthMm || ''}
            onChange={(e) => setFormData({ ...formData, widthMm: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="e.g., 300"
            className="text-sm sm:text-base w-full sm:w-1/3"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
            Accessory Image
          </label>
          <div className="space-y-3">
            {/* Image Preview */}
            {(imagePreview || formData.imageUrl) && (
              <div className="relative inline-block">
                <img
                  src={imagePreview || getImageUrl(formData.imageUrl)}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-background-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect fill="%23333" width="128" height="128"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                {(imagePreview || formData.imageUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveImage();
                      setFormData({ ...formData, imageUrl: '' });
                    }}
                    className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 hover:bg-error/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* File Input */}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                {imagePreview || formData.imageUrl ? 'Change Image' : 'Upload Image'}
              </Button>
              <span className="text-xs text-text-500">Max 5MB, JPG/PNG</span>
            </div>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
            Color
          </label>
          <Input
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="e.g., Silver, Black"
            className="text-sm sm:text-base"
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="w-4 h-4 text-primary-600 bg-background-900 border-background-600 rounded focus:ring-primary-600"
          />
          <label htmlFor="active" className="text-xs sm:text-sm font-medium text-text-700">
            Active
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-background-600">
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Saving...' : initialValues ? 'Update Accessory' : 'Create Accessory'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default AccessoryManager;
