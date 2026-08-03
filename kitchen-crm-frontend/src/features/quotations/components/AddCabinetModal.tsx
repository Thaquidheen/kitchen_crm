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
import type { CabinetType, DoorType, Material, InnerPanelType } from '../../products/types';
import type { QuotationElevation } from '../types';
import { useGetActiveMaterialsQuery, useGetActiveInnerPanelTypesQuery } from '../../products/productsAPI';
import { useIsSuperAdmin } from '@/features/auth/useIsSuperAdmin';

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
  materialCalculationType?: string;
  // Lighting cost (Width mm × 2) — legacy, kept so existing lines keep their amount
  lightingCost?: number;
  // Accessories cost (BLUM standard accessories)
  accessoriesCost?: number;
  // Powder coating: box surface area × the cabinet type's per-sqft rate
  powderCoating?: boolean;
  powderCoatingCost?: number;
  // Inner panel
  innerPanelTypeId?: number;
  innerPanelTypeName?: string;
  innerPanelRate?: number;
  innerPanelMultiplier?: number;
  innerPanelCost?: number;
  innerPanelQuantity?: number;
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
  // Per-unit cost rates are internal; staff see the resulting line totals only.
  const isSuperAdmin = useIsSuperAdmin();
  const isEditing = editIndex !== undefined;
  const [widthMm, setWidthMm] = useState<number>(0);
  const [heightMm, setHeightMm] = useState<number>(0);
  const [depthMm, setDepthMm] = useState<number>(0);
  const [quantityStr, setQuantityStr] = useState<string>('1');
  const quantity = quantityStr === '' ? 0 : parseInt(quantityStr) || 0;
  const [addDoor, setAddDoor] = useState<boolean>(false);
  const [selectedDoorId, setSelectedDoorId] = useState<number | string>('');

  // New state for material, lighting, accessories, inner panel, and elevation
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | string>('');
  const [includeAccessories, setIncludeAccessories] = useState<boolean>(true);
  const [powderCoating, setPowderCoating] = useState<boolean>(false);
  const [selectedInnerPanelId, setSelectedInnerPanelId] = useState<number | string>('');
  const [innerPanelQty, setInnerPanelQty] = useState<number>(0);
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

  // Fetch active materials and inner panel types
  const { data: materials = [], isLoading: materialsLoading } = useGetActiveMaterialsQuery();
  const { data: innerPanelTypes = [] } = useGetActiveInnerPanelTypesQuery();

  // Reset form when modal opens, or populate with edit data
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        // Populate form with existing cabinet data for editing
        setWidthMm(editData.widthMm || 0);
        setHeightMm(editData.heightMm || 0);
        setDepthMm(editData.depthMm || 0);
        setQuantityStr(String(editData.quantity || 1));
        setSelectedMaterialId(editData.materialId || '');
        setIncludeAccessories((editData.accessoriesCost ?? 0) > 0);
        setPowderCoating(editData.powderCoating ?? (editData.powderCoatingCost ?? 0) > 0);
        setSelectedInnerPanelId(editData.innerPanelTypeId || '');
        setInnerPanelQty(editData.innerPanelQuantity || 0);
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
        setQuantityStr('1');
        setAddDoor(false);
        setSelectedDoorId('');
        setSelectedMaterialId('');
        setIncludeAccessories(true);
        setPowderCoating(false);
        setSelectedInnerPanelId('');
        setInnerPanelQty(0);
        setSelectedElevationId(availableElevations.length > 0 ? availableElevations[0].id || '' : '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Excel formula: Cabinet surface area = [2*(W*D + W*H + D*H) - W*H] / 92903
  // = [2*W*D + W*H + 2*D*H] / 92903 (box area minus door face)
  const calculateCabinetSurfaceArea = () => {
    if (!widthMm || !heightMm || !depthMm) return 0;
    return (2 * widthMm * depthMm + widthMm * heightMm + 2 * depthMm * heightMm) / 92903;
  };

  // Excel formula: Door face area = (W * H) / 92903
  const calculateDoorFaceArea = () => {
    if (!widthMm || !heightMm) return 0;
    return (widthMm * heightMm) / 92903;
  };

  // Inner panel cost: (W * D / 92903) × rate × multiplier × quantity
  const calculateInnerPanelCost = () => {
    if (!widthMm || !depthMm || !selectedInnerPanel || innerPanelQty <= 0) return 0;
    const floorArea = (widthMm * depthMm) / 92903;
    return floorArea * selectedInnerPanel.ratePerSqft * selectedInnerPanel.multiplier * innerPanelQty;
  };

  // Get selected material
  const selectedMaterial = materials.find(m => m.id === Number(selectedMaterialId));
  const materialRate = selectedMaterial?.unitRatePerSqft || 0;

  // Get selected inner panel type
  const selectedInnerPanel = innerPanelTypes.find(ip => ip.id === Number(selectedInnerPanelId));

  // Calculate surface area based on material type
  const surfaceArea = selectedMaterial?.calculationType === 'FACE_AREA'
    ? calculateDoorFaceArea()   // PLY, WPC → front face only
    : calculateCabinetSurfaceArea(); // SS 304, etc. → full box area

  // Calculate cabinet price: surfaceArea × materialRate
  const cabinetPrice = surfaceArea * materialRate;

  // Legacy lighting cost, preserved when editing a line that already had it. The checkbox
  // that produced it was replaced by powder coating, so nothing sets it on new lines.
  const lightingCost = editData?.lightingCost ?? 0;

  // Accessories cost (cabinet's fixed price)
  const accessoriesCost = includeAccessories ? (cabinet.fixedPrice || 0) : 0;

  // Powder coating: always the BOX surface area, whatever the material's calculation type,
  // because the coating covers the whole carcass. The server recomputes this on save; the
  // value here is only so the breakdown shows the right number as you type.
  const powderCoatingRate = cabinet.powderCoatingRatePerSqft || 0;
  const boxSurfaceArea = calculateCabinetSurfaceArea();
  const powderCoatingCost = powderCoating ? boxSurfaceArea * powderCoatingRate : 0;

  // Inner panel cost
  const innerPanelCost = calculateInnerPanelCost();

  // Per-unit total
  const perUnitTotal = cabinetPrice + lightingCost + accessoriesCost + innerPanelCost + powderCoatingCost;

  // Total cabinet price (with quantity)
  const totalCabinetPrice = perUnitTotal * quantity;

  // Door calculations
  const selectedDoor = availableDoors.find(d => d.id === Number(selectedDoorId));
  const doorArea = calculateDoorFaceArea();
  const doorPrice = addDoor && selectedDoor ? doorArea * (selectedDoor.companyPrice || 0) * quantity : 0;

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
      materialCalculationType: selectedMaterial?.calculationType || 'BOX_AREA',
      lightingCost,
      accessoriesCost: includeAccessories ? accessoriesCost : 0,
      powderCoating,
      powderCoatingCost,
      // Inner panel
      innerPanelTypeId: selectedInnerPanel?.id,
      innerPanelTypeName: selectedInnerPanel?.name,
      innerPanelRate: selectedInnerPanel?.ratePerSqft,
      innerPanelMultiplier: selectedInnerPanel?.multiplier,
      innerPanelCost: innerPanelCost,
      innerPanelQuantity: innerPanelQty,
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
        <div className="mb-4 sm:mb-5 p-3.5 bg-background-700/60 rounded-xl border border-background-600">
          <div className="text-text-900 font-[650] text-sm">{cabinet.name}</div>
          {cabinet.categoryName && (
            <div className="text-text-600 text-xs mt-0.5">{cabinet.categoryName}</div>
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
            type="text"
            inputMode="numeric"
            value={quantityStr}
            onChange={(e) => {
              setQuantityStr(e.target.value.replace(/[^0-9]/g, ''));
            }}
            placeholder="Enter quantity"
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
                {material.name}{isSuperAdmin ? ` - ₹${material.unitRatePerSqft?.toLocaleString('en-IN')}/sqft` : ''}
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

        {/* Inner Panel Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select
            label="Inner Panel Type"
            value={selectedInnerPanelId}
            onChange={(e) => {
              setSelectedInnerPanelId(e.target.value);
              if (e.target.value && innerPanelQty === 0) setInnerPanelQty(1);
              if (!e.target.value) setInnerPanelQty(0);
            }}
            placeholder="None (NIL)"
          >
            {innerPanelTypes.map((ip) => (
              <option key={ip.id} value={ip.id}>
                {ip.name}{isSuperAdmin ? ` - ₹${ip.ratePerSqft?.toLocaleString('en-IN')}/sqft` : ''} {ip.multiplier !== 1 ? `x${ip.multiplier}` : ''}
              </option>
            ))}
          </Select>
          {selectedInnerPanelId && (
            <Input
              label="Panel Qty"
              type="number"
              value={innerPanelQty || ''}
              onChange={(e) => setInnerPanelQty(Number(e.target.value) || 0)}
              placeholder="Qty"
              min={0}
              max={10}
            />
          )}
        </div>

        {/* Accessories and Lighting Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center">
            <Checkbox
              label={isSuperAdmin ? `Fixed Price - ₹${(cabinet.fixedPrice || 0).toLocaleString('en-IN')}` : 'Fixed Price'}
              checked={includeAccessories}
              onChange={(e) => setIncludeAccessories(e.target.checked)}
            />
          </div>
          <div className="flex items-center">
            <Checkbox
              label={
                powderCoatingRate > 0
                  ? (isSuperAdmin ? `Powder Coating - ₹${powderCoatingRate.toLocaleString('en-IN')}/sq.ft` : 'Powder Coating')
                  : 'Powder Coating - no rate set'
              }
              checked={powderCoating}
              disabled={powderCoatingRate <= 0}
              onChange={(e) => setPowderCoating(e.target.checked)}
            />
          </div>
        </div>

        {/* Pricing Breakdown */}
        {widthMm > 0 && heightMm > 0 && depthMm > 0 && selectedMaterialId && (
          <div className="mb-4 sm:mb-5 p-3.5 bg-background-700/40 border border-background-600 rounded-xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-600 mb-2.5 pb-2 border-b border-background-600">
              Pricing Breakdown
            </div>

            {/* Surface Area */}
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-text-600">
                {selectedMaterial?.calculationType === 'FACE_AREA' ? 'Face Area' : 'Cabinet SQFT'}
              </span>
              <span className="text-text-900 font-medium tabular-nums">{surfaceArea.toFixed(2)} sqft</span>
            </div>

            {/* Material Rate — cost input, admin only */}
            {isSuperAdmin && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-600">Material Rate ({selectedMaterial?.name})</span>
                <span className="text-text-900 font-medium tabular-nums">₹{materialRate.toLocaleString('en-IN')}/sqft</span>
              </div>
            )}

            {/* Cabinet Price */}
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-text-600">Cabinet Price</span>
              <span className="text-text-900 font-medium tabular-nums">
                {isSuperAdmin ? `${surfaceArea.toFixed(2)} × ₹${materialRate.toLocaleString('en-IN')} = ` : ''}₹{cabinetPrice.toFixed(2)}
              </span>
            </div>

            {/* Fixed Price */}
            {includeAccessories && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-600">Fixed Price</span>
                <span className="text-text-900 font-medium tabular-nums">₹{accessoriesCost.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Inner Panel */}
            {selectedInnerPanel && innerPanelCost > 0 && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-600">Inner Panel ({selectedInnerPanel.name} x{innerPanelQty})</span>
                <span className="text-text-900 font-medium tabular-nums">₹{innerPanelCost.toFixed(2)}</span>
              </div>
            )}

            {/* Legacy lighting, only shown when editing a line that already carries it */}
            {lightingCost > 0 && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-600">Lightings (existing)</span>
                <span className="text-text-900 font-medium tabular-nums">₹{lightingCost.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Powder coating — box area, whatever the material's calculation type */}
            {powderCoating && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-600">
                  Powder Coating{isSuperAdmin ? ` (${boxSurfaceArea.toFixed(2)} sq.ft × ₹${powderCoatingRate})` : ''}
                </span>
                <span className="text-text-900 font-medium tabular-nums">₹{powderCoatingCost.toFixed(2)}</span>
              </div>
            )}

            {/* Per Unit Total */}
            <div className="flex justify-between text-xs mb-1.5 pt-2 border-t border-background-600">
              <span className="text-text-600">Per Unit Total</span>
              <span className="text-text-900 font-medium tabular-nums">₹{perUnitTotal.toFixed(2)}</span>
            </div>

            {/* Quantity multiplier */}
            {quantity > 1 && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-600">Quantity</span>
                <span className="text-text-900 font-medium tabular-nums">× {quantity}</span>
              </div>
            )}

            {/* Subtotal */}
            <div className="flex justify-between items-baseline pt-2 border-t border-background-600 mt-2">
              <span className="text-xs font-semibold text-text-800">Subtotal (Cabinet)</span>
              <span className="text-primary-600 font-bold text-base tabular-nums">₹{totalCabinetPrice.toFixed(2)}</span>
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
          <div className="p-3.5 bg-background-700/40 rounded-xl border border-background-600">
            <Select
              label="Select Door Type *"
              value={selectedDoorId}
              onChange={(e) => setSelectedDoorId(e.target.value)}
              placeholder="Choose a door"
            >
              {availableDoors.map((door) => (
                <option key={door.id} value={door.id}>
                  {door.name}{isSuperAdmin ? ` - ₹${door.companyPrice?.toLocaleString('en-IN')}/sqft` : ''}
                </option>
              ))}
            </Select>

            {/* Calculated Door Price */}
            {selectedDoor && doorArea > 0 && (
              <div className="mt-3 p-3 bg-background-800 border border-background-600 rounded-xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-600">Door Calculation</div>
                <div className="text-text-500 text-[11px] mt-0.5">
                  Uses cabinet width × height
                </div>
                <div className="text-text-900 font-medium mt-1 text-xs tabular-nums">
                  {isSuperAdmin
                    ? `${doorArea.toFixed(2)} sqft × ₹${selectedDoor.companyPrice?.toLocaleString('en-IN')} × ${quantity} = `
                    : ''}₹{doorPrice.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Total Preview */}
        {widthMm > 0 && heightMm > 0 && depthMm > 0 && selectedMaterialId && quantity > 0 && (
          <div className="mt-4 p-3.5 bg-primary-600/[0.06] border border-primary-600/40 rounded-xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-600">Estimated Total</div>
            <div className="text-primary-600 font-bold text-lg mt-0.5 tabular-nums">
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
          className="btn-raised-accent"
        >
          {isEditing ? "Update Cabinet" : "Add to Quotation"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default AddCabinetModal;
