// Quotation Types based on backend DTOs

export const QuotationStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVISED: 'REVISED'
} as const;

export type QuotationStatus = typeof QuotationStatus[keyof typeof QuotationStatus];

// Base quotation line item interface
export interface QuotationLineItem {
  id?: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

// Accessory line item
export interface QuotationAccessory extends QuotationLineItem {
  accessoryId?: number;
  accessoryName?: string;
  brandName?: string;
  categoryName?: string;
  customItem?: boolean;
  customItemName?: string;
  imageUrl?: string;
  widthMm?: number;
  heightMm?: number;
  depthMm?: number;
  color?: string;
  materialCode?: string;
  kitchenId?: number; // Reference to quotation_kitchens
  // Elevation reference
  elevationId?: number;
  elevationName?: string;
}

// Cabinet line item
export interface QuotationCabinet extends QuotationLineItem {
  cabinetTypeId?: number;
  cabinetTypeName?: string;
  brandName?: string;
  materialName?: string;
  widthMm?: number;
  heightMm?: number;
  depthMm?: number;
  calculatedSqft?: number;
  marginAmount?: number;
  taxAmount?: number;
  cabinetFinish?: string;
  customDimensions?: boolean;
  kitchenId?: number; // Reference to quotation_kitchens
  // Material selection for sqft-based pricing
  materialId?: number;
  materialRate?: number;
  // Lighting cost (Width mm × 2)
  lightingCost?: number;
  // Accessories cost (BLUM standard accessories)
  accessoriesCost?: number;
  // Elevation reference
  elevationId?: number;
  elevationName?: string;
  // Linked door reference (for edit modal restore)
  linkedDoor?: {
    doorTypeId: number;
    doorType?: any;
    widthMm: number;
    heightMm: number;
    quantity: number;
    faceArea?: number;
  };
}

// Door line item
export interface QuotationDoor extends QuotationLineItem {
  doorTypeId?: number;
  doorTypeName?: string;
  brandName?: string;
  material?: string;
  widthMm?: number;
  heightMm?: number;
  calculatedSqft?: number;
  marginAmount?: number;
  taxAmount?: number;
  doorFinish?: string;
  doorStyle?: string;
  customDimensions?: boolean;
  kitchenId?: number; // Reference to quotation_kitchens
  // Elevation reference
  elevationId?: number;
  elevationName?: string;
}

// Lighting line item
export interface QuotationLighting extends QuotationLineItem {
  itemType: 'LIGHT_PROFILE' | 'DRIVER' | 'CONNECTOR' | 'SENSOR';
  itemId: number;
  itemName?: string;
  unit?: string;
  specifications?: string;
  wattage?: number;
  profileType?: string;
  sensorType?: string;
  connectorType?: string;
  marginAmount?: number;
  taxAmount?: number;
  kitchenId?: number; // Reference to quotation_kitchens
}

// Category totals
export interface CategoryTotals {
  base: number;
  margin: number;
  tax: number;
  final: number;
}

// Quotation totals
export interface QuotationTotals {
  subtotal: number;
  marginAmount: number;
  taxAmount: number;
  totalAmount: number;
  accessories: CategoryTotals;
  cabinets: CategoryTotals;
  doors: CategoryTotals;
  lighting: CategoryTotals;
}

// Main quotation interface
export interface Quotation {
  id?: number;
  customerId: number;
  customerName?: string;
  quotationNumber?: string;
  projectName?: string;
  
  // Pricing fields
  transportationPrice: number;
  installationPrice: number;
  marginPercentage: number;
  taxPercentage: number;
  // Category-specific margin percentages
  accessoriesMarginPercentage?: number;
  cabinetsMarginPercentage?: number;
  doorsMarginPercentage?: number;
  lightingMarginPercentage?: number;
  // Category-specific tax percentages
  accessoriesTaxPercentage?: number;
  cabinetsTaxPercentage?: number;
  doorsTaxPercentage?: number;
  lightingTaxPercentage?: number;
  subtotal: number;
  marginAmount: number;
  taxAmount: number;
  totalAmount: number;
  
  // Category totals
  accessoriesBaseTotal: number;
  accessoriesMarginAmount: number;
  accessoriesTaxAmount: number;
  accessoriesFinalTotal: number;
  
  cabinetsBaseTotal: number;
  cabinetsMarginAmount: number;
  cabinetsTaxAmount: number;
  cabinetsFinalTotal: number;
  
  doorsBaseTotal: number;
  doorsMarginAmount: number;
  doorsTaxAmount: number;
  doorsFinalTotal: number;
  
  lightingBaseTotal: number;
  lightingMarginAmount: number;
  lightingTaxAmount: number;
  lightingFinalTotal: number;
  
  // Status and metadata
  status: QuotationStatus;
  validUntil?: string;
  notes?: string;
  termsConditions?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;

  // Signature fields (Phase 6 integration)
  signedDocumentId?: number;
  signatureStatus?: 'PENDING' | 'SENT' | 'SIGNED' | 'REJECTED' | 'EXPIRED';
  quotationSignedAt?: string;

  // Signer information (from SignedDocument)
  signerName?: string;
  signerEmail?: string;
  signerPhone?: string;

  // Line items
  accessories?: QuotationAccessory[];
  cabinets?: QuotationCabinet[];
  doors?: QuotationDoor[];
  lighting?: QuotationLighting[];

  // Kitchens (multi-kitchen support)
  kitchens?: QuotationKitchen[];

  // Payment terms & important note
  importantNote?: string;
  paymentAcceptancePct?: number;
  paymentDeliveryPct?: number;
  paymentInstallationPct?: number;
}

// Quotation summary for list views
export interface QuotationSummary {
  id: number;
  quotationNumber: string;
  customerName: string;
  projectName?: string;
  totalAmount: number;
  status: QuotationStatus;
  validUntil?: string;
  createdAt: string;
  createdBy?: string;
  // Signature fields (Phase 6 integration)
  signatureStatus?: 'PENDING' | 'SENT' | 'SIGNED' | 'REJECTED' | 'EXPIRED';
  quotationSignedAt?: string;
  // Signer information (from SignedDocument)
  signerName?: string;
  signerEmail?: string;
  signerPhone?: string;
}

// Create quotation request
export interface CreateQuotationRequest {
  customerId: number;
  projectName?: string;
  transportationPrice?: number;
  installationPrice?: number;
  marginPercentage?: number;
  taxPercentage?: number;
  validUntil?: string;
  notes?: string;
  termsConditions?: string;
  accessories?: QuotationAccessory[];
  cabinets?: QuotationCabinet[];
  doors?: QuotationDoor[];
  lighting?: QuotationLighting[];

  // Kitchens (multi-kitchen support)
  kitchens?: QuotationKitchen[];

  // Payment terms & important note
  importantNote?: string;
  paymentAcceptancePct?: number;
  paymentDeliveryPct?: number;
  paymentInstallationPct?: number;
}

// Update quotation request
export interface UpdateQuotationRequest extends Partial<Quotation> {
  id: number;
}

// Quotation filters
export interface QuotationFilters {
  customerId?: number;
  status?: QuotationStatus;
  customerName?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  // Signature filter (Phase 6 integration)
  signatureStatus?: 'PENDING' | 'SENT' | 'SIGNED' | 'REJECTED' | 'EXPIRED';
}

// Alias for backward compatibility
export type QuotationListParams = QuotationFilters;

// Quotation statistics
export interface QuotationStatistics {
  totalQuotations: number;
  draftQuotations: number;
  sentQuotations: number;
  approvedQuotations: number;
  rejectedQuotations: number;
  revisedQuotations: number;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  quotationsByStatus: Record<QuotationStatus, number>;
  quotationsByMonth: Array<{
    month: string;
    count: number;
    value: number;
  }>;
}

// Paginated response
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// Kitchen-related types
export interface QuotationKitchenPlanImage {
  id?: number;
  kitchenId?: number;
  customerPlanImageId?: number;
  designPhaseFileId?: number;
  imageName: string;
  imageUrl: string;
  imageOrder: number;
}

export interface QuotationKitchenScopeDetail {
  id?: number;
  kitchenId?: number;
  fieldName: string;
  fieldValue: string;
  fieldOrder: number;
}

// Predefined scope field names for quotations
export const SCOPE_FIELD_NAMES = [
  'Kitchen Shape',
  'Color and finish detail',
  'Carcass Material',
  'Shutter Material',
  'Handles',
  'Hardware',
  'Countertop',
  'Appliances',
  'Accessories',
  'Lights',
] as const;

export type ScopeFieldName = (typeof SCOPE_FIELD_NAMES)[number];

// Elevation interface
export interface QuotationElevation {
  id?: number;
  name: string;
  displayOrder: number;
  kitchenId?: number;
}

export interface QuotationKitchen {
  id?: number;
  quotationId?: number;
  kitchenName: string;
  kitchenOrder: number;
  transportationPrice: number;
  installationPrice: number;
  subtotal: number;
  marginAmount: number;
  taxAmount: number;
  totalAmount: number;
  // Category totals
  accessoriesBaseTotal: number;
  accessoriesMarginAmount: number;
  accessoriesTaxAmount: number;
  accessoriesFinalTotal: number;
  cabinetsBaseTotal: number;
  cabinetsMarginAmount: number;
  cabinetsTaxAmount: number;
  cabinetsFinalTotal: number;
  doorsBaseTotal: number;
  doorsMarginAmount: number;
  doorsTaxAmount: number;
  doorsFinalTotal: number;
  lightingBaseTotal: number;
  lightingMarginAmount: number;
  lightingTaxAmount: number;
  lightingFinalTotal: number;
  // Related data
  planImages?: QuotationKitchenPlanImage[];
  scopeDetails?: QuotationKitchenScopeDetail[];
  elevations?: QuotationElevation[];
  accessories?: QuotationAccessory[];
  cabinets?: QuotationCabinet[];
  doors?: QuotationDoor[];
  lighting?: QuotationLighting[];
}

export interface QuotationKitchenFormData {
  kitchenName: string;
  kitchenOrder: number;
  transportationPrice: number;
  installationPrice: number;
  scopeDetails: QuotationKitchenScopeDetail[];
  planImages: QuotationKitchenPlanImage[];
  elevations: QuotationElevation[];
  accessories: QuotationAccessory[];
  cabinets: QuotationCabinet[];
  doors: QuotationDoor[];
  lighting: QuotationLighting[];
}

// Quotation form data for the builder
export interface QuotationFormData {
  customerId: number;
  projectName: string;
  transportationPrice: number;
  installationPrice: number;
  marginPercentage: number;
  taxPercentage: number;
  validUntil: string;
  notes: string;
  termsConditions: string;
  accessories: QuotationAccessory[];
  cabinets: QuotationCabinet[];
  doors: QuotationDoor[];
  lighting: QuotationLighting[];
  kitchens?: QuotationKitchenFormData[];
  importantNote?: string;
  paymentAcceptancePct?: number;
  paymentDeliveryPct?: number;
  paymentInstallationPct?: number;
}

// Quotation state
export interface QuotationState {
  quotations: QuotationSummary[];
  currentQuotation: Quotation | null;
  statistics: QuotationStatistics | null;
  filters: QuotationFilters;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    statistics: boolean;
  };
  error: string | null;
}
