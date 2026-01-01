import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X } from 'lucide-react';
import type { Cabinet, Door, Accessory } from '../types';
import {
  useGetActiveCategoriesQuery,
  useGetActiveBrandsQuery,
  useGetActiveMaterialsQuery,
} from '../productsAPI';

const advancedProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  active: z.boolean(),
  categoryId: z.number().optional(),
  brandId: z.number().optional(),
  materialId: z.number().optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
});

type AdvancedProductFormValues = z.infer<typeof advancedProductSchema>;

export interface AdvancedProductFormProps {
  initialValues?: Partial<Cabinet | Door | Accessory>;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  entityType: 'cabinet' | 'door' | 'accessory';
  showCategoryField?: boolean;
  showBrandField?: boolean;
  showMaterialField?: boolean;
  showPriceField?: boolean;
}

export const AdvancedProductForm: React.FC<AdvancedProductFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  entityType,
  showCategoryField = false,
  showBrandField = false,
  showMaterialField = false,
  showPriceField = false,
}) => {
  const isEdit = Boolean(initialValues?.id);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: categories } = useGetActiveCategoriesQuery(undefined, {
    skip: !showCategoryField,
  });
  const { data: brands } = useGetActiveBrandsQuery(undefined, {
    skip: !showBrandField,
  });
  const { data: materials } = useGetActiveMaterialsQuery(undefined, {
    skip: !showMaterialField,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<AdvancedProductFormValues>({
    resolver: zodResolver(advancedProductSchema),
    defaultValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      active: initialValues?.active ?? true,
      categoryId: initialValues && 'categoryId' in initialValues ? initialValues.categoryId : undefined,
      brandId: initialValues && 'brandId' in initialValues ? initialValues.brandId : undefined,
      materialId: initialValues && 'materialId' in initialValues ? initialValues.materialId : undefined,
      price: initialValues && 'price' in initialValues ? initialValues.price : undefined,
    },
  });

  const activeValue = watch('active');

  const handleFormSubmit = (values: AdvancedProductFormValues) => {
    if (isEdit && initialValues?.id) {
      onSubmit({ ...initialValues, ...values });
    } else {
      onSubmit(values);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
  };

  const getEntityLabel = () => {
    return entityType.charAt(0).toUpperCase() + entityType.slice(1);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-3xl w-full">
      <div className="bg-background-800 border border-background-600 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1">
            Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-background-600 bg-background-900 text-text-900 p-2 text-sm sm:text-base focus:border-primary-600 focus:outline-none"
            placeholder={`Enter ${entityType} name`}
            {...register('name')}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-error text-xs sm:text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Category, Brand, Material Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Category */}
          {showCategoryField && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1">Category</label>
              <select
                className="w-full rounded-md border border-background-600 bg-background-900 text-text-900 p-2 text-sm sm:text-base focus:border-primary-600 focus:outline-none"
                {...register('categoryId', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                disabled={isLoading}
              >
                <option value="">None</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Brand */}
          {showBrandField && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1">Brand</label>
              <select
                className="w-full rounded-md border border-background-600 bg-background-900 text-text-900 p-2 text-sm sm:text-base focus:border-primary-600 focus:outline-none"
                {...register('brandId', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                disabled={isLoading}
              >
                <option value="">None</option>
                {brands?.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Material */}
          {showMaterialField && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1">Material</label>
              <select
                className="w-full rounded-md border border-background-600 bg-background-900 text-text-900 p-2 text-sm sm:text-base focus:border-primary-600 focus:outline-none"
                {...register('materialId', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                disabled={isLoading}
              >
                <option value="">None</option>
                {materials?.map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Price */}
        {showPriceField && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1">Price (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border border-background-600 bg-background-900 text-text-900 p-2 text-sm sm:text-base focus:border-primary-600 focus:outline-none"
              placeholder="Enter price"
              {...register('price', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
              disabled={isLoading}
            />
            {errors.price && (
              <p className="text-error text-xs sm:text-sm mt-1">{errors.price.message}</p>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1">Description</label>
          <textarea
            className="w-full rounded-md border border-background-600 bg-background-900 text-text-900 p-2 text-sm sm:text-base focus:border-primary-600 focus:outline-none"
            rows={3}
            placeholder={`Enter ${entityType} description`}
            {...register('description')}
            disabled={isLoading}
          />
        </div>

        {/* Active Toggle */}
        <div>
          <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                {...register('active')}
                disabled={isLoading}
              />
              <div
                className={`w-10 h-5 sm:w-11 sm:h-6 rounded-full transition-colors ${
                  activeValue ? 'bg-success' : 'bg-background-600'
                }`}
                onClick={() => !isLoading && setValue('active', !activeValue)}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-text-900 rounded-full transition-transform ${
                    activeValue ? 'transform translate-x-5' : ''
                  }`}
                ></div>
              </div>
            </div>
            <div>
              <span className="text-text-900 font-medium text-sm sm:text-base">
                {activeValue ? 'Active' : 'Inactive'}
              </span>
              <p className="text-xs sm:text-sm text-text-600">
                {activeValue
                  ? `This ${entityType} will be visible and usable`
                  : `This ${entityType} will be hidden`}
              </p>
            </div>
          </label>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
            Image <span className="text-text-500 text-xs">(Coming soon)</span>
          </label>
          <div className="border-2 border-dashed border-background-600 rounded-lg p-4 sm:p-6">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 sm:h-48 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-error hover:bg-error/80 text-text-900 rounded-full"
                  disabled={isLoading}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-text-500 mx-auto mb-2" />
                <p className="text-text-600 text-xs sm:text-sm mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-text-500 text-xs">PNG, JPG up to 10MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  disabled={isLoading}
                />
                <label
                  htmlFor="image-upload"
                  className="inline-block mt-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-background-700 hover:bg-background-600 text-text-900 text-xs sm:text-sm rounded-md cursor-pointer transition-colors"
                >
                  Select Image
                </label>
              </div>
            )}
          </div>
          <p className="text-xs text-text-500 mt-1">
            Image upload functionality will be implemented with backend support
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-background-600">
          <button
            type="submit"
            className="px-3 sm:px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-text-900 disabled:opacity-60 transition-colors text-sm sm:text-base font-medium"
            disabled={isLoading}
          >
            {isLoading
              ? 'Saving...'
              : isEdit
              ? `Update ${getEntityLabel()}`
              : `Create ${getEntityLabel()}`}
          </button>
          <button
            type="button"
            className="px-3 sm:px-4 py-2 rounded-md border border-background-600 text-text-900 hover:bg-background-700 disabled:opacity-60 transition-colors text-sm sm:text-base"
            onClick={() => {
              if (!isDirty || window.confirm('Discard changes?')) {
                onCancel();
              }
            }}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default AdvancedProductForm;
