import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { BaseEntity, Material } from '../types';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  active: z.boolean(),
  unitRatePerSqft: z.number().min(0.01, 'Price must be greater than 0').optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export interface ProductFormProps {
  initialValues?: Partial<BaseEntity & Material>;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  entityType: 'category' | 'brand' | 'material';
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  entityType,
}) => {
  const isEdit = Boolean(initialValues?.id);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      active: initialValues?.active ?? true,
      unitRatePerSqft: initialValues?.unitRatePerSqft || undefined,
    },
  });

  const activeValue = watch('active');

  const handleFormSubmit = (values: ProductFormValues) => {
    if (isEdit && initialValues?.id) {
      onSubmit({ ...initialValues, ...values });
    } else {
      onSubmit(values);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement actual image upload when backend endpoint is ready
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-2xl w-full">
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

        {/* Price per Sqft (Materials only) */}
        {entityType === 'material' && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1">
              Price per Sqft (Rs.) <span className="text-error">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full rounded-md border border-background-600 bg-background-900 text-text-900 p-2 text-sm sm:text-base focus:border-primary-600 focus:outline-none"
              placeholder="Enter price per square foot"
              {...register('unitRatePerSqft', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.unitRatePerSqft && (
              <p className="text-error text-xs sm:text-sm mt-1">{errors.unitRatePerSqft.message}</p>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1">
            Description
          </label>
          <textarea
            className="w-full rounded-md border border-background-600 bg-background-900 text-text-900 p-2 text-sm sm:text-base focus:border-primary-600 focus:outline-none"
            rows={3}
            placeholder={`Enter ${entityType} description`}
            {...register('description')}
            disabled={isLoading}
          />
          {errors.description && (
            <p className="text-error text-xs sm:text-sm mt-1">{errors.description.message}</p>
          )}
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

        {/* Image Upload (Placeholder for Sprint 6.2) */}
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
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            isLoading={isLoading}
            className="w-full sm:w-auto"
          >
            {isEdit ? `Update ${getEntityLabel()}` : `Create ${getEntityLabel()}`}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!isDirty || window.confirm('Discard changes?')) {
                onCancel();
              }
            }}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;
