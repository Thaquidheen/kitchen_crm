// Project Types based on backend DTOs

export const ProjectStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD',
  IN_PROGRESS: 'IN_PROGRESS'
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

// Main project interface
export interface Project {
  id?: number;
  customerId: number;
  customerName?: string;
  quotationId?: number;
  quotationNumber?: string;
  projectName: string;
  projectDescription?: string;
  
  // Financial fields - commitment
  totalAmount: number;
  totalTaxAmount: number;
  committedInHand: number;
  committedInAccount: number;
  
  // Financial fields - received
  receivedInHand: number;
  receivedInAccount: number;
  receivedAmountTotal: number;
  
  // Financial fields - balance (computed)
  balanceInHand: number;
  balanceInAccount: number;
  balanceAmount: number;
  
  // Financial fields - expenses
  totalExpense: number;
  profitAmount: number;
  
  // Status and dates
  status: ProjectStatus;
  startDate?: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  
  // Metadata
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;

  // Category-specific edited tax percentages (for cash calculation)
  accessoriesTaxPercentage?: number;
  cabinetsTaxPercentage?: number;
  doorsTaxPercentage?: number;
  lightingTaxPercentage?: number;
}

// Project summary for list views
export interface ProjectSummary {
  id: number;
  projectName: string;
  customerId: number;
  customerName: string;
  totalAmount: number;
  balanceAmount: number;
  status: ProjectStatus;
  startDate?: string;
  expectedCompletionDate?: string;
  createdBy?: string;
}

// Create project request
export interface CreateProjectRequest {
  customerId: number;
  quotationId?: number;
  projectName: string;
  projectDescription?: string;
  totalAmount?: number;
  totalTaxAmount?: number;
  committedInHand?: number;
  committedInAccount?: number;
  startDate?: string;
  expectedCompletionDate?: string;
}

// Update project request
export interface UpdateProjectRequest extends Partial<Project> {
  id: number;
}

// Project filters
export interface ProjectFilters {
  customerId?: number;
  status?: ProjectStatus;
  projectName?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// Project statistics
export interface ProjectStatistics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  onHoldProjects: number;
  inProgressProjects: number;
  totalValue: number;
  averageValue: number;
  completionRate: number;
  projectsByStatus: Record<ProjectStatus, number>;
  projectsByMonth: Array<{
    month: string;
    count: number;
    value: number;
  }>;
}

// Project financial summary
export interface ProjectFinancialSummary {
  totalAmount: number;
  totalTaxAmount: number;
  cashInHand: number;
  cashInAccount: number;
  balanceAmount: number;
  receivedAmountTotal: number;
  totalExpense: number;
  paymentCompletionPercentage: number;
  profitMargin: number;
  expensesBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

// Quotation conversion request
export interface ConvertQuotationToProjectRequest {
  quotationId: number;
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

// Project form data
export interface ProjectFormData {
  customerId: number;
  quotationId?: number;
  projectName: string;
  projectDescription: string;
  totalAmount: number;
  totalTaxAmount: number;
  startDate: string;
  expectedCompletionDate: string;
}

// Kitchen-specific cash calculation data
export interface KitchenCashCalculation {
  // Kitchen identification
  kitchenId: number;
  kitchenName: string;
  kitchenOrder: number;

  // Category base amounts from kitchen (without tax)
  accessoriesBaseTotal: number;
  cabinetsBaseTotal: number;
  doorsBaseTotal: number;
  lightingBaseTotal: number;

  // Category margin amounts from kitchen
  accessoriesMarginAmount: number;
  cabinetsMarginAmount: number;
  doorsMarginAmount: number;
  lightingMarginAmount: number;

  // Original tax percentages from quotation (used for all kitchens)
  accessoriesTaxPercentage: number;
  cabinetsTaxPercentage: number;
  doorsTaxPercentage: number;
  lightingTaxPercentage: number;

  // Edited tax percentages (user input) - can be per kitchen or quotation-level
  editedAccessoriesTaxPercentage?: number;
  editedCabinetsTaxPercentage?: number;
  editedDoorsTaxPercentage?: number;
  editedLightingTaxPercentage?: number;

  // Calculated results for this kitchen
  cashInHand: number;
  cashInAccount: number;
}

// Project cash calculation data
export interface ProjectCashCalculation {
  // Category base amounts from quotation (without tax)
  accessoriesBaseTotal: number;
  cabinetsBaseTotal: number;
  doorsBaseTotal: number;
  lightingBaseTotal: number;

  // Category margin amounts from quotation
  accessoriesMarginAmount: number;
  cabinetsMarginAmount: number;
  doorsMarginAmount: number;
  lightingMarginAmount: number;

  // Original tax percentages from quotation
  accessoriesTaxPercentage: number;
  cabinetsTaxPercentage: number;
  doorsTaxPercentage: number;
  lightingTaxPercentage: number;

  // Edited tax percentages (user input)
  editedAccessoriesTaxPercentage?: number;
  editedCabinetsTaxPercentage?: number;
  editedDoorsTaxPercentage?: number;
  editedLightingTaxPercentage?: number;

  // Transportation and installation costs from quotation
  transportationPrice: number;
  installationPrice: number;

  // Calculated results (aggregated totals for backward compatibility)
  cashInHand: number;
  cashInAccount: number;

  // Multi-kitchen support
  isMultiKitchen?: boolean;
  kitchens?: KitchenCashCalculation[];
}

// Kitchen tax percentages
export interface KitchenTaxPercentages {
  accessoriesTaxPercentage?: number;
  cabinetsTaxPercentage?: number;
  doorsTaxPercentage?: number;
  lightingTaxPercentage?: number;
}

// Update project cash calculation request
export interface UpdateProjectCashCalculationRequest {
  // Project-level tax percentages (for backward compatibility and single-kitchen mode)
  accessoriesTaxPercentage?: number;
  cabinetsTaxPercentage?: number;
  doorsTaxPercentage?: number;
  lightingTaxPercentage?: number;
  
  // Per-kitchen tax percentages (Map<kitchenId, KitchenTaxPercentages>)
  kitchenTaxPercentages?: Record<number, KitchenTaxPercentages>;
}

// Project state
export interface ProjectState {
  projects: ProjectSummary[];
  currentProject: Project | null;
  statistics: ProjectStatistics | null;
  financialSummary: ProjectFinancialSummary | null;
  filters: ProjectFilters;
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
    financialSummary: boolean;
    convert: boolean;
  };
  error: string | null;
}

