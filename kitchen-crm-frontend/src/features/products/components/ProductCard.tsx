import React from 'react';
import { Edit2, Trash2, Eye, EyeOff, Package } from 'lucide-react';
import type { Cabinet, Door, Accessory } from '../types';

type Product = Cabinet | Door | Accessory;

export interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number, name: string) => void;
  onToggleActive: (product: Product) => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
  categoryName?: string;
  brandName?: string;
  materialName?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onToggleActive,
  isDeleting = false,
  isUpdating = false,
  categoryName,
  brandName,
  materialName,
}) => {
  const formatCurrency = (price?: number) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const hasImage = 'imageUrl' in product && product.imageUrl;

  return (
    <div
      className={`bg-background-800 border rounded-lg overflow-hidden transition-colors ${
        product.active
          ? 'border-background-600 hover:border-primary-600'
          : 'border-background-700 opacity-60'
      }`}
    >
      {/* Image Section */}
      <div className="relative aspect-square bg-background-700 flex items-center justify-center">
        {hasImage ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-text-500" />
        )}
        {/* Active Badge */}
        <button
          onClick={() => onToggleActive(product)}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
            product.active
              ? 'bg-success/20 text-success hover:bg-success/30'
              : 'bg-background-600 text-text-500 hover:bg-background-500'
          }`}
          title={product.active ? 'Active' : 'Inactive'}
          disabled={isUpdating || isDeleting}
        >
          {product.active ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Product Name */}
        <h3 className="text-base sm:text-lg font-semibold text-text-900 line-clamp-1" title={product.name}>
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-xs sm:text-sm text-text-600 line-clamp-2">{product.description}</p>
        )}

        {/* Product Attributes */}
        <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
          {categoryName && (
            <div className="flex items-center gap-2">
              <span className="text-text-600">Category:</span>
              <span className="text-text-900">{categoryName}</span>
            </div>
          )}
          {brandName && (
            <div className="flex items-center gap-2">
              <span className="text-text-600">Brand:</span>
              <span className="text-text-900">{brandName}</span>
            </div>
          )}
          {materialName && (
            <div className="flex items-center gap-2">
              <span className="text-text-600">Material:</span>
              <span className="text-text-900">{materialName}</span>
            </div>
          )}
          {'price' in product && product.price && (
            <div className="flex items-center gap-2">
              <span className="text-text-600">Price:</span>
              <span className="text-primary-600 font-semibold">{formatCurrency(product.price)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 sm:pt-3 border-t border-background-600">
          <button
            onClick={() => onEdit(product)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-text-900 hover:bg-background-700 rounded-md transition-colors flex-1 justify-center"
            disabled={isDeleting}
          >
            <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden xs:inline">Edit</span>
          </button>
          <button
            onClick={() => onDelete(product.id, product.name)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-error hover:bg-error/20 rounded-md transition-colors flex-1 justify-center"
            disabled={isDeleting}
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden xs:inline">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
