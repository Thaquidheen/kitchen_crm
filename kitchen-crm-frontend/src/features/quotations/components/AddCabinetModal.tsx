/**
 * AddCabinetModal Component
 * Modal for entering cabinet dimensions and optionally adding a related door
 */

import { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalFooter } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Select } from '../../../components/ui/Select';
import type { CabinetType, DoorType } from '../../products/types';

export interface CabinetWithDimensions {
  cabinetTypeId: number;
  cabinetType?: CabinetType;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  quantity: number;
  surfaceArea?: number; // Add this for price calculation
  linkedDoor?: {
    doorTypeId: number;
    doorType?: DoorType;
    widthMm: number;
    heightMm: number;
    quantity: number;
    faceArea?: number; // Add this for price calculation
  };
}

interface AddCabinetModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabinet: CabinetType;
  availableDoors: DoorType[];
  onAdd: (data: CabinetWithDimensions) => void;
}

export function AddCabinetModal({
  isOpen,
  onClose,
  cabinet,
  availableDoors,
  onAdd,
}: AddCabinetModalProps) {
  const [widthMm, setWidthMm] = useState<number>(0);
  const [heightMm, setHeightMm] = useState<number>(0);
  const [depthMm, setDepthMm] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [addDoor, setAddDoor] = useState<boolean>(false);
  const [selectedDoorId, setSelectedDoorId] = useState<number | string>('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setWidthMm(0);
      setHeightMm(0);
      setDepthMm(0);
      setQuantity(1);
      setAddDoor(false);
      setSelectedDoorId('');
    }
  }, [isOpen]);

  // Excel formula: Cabinet surface area = [((W/304)+(H/304))×2×(D/304)] + [(W/304)×(H/304)]
  const calculateCabinetSurfaceArea = () => {
    if (!widthMm || !heightMm || !depthMm) return 0;
    const w = widthMm / 304;
    const h = heightMm / 304;
    const d = depthMm / 304;
    return ((w + h) * 2 * d) + (w * h);
  };

  // Excel formula: Door face area = (W/304) × (H/304)
  const calculateDoorFaceArea = () => {
    if (!widthMm || !heightMm) return 0;
    return (widthMm / 304) * (heightMm / 304);
  };

  const surfaceArea = calculateCabinetSurfaceArea();
  const cabinetPrice = surfaceArea * (cabinet.basePrice || 0) * quantity;

  const selectedDoor = availableDoors.find(d => d.id === Number(selectedDoorId));
  const doorArea = calculateDoorFaceArea();
  const doorPrice = selectedDoor ? doorArea * (selectedDoor.companyPrice || 0) * quantity : 0;

  const isValid = widthMm > 0 && heightMm > 0 && depthMm > 0 && quantity > 0;
  const isDoorValid = !addDoor || (addDoor && selectedDoorId);

  const handleAdd = () => {
    if (!isValid || !isDoorValid) return;

    onAdd({
      cabinetTypeId: cabinet.id,
      cabinetType: cabinet,
      widthMm,
      heightMm,
      depthMm,
      quantity,
      surfaceArea, // Pass calculated surface area
      linkedDoor: addDoor && selectedDoor ? {
        doorTypeId: selectedDoor.id,
        doorType: selectedDoor,
        widthMm,
        heightMm,
        quantity,
        faceArea: doorArea, // Pass calculated face area
      } : undefined,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Cabinet to Quotation" size="lg">
      <ModalBody>
        {/* Cabinet Info */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-background-700 rounded-lg border border-background-600">
          <div className="text-text-900 font-semibold text-base sm:text-lg">{cabinet.name}</div>
          <div className="text-text-700 mt-1 text-sm sm:text-base">
            Base Price: ₹{cabinet.basePrice?.toLocaleString('en-IN')}/sqft
          </div>
          {cabinet.categoryName && (
            <div className="text-text-600 text-xs sm:text-sm mt-1">Category: {cabinet.categoryName}</div>
          )}
        </div>

        {/* Dimension Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
          <Input
            label="Depth (mm) *"
            type="number"
            value={depthMm || ''}
            onChange={(e) => setDepthMm(Number(e.target.value))}
            placeholder="e.g., 550"
            min={100}
            max={1000}
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

        {/* Calculated Cabinet Price */}
        {surfaceArea > 0 && (
          <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-primary-900/10 border border-primary-700/30 rounded-lg">
            <div className="text-text-800 text-xs sm:text-sm">Cabinet Calculation:</div>
            <div className="text-text-900 font-semibold mt-1 text-xs sm:text-sm">
              {surfaceArea.toFixed(2)} sqft × ₹{cabinet.basePrice?.toLocaleString('en-IN')} × {quantity} = ₹
              {cabinetPrice.toFixed(2)}
            </div>
          </div>
        )}

        {/* Add Door Checkbox */}
        <div className="mb-3 sm:mb-4">
          <Checkbox
            label="Add matching door for this cabinet"
            checked={addDoor}
            onChange={(e) => setAddDoor(e.target.checked)}
          />
        </div>

        {/* Door Selection */}
        {addDoor && (
          <div className="p-3 sm:p-4 bg-background-700 rounded-lg border border-background-600">
            <Select
              label="Select Door Type *"
              value={selectedDoorId}
              onChange={(e) => setSelectedDoorId(e.target.value)}
              placeholder="Choose a door"
            >
              {availableDoors.map((door) => (
                <option key={door.id} value={door.id}>
                  {door.name} - ₹{door.companyPrice?.toLocaleString('en-IN')}/sqft
                </option>
              ))}
            </Select>

            {/* Calculated Door Price */}
            {selectedDoor && doorArea > 0 && (
              <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-primary-900/10 border border-primary-700/30 rounded-lg">
                <div className="text-text-800 text-xs sm:text-sm">Door Calculation:</div>
                <div className="text-text-700 text-xs mt-1">
                  (Uses cabinet width × height)
                </div>
                <div className="text-text-900 font-semibold mt-1 text-xs sm:text-sm">
                  {doorArea.toFixed(2)} sqft × ₹{selectedDoor.companyPrice?.toLocaleString('en-IN')} × {quantity} = ₹
                  {doorPrice.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Total Preview */}
        {surfaceArea > 0 && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-background-800 border-2 border-primary-700 rounded-lg">
            <div className="text-text-800 text-xs sm:text-sm">Estimated Total (before margin & tax):</div>
            <div className="text-text-900 font-bold text-lg sm:text-xl mt-1">
              ₹{(cabinetPrice + doorPrice).toFixed(2)}
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
          disabled={!isValid || !isDoorValid}
        >
          Add to Quotation
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default AddCabinetModal;

