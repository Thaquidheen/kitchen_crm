/**
 * AddCabinetModal Component
 * Modal for entering cabinet dimensions with material selection, lighting, and accessories
 */

import { useState, useEffect, useRef } from 'react';
import { Modal, ModalBody, ModalFooter } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Select } from '../../../components/ui/Select';
import type { CabinetType, DoorType, Material } from '../../products/types';
import type { QuotationElevation } from '../types';
import { useGetActiveMaterialsQuery } from '../../products/productsAPI';

export interface CabinetWithDimensions {
  cabinetTypeId: number;
  cabinetType?: CabinetType;
  cabinetTypeName?: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  quantity: number;
  surfaceArea?: number;
  calculatedSqft?: number;
  // Material selection for sqft-based pricing
  materialId?: number;
  materialName?: string;
  materialRate?: number;
  // Lighting cost (Width mm × 2)
  lightingCost?: number;
  // Accessories cost (BLUM standard accessories)
  accessoriesCost?: number;
  // Pricing
  unitPrice?: number;
  totalPrice?: number;
  description?: string;
  // Elevation reference
  elevationId?: number;
  elevationName?: string;
  linkedDoor?: {
    doorTypeId: number;
    doorType?: DoorType;
    widthMm: number;
    heightMm: number;
    quantity: number;
    faceArea?: number;
  };
}

interface AddCabinetModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabinet: CabinetType;
  availableDoors: DoorType[];
  availableElevations?: QuotationElevation[];
  onAdd: (data: CabinetWithDimensions, editIndex?: number) => void;
  editData?: CabinetWithDimensions;
  editIndex?: number;
}

export function AddCabinetModal({
  isOpen,
  onClose,
  cabinet,
  availableDoors,
  availableElevations = [],
  onAdd,
  editData,
  editIndex,
}: AddCabinetModalProps) {
  const isEditing = editIndex !== undefined;
  const [widthMm, setWidthMm] = useState<number>(0);
  const [heightMm, setHeightMm] = useState<number>(0);
  const [depthMm, setDepthMm] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [addDoor, setAddDoor] = useState<boolean>(false);
  const [selectedDoorId, setSelectedDoorId] = useState<number | string>('');

  // New state for material, lighting, accessories, and elevation
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | string>('');
  const [includeAccessories, setIncludeAccessories] = useState<boolean>(true);
  const [includeLighting, setIncludeLighting] = useState<boolean>(true);
  const [selectedElevationId, setSelectedElevationId] = useState<number | string>('');

  // Refs for Enter key navigation
  const widthRef = useRef<HTMLInputElement>(null);
  const depthRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);

  // Handle Enter key to move to next field
  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  // Fetch active materials
  const { data: materials = [], isLoading: materialsLoading } = useGetActiveMaterialsQuery();

  // Reset form when modal opens, or populate with edit data
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        // Populate form with existing cabinet data for editing
        setWidthMm(editData.widthMm || 0);
        setHeightMm(editData.heightMm || 0);
        setDepthMm(editData.depthMm || 0);
        setQuantity(editData.quantity || 1);
        setSelectedMaterialId(editData.materialId || '');
        setIncludeAccessories((editData.accessoriesCost ?? 0) > 0);
        setIncludeLighting((editData.lightingCost ?? 0) > 0);
        setSelectedElevationId(editData.elevationId || '');
        // Handle linked door
        if (editData.linkedDoor) {
          setAddDoor(true);
          setSelectedDoorId(editData.linkedDoor.doorTypeId || '');
        } else {
          setAddDoor(false);
          setSelectedDoorId('');
        }
      } else {
        // Reset form for new cabinet
        setWidthMm(0);
        setHeightMm(0);
        setDepthMm(0);
        setQuantity(1);
        setAddDoor(false);
        setSelectedDoorId('');
        setSelectedMaterialId('');
        setIncludeAccessories(true);
        setIncludeLighting(true);
        setSelectedElevationId(availableElevations.length > 0 ? availableElevations[0].id || '' : '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Get selected material
  const selectedMaterial = materials.find(m => m.id === Number(selectedMaterialId));
  const materialRate = selectedMaterial?.unitRatePerSqft || 0;

  // Calculate surface area
  const surfaceArea = calculateCabinetSurfaceArea();

  // Calculate cabinet price: surfaceArea × materialRate
  const cabinetPrice = surfaceArea * materialRate;

  // Calculate lighting cost: Width (mm) × 2
  const lightingCost = includeLighting ? widthMm * 2 : 0;

  // Accessories cost (cabinet's fixed price)
  const accessoriesCost = includeAccessories ? (cabinet.fixedPrice || 0) : 0;

  // Per-unit total
  const perUnitTotal = cabinetPrice + lightingCost + accessoriesCost;

  // Total cabinet price (with quantity)
  const totalCabinetPrice = perUnitTotal * quantity;

  // Door calculations
  const selectedDoor = availableDoors.find(d => d.id === Number(selectedDoorId));
  const doorArea = calculateDoorFaceArea();
  const doorPrice = selectedDoor ? doorArea * (selectedDoor.companyPrice || 0) * quantity : 0;

  // Elevation selection
  const selectedElevation = availableElevations.find(e => e.id === Number(selectedElevationId));

  // Validation - elevation is required only if elevations are available
  const isValid = widthMm > 0 && heightMm > 0 && depthMm > 0 && quantity > 0 && selectedMaterialId;
  const isDoorValid = !addDoor || (addDoor && selectedDoorId);
  const isElevationValid = availableElevations.length === 0 || selectedElevationId;

  const handleAdd = () => {
    if (!isValid || !isDoorValid || !isElevationValid) return;

    onAdd({
      cabinetTypeId: cabinet.id,
      cabinetType: cabinet,
      cabinetTypeName: cabinet.name,
      widthMm,
      heightMm,
      depthMm,
      quantity,
      surfaceArea,
      calculatedSqft: surfaceArea,
      materialId: selectedMaterial?.id,
      materialName: selectedMaterial?.name,
      materialRate: materialRate,
      lightingCost: includeLighting ? lightingCost : 0,
      accessoriesCost: includeAccessories ? accessoriesCost : 0,
      // Set unit price (per unit) and total price for display
      unitPrice: perUnitTotal,
      totalPrice: totalCabinetPrice,
      description: `${cabinet.name} (${widthMm}×${depthMm}×${heightMm}mm)`,
      // Elevation
      elevationId: selectedElevation?.id,
      elevationName: selectedElevation?.name,
      linkedDoor: addDoor && selectedDoor ? {
        doorTypeId: selectedDoor.id,
        doorType: selectedDoor,
        widthMm,
        heightMm,
        quantity,
        faceArea: doorArea,
      } : undefined,
    }, editIndex);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Cabinet" : "Add Cabinet to Quotation"} size="lg">
      <ModalBody>
        {/* Cabinet Info */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-background-700 rounded-lg border border-background-600">
          <div className="text-text-900 font-semibold text-base sm:text-lg">{cabinet.name}</div>
          {cabinet.categoryName && (
            <div className="text-text-600 text-xs sm:text-sm mt-1">Category: {cabinet.categoryName}</div>
          )}
        </div>

        {/* Dimension Inputs - Order: Width, Depth, Height */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            ref={widthRef}
            label="Width (mm) *"
            type="number"
            value={widthMm || ''}
            onChange={(e) => setWidthMm(Number(e.target.value))}
            onKeyDown={(e) => handleKeyDown(e, depthRef)}
            placeholder="e.g., 600"
            min={100}
            max={5000}
          />
          <Input
            ref={depthRef}
            label="Depth (mm) *"
            type="number"
            value={depthMm || ''}
            onChange={(e) => setDepthMm(Number(e.target.value))}
            onKeyDown={(e) => handleKeyDown(e, heightRef)}
            placeholder="e.g., 550"
            min={100}
            max={1000}
          />
          <Input
            ref={heightRef}
            label="Height (mm) *"
            type="number"
            value={heightMm || ''}
            onChange={(e) => setHeightMm(Number(e.target.value))}
            onKeyDown={(e) => handleKeyDown(e, quantityRef)}
            placeholder="e.g., 800"
            min={100}
            max={3000}
          />
        </div>

        {/* Quantity and Material Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            ref={quantityRef}
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            placeholder="1"
            min={1}
          />
          <Select
            label="Material *"
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            placeholder="Select Material"
            disabled={materialsLoading}
          >
            {materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name} - ₹{material.unitRatePerSqft?.toLocaleString('en-IN')}/sqft
              </option>
            ))}
          </Select>
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

        {/* Accessories and Lighting Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center">
            <Checkbox
              label={`Fixed Price - ₹${(cabinet.fixedPrice || 0).toLocaleString('en-IN')}`}
              checked={includeAccessories}
              onChange={(e) => setIncludeAccessories(e.target.checked)}
            />
          </div>
          <div className="flex items-center">
            <Checkbox
              label="Include Lighting"
              checked={includeLighting}
              onChange={(e) => setIncludeLighting(e.target.checked)}
            />
          </div>
        </div>

        {/* Pricing Breakdown */}
        {widthMm > 0 && heightMm > 0 && depthMm > 0 && selectedMaterialId && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-primary-900/10 border border-primary-700/30 rounded-lg">
            <div className="text-text-800 text-sm font-semibold mb-3 border-b border-primary-700/30 pb-2">
              PRICING BREAKDOWN
            </div>

            {/* Surface Area */}
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-text-600">Cabinet SQFT:</span>
              <span className="text-text-900 font-medium">{surfaceArea.toFixed(2)} sqft</span>
            </div>

            {/* Material Rate */}
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-text-600">Material Rate ({selectedMaterial?.name}):</span>
              <span className="text-text-900 font-medium">₹{materialRate.toLocaleString('en-IN')}/sqft</span>
            </div>

            {/* Cabinet Price */}
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-text-600">Cabinet Price:</span>
              <span className="text-text-900 font-medium">
                {surfaceArea.toFixed(2)} × ₹{materialRate.toLocaleString('en-IN')} = ₹{cabinetPrice.toFixed(2)}
              </span>
            </div>

            {/* Fixed Price */}
            {includeAccessories && (
              <div className="flex justify-between text-xs sm:text-sm mb-2">
                <span className="text-text-600">Fixed Price:</span>
                <span className="text-text-900 font-medium">₹{accessoriesCost.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Lighting */}
            {includeLighting && (
              <div className="flex justify-between text-xs sm:text-sm mb-2">
                <span className="text-text-600">Lightings ({widthMm} × 2):</span>
                <span className="text-text-900 font-medium">₹{lightingCost.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Per Unit Total */}
            <div className="flex justify-between text-xs sm:text-sm mb-2 pt-2 border-t border-primary-700/30">
              <span className="text-text-600">Per Unit Total:</span>
              <span className="text-text-900 font-medium">₹{perUnitTotal.toFixed(2)}</span>
            </div>

            {/* Quantity multiplier */}
            {quantity > 1 && (
              <div className="flex justify-between text-xs sm:text-sm mb-2">
                <span className="text-text-600">Quantity:</span>
                <span className="text-text-900 font-medium">× {quantity}</span>
              </div>
            )}

            {/* Subtotal */}
            <div className="flex justify-between text-sm sm:text-base pt-2 border-t border-primary-700/30 mt-2">
              <span className="text-text-800 font-semibold">SUBTOTAL (Cabinet):</span>
              <span className="text-success font-bold">₹{totalCabinetPrice.toFixed(2)}</span>
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
        {widthMm > 0 && heightMm > 0 && depthMm > 0 && selectedMaterialId && quantity > 0 && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-background-800 border-2 border-primary-700 rounded-lg">
            <div className="text-text-800 text-xs sm:text-sm">Estimated Total (before margin & tax):</div>
            <div className="text-text-900 font-bold text-lg sm:text-xl mt-1">
              ₹{(totalCabinetPrice + doorPrice).toFixed(2)}
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
          disabled={!isValid || !isDoorValid || !isElevationValid}
        >
          {isEditing ? "Update Cabinet" : "Add to Quotation"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default AddCabinetModal;
