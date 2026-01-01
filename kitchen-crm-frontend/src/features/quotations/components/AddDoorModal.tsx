/**
 * AddDoorModal Component
 * Modal for entering door dimensions (standalone door without cabinet)
 */

import { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalFooter } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { DoorType } from '../../products/types';

export interface DoorWithDimensions {
  doorTypeId: number;
  doorType?: DoorType;
  widthMm: number;
  heightMm: number;
  quantity: number;
  faceArea?: number; // Add this for price calculation
}

interface AddDoorModalProps {
  isOpen: boolean;
  onClose: () => void;
  door: DoorType;
  onAdd: (data: DoorWithDimensions) => void;
}

export function AddDoorModal({
  isOpen,
  onClose,
  door,
  onAdd,
}: AddDoorModalProps) {
  const [widthMm, setWidthMm] = useState<number>(0);
  const [heightMm, setHeightMm] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setWidthMm(0);
      setHeightMm(0);
      setQuantity(1);
    }
  }, [isOpen]);

  // Excel formula: Door face area = (W/304) × (H/304)
  const calculateDoorFaceArea = () => {
    if (!widthMm || !heightMm) return 0;
    return (widthMm / 304) * (heightMm / 304);
  };

  const faceArea = calculateDoorFaceArea();
  const doorPrice = faceArea * (door.companyPrice || 0) * quantity;

  const isValid = widthMm > 0 && heightMm > 0 && quantity > 0;

  const handleAdd = () => {
    if (!isValid) return;

    onAdd({
      doorTypeId: door.id,
      doorType: door,
      widthMm,
      heightMm,
      quantity,
      faceArea, // Pass calculated face area
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Door to Quotation" size="md">
      <ModalBody>
        {/* Door Info */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-background-700 rounded-lg border border-background-600">
          <div className="text-text-900 font-semibold text-base sm:text-lg">{door.name}</div>
          <div className="text-text-700 mt-1 text-sm sm:text-base">
            Price: ₹{door.companyPrice?.toLocaleString('en-IN')}/sqft
          </div>
          {door.brandName && (
            <div className="text-text-600 text-xs sm:text-sm mt-1">Brand: {door.brandName}</div>
          )}
          {door.material && (
            <div className="text-text-600 text-xs sm:text-sm">Material: {door.material}</div>
          )}
        </div>

        {/* Dimension Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            label="Width (mm) *"
            type="number"
            value={widthMm || ''}
            onChange={(e) => setWidthMm(Number(e.target.value))}
            placeholder="e.g., 600"
            min={100}
            max={5000}
          />
          <Input
            label="Height (mm) *"
            type="number"
            value={heightMm || ''}
            onChange={(e) => setHeightMm(Number(e.target.value))}
            placeholder="e.g., 800"
            min={100}
            max={3000}
          />
        </div>

        <div className="mb-6">
          <Input
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            placeholder="1"
            min={1}
          />
        </div>

        {/* Calculated Door Price */}
        {faceArea > 0 && (
          <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-primary-900/10 border border-primary-700/30 rounded-lg">
            <div className="text-text-800 text-xs sm:text-sm">Door Calculation:</div>
            <div className="text-text-900 font-semibold mt-1 text-xs sm:text-sm">
              {faceArea.toFixed(2)} sqft × ₹{door.companyPrice?.toLocaleString('en-IN')} × {quantity} = ₹
              {doorPrice.toFixed(2)}
            </div>
          </div>
        )}

        {/* Total Preview */}
        {faceArea > 0 && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-background-800 border-2 border-primary-700 rounded-lg">
            <div className="text-text-800 text-xs sm:text-sm">Estimated Total (before margin & tax):</div>
            <div className="text-text-900 font-bold text-lg sm:text-xl mt-1">
              ₹{doorPrice.toFixed(2)}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleAdd}
          disabled={!isValid}
        >
          Add to Quotation
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default AddDoorModal;

