/**
 * QuotationBuilderPage
 * Multi-step quotation builder with customer selection and product selection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { FileText, ArrowLeft, Save, Send, FilePlus } from 'lucide-react';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CustomerSelector } from '@/features/quotations/components/CustomerSelector';
import { ProductSelector } from '@/features/quotations/components/ProductSelector';
import { SelectedProductsList } from '@/features/quotations/components/SelectedProductsList';
import { CategoryPricingPanel } from '@/features/quotations/components/CategoryPricingPanel';
import { CategoryTotals } from '@/features/quotations/components/CategoryTotals';
import { QuotationPreview } from '@/features/quotations/components/QuotationPreview';
import { KitchenSelector } from '@/features/quotations/components/KitchenSelector';
import { KitchenScopeForm } from '@/features/quotations/components/KitchenScopeForm';
import { KitchenPlanImageSelector } from '@/features/quotations/components/KitchenPlanImageSelector';
import { KitchenProductTabs } from '@/features/quotations/components/KitchenProductTabs';
import { AddCabinetModal, type CabinetWithDimensions } from '@/features/quotations/components/AddCabinetModal';
import { AddDoorModal, type DoorWithDimensions } from '@/features/quotations/components/AddDoorModal';
import type { QuotationFormData, CreateQuotationRequest, QuotationAccessory, QuotationCabinet, QuotationDoor, QuotationLighting, QuotationKitchenFormData, QuotationOtherExpense } from '@/features/quotations/types';

const DEFAULT_TERMS_CONDITIONS = `• The Above-mentioned Terms are Subjected to Change depending upon the delay from Client side to provide necessary Inputs/Approvals
• Kitchen Delivery and Installation will not proceed unless site condition requirements outlined in our Terms and Conditions.
• Unloading Expenses of the materials at the sight to bear by the customer
• Our scope is limited to the installation of the specified items only. There will be additional charges for installing any items not included in this offer.
• The client must provide all plumbing and electrical items, including faucets, as part of their scope. All plumbing outlets and electrical points should be installed according to our site drawing
• The client should provide safe storage spaces for materials during installation at the site.`;

const DEFAULT_WARRANTY_SERVICE = `We Warrant the Furniture We Sell to Be Free from Defects in Material and Workmanship Under Normal Residential Usage to The Original Purchaser for The Period Specified Below. We Will Repair Any Part That Proves to Be Defective in Materials and Workmanship. If Repair Is Not Possible, We Will Either Replace the Part with A New Part or A Component of Similar Composition and Price.

This Warranty Does Not Apply to Any Issues with Our Furniture or Parts of Our Furniture That Result from Improper Handling, Negligence, Alterations, Accidents, Misuse, Improper Cleaning or Care, Or Natural Calamities. Additionally, Consequential and Incidental Damages Are Not Covered Under This Warranty.

Stainless Steel Cabinets Have 20 Years of Warranty Against Any Manufacturing Defect
Any Other Doors Have 8 Years of Warranty Against Any Manufacturing Defect
Hardware & Accessories: As Provided by The Manufacturer
Lightings: As Provided by The Manufacturer`;
import { SCOPE_FIELD_NAMES } from '@/features/quotations/types';
import toast from 'react-hot-toast';
import { useGetCustomersPageQuery } from '@/features/customers/customersAPI';
import { useCreateQuotationMutation, useUpdateQuotationMutation, useGetQuotationByIdQuery } from '@/app/baseApi';
import { useGetMarginsQuery } from '@/services/settingsAPI';
import { useGetCabinetsQuery, useGetDoorsQuery } from '@/features/products/productsAPI';
import { useParams } from 'react-router-dom';

type BuilderStep = 'customer' | 'kitchens' | 'products' | 'review';

// Map a saved accessory row into the builder's shape, preserving identity (accessoryId)
// and elevation so later adds of the same accessory merge instead of duplicating.
function mapLoadedAccessory(a: any) {
  return {
    id: a.accessoryId || a.id,
    accessoryId: a.accessoryId || a.id,
    quantity: a.quantity,
    unitPrice: Number(a.unitPrice || 0),
    // Use unitPrice × quantity as base (backend totalPrice includes margin+tax)
    totalPrice: Number(a.unitPrice || 0) * (a.quantity || 1),
    name: a.description || a.accessoryName || 'Accessory',
    description: a.description || a.accessoryName || 'Accessory',
    price: Number(a.unitPrice || 0),
    brandName: a.brandName,
    elevationId: a.elevationId,
    elevationName: a.elevationName,
  };
}

// Heal quotations that already contain split rows for the same accessory (same accessory,
// same elevation, same unit price) by merging them into one row with the summed quantity.
function mergeDuplicateAccessories(list: any[]): any[] {
  const merged: any[] = [];
  for (const item of list) {
    const itemElev = item.elevationId ?? null;
    const existing = merged.find((x) => {
      if ((x.accessoryId ?? x.id) !== (item.accessoryId ?? item.id)) return false;
      if (Number(x.unitPrice || 0) !== Number(item.unitPrice || 0)) return false;
      const curElev = x.elevationId ?? null;
      // Same rule as the add flow: only two explicitly different elevations stay separate
      return curElev === itemElev || curElev === null || itemElev === null;
    });
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
      existing.totalPrice = Number(existing.unitPrice || 0) * existing.quantity;
      if ((existing.elevationId ?? null) === null && itemElev !== null) {
        existing.elevationId = item.elevationId;
        existing.elevationName = item.elevationName;
      }
    } else {
      merged.push({ ...item });
    }
  }
  return merged;
}

export function QuotationBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Get current user and role from auth state
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userRole = currentUser?.role || 'ROLE_STAFF';

  // Fetch global margin settings
  const { data: marginsResponse, isLoading: isMarginsLoading } = useGetMarginsQuery();

  // Fetch cabinet and door types for edit modal (with large page size to get all)
  const { data: cabinetTypes = [] } = useGetCabinetsQuery({ page: 0, size: 100 });
  const { data: doorTypes = [] } = useGetDoorsQuery({ page: 0, size: 100 });

  // Edit cabinet modal state
  const [editCabinetModalOpen, setEditCabinetModalOpen] = useState(false);
  const [editingCabinetData, setEditingCabinetData] = useState<CabinetWithDimensions | null>(null);
  const [editingCabinetIndex, setEditingCabinetIndex] = useState<number | null>(null);
  const [editingKitchenIndex, setEditingKitchenIndex] = useState<number | null>(null);

  // Item removal confirmation dialog state (products + other expenses, kitchen or global)
  const [pendingRemoval, setPendingRemoval] = useState<{
    scope: 'product' | 'otherExpense';
    category?: string;
    index: number;
    kitchenIndex?: number;
    itemName: string;
    linkedDoorIndex?: number;
    linkedDoorName?: string;
  } | null>(null);
  const [showLinkedDoorRemoveDialog, setShowLinkedDoorRemoveDialog] = useState(false);
  const [showRemoveItemDialog, setShowRemoveItemDialog] = useState(false);
  // "Clear All" confirmation (whole category or all other expenses, kitchen or global)
  const [pendingClear, setPendingClear] = useState<{
    scope: 'category' | 'otherExpenses';
    category?: string;
    kitchenIndex?: number;
    label: string;
  } | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Edit door modal state
  const [editDoorModalOpen, setEditDoorModalOpen] = useState(false);
  const [editingDoorData, setEditingDoorData] = useState<DoorWithDimensions | null>(null);
  const [editingDoorIndex, setEditingDoorIndex] = useState<number | null>(null);
  const [editingDoorKitchenIndex, setEditingDoorKitchenIndex] = useState<number | null>(null);

  const [currentStep, setCurrentStep] = useState<BuilderStep>('customer');
  const [highestVisitedStep, setHighestVisitedStep] = useState(isEditMode ? 3 : 0);

  useEffect(() => {
    const steps: BuilderStep[] = ['customer', 'kitchens', 'products', 'review'];
    const idx = steps.indexOf(currentStep);
    setHighestVisitedStep(prev => Math.max(prev, idx));
  }, [currentStep]);

  const [customerKitchenTypes, setCustomerKitchenTypes] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const initialFormDataRef = useRef<string | null>(null);
  const skipNavigationBlockRef = useRef(false);
  const [formData, setFormData] = useState<Partial<QuotationFormData>>({
    customerId: 0,
    projectName: '',
    transportationPrice: 0,
    installationPrice: 0,
    marginPercentage: 20, // Global (kept for backward compatibility)
    taxPercentage: 18, // Global (kept for backward compatibility)
    // Category-specific rates (will be loaded from system settings)
    accessoriesMarginPercentage: 20,
    cabinetsMarginPercentage: 20,
    doorsMarginPercentage: 20,
    lightingMarginPercentage: 20,
    accessoriesTaxPercentage: 18,
    cabinetsTaxPercentage: 18,
    doorsTaxPercentage: 18,
    lightingTaxPercentage: 18,
    miscellaneousMarginPercentage: 0,
    miscellaneousTaxPercentage: 18,
    // Per-category MRP (list price) rates (default to the offer values)
    accessoriesMrpMarginPercentage: 20,
    cabinetsMrpMarginPercentage: 20,
    doorsMrpMarginPercentage: 20,
    lightingMrpMarginPercentage: 20,
    accessoriesMrpTaxPercentage: 18,
    cabinetsMrpTaxPercentage: 18,
    doorsMrpTaxPercentage: 18,
    lightingMrpTaxPercentage: 18,
    miscellaneousMrpMarginPercentage: 0,
    miscellaneousMrpTaxPercentage: 18,
    validUntil: '',
    notes: '',
    termsConditions: DEFAULT_TERMS_CONDITIONS,
    warrantyAndService: DEFAULT_WARRANTY_SERVICE,
    accessories: [],
    cabinets: [],
    doors: [],
    lighting: [],
    otherExpenses: [
      { name: 'Transportation', amount: 0, isDefault: true },
      { name: 'Installation', amount: 0, isDefault: true },
    ],
    kitchens: [],
    importantNote: 'THIS QUOTE IS ONLY FOR THE ITEMS MENTIONED IN THIS OFFER. ANY OTHER ITEMS OR APPLIANCES LIKE HOB, HOOD, FRIDGE, OVEN ETC ARE EXCLUDED FROM THIS QUOTE. THE QUOTE FOR THOSE ITEMS ARE GIVEN SEPARATELY. VALIDITY OF THIS QUOTE IS ONLY FOR 30 DAYS. THERE WILL BE REVISION OF PRICES IN EVERY 30 DAYS AS PER MARKET COST FLUCTUATIONS.',
    paymentAcceptancePct: 60,
    paymentDeliveryPct: 30,
    paymentInstallationPct: 10,
  });

  // Load margins from system settings on mount (only for new quotations, not when editing)
  useEffect(() => {
    if (!isEditMode && marginsResponse?.data) {
      setFormData((prev) => ({
        ...prev,
        accessoriesMarginPercentage: marginsResponse.data.accessories,
        cabinetsMarginPercentage: marginsResponse.data.cabinets,
        doorsMarginPercentage: marginsResponse.data.doors,
        lightingMarginPercentage: marginsResponse.data.lighting,
        miscellaneousMarginPercentage: marginsResponse.data.miscellaneous ?? 0,
      }));
    }
  }, [marginsResponse, isEditMode]);

  // Load existing quotation when editing
  const quotationId = isEditMode ? Number(id) : undefined;
  const { data: existingQuotation } = useGetQuotationByIdQuery(quotationId as number, { skip: !isEditMode });

  useEffect(() => {
    if (!isEditMode || !existingQuotation) return;

    // Helper: pair cabinets with linked doors via _tempPairId
    const pairCabinetsAndDoors = (rawCabinets: any[], rawDoors: any[]) => {
      const cabinets = rawCabinets.map((c: any) => ({
        cabinetTypeId: c.cabinetTypeId || c.id,
        widthMm: c.widthMm,
        heightMm: c.heightMm,
        depthMm: c.depthMm,
        calculatedSqft: c.calculatedSqft,
        customDimensions: c.customDimensions,
        quantity: c.quantity,
        unitPrice: Number(c.unitPrice || 0),
        totalPrice: Number(c.unitPrice || 0) * (c.quantity || 1),
        cabinetTypeName: c.cabinetTypeName || c.cabinetType?.name || c.description || 'Cabinet',
        description: c.description || `${c.cabinetTypeName || c.cabinetType?.name || 'Cabinet'} (${c.widthMm}×${c.depthMm}×${c.heightMm}mm)`,
        materialId: c.materialId,
        materialName: c.materialName,
        materialRate: c.materialRate,
        materialCalculationType: c.materialCalculationType,
        lightingCost: c.lightingCost,
        accessoriesCost: c.accessoriesCost,
        innerPanelTypeId: c.innerPanelTypeId,
        innerPanelTypeName: c.innerPanelTypeName,
        innerPanelRate: c.innerPanelRate,
        innerPanelMultiplier: c.innerPanelMultiplier,
        innerPanelCost: c.innerPanelCost,
        innerPanelQuantity: c.innerPanelQuantity,
        linkedDoorTypeId: c.linkedDoorTypeId || null,
        linkedDoor: c.linkedDoorTypeId ? {
          doorTypeId: c.linkedDoorTypeId,
          doorTypeName: c.linkedDoorTypeName,
        } : undefined,
      }));
      const doors = rawDoors.map((d: any) => {
        // Door unitPrice is per-sqft rate, so totalPrice must use face area = (W × H) / 92903
        // (92903 mm² = 1 sqft). Must match the backend so the review total equals the saved/PDF total.
        const faceArea = d.widthMm && d.heightMm ? (d.widthMm * d.heightMm) / 92903 : 1;
        return {
          doorTypeId: d.doorTypeId || d.id,
          widthMm: d.widthMm,
          heightMm: d.heightMm,
          calculatedSqft: d.calculatedSqft,
          customDimensions: d.customDimensions,
          quantity: d.quantity,
          unitPrice: Number(d.unitPrice || 0),
          totalPrice: faceArea * Number(d.unitPrice || 0) * (d.quantity || 1),
          doorTypeName: d.doorType?.name || d.description || 'Door',
          description: d.description || `${d.doorType?.name || 'Door'} (${d.widthMm}×${d.heightMm}mm)`,
        };
      });
      // Establish _tempPairId links between cabinets and their linked doors.
      // A linked door is always sized to its cabinet, so prefer a door of the same type AND the
      // cabinet's dimensions; only fall back to the first unpaired door of that type. This avoids
      // grabbing a STANDALONE door of the same type (which would then get shrunk to the cabinet
      // size when the cabinet is edited). Only pair the cabinet when a door is actually matched.
      cabinets.forEach((cab: any) => {
        if (!cab.linkedDoorTypeId) return;
        const match =
          doors.find((d: any) => d.doorTypeId === cab.linkedDoorTypeId && !(d as any)._tempPairId
            && d.widthMm === cab.widthMm && d.heightMm === cab.heightMm) ||
          doors.find((d: any) => d.doorTypeId === cab.linkedDoorTypeId && !(d as any)._tempPairId);
        if (match) {
          const pairId = Date.now() + Math.random();
          cab._tempPairId = pairId;
          (match as any)._tempPairId = pairId;
        }
      });
      return { cabinets, doors };
    };

    const globalPaired = pairCabinetsAndDoors(existingQuotation.cabinets || [], existingQuotation.doors || []);

    // Build otherExpenses from backend data.
    // forKitchen=true: transportation is a quotation-level common charge, never per-kitchen,
    // so it is excluded and an Installation default is ensured.
    const buildOtherExpenses = (
      transportPrice: number,
      installPrice: number,
      backendExpenses?: any[],
      forKitchen: boolean = false
    ): QuotationOtherExpense[] => {
      if (backendExpenses && backendExpenses.length > 0) {
        let mapped: QuotationOtherExpense[] = backendExpenses.map((e: any) => ({
          id: e.id,
          name: e.name,
          amount: Number(e.amount || 0),
          isDefault: e.isDefault ?? false,
        }));
        if (forKitchen) {
          mapped = mapped.filter((e) => e.name !== 'Transportation');
          if (!mapped.some((e) => e.name === 'Installation')) {
            mapped.unshift({ name: 'Installation', amount: installPrice, isDefault: true });
          }
        }
        return mapped;
      }
      // Fallback: build from scalar prices
      if (forKitchen) {
        return [{ name: 'Installation', amount: installPrice, isDefault: true }];
      }
      return [
        { name: 'Transportation', amount: transportPrice, isDefault: true },
        { name: 'Installation', amount: installPrice, isDefault: true },
      ];
    };

    // Common (quotation-level) transportation seed. Prefer the quotation-level value; if it is 0
    // (e.g. legacy multi-kitchen data where transportation was stored per kitchen), fall back to the
    // largest per-kitchen transportation so the value is not silently lost on load.
    const commonTransportSeed = Number(existingQuotation.transportationPrice || 0) > 0
      ? Number(existingQuotation.transportationPrice)
      : (existingQuotation.kitchens || []).reduce(
          (max: number, k: any) => Math.max(max, Number(k.transportationPrice || 0)),
          0
        );

    // Map API quotation to builder form shape
    setFormData({
      customerId: existingQuotation.customerId,
      projectName: existingQuotation.projectName || '',
      transportationPrice: Number(existingQuotation.transportationPrice || 0),
      installationPrice: Number(existingQuotation.installationPrice || 0),
      marginPercentage: Number(existingQuotation.marginPercentage || 0),
      taxPercentage: Number(existingQuotation.taxPercentage || 0),
      accessoriesMarginPercentage: Number(existingQuotation.accessoriesMarginPercentage ?? 20),
      cabinetsMarginPercentage: Number(existingQuotation.cabinetsMarginPercentage ?? 20),
      doorsMarginPercentage: Number(existingQuotation.doorsMarginPercentage ?? 20),
      lightingMarginPercentage: Number(existingQuotation.lightingMarginPercentage ?? 20),
      accessoriesTaxPercentage: Number(existingQuotation.accessoriesTaxPercentage ?? 18),
      cabinetsTaxPercentage: Number(existingQuotation.cabinetsTaxPercentage ?? 18),
      doorsTaxPercentage: Number(existingQuotation.doorsTaxPercentage ?? 18),
      lightingTaxPercentage: Number(existingQuotation.lightingTaxPercentage ?? 18),
      miscellaneousMarginPercentage: Number(existingQuotation.miscellaneousMarginPercentage ?? 0),
      miscellaneousTaxPercentage: Number(existingQuotation.miscellaneousTaxPercentage ?? 18),
      // Per-category MRP (list price) rates — fall back to the matching offer value
      accessoriesMrpMarginPercentage: Number(existingQuotation.accessoriesMrpMarginPercentage ?? existingQuotation.accessoriesMarginPercentage ?? 20),
      cabinetsMrpMarginPercentage: Number(existingQuotation.cabinetsMrpMarginPercentage ?? existingQuotation.cabinetsMarginPercentage ?? 20),
      doorsMrpMarginPercentage: Number(existingQuotation.doorsMrpMarginPercentage ?? existingQuotation.doorsMarginPercentage ?? 20),
      lightingMrpMarginPercentage: Number(existingQuotation.lightingMrpMarginPercentage ?? existingQuotation.lightingMarginPercentage ?? 20),
      accessoriesMrpTaxPercentage: Number(existingQuotation.accessoriesMrpTaxPercentage ?? existingQuotation.accessoriesTaxPercentage ?? 18),
      cabinetsMrpTaxPercentage: Number(existingQuotation.cabinetsMrpTaxPercentage ?? existingQuotation.cabinetsTaxPercentage ?? 18),
      doorsMrpTaxPercentage: Number(existingQuotation.doorsMrpTaxPercentage ?? existingQuotation.doorsTaxPercentage ?? 18),
      lightingMrpTaxPercentage: Number(existingQuotation.lightingMrpTaxPercentage ?? existingQuotation.lightingTaxPercentage ?? 18),
      miscellaneousMrpMarginPercentage: Number(existingQuotation.miscellaneousMrpMarginPercentage ?? existingQuotation.miscellaneousMarginPercentage ?? 0),
      miscellaneousMrpTaxPercentage: Number(existingQuotation.miscellaneousMrpTaxPercentage ?? existingQuotation.miscellaneousTaxPercentage ?? 18),
      // If the saved validity date has already passed (quotes are valid 30 days), re-issue
      // with a fresh 30-day validity so editing an old quotation isn't blocked by the
      // "Validity date must be in the future" check. The user can still change the date.
      validUntil: (() => {
        const saved = existingQuotation.validUntil || '';
        if (!saved) return '';
        const savedDate = new Date(saved);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (savedDate < today) {
          const fresh = new Date();
          fresh.setDate(fresh.getDate() + 30);
          return fresh.toISOString().split('T')[0];
        }
        return saved;
      })(),
      notes: existingQuotation.notes || '',
      termsConditions: existingQuotation.termsConditions || DEFAULT_TERMS_CONDITIONS,
      warrantyAndService: existingQuotation.warrantyAndService || DEFAULT_WARRANTY_SERVICE,
      importantNote: existingQuotation.importantNote || 'THIS QUOTE IS ONLY FOR THE ITEMS MENTIONED IN THIS OFFER. ANY OTHER ITEMS OR APPLIANCES LIKE HOB, HOOD, FRIDGE, OVEN ETC ARE EXCLUDED FROM THIS QUOTE. THE QUOTE FOR THOSE ITEMS ARE GIVEN SEPARATELY. VALIDITY OF THIS QUOTE IS ONLY FOR 30 DAYS. THERE WILL BE REVISION OF PRICES IN EVERY 30 DAYS AS PER MARKET COST FLUCTUATIONS.',
      paymentAcceptancePct: Number(existingQuotation.paymentAcceptancePct || 60),
      paymentDeliveryPct: Number(existingQuotation.paymentDeliveryPct || 30),
      paymentInstallationPct: Number(existingQuotation.paymentInstallationPct || 10),
      accessories: mergeDuplicateAccessories((existingQuotation.accessories || []).map(mapLoadedAccessory)),
      cabinets: globalPaired.cabinets,
      doors: globalPaired.doors,
      kitchens: (existingQuotation.kitchens || []).map((k: any) => ({
        kitchenName: k.kitchenName || 'Kitchen',
        kitchenOrder: k.kitchenOrder || 0,
        transportationPrice: Number(k.transportationPrice || 0),
        installationPrice: Number(k.installationPrice || 0),
        scopeDetails: [
          // Include predefined fields
          ...SCOPE_FIELD_NAMES.map((fieldName, index) => {
            const existing = (k.scopeDetails || []).find((sd: any) => sd.fieldName === fieldName);
            return {
              fieldName,
              fieldValue: existing?.fieldValue || '',
              fieldOrder: index,
            };
          }),
          // Include custom fields (fields not in SCOPE_FIELD_NAMES)
          ...(k.scopeDetails || [])
            .filter((sd: any) => !SCOPE_FIELD_NAMES.includes(sd.fieldName))
            .map((sd: any, index: number) => ({
              fieldName: sd.fieldName,
              fieldValue: sd.fieldValue || '',
              fieldOrder: SCOPE_FIELD_NAMES.length + index,
            })),
        ],
        planImages: (k.planImages || []).map((pi: any) => ({
          imageName: pi.imageName || '',
          imageUrl: pi.imageUrl || '',
          imageOrder: pi.imageOrder || 0,
          customerPlanImageId: pi.customerPlanImageId,
          designPhaseFileId: pi.designPhaseFileId,
        })),
        accessories: mergeDuplicateAccessories((k.accessories || []).map(mapLoadedAccessory)),
        ...(() => {
          const paired = pairCabinetsAndDoors(k.cabinets || [], k.doors || []);
          return { cabinets: paired.cabinets, doors: paired.doors };
        })(),
        lighting: (k.lighting || []).map((l: any) => {
          const itemType = l.itemType || 'LIGHT_PROFILE';
          let displayName = l.itemName || l.description || 'Lighting Item';
          return {
            id: l.itemId || l.id,
            quantity: l.quantity,
            unitPrice: Number(l.unitPrice || 0),
            // Use unitPrice × quantity as base (backend totalPrice includes margin+tax)
            totalPrice: Number(l.unitPrice || 0) * (l.quantity || 1),
            name: displayName,
            description: displayName,
            itemType: itemType,
          };
        }),
        otherExpenses: buildOtherExpenses(
          0,
          Number(k.installationPrice || 0),
          k.otherExpenses,
          true
        ),
      })),
      lighting: (existingQuotation.lighting || []).map((l: any) => {
        // Try to reconstruct the itemType from the description or fallback to itemType
        const itemType = l.itemType || 'LIGHT_PROFILE';
        // Use itemName from backend (e.g., "Driver - 20W", "Light Profile - Type A")
        // Fall back to description if itemName is not available
        let displayName = l.itemName || l.description || 'Lighting Item';

        return {
          id: l.itemId || l.id,
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice || 0),
          // Use unitPrice × quantity as base (backend totalPrice includes margin+tax)
          totalPrice: Number(l.unitPrice || 0) * (l.quantity || 1),
          name: displayName,
          description: displayName,
          itemType: itemType,
        };
      }),
      otherExpenses: buildOtherExpenses(
        commonTransportSeed,
        Number(existingQuotation.installationPrice || 0),
        existingQuotation.otherExpenses
      ),
    });
  }, [isEditMode, existingQuotation]);

  // Track initial form data for dirty state detection
  useEffect(() => {
    // Only set initial snapshot after margins are loaded (for new) or quotation is loaded (for edit)
    if (!isEditMode && marginsResponse?.data && initialFormDataRef.current === null) {
      // Small delay to let margins apply to formData
      const timer = setTimeout(() => {
        initialFormDataRef.current = JSON.stringify(formData);
      }, 100);
      return () => clearTimeout(timer);
    } else if (isEditMode && existingQuotation && initialFormDataRef.current === null) {
      // For edit mode, snapshot after quotation is loaded
      const timer = setTimeout(() => {
        initialFormDataRef.current = JSON.stringify(formData);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [marginsResponse, existingQuotation, isEditMode, formData]);

  // Track dirty state
  useEffect(() => {
    if (initialFormDataRef.current !== null) {
      const currentFormData = JSON.stringify(formData);
      setIsDirty(currentFormData !== initialFormDataRef.current);
    }
  }, [formData]);

  // Browser navigation protection (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // React Router navigation blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !skipNavigationBlockRef.current && isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // API mutations
  const [createQuotation, { isLoading: isCreating }] = useCreateQuotationMutation();
  const [updateQuotation, { isLoading: isUpdating }] = useUpdateQuotationMutation();

  // Fetch customer details for preview
  const { data: customersData } = useGetCustomersPageQuery({
    page: 0,
    size: 1000,
  });

  const selectedCustomer = customersData?.content?.find(
    (c) => c.id === formData.customerId
  );

  // Calculate products subtotal
  const productsSubtotal =
    [...(formData.accessories || []), ...(formData.cabinets || []), ...(formData.doors || []), ...(formData.lighting || [])].reduce(
      (sum, item) => sum + (item.totalPrice ?? item.price ?? 0),
      0
    );

  // Helper function to convert form data to API request format
  const convertFormDataToRequest = (isDraft: boolean): CreateQuotationRequest => {
    const hasKitchens = (formData.kitchens?.length || 0) > 0;
    // Transportation is a single COMMON charge for the whole quotation only when there are 2+
    // kitchens. With a single kitchen it is carried on that kitchen (same as legacy), and with no
    // kitchens it stays at the quotation level (legacy).
    const isMultiKitchen = (formData.kitchens?.length || 0) >= 2;
    // Extract transportation/installation from otherExpenses for backward compat
    const globalExpenses = formData.otherExpenses || [];
    const transportFromExpenses = globalExpenses.find(e => e.name === 'Transportation')?.amount || 0;
    const installFromExpenses = globalExpenses.find(e => e.name === 'Installation')?.amount || 0;
    return {
      customerId: formData.customerId || 0,
      projectName: formData.projectName || undefined,
      // Common transportation lives at the quotation level only for multi-kitchen (2+). For a single
      // kitchen it is sent on the kitchen (below); for no kitchens it is the legacy quotation value.
      transportationPrice: isMultiKitchen ? transportFromExpenses : (hasKitchens ? 0 : transportFromExpenses),
      installationPrice: hasKitchens ? 0 : installFromExpenses,
      marginPercentage: formData.marginPercentage || 0, // Global (backward compatibility)
      taxPercentage: formData.taxPercentage || 0, // Global (backward compatibility)
      // Category-specific rates
      accessoriesMarginPercentage: formData.accessoriesMarginPercentage ?? 20,
      cabinetsMarginPercentage: formData.cabinetsMarginPercentage ?? 20,
      doorsMarginPercentage: formData.doorsMarginPercentage ?? 20,
      lightingMarginPercentage: formData.lightingMarginPercentage ?? 20,
      accessoriesTaxPercentage: formData.accessoriesTaxPercentage ?? 18,
      cabinetsTaxPercentage: formData.cabinetsTaxPercentage ?? 18,
      doorsTaxPercentage: formData.doorsTaxPercentage ?? 18,
      lightingTaxPercentage: formData.lightingTaxPercentage ?? 18,
      miscellaneousMarginPercentage: formData.miscellaneousMarginPercentage ?? 0,
      miscellaneousTaxPercentage: formData.miscellaneousTaxPercentage ?? 18,
      // Per-category MRP (list price) rates
      accessoriesMrpMarginPercentage: formData.accessoriesMrpMarginPercentage ?? 20,
      cabinetsMrpMarginPercentage: formData.cabinetsMrpMarginPercentage ?? 20,
      doorsMrpMarginPercentage: formData.doorsMrpMarginPercentage ?? 20,
      lightingMrpMarginPercentage: formData.lightingMrpMarginPercentage ?? 20,
      accessoriesMrpTaxPercentage: formData.accessoriesMrpTaxPercentage ?? 18,
      cabinetsMrpTaxPercentage: formData.cabinetsMrpTaxPercentage ?? 18,
      doorsMrpTaxPercentage: formData.doorsMrpTaxPercentage ?? 18,
      lightingMrpTaxPercentage: formData.lightingMrpTaxPercentage ?? 18,
      miscellaneousMrpMarginPercentage: formData.miscellaneousMrpMarginPercentage ?? 0,
      miscellaneousMrpTaxPercentage: formData.miscellaneousMrpTaxPercentage ?? 18,
      validUntil: formData.validUntil || undefined,
      notes: formData.notes || undefined,
      termsConditions: formData.termsConditions || undefined,
      warrantyAndService: formData.warrantyAndService || undefined,
      importantNote: formData.importantNote || undefined,
      paymentAcceptancePct: formData.paymentAcceptancePct ?? 60,
      paymentDeliveryPct: formData.paymentDeliveryPct ?? 30,
      paymentInstallationPct: formData.paymentInstallationPct ?? 10,
      // When kitchens exist, ALL products live inside the kitchens. Sending the (loaded)
      // top-level lists too made the backend store a second, kitchen-less copy of every
      // item on each save — quotations ballooned to thousands of junk rows and every
      // load/save got slower ("becomes still lag"). Same rule as otherExpenses below.
      accessories: hasKitchens ? [] : (formData.accessories || []).map((item: any) => ({
        accessoryId: item.id,
        quantity: item.quantity || 1,
        unitPrice: item.price || 0,
        totalPrice: item.totalPrice || item.price || 0,
        description: item.name,
        elevationId: item.elevationId,
        elevationName: item.elevationName,
      })) as QuotationAccessory[],
      cabinets: hasKitchens ? [] : (formData.cabinets || []).map((item: any) => ({
        cabinetTypeId: item.cabinetTypeId || item.id,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.price || 0,
        totalPrice: item.totalPrice || item.price || 0,
        description: item.cabinetTypeName || item.name,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        depthMm: item.depthMm,
        calculatedSqft: item.calculatedSqft || item.surfaceArea,
        customDimensions: item.customDimensions,
        // Material, lighting, and accessories fields
        materialId: item.materialId,
        materialName: item.materialName,
        materialRate: item.materialRate,
        materialCalculationType: item.materialCalculationType,
        lightingCost: item.lightingCost,
        accessoriesCost: item.accessoriesCost,
        // Inner panel fields
        innerPanelTypeId: item.innerPanelTypeId,
        innerPanelTypeName: item.innerPanelTypeName,
        innerPanelRate: item.innerPanelRate,
        innerPanelMultiplier: item.innerPanelMultiplier,
        innerPanelCost: item.innerPanelCost,
        innerPanelQuantity: item.innerPanelQuantity,
        // Linked door type
        linkedDoorTypeId: item.linkedDoor?.doorTypeId || null,
      })) as QuotationCabinet[],
      doors: hasKitchens ? [] : (formData.doors || []).map((item: any) => ({
        doorTypeId: item.doorTypeId || item.id,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.price || 0,
        totalPrice: item.totalPrice || item.price || 0,
        description: item.doorTypeName || item.name,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        calculatedSqft: item.calculatedSqft,
        customDimensions: item.customDimensions,
      })) as QuotationDoor[],
      lighting: hasKitchens ? [] : (formData.lighting || []).map((item: any) => ({
        itemType: (item.itemType || 'LIGHT_PROFILE') as any,
        itemId: item.id || 0,
        quantity: item.quantity || 1,
        unitPrice: item.price || item.unitPrice || 0,
        totalPrice: item.totalPrice || item.price || 0,
        description: item.name || item.description || 'Lighting Item',
      })) as QuotationLighting[],
      otherExpenses: hasKitchens ? [] : (formData.otherExpenses || []).filter(e => e.amount > 0 || e.isDefault),
      kitchens: (formData.kitchens || []).map((kitchen: QuotationKitchenFormData) => {
        const kitchenExpenses = kitchen.otherExpenses || [];
        const kitchenInstall = kitchenExpenses.find(e => e.name === 'Installation')?.amount || 0;
        // Multi-kitchen (2+): transportation is common at the quotation level, so it is 0 per kitchen.
        // Single kitchen: the common transportation value is carried on the kitchen.
        const kitchenTransport = isMultiKitchen ? 0 : transportFromExpenses;
        return {
        kitchenName: kitchen.kitchenName,
        kitchenOrder: kitchen.kitchenOrder,
        transportationPrice: kitchenTransport,
        installationPrice: kitchenInstall,
        scopeDetails: kitchen.scopeDetails.map((sd) => ({
          fieldName: sd.fieldName,
          fieldValue: sd.fieldValue,
          fieldOrder: sd.fieldOrder,
        })),
        planImages: kitchen.planImages.map((pi) => ({
          imageName: pi.imageName,
          imageUrl: pi.imageUrl,
          imageOrder: pi.imageOrder,
          customerPlanImageId: pi.customerPlanImageId,
          designPhaseFileId: pi.designPhaseFileId,
        })),
        accessories: kitchen.accessories.map((item: any) => ({
          accessoryId: item.id,
          quantity: item.quantity || 1,
          unitPrice: item.price || item.unitPrice || 0,
          totalPrice: item.totalPrice || item.price || 0,
          description: item.name,
          elevationId: item.elevationId,
          elevationName: item.elevationName,
        })),
        cabinets: kitchen.cabinets.map((item: any) => ({
          cabinetTypeId: item.cabinetTypeId || item.id,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.price || 0,
          totalPrice: item.totalPrice || item.price || 0,
          description: item.cabinetTypeName || item.name,
          widthMm: item.widthMm,
          heightMm: item.heightMm,
          depthMm: item.depthMm,
          calculatedSqft: item.calculatedSqft || item.surfaceArea,
          customDimensions: item.customDimensions,
          // Material, lighting, and accessories fields
          materialId: item.materialId,
          materialName: item.materialName,
          materialRate: item.materialRate,
          materialCalculationType: item.materialCalculationType,
          lightingCost: item.lightingCost,
          accessoriesCost: item.accessoriesCost,
          // Inner panel fields
          innerPanelTypeId: item.innerPanelTypeId,
          innerPanelTypeName: item.innerPanelTypeName,
          innerPanelRate: item.innerPanelRate,
          innerPanelMultiplier: item.innerPanelMultiplier,
          innerPanelCost: item.innerPanelCost,
          innerPanelQuantity: item.innerPanelQuantity,
          // Linked door type
          linkedDoorTypeId: item.linkedDoorTypeId || item.linkedDoor?.doorTypeId || null,
        })),
        doors: kitchen.doors.map((item: any) => ({
          doorTypeId: item.doorTypeId || item.id,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.price || 0,
          totalPrice: item.totalPrice || item.price || 0,
          description: item.doorTypeName || item.name,
          widthMm: item.widthMm,
          heightMm: item.heightMm,
          calculatedSqft: item.calculatedSqft,
          customDimensions: item.customDimensions,
        })),
        lighting: kitchen.lighting.map((item: any) => ({
          itemType: (item.itemType || 'LIGHT_PROFILE') as any,
          itemId: item.id || 0,
          quantity: item.quantity || 1,
          unitPrice: item.price || item.unitPrice || 0,
          totalPrice: item.totalPrice || item.price || 0,
          description: item.name || item.description || 'Lighting Item',
        })),
        otherExpenses: (() => {
          const base = kitchenExpenses
            .filter(e => e.name !== 'Transportation')
            .filter(e => e.amount > 0 || e.isDefault);
          // Single kitchen: surface the common transportation as a line item so it appears in the
          // kitchen's MISCELLANEOUS section of the PDF (multi-kitchen shows it in the grand summary).
          if (!isMultiKitchen && kitchenTransport > 0) {
            return [{ name: 'Transportation', amount: kitchenTransport, isDefault: true }, ...base];
          }
          return base;
        })(),
      };
      }),
    };
  };

  // Validate form data
  const validateFormData = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.customerId) {
      errors.push('Please select a customer');
    }

    // Check for products - either in kitchens or globally (backward compatibility)
    const hasKitchens = formData.kitchens && formData.kitchens.length > 0;
    
    let hasProducts = false;
    
    if (hasKitchens) {
      // Check if at least one kitchen has at least one product
      hasProducts = formData.kitchens.some((kitchen) => {
        const kitchenHasProducts =
          (kitchen.accessories?.length || 0) > 0 ||
          (kitchen.cabinets?.length || 0) > 0 ||
          (kitchen.doors?.length || 0) > 0 ||
          (kitchen.lighting?.length || 0) > 0;
        return kitchenHasProducts;
      });
    } else {
      // Backward compatibility: check global product arrays
      hasProducts =
        (formData.accessories?.length || 0) > 0 ||
        (formData.cabinets?.length || 0) > 0 ||
        (formData.doors?.length || 0) > 0 ||
        (formData.lighting?.length || 0) > 0;
    }

    if (!hasProducts) {
      errors.push('Please add at least one product');
    }

    if (formData.validUntil) {
      const validDate = new Date(formData.validUntil);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (validDate < today) {
        errors.push('Validity date must be in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Handle edit cabinet from SelectedProductsList (kitchen-specific)
  const handleEditCabinetInKitchen = (kitchenIndex: number, cabinetIndex: number) => {
    const kitchen = formData.kitchens?.[kitchenIndex];
    const cabinet = kitchen?.cabinets?.[cabinetIndex];
    if (cabinet) {
      setEditingCabinetData(cabinet as CabinetWithDimensions);
      setEditingCabinetIndex(cabinetIndex);
      setEditingKitchenIndex(kitchenIndex);
      setEditCabinetModalOpen(true);
    }
  };

  // Handle edit cabinet from SelectedProductsList (global)
  const handleEditCabinetGlobal = (cabinetIndex: number) => {
    const cabinet = formData.cabinets?.[cabinetIndex];
    if (cabinet) {
      setEditingCabinetData(cabinet as CabinetWithDimensions);
      setEditingCabinetIndex(cabinetIndex);
      setEditingKitchenIndex(null);
      setEditCabinetModalOpen(true);
    }
  };

  // Handle cabinet update from edit modal
  const handleCabinetUpdate = (data: CabinetWithDimensions, editIndex?: number) => {
    if (editIndex === undefined) return;

    if (editingKitchenIndex !== null) {
      // Update in kitchen-specific list
      const updatedKitchens = [...(formData.kitchens || [])];
      const kitchen = { ...updatedKitchens[editingKitchenIndex] };
      const cabinets = [...(kitchen.cabinets || [])];
      const oldCabinet = cabinets[editIndex] as any;
      const oldPairId = oldCabinet?._tempPairId;

      // Sync linked door changes
      let doors = [...(kitchen.doors || [])];
      if (oldPairId) {
        if (!data.linkedDoor) {
          // Door was unticked: remove the paired door
          doors = doors.filter((d: any) => d._tempPairId !== oldPairId);
        } else {
          // Door still exists: update paired door data
          doors = doors.map((d: any) => {
            if (d._tempPairId !== oldPairId) return d;
            const doorArea = data.linkedDoor!.faceArea || 0;
            const doorPrice = data.linkedDoor!.doorType?.companyPrice || 0;
            return {
              ...d,
              doorTypeId: data.linkedDoor!.doorTypeId,
              doorTypeName: data.linkedDoor!.doorType?.name,
              brandName: data.linkedDoor!.doorType?.brandName,
              material: data.linkedDoor!.doorType?.material,
              widthMm: data.linkedDoor!.widthMm,
              heightMm: data.linkedDoor!.heightMm,
              quantity: data.linkedDoor!.quantity,
              unitPrice: doorPrice,
              totalPrice: doorArea * doorPrice * data.linkedDoor!.quantity,
              description: `${data.linkedDoor!.doorType?.name} (${data.linkedDoor!.widthMm}×${data.linkedDoor!.heightMm}mm)`,
            };
          });
        }
      } else if (data.linkedDoor) {
        // Door was newly added: create paired door
        const pairId = Date.now() + Math.random();
        (data as any)._tempPairId = pairId;
        const doorArea = data.linkedDoor.faceArea || 0;
        const doorPrice = data.linkedDoor.doorType?.companyPrice || 0;
        doors.push({
          doorTypeId: data.linkedDoor.doorTypeId,
          doorTypeName: data.linkedDoor.doorType?.name,
          brandName: data.linkedDoor.doorType?.brandName,
          material: data.linkedDoor.doorType?.material,
          widthMm: data.linkedDoor.widthMm,
          heightMm: data.linkedDoor.heightMm,
          quantity: data.linkedDoor.quantity,
          unitPrice: doorPrice,
          totalPrice: doorArea * doorPrice * data.linkedDoor.quantity,
          customDimensions: true,
          description: `${data.linkedDoor.doorType?.name} (${data.linkedDoor.widthMm}×${data.linkedDoor.heightMm}mm)`,
          elevationId: data.elevationId,
          elevationName: data.elevationName,
          _tempPairId: pairId,
        } as any);
      }

      // Preserve _tempPairId on updated cabinet
      if (oldPairId && data.linkedDoor) {
        (data as any)._tempPairId = oldPairId;
      }

      cabinets[editIndex] = data;
      kitchen.cabinets = cabinets;
      kitchen.doors = doors;
      updatedKitchens[editingKitchenIndex] = kitchen;
      setFormData({ ...formData, kitchens: updatedKitchens });
    } else {
      // Update in global list
      const cabinets = [...(formData.cabinets || [])];
      const oldCabinet = cabinets[editIndex] as any;
      const oldPairId = oldCabinet?._tempPairId;

      // Sync linked door changes
      let doors = [...(formData.doors || [])];
      if (oldPairId) {
        if (!data.linkedDoor) {
          // Door was unticked: remove the paired door
          doors = doors.filter((d: any) => d._tempPairId !== oldPairId);
        } else {
          // Door still exists: update paired door data
          doors = doors.map((d: any) => {
            if (d._tempPairId !== oldPairId) return d;
            const doorArea = data.linkedDoor!.faceArea || 0;
            const doorPrice = data.linkedDoor!.doorType?.companyPrice || 0;
            return {
              ...d,
              doorTypeId: data.linkedDoor!.doorTypeId,
              doorTypeName: data.linkedDoor!.doorType?.name,
              brandName: data.linkedDoor!.doorType?.brandName,
              material: data.linkedDoor!.doorType?.material,
              widthMm: data.linkedDoor!.widthMm,
              heightMm: data.linkedDoor!.heightMm,
              quantity: data.linkedDoor!.quantity,
              unitPrice: doorPrice,
              totalPrice: doorArea * doorPrice * data.linkedDoor!.quantity,
              description: `${data.linkedDoor!.doorType?.name} (${data.linkedDoor!.widthMm}×${data.linkedDoor!.heightMm}mm)`,
            };
          });
        }
      } else if (data.linkedDoor) {
        // Door was newly added: create paired door
        const pairId = Date.now() + Math.random();
        (data as any)._tempPairId = pairId;
        const doorArea = data.linkedDoor.faceArea || 0;
        const doorPrice = data.linkedDoor.doorType?.companyPrice || 0;
        doors.push({
          doorTypeId: data.linkedDoor.doorTypeId,
          doorTypeName: data.linkedDoor.doorType?.name,
          brandName: data.linkedDoor.doorType?.brandName,
          material: data.linkedDoor.doorType?.material,
          widthMm: data.linkedDoor.widthMm,
          heightMm: data.linkedDoor.heightMm,
          quantity: data.linkedDoor.quantity,
          unitPrice: doorPrice,
          totalPrice: doorArea * doorPrice * data.linkedDoor.quantity,
          customDimensions: true,
          description: `${data.linkedDoor.doorType?.name} (${data.linkedDoor.widthMm}×${data.linkedDoor.heightMm}mm)`,
          elevationId: data.elevationId,
          elevationName: data.elevationName,
          _tempPairId: pairId,
        } as any);
      }

      // Preserve _tempPairId on updated cabinet
      if (oldPairId && data.linkedDoor) {
        (data as any)._tempPairId = oldPairId;
      }

      cabinets[editIndex] = data;
      setFormData({ ...formData, cabinets, doors });
    }

    // Reset edit state
    setEditCabinetModalOpen(false);
    setEditingCabinetData(null);
    setEditingCabinetIndex(null);
    setEditingKitchenIndex(null);
  };

  // Close any removal confirmation without removing anything.
  const cancelRemoval = () => {
    setPendingRemoval(null);
    setShowLinkedDoorRemoveDialog(false);
    setShowRemoveItemDialog(false);
  };

  // Perform the pending removal (product or other-expense, kitchen or global).
  // removeDoorToo additionally removes a cabinet's linked door.
  const performRemoval = (removeDoorToo: boolean = false) => {
    if (!pendingRemoval) return;
    const { scope, category, index, kitchenIndex, linkedDoorIndex } = pendingRemoval;

    if (kitchenIndex !== undefined) {
      // Kitchen-specific removal
      const updatedKitchens = [...(formData.kitchens || [])];
      const kitchen: any = { ...updatedKitchens[kitchenIndex] };
      if (scope === 'otherExpense') {
        const expenses = [...(kitchen.otherExpenses || [])];
        expenses.splice(index, 1);
        kitchen.otherExpenses = expenses;
      } else if (category) {
        const list = [...((kitchen[category] as any[]) || [])];
        list.splice(index, 1);
        kitchen[category] = list;
        if (removeDoorToo && linkedDoorIndex !== undefined && Array.isArray(kitchen.doors)) {
          const doors = [...kitchen.doors];
          if (linkedDoorIndex >= 0 && linkedDoorIndex < doors.length) doors.splice(linkedDoorIndex, 1);
          kitchen.doors = doors;
        }
      }
      updatedKitchens[kitchenIndex] = kitchen;
      setFormData({ ...formData, kitchens: updatedKitchens });
    } else {
      // Global removal
      const next: any = { ...formData };
      if (scope === 'otherExpense') {
        const expenses = [...(next.otherExpenses || [])];
        expenses.splice(index, 1);
        next.otherExpenses = expenses;
      } else if (category) {
        const list = (next[category] || []).slice();
        list.splice(index, 1);
        next[category] = list;
        if (removeDoorToo && linkedDoorIndex !== undefined && Array.isArray(next.doors)) {
          const doors = [...next.doors];
          if (linkedDoorIndex >= 0 && linkedDoorIndex < doors.length) doors.splice(linkedDoorIndex, 1);
          next.doors = doors;
        }
      }
      setFormData(next);
    }

    cancelRemoval();
  };

  // Close the "Clear All" confirmation without clearing anything.
  const cancelClear = () => {
    setPendingClear(null);
    setShowClearDialog(false);
  };

  // Perform the pending "Clear All" (whole category or all other expenses, kitchen or global).
  const performClear = () => {
    if (!pendingClear) return;
    const { scope, category, kitchenIndex } = pendingClear;

    if (kitchenIndex !== undefined) {
      const updatedKitchens = [...(formData.kitchens || [])];
      const k: any = { ...updatedKitchens[kitchenIndex] };
      if (scope === 'otherExpenses') {
        k.otherExpenses = [];
      } else if (category) {
        if (category === 'cabinets') {
          const pairIds = new Set((k.cabinets || []).map((c: any) => c._tempPairId).filter(Boolean));
          k.doors = (k.doors || []).filter((d: any) => !d._tempPairId || !pairIds.has(d._tempPairId));
        }
        k[category] = [];
      }
      updatedKitchens[kitchenIndex] = k;
      setFormData({ ...formData, kitchens: updatedKitchens });
    } else {
      const next: any = { ...formData };
      if (scope === 'otherExpenses') {
        next.otherExpenses = [];
      } else if (category) {
        if (category === 'cabinets') {
          const pairIds = new Set((next.cabinets || []).map((c: any) => c._tempPairId).filter(Boolean));
          next.doors = (next.doors || []).filter((d: any) => !d._tempPairId || !pairIds.has(d._tempPairId));
        }
        next[category] = [];
      }
      setFormData(next);
    }

    cancelClear();
  };

  // Handle edit door from SelectedProductsList (kitchen-specific)
  const handleEditDoorInKitchen = (kitchenIndex: number, doorIndex: number) => {
    const kitchen = formData.kitchens?.[kitchenIndex];
    const door = kitchen?.doors?.[doorIndex];
    if (door) {
      setEditingDoorData(door as DoorWithDimensions);
      setEditingDoorIndex(doorIndex);
      setEditingDoorKitchenIndex(kitchenIndex);
      setEditDoorModalOpen(true);
    }
  };

  // Handle edit door from SelectedProductsList (global)
  const handleEditDoorGlobal = (doorIndex: number) => {
    const door = formData.doors?.[doorIndex];
    if (door) {
      setEditingDoorData(door as DoorWithDimensions);
      setEditingDoorIndex(doorIndex);
      setEditingDoorKitchenIndex(null);
      setEditDoorModalOpen(true);
    }
  };

  // Handle door update from edit modal
  const handleDoorUpdate = (data: DoorWithDimensions) => {
    if (editingDoorIndex === null) return;

    if (editingDoorKitchenIndex !== null) {
      // Update in kitchen-specific list (merge to preserve id / _tempPairId)
      const updatedKitchens = [...(formData.kitchens || [])];
      const kitchen = { ...updatedKitchens[editingDoorKitchenIndex] };
      const doors = [...(kitchen.doors || [])];
      doors[editingDoorIndex] = { ...(doors[editingDoorIndex] as any), ...data };
      kitchen.doors = doors;
      updatedKitchens[editingDoorKitchenIndex] = kitchen;
      setFormData({ ...formData, kitchens: updatedKitchens });
    } else {
      // Update in global list (merge to preserve id / _tempPairId)
      const doors = [...(formData.doors || [])];
      doors[editingDoorIndex] = { ...(doors[editingDoorIndex] as any), ...data };
      setFormData({ ...formData, doors });
    }

    // Reset edit state
    setEditDoorModalOpen(false);
    setEditingDoorData(null);
    setEditingDoorIndex(null);
    setEditingDoorKitchenIndex(null);
  };

  const handleCustomerSelect = (customerId: number) => {
    setFormData({ ...formData, customerId });

    // Extract kitchen types from the selected customer
    const customer = customersData?.content?.find((c) => c.id === customerId);
    if (customer?.kitchenTypes) {
      // Parse comma-separated kitchen types
      const types = customer.kitchenTypes
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      setCustomerKitchenTypes(types);
    } else {
      setCustomerKitchenTypes([]);
    }
  };

  const handleNext = () => {
    if (currentStep === 'customer') {
      if (!formData.customerId) {
        toast.error('Please select a customer');
        return;
      }
      setCurrentStep('kitchens');
    } else if (currentStep === 'kitchens') {
      // If no kitchens added, skip to products (backward compatibility)
      if ((formData.kitchens?.length || 0) === 0) {
        setCurrentStep('products');
      } else {
        // Validate kitchens have required data
        const hasInvalidKitchen = formData.kitchens?.some(
          (k) => !k.kitchenName || k.planImages.length === 0
        );
        if (hasInvalidKitchen) {
          toast.error('Please complete all kitchen details (name and at least one plan image)');
          return;
        }
        // Validate all scope fields are filled
        const hasIncompleteScope = formData.kitchens?.some(
          (k) => k.scopeDetails.some((sd) => !sd.fieldValue.trim())
        );
        if (hasIncompleteScope) {
          toast.error('Please fill in all scope of work fields for each kitchen');
          return;
        }
        setCurrentStep('products');
      }
    } else if (currentStep === 'products') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'products') {
      setCurrentStep('kitchens');
    } else if (currentStep === 'kitchens') {
      setCurrentStep('customer');
    } else if (currentStep === 'review') {
      setCurrentStep('products');
    }
  };

  const stepOrder: BuilderStep[] = ['customer', 'kitchens', 'products', 'review'];

  const handleStepClick = (stepId: string) => {
    const targetIndex = stepOrder.indexOf(stepId as BuilderStep);
    const currentIndex = stepOrder.indexOf(currentStep);
    if (targetIndex < 0 || targetIndex === currentIndex) return;
    // Allow clicking any previously visited step (backward or forward)
    if (targetIndex <= highestVisitedStep) {
      setCurrentStep(stepId as BuilderStep);
    }
  };

  const handleSaveDraft = async () => {
    const validation = validateFormData();

    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    try {
      const requestData = convertFormDataToRequest(true);

      if (isEditMode && id) {
        await updateQuotation({ id: parseInt(id), ...requestData }).unwrap();
        toast.success('Quotation draft updated successfully');
      } else {
        await createQuotation(requestData).unwrap();
        toast.success('Quotation draft saved successfully');
      }

      // Reset dirty state after successful save
      initialFormDataRef.current = JSON.stringify(formData);
      setIsDirty(false);
      skipNavigationBlockRef.current = true;
      navigate('/quotations');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast.error(error?.data?.message || 'Failed to save quotation draft');
    }
  };

  const handleSubmit = async () => {
    const validation = validateFormData();

    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    try {
      const requestData = convertFormDataToRequest(false);

      if (isEditMode && id) {
        await updateQuotation({ id: parseInt(id), ...requestData }).unwrap();
        toast.success('Quotation updated and sent successfully');
      } else {
        const result = await createQuotation(requestData).unwrap();
        toast.success('Quotation created and sent successfully');
      }

      // Reset dirty state after successful save
      initialFormDataRef.current = JSON.stringify(formData);
      setIsDirty(false);
      skipNavigationBlockRef.current = true;
      navigate('/quotations');
    } catch (error: any) {
      console.error('Error submitting quotation:', error);
      toast.error(error?.data?.message || 'Failed to submit quotation');
    }
  };

  const handleSaveAsNew = async () => {
    const validation = validateFormData();
    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }
    try {
      // Pass the source quotation id so the new quotation joins its folder as the next version
      const requestData = { ...convertFormDataToRequest(false), sourceQuotationId: id ? Number(id) : undefined };
      const created = await createQuotation(requestData).unwrap();
      const newVersion = created?.data?.versionNumber ?? created?.versionNumber;
      toast.success(newVersion ? `Saved as version V${newVersion}` : 'New quotation created successfully');
      initialFormDataRef.current = JSON.stringify(formData);
      setIsDirty(false);
      skipNavigationBlockRef.current = true;
      navigate('/quotations');
    } catch (error: any) {
      console.error('Error creating new quotation:', error);
      toast.error(error?.data?.message || 'Failed to create new quotation');
    }
  };

  // Blocker dialog handlers
  const handleBlockerSave = async () => {
    try {
      const requestData = convertFormDataToRequest(true);
      if (isEditMode && id) {
        await updateQuotation({ id: parseInt(id), ...requestData }).unwrap();
        toast.success('Quotation draft saved');
      } else {
        await createQuotation(requestData).unwrap();
        toast.success('Quotation draft saved');
      }
      // Reset dirty state and proceed with navigation
      initialFormDataRef.current = JSON.stringify(formData);
      setIsDirty(false);
      blocker.proceed?.();
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast.error(error?.data?.message || 'Failed to save draft');
    }
  };

  const handleBlockerDiscard = () => {
    // Reset dirty state and proceed with navigation
    initialFormDataRef.current = null;
    setIsDirty(false);
    blocker.proceed?.();
  };

  const handleBlockerCancel = () => {
    blocker.reset?.();
  };

  const steps = [
    { id: 'customer', label: 'Customer', completed: !!formData.customerId },
    { id: 'kitchens', label: 'Kitchens', completed: (formData.kitchens?.length || 0) > 0 },
    { id: 'products', label: 'Products', completed: false },
    { id: 'review', label: 'Review', completed: false },
  ];

  return (
    <div className="min-h-screen bg-background-900 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/quotations')} className="hidden sm:flex">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-900">{isEditMode ? 'Edit Quotation' : 'New Quotation'}</h1>
              <p className="text-xs sm:text-sm text-text-600 mt-1">
                {isEditMode ? 'Update the existing quotation' : 'Create a new quotation'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {isEditMode && (
              <Button variant="secondary" size="sm" onClick={handleSaveAsNew} disabled={isCreating || isUpdating} className="w-full sm:w-auto">
                <FilePlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Save as New</span>
                <span className="sm:hidden">New</span>
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleSaveDraft} disabled={isCreating || isUpdating} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{isCreating || isUpdating ? 'Saving...' : 'Save Draft'}</span>
              <span className="sm:hidden">Draft</span>
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isCreating || isUpdating} className="w-full sm:w-auto">
              <Send className="h-4 w-4 mr-2" />
              {isCreating || isUpdating ? 'Saving...' : 'Submit'}
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-max">
            {steps.map((step, index) => {
              const currentIndex = stepOrder.indexOf(currentStep);
              const isClickable = index !== currentIndex && index <= highestVisitedStep;
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}`}
                    onClick={() => isClickable && handleStepClick(step.id)}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep === step.id
                          ? 'bg-primary-600 text-text-900'
                          : step.completed
                          ? 'bg-success text-text-900'
                          : 'bg-background-700 text-text-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-medium ${
                        currentStep === step.id ? 'text-text-900' : 'text-text-600'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-8 sm:w-16 h-0.5 bg-background-600 mx-2 sm:mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
            {currentStep === 'customer' && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-text-900 mb-4">Select Customer</h2>
                {isEditMode && selectedCustomer ? (
                  <div className="p-4 rounded-lg border border-primary-600 bg-primary-900/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-background-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-text-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-text-900">{selectedCustomer.name}</p>
                        {selectedCustomer.phone && <p className="text-sm text-text-600">{selectedCustomer.phone}</p>}
                        {selectedCustomer.email && <p className="text-sm text-text-600">{selectedCustomer.email}</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <CustomerSelector
                    selectedCustomerId={formData.customerId}
                    onSelect={handleCustomerSelect}
                  />
                )}
                <div className="mt-4 sm:mt-6 flex justify-end">
                  <Button variant="primary" onClick={handleNext} className="w-full sm:w-auto">
                    Next: Add Kitchens
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'kitchens' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-text-900 mb-4">Add Kitchens</h2>
                <p className="text-xs sm:text-sm text-text-600 mb-4">
                  Add one or more kitchens to this quotation. Each kitchen can have its own scope of work, plan images, and products.
                </p>

                <KitchenSelector
                  kitchens={formData.kitchens || []}
                  onKitchensChange={(kitchens) => setFormData({ ...formData, kitchens })}
                  suggestedKitchenTypes={customerKitchenTypes}
                />

                {/* Kitchen Details */}
                {formData.kitchens && formData.kitchens.length > 0 && (
                  <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                    {formData.kitchens.map((kitchen, kitchenIndex) => (
                      <Card key={kitchenIndex} className="p-4 sm:p-6 bg-background-800 border-background-600">
                        <h3 className="text-base sm:text-lg font-semibold text-text-900 mb-4">
                          {kitchen.kitchenName}
                        </h3>

                        <div className="space-y-6">
                          {/* Scope of Work */}
                          <div>
                            <KitchenScopeForm
                              scopeDetails={kitchen.scopeDetails}
                              onScopeDetailsChange={(scopeDetails) => {
                                const updatedKitchens = [...(formData.kitchens || [])];
                                updatedKitchens[kitchenIndex] = {
                                  ...updatedKitchens[kitchenIndex],
                                  scopeDetails,
                                };
                                setFormData({ ...formData, kitchens: updatedKitchens });
                              }}
                            />
                          </div>

                          {/* Plan Images */}
                          <div>
                            <KitchenPlanImageSelector
                              customerId={formData.customerId || 0}
                              selectedPlanImages={kitchen.planImages}
                              onPlanImagesChange={(planImages) => {
                                const updatedKitchens = [...(formData.kitchens || [])];
                                updatedKitchens[kitchenIndex] = {
                                  ...updatedKitchens[kitchenIndex],
                                  planImages,
                                };
                                setFormData({ ...formData, kitchens: updatedKitchens });
                              }}
                            />
                          </div>

                          {/* Transportation and Installation are set per-kitchen in the Products step */}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between gap-2">
                  <Button variant="secondary" onClick={handleBack} className="w-full sm:w-auto">
                    Back
                  </Button>
                  <Button variant="primary" onClick={handleNext} className="w-full sm:w-auto">
                    {formData.kitchens && formData.kitchens.length > 0
                      ? 'Next: Add Products'
                      : 'Skip: Add Products'}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'products' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-text-900 mb-4">Add Products</h2>
                
                {/* Check if kitchens exist - if yes, show KitchenProductTabs, otherwise show global product selection */}
                {formData.kitchens && formData.kitchens.length > 0 ? (
                  <>
                    {/* Common transportation — one charge for the whole quotation (installation stays per-kitchen) */}
                    <Card className="p-4 sm:p-5 bg-background-800 border-background-600">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-text-900">Transportation (common)</h3>
                          <p className="text-xs text-text-600 mt-0.5">
                            Charged once for the whole quotation, regardless of the number of kitchens. Installation is entered per kitchen below.
                          </p>
                        </div>
                        <div className="w-full sm:w-48">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={(formData.otherExpenses || []).find(e => e.name === 'Transportation')?.amount || ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const num = raw === '' ? 0 : parseFloat(raw);
                              if (isNaN(num)) return;
                              const amount = Math.max(0, num);
                              const list = [...(formData.otherExpenses || [])];
                              const idx = list.findIndex(item => item.name === 'Transportation');
                              if (idx >= 0) list[idx] = { ...list[idx], amount };
                              else list.unshift({ name: 'Transportation', amount, isDefault: true });
                              setFormData({ ...formData, otherExpenses: list });
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </Card>
                    <KitchenProductTabs
                      kitchens={formData.kitchens}
                      onKitchensChange={(kitchens) => setFormData({ ...formData, kitchens })}
                      accessoriesMarginPercentage={formData.accessoriesMarginPercentage ?? 20}
                      cabinetsMarginPercentage={formData.cabinetsMarginPercentage ?? 20}
                      doorsMarginPercentage={formData.doorsMarginPercentage ?? 20}
                      lightingMarginPercentage={formData.lightingMarginPercentage ?? 20}
                      accessoriesTaxPercentage={formData.accessoriesTaxPercentage ?? 18}
                      cabinetsTaxPercentage={formData.cabinetsTaxPercentage ?? 18}
                      doorsTaxPercentage={formData.doorsTaxPercentage ?? 18}
                      lightingTaxPercentage={formData.lightingTaxPercentage ?? 18}
                      miscellaneousMarginPercentage={formData.miscellaneousMarginPercentage ?? 0}
                      miscellaneousTaxPercentage={formData.miscellaneousTaxPercentage ?? 18}
                      userRole={userRole}
                      onAccessoriesTaxChange={(val) => setFormData({ ...formData, accessoriesTaxPercentage: val })}
                      onCabinetsTaxChange={(val) => setFormData({ ...formData, cabinetsTaxPercentage: val })}
                      onDoorsTaxChange={(val) => setFormData({ ...formData, doorsTaxPercentage: val })}
                      onLightingTaxChange={(val) => setFormData({ ...formData, lightingTaxPercentage: val })}
                      onAccessoriesMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, accessoriesMarginPercentage: val }) : undefined}
                      onCabinetsMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, cabinetsMarginPercentage: val }) : undefined}
                      onDoorsMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, doorsMarginPercentage: val }) : undefined}
                      onLightingMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, lightingMarginPercentage: val }) : undefined}
                      onMiscellaneousMarginChange={(val) => setFormData({ ...formData, miscellaneousMarginPercentage: val })}
                      onMiscellaneousTaxChange={(val) => setFormData({ ...formData, miscellaneousTaxPercentage: val })}
                    />
                  </>
                ) : (
                  <>
                    <ProductSelector
                      selectedProducts={{
                        accessories: formData.accessories || [],
                        cabinets: formData.cabinets || [],
                        doors: formData.doors || [],
                        lighting: formData.lighting || [],
                        otherExpenses: formData.otherExpenses || [],
                      }}
                      onProductsChange={(products) => setFormData({ ...formData, ...products })}
                      miscellaneousMarginPercentage={formData.miscellaneousMarginPercentage ?? 0}
                      miscellaneousTaxPercentage={formData.miscellaneousTaxPercentage ?? 18}
                      onMiscellaneousMarginChange={(v) => setFormData({ ...formData, miscellaneousMarginPercentage: v })}
                      onMiscellaneousTaxChange={(v) => setFormData({ ...formData, miscellaneousTaxPercentage: v })}
                    />

                    {/* Category Pricing Panel */}
                    <div className="mt-6">
                      <CategoryPricingPanel
                        accessories={formData.accessories || []}
                        cabinets={formData.cabinets || []}
                        doors={formData.doors || []}
                        lighting={formData.lighting || []}
                        otherExpenses={formData.otherExpenses || []}
                        miscellaneousMarginPercentage={formData.miscellaneousMarginPercentage ?? 0}
                        miscellaneousTaxPercentage={formData.miscellaneousTaxPercentage ?? 18}
                        accessoriesMargin={formData.accessoriesMarginPercentage ?? 20}
                        cabinetsMargin={formData.cabinetsMarginPercentage ?? 20}
                        doorsMargin={formData.doorsMarginPercentage ?? 20}
                        lightingMargin={formData.lightingMarginPercentage ?? 20}
                        accessoriesTax={formData.accessoriesTaxPercentage ?? 18}
                        cabinetsTax={formData.cabinetsTaxPercentage ?? 18}
                        doorsTax={formData.doorsTaxPercentage ?? 18}
                        lightingTax={formData.lightingTaxPercentage ?? 18}
                        onAccessoriesTaxChange={(val) => setFormData({ ...formData, accessoriesTaxPercentage: val })}
                        onCabinetsTaxChange={(val) => setFormData({ ...formData, cabinetsTaxPercentage: val })}
                        onDoorsTaxChange={(val) => setFormData({ ...formData, doorsTaxPercentage: val })}
                        onLightingTaxChange={(val) => setFormData({ ...formData, lightingTaxPercentage: val })}
                        onAccessoriesMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, accessoriesMarginPercentage: val }) : undefined}
                        onCabinetsMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, cabinetsMarginPercentage: val }) : undefined}
                        onDoorsMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, doorsMarginPercentage: val }) : undefined}
                        onLightingMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, lightingMarginPercentage: val }) : undefined}
                        onMiscellaneousMarginChange={userRole === 'ROLE_SUPER_ADMIN' ? (val) => setFormData({ ...formData, miscellaneousMarginPercentage: val }) : undefined}
                        onMiscellaneousTaxChange={(val) => setFormData({ ...formData, miscellaneousTaxPercentage: val })}
                        userRole={userRole}
                      />
                    </div>

                    {/* Category Totals */}
                    <div className="mt-6">
                      <CategoryTotals
                        accessories={formData.accessories || []}
                        cabinets={formData.cabinets || []}
                        doors={formData.doors || []}
                        lighting={formData.lighting || []}
                        accessoriesMarginPercentage={formData.accessoriesMarginPercentage ?? 20}
                        cabinetsMarginPercentage={formData.cabinetsMarginPercentage ?? 20}
                        doorsMarginPercentage={formData.doorsMarginPercentage ?? 20}
                        lightingMarginPercentage={formData.lightingMarginPercentage ?? 20}
                        accessoriesTaxPercentage={formData.accessoriesTaxPercentage ?? 18}
                        cabinetsTaxPercentage={formData.cabinetsTaxPercentage ?? 18}
                        doorsTaxPercentage={formData.doorsTaxPercentage ?? 18}
                        lightingTaxPercentage={formData.lightingTaxPercentage ?? 18}
                        otherExpenses={formData.otherExpenses || []}
                        miscellaneousMarginPercentage={formData.miscellaneousMarginPercentage ?? 0}
                        miscellaneousTaxPercentage={formData.miscellaneousTaxPercentage ?? 18}
                      />
                    </div>
                  </>
                )}

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between gap-2">
                  <Button variant="secondary" onClick={handleBack} className="w-full sm:w-auto">
                    Back
                  </Button>
                  <Button variant="primary" onClick={handleNext} className="w-full sm:w-auto">
                    Next: Review
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'review' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-text-900 mb-4">Review & Finalize Quotation</h2>

                {/* Quotation Details */}
                <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
                  <h3 className="text-base sm:text-lg font-semibold text-text-900 mb-4">Quotation Details</h3>
                  <div className="space-y-4">
                    {/* Project Name */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
                        Project Name (Optional)
                      </label>
                      <Input
                        type="text"
                        value={formData.projectName || ''}
                        onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                        placeholder="e.g., Kitchen Renovation - Apartment 101"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
                        Notes (Optional)
                      </label>
                      <TextArea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Add any additional notes or special instructions..."
                        rows={4}
                      />
                    </div>

                    {/* Terms & Conditions */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
                        Terms & Conditions
                      </label>
                      <TextArea
                        value={formData.termsConditions || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, termsConditions: e.target.value })
                        }
                        placeholder="Enter terms and conditions..."
                        rows={6}
                      />
                    </div>

                    {/* Warranty & Service */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
                        Warranty & Service
                      </label>
                      <TextArea
                        value={formData.warrantyAndService || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, warrantyAndService: e.target.value })
                        }
                        placeholder="Enter warranty and service terms..."
                        rows={6}
                      />
                    </div>

                    {/* Important Note */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
                        Important Note
                      </label>
                      <TextArea
                        value={formData.importantNote || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, importantNote: e.target.value })
                        }
                        placeholder="Enter important note for the quotation..."
                        rows={4}
                      />
                    </div>

                    {/* Payment Terms */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
                        Payment Terms (%)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-text-600 mb-1">By Acceptance</label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={formData.paymentAcceptancePct ?? 60}
                            onChange={(e) =>
                              setFormData({ ...formData, paymentAcceptancePct: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-600 mb-1">On Delivery</label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={formData.paymentDeliveryPct ?? 30}
                            onChange={(e) =>
                              setFormData({ ...formData, paymentDeliveryPct: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-600 mb-1">After Installation</label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={formData.paymentInstallationPct ?? 10}
                            onChange={(e) =>
                              setFormData({ ...formData, paymentInstallationPct: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                      </div>
                      <p className="text-xs text-text-500 mt-1">
                        Total: {(formData.paymentAcceptancePct ?? 60) + (formData.paymentDeliveryPct ?? 30) + (formData.paymentInstallationPct ?? 10)}%
                      </p>
                    </div>
                  </div>
                </Card>

                {/* MRP (List Price) — per-category pricing, mirrors the offer "Pricing by Category".
                    A single quotation-level set of MRP margins/taxes (super-admin only). */}
                {userRole === 'ROLE_SUPER_ADMIN' && (() => {
                  const ks = formData.kitchens || [];
                  const hasK = ks.length > 0;
                  const isMulti = ks.length >= 2;
                  const acc = hasK ? ks.flatMap((k) => k.accessories || []) : (formData.accessories || []);
                  const cab = hasK ? ks.flatMap((k) => k.cabinets || []) : (formData.cabinets || []);
                  const dor = hasK ? ks.flatMap((k) => k.doors || []) : (formData.doors || []);
                  const lit = hasK ? ks.flatMap((k) => k.lighting || []) : (formData.lighting || []);
                  let oe: QuotationOtherExpense[];
                  if (hasK) {
                    const perK = ks.flatMap((k) => (k.otherExpenses || []).filter((e) => e.name !== 'Transportation'));
                    const transport = (formData.otherExpenses || []).find((e) => e.name === 'Transportation');
                    oe = isMulti && transport && (transport.amount || 0) > 0 ? [...perK, transport] : perK;
                  } else {
                    oe = formData.otherExpenses || [];
                  }
                  return (
                    <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
                      <h3 className="text-base sm:text-lg font-semibold text-text-900 mb-1">Pricing by Category — MRP (List Price)</h3>
                      <p className="text-xs text-text-500 mb-4">Set the per-category margin &amp; tax used for the MRP. The Offer Price uses the rates above.</p>
                      <CategoryPricingPanel
                        accessories={acc}
                        cabinets={cab}
                        doors={dor}
                        lighting={lit}
                        accessoriesMargin={formData.accessoriesMrpMarginPercentage ?? 20}
                        cabinetsMargin={formData.cabinetsMrpMarginPercentage ?? 20}
                        doorsMargin={formData.doorsMrpMarginPercentage ?? 20}
                        lightingMargin={formData.lightingMrpMarginPercentage ?? 20}
                        accessoriesTax={formData.accessoriesMrpTaxPercentage ?? 18}
                        cabinetsTax={formData.cabinetsMrpTaxPercentage ?? 18}
                        doorsTax={formData.doorsMrpTaxPercentage ?? 18}
                        lightingTax={formData.lightingMrpTaxPercentage ?? 18}
                        onAccessoriesMarginChange={(v) => setFormData({ ...formData, accessoriesMrpMarginPercentage: v })}
                        onCabinetsMarginChange={(v) => setFormData({ ...formData, cabinetsMrpMarginPercentage: v })}
                        onDoorsMarginChange={(v) => setFormData({ ...formData, doorsMrpMarginPercentage: v })}
                        onLightingMarginChange={(v) => setFormData({ ...formData, lightingMrpMarginPercentage: v })}
                        onAccessoriesTaxChange={(v) => setFormData({ ...formData, accessoriesMrpTaxPercentage: v })}
                        onCabinetsTaxChange={(v) => setFormData({ ...formData, cabinetsMrpTaxPercentage: v })}
                        onDoorsTaxChange={(v) => setFormData({ ...formData, doorsMrpTaxPercentage: v })}
                        onLightingTaxChange={(v) => setFormData({ ...formData, lightingMrpTaxPercentage: v })}
                        otherExpenses={oe}
                        miscellaneousMarginPercentage={formData.miscellaneousMrpMarginPercentage ?? 0}
                        miscellaneousTaxPercentage={formData.miscellaneousMrpTaxPercentage ?? 18}
                        onMiscellaneousMarginChange={(v) => setFormData({ ...formData, miscellaneousMrpMarginPercentage: v })}
                        onMiscellaneousTaxChange={(v) => setFormData({ ...formData, miscellaneousMrpTaxPercentage: v })}
                        userRole={userRole}
                      />
                    </Card>
                  );
                })()}

                {/* Preview */}
                <QuotationPreview
                  customer={selectedCustomer}
                  accessories={formData.accessories || []}
                  cabinets={formData.cabinets || []}
                  doors={formData.doors || []}
                  lighting={formData.lighting || []}
                  transportationPrice={(formData.otherExpenses || []).find(e => e.name === 'Transportation')?.amount || 0}
                  installationPrice={formData.kitchens && formData.kitchens.length > 0 ? 0 : ((formData.otherExpenses || []).find(e => e.name === 'Installation')?.amount || 0)}
                  otherExpenses={formData.kitchens && formData.kitchens.length > 0 ? undefined : (formData.otherExpenses || [])}
                  accessoriesMarginPercentage={formData.accessoriesMarginPercentage ?? 20}
                  cabinetsMarginPercentage={formData.cabinetsMarginPercentage ?? 20}
                  doorsMarginPercentage={formData.doorsMarginPercentage ?? 20}
                  lightingMarginPercentage={formData.lightingMarginPercentage ?? 20}
                  accessoriesTaxPercentage={formData.accessoriesTaxPercentage ?? 18}
                  cabinetsTaxPercentage={formData.cabinetsTaxPercentage ?? 18}
                  doorsTaxPercentage={formData.doorsTaxPercentage ?? 18}
                  lightingTaxPercentage={formData.lightingTaxPercentage ?? 18}
                  miscellaneousMarginPercentage={formData.miscellaneousMarginPercentage ?? 0}
                  miscellaneousTaxPercentage={formData.miscellaneousTaxPercentage ?? 18}
                  accessoriesMrpMarginPercentage={formData.accessoriesMrpMarginPercentage ?? 20}
                  cabinetsMrpMarginPercentage={formData.cabinetsMrpMarginPercentage ?? 20}
                  doorsMrpMarginPercentage={formData.doorsMrpMarginPercentage ?? 20}
                  lightingMrpMarginPercentage={formData.lightingMrpMarginPercentage ?? 20}
                  accessoriesMrpTaxPercentage={formData.accessoriesMrpTaxPercentage ?? 18}
                  cabinetsMrpTaxPercentage={formData.cabinetsMrpTaxPercentage ?? 18}
                  doorsMrpTaxPercentage={formData.doorsMrpTaxPercentage ?? 18}
                  lightingMrpTaxPercentage={formData.lightingMrpTaxPercentage ?? 18}
                  miscellaneousMrpMarginPercentage={formData.miscellaneousMrpMarginPercentage ?? 0}
                  miscellaneousMrpTaxPercentage={formData.miscellaneousMrpTaxPercentage ?? 18}
                  kitchens={formData.kitchens}
                />

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between gap-2">
                  <Button variant="secondary" onClick={handleBack} className="w-full sm:w-auto">
                    Back
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {isEditMode && (
                      <Button
                        variant="secondary"
                        onClick={handleSaveAsNew}
                        disabled={isCreating || isUpdating}
                        className="w-full sm:w-auto"
                      >
                        <FilePlus className="h-4 w-4 mr-2" />
                        Save as New
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={handleSaveDraft}
                      disabled={isCreating || isUpdating}
                      className="w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isCreating || isUpdating ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      disabled={isCreating || isUpdating}
                      className="w-full sm:w-auto"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isCreating || isUpdating ? 'Submitting...' : 'Submit Quotation'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Selected Products Summary */}
        <div className="lg:col-span-1 lg:sticky lg:top-4 lg:self-start">
          <Card className="p-4 sm:p-6 bg-background-800 border-background-600 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-text-900 mb-4">Selected Products</h3>
            {formData.kitchens && formData.kitchens.length > 0 ? (
              // Show products per kitchen
              <div className="space-y-4">
                {formData.kitchens.map((kitchen, kitchenIndex) => (
                  <div key={kitchenIndex} className="border border-background-600 rounded-lg p-3 sm:p-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-text-800 mb-3">{kitchen.kitchenName}</h4>
                    <SelectedProductsList
                      accessories={kitchen.accessories || []}
                      cabinets={kitchen.cabinets || []}
                      doors={kitchen.doors || []}
                      lighting={kitchen.lighting || []}
                      otherExpenses={kitchen.otherExpenses || []}
                      availableElevations={kitchen.elevations || []}
                      accessoriesMarginPercentage={formData.accessoriesMarginPercentage}
                      cabinetsMarginPercentage={formData.cabinetsMarginPercentage}
                      doorsMarginPercentage={formData.doorsMarginPercentage}
                      lightingMarginPercentage={formData.lightingMarginPercentage}
                      accessoriesTaxPercentage={formData.accessoriesTaxPercentage}
                      cabinetsTaxPercentage={formData.cabinetsTaxPercentage}
                      doorsTaxPercentage={formData.doorsTaxPercentage}
                      lightingTaxPercentage={formData.lightingTaxPercentage}
                      miscellaneousMarginPercentage={formData.miscellaneousMarginPercentage ?? 0}
                      miscellaneousTaxPercentage={formData.miscellaneousTaxPercentage ?? 18}
                      onRemove={(category, index) => {
                        const kitchen = (formData.kitchens || [])[kitchenIndex];
                        const removed = ((kitchen?.[category] as any[]) || [])[index] as any;
                        const itemName = removed?.name || removed?.cabinetTypeName || removed?.description || 'this item';
                        // For a cabinet, locate its linked door (by pair id, else by linked door type id)
                        // so we can name it in the prompt and reliably remove the exact row.
                        let linkedDoorIndex: number | undefined;
                        let linkedDoorName: string | undefined;
                        if (category === 'cabinets') {
                          const doors = (kitchen?.doors as any[]) || [];
                          let di = removed?._tempPairId != null
                            ? doors.findIndex((d: any) => d._tempPairId === removed._tempPairId)
                            : -1;
                          if (di < 0 && removed?.linkedDoorTypeId != null) {
                            di = doors.findIndex((d: any) => d.doorTypeId === removed.linkedDoorTypeId);
                          }
                          if (di >= 0) {
                            linkedDoorIndex = di;
                            linkedDoorName = doors[di]?.doorTypeName || doors[di]?.description;
                          }
                        }
                        setPendingRemoval({ scope: 'product', category, index, kitchenIndex, itemName, linkedDoorIndex, linkedDoorName });
                        if (category === 'cabinets' && linkedDoorIndex !== undefined) {
                          setShowLinkedDoorRemoveDialog(true);
                        } else {
                          setShowRemoveItemDialog(true);
                        }
                      }}
                      onRemoveOtherExpense={(expenseIndex) => {
                        const kitchen = (formData.kitchens || [])[kitchenIndex];
                        const removed = (kitchen?.otherExpenses || [])[expenseIndex] as any;
                        const itemName = removed?.name || 'this item';
                        setPendingRemoval({ scope: 'otherExpense', index: expenseIndex, kitchenIndex, itemName });
                        setShowRemoveItemDialog(true);
                      }}
                      onClearCategory={(category) => {
                        setPendingClear({ scope: 'category', category, kitchenIndex, label: `all ${category}` });
                        setShowClearDialog(true);
                      }}
                      onClearOtherExpenses={() => {
                        setPendingClear({ scope: 'otherExpenses', kitchenIndex, label: 'all other expenses' });
                        setShowClearDialog(true);
                      }}
                      onEditCabinet={(cabinetIndex) => handleEditCabinetInKitchen(kitchenIndex, cabinetIndex)}
                      onEditDoor={(doorIndex) => handleEditDoorInKitchen(kitchenIndex, doorIndex)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // Show global products (backward compatibility)
              <SelectedProductsList
                accessories={formData.accessories || []}
                cabinets={formData.cabinets || []}
                doors={formData.doors || []}
                lighting={formData.lighting || []}
                otherExpenses={formData.otherExpenses || []}
                availableElevations={[]}
                accessoriesMarginPercentage={formData.accessoriesMarginPercentage}
                cabinetsMarginPercentage={formData.cabinetsMarginPercentage}
                doorsMarginPercentage={formData.doorsMarginPercentage}
                lightingMarginPercentage={formData.lightingMarginPercentage}
                accessoriesTaxPercentage={formData.accessoriesTaxPercentage}
                cabinetsTaxPercentage={formData.cabinetsTaxPercentage}
                doorsTaxPercentage={formData.doorsTaxPercentage}
                lightingTaxPercentage={formData.lightingTaxPercentage}
                miscellaneousMarginPercentage={formData.miscellaneousMarginPercentage ?? 0}
                miscellaneousTaxPercentage={formData.miscellaneousTaxPercentage ?? 18}
                onRemove={(category, index) => {
                  const removed = (((formData as any)[category]) || [])[index] as any;
                  const itemName = removed?.name || removed?.cabinetTypeName || removed?.description || 'this item';
                  let linkedDoorIndex: number | undefined;
                  let linkedDoorName: string | undefined;
                  if (category === 'cabinets') {
                    const doors = ((formData as any).doors as any[]) || [];
                    let di = removed?._tempPairId != null
                      ? doors.findIndex((d: any) => d._tempPairId === removed._tempPairId)
                      : -1;
                    if (di < 0 && removed?.linkedDoorTypeId != null) {
                      di = doors.findIndex((d: any) => d.doorTypeId === removed.linkedDoorTypeId);
                    }
                    if (di >= 0) {
                      linkedDoorIndex = di;
                      linkedDoorName = doors[di]?.doorTypeName || doors[di]?.description;
                    }
                  }
                  setPendingRemoval({ scope: 'product', category, index, itemName, linkedDoorIndex, linkedDoorName });
                  if (category === 'cabinets' && linkedDoorIndex !== undefined) {
                    setShowLinkedDoorRemoveDialog(true);
                  } else {
                    setShowRemoveItemDialog(true);
                  }
                }}
                onRemoveOtherExpense={(expenseIndex) => {
                  const removed = (formData.otherExpenses || [])[expenseIndex] as any;
                  const itemName = removed?.name || 'this item';
                  setPendingRemoval({ scope: 'otherExpense', index: expenseIndex, itemName });
                  setShowRemoveItemDialog(true);
                }}
                onClearCategory={(category) => {
                  setPendingClear({ scope: 'category', category, label: `all ${category}` });
                  setShowClearDialog(true);
                }}
                onClearOtherExpenses={() => {
                  setPendingClear({ scope: 'otherExpenses', label: 'all other expenses' });
                  setShowClearDialog(true);
                }}
                onEditCabinet={handleEditCabinetGlobal}
                onEditDoor={handleEditDoorGlobal}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Edit Cabinet Modal */}
      {editCabinetModalOpen && editingCabinetData && editingCabinetIndex !== null && (
        <AddCabinetModal
          isOpen={editCabinetModalOpen}
          onClose={() => {
            setEditCabinetModalOpen(false);
            setEditingCabinetData(null);
            setEditingCabinetIndex(null);
            setEditingKitchenIndex(null);
          }}
          cabinet={cabinetTypes.find((c: any) => c.id === editingCabinetData.cabinetTypeId) || { id: editingCabinetData.cabinetTypeId, name: editingCabinetData.cabinetTypeName || 'Cabinet' } as any}
          availableDoors={doorTypes}
          onAdd={handleCabinetUpdate}
          editData={editingCabinetData}
          editIndex={editingCabinetIndex}
        />
      )}

      {/* Edit Door Modal */}
      {editDoorModalOpen && editingDoorData && editingDoorIndex !== null && (
        <AddDoorModal
          isOpen={editDoorModalOpen}
          onClose={() => {
            setEditDoorModalOpen(false);
            setEditingDoorData(null);
            setEditingDoorIndex(null);
            setEditingDoorKitchenIndex(null);
          }}
          door={doorTypes.find((d: any) => d.id === editingDoorData.doorTypeId) || { id: editingDoorData.doorTypeId, name: editingDoorData.doorType?.name || 'Door' } as any}
          availableElevations={editingDoorKitchenIndex !== null ? formData.kitchens?.[editingDoorKitchenIndex]?.elevations || [] : []}
          onAdd={handleDoorUpdate}
          editData={editingDoorData}
          editIndex={editingDoorIndex}
        />
      )}

      {/* Generic item removal confirmation */}
      <ConfirmDialog
        isOpen={showRemoveItemDialog}
        onClose={cancelRemoval}
        onConfirm={() => performRemoval(false)}
        title="Remove Item?"
        message={`Remove "${pendingRemoval?.itemName ?? 'this item'}" from this quotation?`}
        confirmText="Yes, Remove"
        cancelText="Cancel"
        type="warning"
      />

      {/* Clear All confirmation (whole category / all other expenses) */}
      <ConfirmDialog
        isOpen={showClearDialog}
        onClose={cancelClear}
        onConfirm={performClear}
        title="Clear All?"
        message={`Remove ${pendingClear?.label ?? 'all items'} from this quotation? This cannot be undone.`}
        confirmText="Yes, Clear All"
        cancelText="Cancel"
        type="danger"
      />

      {/* Linked Door Removal Confirmation Dialog.
          X / backdrop / Esc (onClose) cancels and removes nothing;
          "No, Keep Door" (onCancel) removes the cabinet but keeps the door;
          "Yes, Remove Door Too" (onConfirm) removes both. */}
      <ConfirmDialog
        isOpen={showLinkedDoorRemoveDialog}
        onClose={cancelRemoval}
        onCancel={() => performRemoval(false)}
        onConfirm={() => performRemoval(true)}
        title="Remove Linked Door?"
        message={
          pendingRemoval?.linkedDoorName
            ? `"${pendingRemoval?.itemName ?? 'This cabinet'}" has a linked door: "${pendingRemoval.linkedDoorName}". Do you want to remove this door as well?`
            : `"${pendingRemoval?.itemName ?? 'This cabinet'}" has a linked door. Do you want to remove the linked door as well?`
        }
        confirmText="Yes, Remove Door Too"
        cancelText="No, Keep Door"
        type="warning"
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={blocker.state === 'blocked'}
        onSave={handleBlockerSave}
        onDiscard={handleBlockerDiscard}
        onCancel={handleBlockerCancel}
        isSaving={isCreating || isUpdating}
      />
    </div>
  );
}

export default QuotationBuilderPage;
