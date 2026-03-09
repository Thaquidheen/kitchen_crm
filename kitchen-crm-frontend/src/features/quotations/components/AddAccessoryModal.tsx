/**
 * AddAccessoryModal Component
 * Modal for adding accessories with quantity and elevation selection
 */

import { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalFooter } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import type { QuotationElevation } from '../types';

export interface AccessoryWithDetails {
  id: number;
  accessoryId?: number;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  price?: number;
  elevationId?: number;
  elevationName?: string;
  raw?: any;
}

interface AddAccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessory: {
    id: number;
    name: string;
    price: number;
    raw?: any;
  };
  availableElevations?: QuotationElevation[];
  onAdd: (data: AccessoryWithDetails) => void;
}

export function AddAccessoryModal({
  isOpen,
  onClose,
  accessory,
  availableElevations = [],
  onAdd,
}: AddAccessoryModalProps) {
  const [quantityStr, setQuantityStr] = useState<string>('1');
  const quantity = quantityStr === '' ? 0 : parseInt(quantityStr) || 0;
  const [selectedElevationId, setSelectedElevationId] = useState<number | string>('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantityStr('1');
      // Pre-select first elevation if available
      setSelectedElevationId(availableElevations.length > 0 ? availableElevations[0].id || '' : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const unitPrice = accessory.price || 0;
  const totalPrice = unitPrice * quantity;

  // Get selected elevation
  const selectedElevation = availableElevations.find(e => e.id === Number(selectedElevationId));

  // Validation - elevation is required only if elevations are available
  const isValid = quantity > 0;
  const isElevationValid = availableElevations.length === 0 || selectedElevationId;

  const handleAdd = () => {
    if (!isValid || !isElevationValid) return;

    onAdd({
      id: accessory.id,
      accessoryId: accessory.id,
      name: accessory.name,
      description: accessory.name,
      quantity,
      unitPrice,
      totalPrice,
      price: unitPrice,
      elevationId: selectedElevation?.id,
      elevationName: selectedElevation?.name,
      brandName: accessory.raw?.brandName,
      raw: accessory.raw,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Accessory to Quotation" size="md">
      <ModalBody>
        {/* Accessory Info */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-background-700 rounded-lg border border-background-600">
          <div className="text-text-900 font-semibold text-base sm:text-lg">{accessory.name}</div>
          <div className="text-text-600 text-xs sm:text-sm mt-1">
            Unit Price: ₹{unitPrice.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Quantity Input */}
        <div className="mb-4">
          <Input
            label="Quantity *"
            type="text"
            inputMode="numeric"
            value={quantityStr}
            onChange={(e) => {
              setQuantityStr(e.target.value.replace(/[^0-9]/g, ''));
            }}
            placeholder="1"
          />
        </div>

        {/* Elevation Selection - Only show if elevations are available */}
        {availableElevations.length > 0 && (
          <div className="mb-4">
            <Select
              label="Elevation *"
              value={selectedElevationId}
              onChange={(e) => setSelectedElevationId(e.target.value)}
              placeholder="Select Elevation"
            >
              {availableElevations.map((elevation) => (
                <option key={elevation.id || elevation.name} value={elevation.id}>
                  {elevation.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Price Preview */}
        {quantity > 0 && (
          <div className="p-3 sm:p-4 bg-primary-900/10 border border-primary-700/30 rounded-lg">
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-text-600">Unit Price:</span>
              <span className="text-text-900 font-medium">₹{unitPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-text-600">Quantity:</span>
              <span className="text-text-900 font-medium">× {quantity}</span>
            </div>
            {selectedElevation && (
              <div className="flex justify-between text-xs sm:text-sm mb-2">
                <span className="text-text-600">Elevation:</span>
                <span className="text-text-900 font-medium">{selectedElevation.name}</span>
              </div>
            )}
            <div className="flex justify-between text-sm sm:text-base pt-2 border-t border-primary-700/30 mt-2">
              <span className="text-text-800 font-semibold">Total:</span>
              <span className="text-success font-bold">₹{totalPrice.toLocaleString('en-IN')}</span>
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
          disabled={!isValid || !isElevationValid}
        >
          Add to Quotation
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default AddAccessoryModal;
