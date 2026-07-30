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
      // Default to "No Elevation": auto-selecting the first elevation made casual adds
      // carry an elevation while older rows had none, splitting the sidebar rows.
      setSelectedElevationId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const unitPrice = accessory.price || 0;
  const totalPrice = unitPrice * quantity;

  // Get selected elevation
  const selectedElevation = availableElevations.find(e => e.id === Number(selectedElevationId));

  // Validation - elevation is optional (defaults to "No Elevation")
  const isValid = quantity > 0;
  const isElevationValid = true;

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
        <div className="mb-4 sm:mb-5 p-3.5 bg-background-700/60 rounded-xl border border-background-600">
          <div className="text-text-900 font-[650] text-sm">{accessory.name}</div>
          <div className="text-text-600 text-xs mt-0.5">
            Unit price · <span className="font-semibold text-text-800 tabular-nums">₹{unitPrice.toLocaleString('en-IN')}</span>
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
            placeholder="Enter quantity"
          />
        </div>

        {/* Elevation Selection - Only show if elevations are available */}
        {availableElevations.length > 0 && (
          <div className="mb-4">
            <Select
              label="Elevation"
              value={selectedElevationId}
              onChange={(e) => setSelectedElevationId(e.target.value)}
              placeholder="Select Elevation"
            >
              <option value="">No Elevation</option>
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
          <div className="p-3.5 bg-background-700/40 border border-background-600 rounded-xl">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-text-600">Unit Price</span>
              <span className="text-text-900 font-medium tabular-nums">₹{unitPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-text-600">Quantity</span>
              <span className="text-text-900 font-medium tabular-nums">× {quantity}</span>
            </div>
            {selectedElevation && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-600">Elevation</span>
                <span className="text-text-900 font-medium">{selectedElevation.name}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-background-600 mt-2">
              <span className="text-xs font-semibold text-text-800">Total</span>
              <span className="text-primary-600 font-bold text-base tabular-nums">₹{totalPrice.toLocaleString('en-IN')}</span>
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
          className="btn-raised-accent"
        >
          Add to Quotation
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default AddAccessoryModal;
