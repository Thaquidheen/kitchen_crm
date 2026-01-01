/**
 * KitchenPlanImageSelector Component
 * Select plan images from existing customer plan images or design phase files
 * Also allows uploading new plan images
 */

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Image, CheckCircle, X, Upload, Loader2 } from 'lucide-react';
import { 
  useGetCustomerAvailablePlanImagesQuery,
  useUploadPlanImageMutation 
} from '@/features/quotations/quotationsAPI';
import type { QuotationKitchenPlanImage } from '@/features/quotations/types';
import { getImageUrl } from '@/utils/imageUtils';

export interface KitchenPlanImageSelectorProps {
  customerId: number;
  selectedPlanImages: QuotationKitchenPlanImage[];
  onPlanImagesChange: (planImages: QuotationKitchenPlanImage[]) => void;
}

export function KitchenPlanImageSelector({
  customerId,
  selectedPlanImages,
  onPlanImagesChange,
}: KitchenPlanImageSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const { data, isLoading, refetch } = useGetCustomerAvailablePlanImagesQuery(customerId, {
    skip: !customerId || customerId === 0,
  });
  
  const [uploadPlanImage] = useUploadPlanImageMutation();

  const availableImages = [
    ...(data?.planImages || []).map((img: any) => ({
      ...img,
      sourceType: 'plan_image' as const,
    })),
    ...(data?.designFiles || []).map((file: any) => ({
      ...file,
      sourceType: 'design_file' as const,
    })),
  ];

  const isImageSelected = (imageId: number, sourceType: 'plan_image' | 'design_file') => {
    return selectedPlanImages.some(
      (selected) =>
        (sourceType === 'plan_image' && selected.customerPlanImageId === imageId) ||
        (sourceType === 'design_file' && selected.designPhaseFileId === imageId)
    );
  };

  const handleToggleImage = (image: any) => {
    const isSelected = isImageSelected(image.id, image.sourceType);

    if (isSelected) {
      // Remove from selection
      const updated = selectedPlanImages.filter(
        (selected) =>
          !(
            (image.sourceType === 'plan_image' && selected.customerPlanImageId === image.id) ||
            (image.sourceType === 'design_file' && selected.designPhaseFileId === image.id)
          )
      );
      onPlanImagesChange(updated);
    } else {
      // Add to selection (max 4 images)
      if (selectedPlanImages.length >= 4) {
        return; // Already have 4 images
      }

      const newPlanImage: QuotationKitchenPlanImage = {
        imageName: image.name || image.originalFileName || 'Plan Image',
        imageUrl: image.url || image.fileUrl || '',
        imageOrder: selectedPlanImages.length,
        customerPlanImageId: image.sourceType === 'plan_image' ? image.id : undefined,
        designPhaseFileId: image.sourceType === 'design_file' ? image.id : undefined,
      };

      onPlanImagesChange([...selectedPlanImages, newPlanImage]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = selectedPlanImages.filter((_, i) => i !== index).map((img, i) => ({
      ...img,
      imageOrder: i,
    }));
    onPlanImagesChange(updated);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !customerId) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG) or PDF');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return;
    }

    // Check if we can add more images
    if (selectedPlanImages.length >= 4) {
      alert('Maximum 4 plan images allowed');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadPlanImage({
        customerId,
        file,
        imageType: 'FLOOR_PLAN', // Default to FLOOR_PLAN, can be made configurable
      }).unwrap();

      if (result?.success && result?.data) {
        const uploadedImage = result.data;
        
        // Refresh the available images list
        await refetch();
        
        // Automatically add the uploaded image to selection
        const newPlanImage: QuotationKitchenPlanImage = {
          imageName: uploadedImage.imageName || file.name,
          imageUrl: uploadedImage.imageUrl || '',
          imageOrder: selectedPlanImages.length,
          customerPlanImageId: uploadedImage.id,
        };
        
        onPlanImagesChange([...selectedPlanImages, newPlanImage]);
      } else {
        alert('Failed to upload image. Please try again.');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    if (selectedPlanImages.length >= 4) {
      alert('Maximum 4 plan images allowed');
      return;
    }
    fileInputRef.current?.click();
  };

  if (!customerId || customerId === 0) {
    return (
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600 text-center">
        <p className="text-xs sm:text-sm text-text-600">Please select a customer first to view available plan images.</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600 text-center">
        <p className="text-xs sm:text-sm text-text-600">Loading available plan images...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-base sm:text-lg font-semibold text-text-900">Plan Images (Select up to 4)</h3>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm text-text-600">
            {selectedPlanImages.length}/4 selected
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={uploading || selectedPlanImages.length >= 4}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Selected Images */}
      {selectedPlanImages.length > 0 && (
        <Card className="p-3 sm:p-4 bg-background-800 border-background-600">
          <h4 className="text-xs sm:text-sm font-semibold text-text-800 mb-2 sm:mb-3">Selected Images</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {selectedPlanImages.map((planImage, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-background-700 border-2 border-primary-600">
                  <img
                    src={getImageUrl(planImage.imageUrl)}
                    alt={planImage.imageName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <div className="absolute top-1 right-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 bg-error hover:bg-error/80"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-3 w-3 text-text-900" />
                  </Button>
                </div>
                <p className="text-xs text-text-600 mt-1 truncate">{planImage.imageName}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Available Images */}
      {availableImages.length === 0 ? (
        <Card className="p-4 sm:p-6 bg-background-800 border-background-600 text-center">
          <Image className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-text-600" />
          <p className="text-xs sm:text-sm text-text-600">No plan images available for this customer.</p>
          <p className="text-xs sm:text-sm text-text-500 mt-1 mb-2 sm:mb-3">
            Click the "Upload" button above to add a new plan image, or upload plan images in the customer's plan images section or design phase files.
          </p>
        </Card>
      ) : (
        <Card className="p-3 sm:p-4 bg-background-800 border-background-600">
          <h4 className="text-xs sm:text-sm font-semibold text-text-800 mb-2 sm:mb-3">Available Images</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 max-h-64 sm:max-h-96 overflow-y-auto">
            {availableImages.map((image) => {
              const isSelected = isImageSelected(image.id, image.sourceType);
              const isDisabled = !isSelected && selectedPlanImages.length >= 4;

              return (
                <div
                  key={`${image.sourceType}-${image.id}`}
                  className={`relative group cursor-pointer ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => !isDisabled && handleToggleImage(image)}
                >
                  <div
                    className={`aspect-square rounded-lg overflow-hidden bg-background-700 border-2 transition-colors ${
                      isSelected
                        ? 'border-primary-600'
                        : isDisabled
                        ? 'border-background-600'
                        : 'border-background-600 hover:border-primary-700'
                    }`}
                  >
                    <img
                      src={getImageUrl(image.url || image.fileUrl)}
                      alt={image.name || image.originalFileName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary-600/20 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-text-600 mt-1 truncate">
                    {image.name || image.originalFileName}
                  </p>
                  {image.sourceType === 'design_file' && (
                    <span className="text-xs text-text-500">(Design File)</span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export default KitchenPlanImageSelector;

