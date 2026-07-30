/**
 * AddDoorModal Component
 * Modal for entering door dimensions (standalone door without cabinet)
 */

import { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalFooter } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import type { DoorType } from '../../products/types';
import type { QuotationElevation } from '../types';

export interface DoorWithDimensions {
  doorTypeId: number;
  doorType?: DoorType;
  widthMm: number;
  heightMm: number;
  quantity: number;
  faceArea?: number; // Add this for price calculation
  // Elevation reference
  elevationId?: number;
  elevationName?: string;
}

interface AddDoorModalProps {
  isOpen: boolean;
  onClose: () => void;
  door: DoorType;
  availableElevations?: QuotationElevation[];
  onAdd: (data: DoorWithDimensions) => void;
  editData?: DoorWithDimensions;
  editIndex?: number;
}

export function AddDoorModal({
  isOpen,
  onClose,
  door,
  availableElevations = [],
  onAdd,
  editData,
  editIndex,
}: AddDoorModalProps) {
  const isEditMode = editData !== undefined && editIndex !== undefined;
  const [widthMm, setWidthMm] = useState<number>(0);
  const [heightMm, setHeightMm] = useState<number>(0);
  const [quantityStr, setQuantityStr] = useState<string>('1');
  const quantity = quantityStr === '' ? 0 : parseInt(quantityStr) || 0;
  const [selectedElevationId, setSelectedElevationId] = useState<number | string>('');

  // Reset form when modal opens or populate with edit data
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        // Populate with edit data
        setWidthMm(editData.widthMm || 0);
        setHeightMm(editData.heightMm || 0);
        setQuantityStr(String(editData.quantity || 1));
        setSelectedElevationId(editData.elevationId || (availableElevations.length > 0 ? availableElevations[0].id || '' : ''));
      } else {
        // Reset for new door
        setWidthMm(0);
        setHeightMm(0);
        setQuantityStr('1');
        setSelectedElevationId(availableElevations.length > 0 ? availableElevations[0].id || '' : '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Door face area = (W × H) / 92903  (92903 mm² = 1 sqft; 304.8mm per foot).
  // Must match the backend (PricingServiceImpl.MM2_PER_SQFT) and AddCabinetModal so the
  // review total equals the saved/PDF total.
  const calculateDoorFaceArea = () => {
    if (!widthMm || !heightMm) return 0;
    return (widthMm * heightMm) / 92903;
  };

  const faceArea = calculateDoorFaceArea();
  const doorPrice = faceArea * (door.companyPrice || 0) * quantity;

  // Get selected elevation
  const selectedElevation = availableElevations.find(e => e.id === Number(selectedElevationId));

  // Validation - elevation is required only if elevations are available
  const isValid = widthMm > 0 && heightMm > 0 && quantity > 0;
  const isElevationValid = availableElevations.length === 0 || selectedElevationId;

  const handleAdd = () => {
    if (!isValid || !isElevationValid) return;

    onAdd({
      doorTypeId: door.id,
      doorType: door,
      // Display + pricing fields so the door survives editing (otherwise it shows "Item N" / ₹0).
      // Mirrors AddCabinetModal and the ProductSelector door enrichment.
      doorTypeName: door.name,
      brandName: door.brandName,
      material: door.material,
      unitPrice: door.companyPrice || 0,
      totalPrice: doorPrice, // faceArea × companyPrice × quantity
      calculatedSqft: faceArea,
      customDimensions: true,
      description: `${door.name} (${widthMm}×${heightMm}mm)`,
      widthMm,
      heightMm,
      quantity,
      faceArea, // Pass calculated face area
      // Elevation
      elevationId: selectedElevation?.id,
      elevationName: selectedElevation?.name,
    } as any);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Door" : "Add Door to Quotation"} size="md">
      <ModalBody>
        {/* Door Info */}
        <div className="mb-4 sm:mb-5 p-3.5 bg-background-700/60 rounded-xl border border-background-600">
          <div className="text-text-900 font-[650] text-sm">{door.name}</div>
          <div className="text-text-600 text-xs mt-0.5">
            <span className="font-semibold text-text-800 tabular-nums">₹{door.companyPrice?.toLocaleString('en-IN')}/sqft</span>
            {door.brandName && <> · {door.brandName}</>}
            {door.material && <> · {door.material}</>}
          </div>
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

        <div className="mb-4">
          <Input
            label="Quantity"
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
          <div className="mb-6">
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

        {/* Calculated Door Price */}
        {faceArea > 0 && (
          <div className="mb-4 p-3 bg-background-700/40 border border-background-600 rounded-xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-600">Door Calculation</div>
            <div className="text-text-900 font-medium mt-1 text-xs tabular-nums">
              {faceArea.toFixed(2)} sqft × ₹{door.companyPrice?.toLocaleString('en-IN')} × {quantity} = ₹
              {doorPrice.toFixed(2)}
            </div>
          </div>
        )}

        {/* Total Preview */}
        {faceArea > 0 && (
          <div className="mt-4 p-3.5 bg-primary-600/[0.06] border border-primary-600/40 rounded-xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-600">Estimated Total (before margin & tax)</div>
            <div className="text-primary-600 font-bold text-lg mt-0.5 tabular-nums">
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
          disabled={!isValid || !isElevationValid}
          className="btn-raised-accent"
        >
          {isEditMode ? "Save Changes" : "Add to Quotation"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default AddDoorModal;

