/**
 * Production & Installation related types and interfaces
 * Based on backend ProductionInstallation entity and DTOs
 */

export const InstallationStatus = {
  NOT_STARTED: 'NOT_STARTED',
  PRODUCTION: 'PRODUCTION',
  SITE_PREPARATION: 'SITE_PREPARATION',
  DELIVERY: 'DELIVERY',
  INSTALLATION: 'INSTALLATION',
  QUALITY_CHECK: 'QUALITY_CHECK',
  COMPLETED: 'COMPLETED',
  ON_HOLD: 'ON_HOLD',
  CANCELLED: 'CANCELLED',
} as const;

export type InstallationStatus = typeof InstallationStatus[keyof typeof InstallationStatus];

export interface ProductionInstallation {
  id: number;
  customerId: number;
  customerName?: string;

  // Production Phase
  epdReceived?: boolean;
  epdReceivedDate?: string;
  productionStarted?: boolean;
  productionStartDate?: string;
  estimatedProductionCompletion?: string;
  actualProductionCompletion?: string;

  // Site Preparation
  siteVisitMarking?: boolean;
  siteVisitDate?: string;
  siteMeasurementsVerified?: boolean;
  flooringCompleted?: boolean;
  flooringCompletionDate?: string;
  ceilingCompleted?: boolean;
  ceilingCompletionDate?: string;
  electricalWorkCompleted?: boolean;
  plumbingWorkCompleted?: boolean;

  // Delivery Tracking
  carcassAtSite?: boolean;
  carcassDeliveryDate?: string;
  countertopAtSite?: boolean;
  countertopDeliveryDate?: string;
  shuttersAtSite?: boolean;
  shuttersDeliveryDate?: string;
  accessoriesAtSite?: boolean;
  accessoriesDeliveryDate?: string;

  // Installation Phase
  carcassInstalled?: boolean;
  carcassInstallationDate?: string;
  countertopInstalled?: boolean;
  countertopInstallationDate?: string;
  shuttersInstalled?: boolean;
  shuttersInstallationDate?: string;
  accessoriesInstalled?: boolean;
  accessoriesInstallationDate?: string;

  // Appliances & Final Setup
  appliancesReceived?: boolean;
  appliancesReceivedDate?: string;
  appliancesInstalled?: boolean;
  appliancesInstallationDate?: string;
  lightsInstalled?: boolean;
  lightsInstallationDate?: string;
  finalCleaningDone?: boolean;
  finalCleaningDate?: string;

  // Project Completion
  handoverToClient?: boolean;
  handoverDate?: string;
  clientFeedbackPhotography?: string;
  warrantyProvided?: boolean;
  warrantyDocumentPath?: string;

  // Project Status and Team
  overallStatus: InstallationStatus;
  projectManagerAssigned?: string;
  installationTeamLead?: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  installationNotes?: string;

  // Quality Control
  qualityCheckPassed?: boolean;
  qualityCheckDate?: string;
  qualityCheckNotes?: string;

  // Calculated Fields
  overallProgressPercentage?: number;
  currentPhase?: string;
  readyForInstallation?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionFilters {
  status?: InstallationStatus;
  projectManager?: string;
  teamLead?: string;
  customerName?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface ProductionStatistics {
  totalInstallations: number;
  installationsByStatus: Record<InstallationStatus, number>;
  installationsInProgress: number;
  completedInstallations: number;
  readyForInstallation: number;
  readyForHandover: number;
  overdueProjects: number;
  scheduledCompletions: number;
  installationsByProjectManager?: Record<string, number>;
  installationsByTeamLead?: Record<string, number>;
}

export interface ProductionApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface ProductionListResponse {
  content: ProductionInstallation[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Status option for UI dropdowns
export interface InstallationStatusOption {
  value: InstallationStatus;
  label: string;
  color: string;
  description: string;
}

// Create request type
export interface ProductionInstallationCreateRequest {
  customerId: number;
  projectManagerAssigned?: string;
  installationTeamLead?: string;
  estimatedCompletionDate?: string; // YYYY-MM-DD format
  installationNotes?: string;
}

// Custom Task Types
export const TaskPhase = {
  PRODUCTION: 'PRODUCTION',
  SITE_PREPARATION: 'SITE_PREPARATION',
  DELIVERY: 'DELIVERY',
  INSTALLATION: 'INSTALLATION',
  COMPLETION: 'COMPLETION',
  CUSTOM: 'CUSTOM',
} as const;

export type TaskPhase = typeof TaskPhase[keyof typeof TaskPhase];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

export interface ProductionCustomTask {
  id: number;
  productionInstallationId: number;
  customerId: number;
  taskTitle: string;
  taskDescription?: string;
  phase: TaskPhase;
  completed: boolean;
  completionDate?: string;
  completedAt?: string;
  completedByUserId?: number;
  completedByUserName?: string;
  priority: TaskPriority;
  sortOrder: number;
  notes?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  createdAt?: string;
  updatedAt?: string;
  taskGroupId?: number;
  taskGroupTitle?: string;
}

export interface ProductionCustomTaskCreateRequest {
  customerId: number;
  taskTitle: string;
  taskDescription?: string;
  phase?: TaskPhase;
  priority?: TaskPriority;
  sortOrder?: number;
  notes?: string;
  taskGroupId?: number;
}

export interface ProductionCustomTaskUpdateRequest {
  taskTitle?: string;
  taskDescription?: string;
  phase?: TaskPhase;
  completed?: boolean;
  completionDate?: string;
  priority?: TaskPriority;
  sortOrder?: number;
  notes?: string;
}

// Task Group Types
export interface ProductionTaskGroup {
  id: number;
  productionInstallationId: number;
  groupTitle: string;
  groupDescription?: string;
  sortOrder: number;
  isExpanded: boolean;
  createdByUserId?: number;
  createdByUserName?: string;
  createdAt?: string;
  updatedAt?: string;
  tasks: ProductionCustomTask[];
  totalTasks: number;
  completedTasks: number;
}

export interface ProductionTaskGroupCreateRequest {
  customerId: number;
  groupTitle: string;
  groupDescription?: string;
  sortOrder?: number;
}

export interface ProductionTaskGroupUpdateRequest {
  groupTitle?: string;
  groupDescription?: string;
  sortOrder?: number;
  isExpanded?: boolean;
}

// Production Issue Types
export const IssueCategory = {
  MATERIAL_DEFECT: 'MATERIAL_DEFECT',
  MEASUREMENT_ERROR: 'MEASUREMENT_ERROR',
  INSTALLATION_DAMAGE: 'INSTALLATION_DAMAGE',
  DELIVERY_DELAY: 'DELIVERY_DELAY',
  QUALITY_ISSUE: 'QUALITY_ISSUE',
  SITE_ISSUE: 'SITE_ISSUE',
  DESIGN_CHANGE: 'DESIGN_CHANGE',
  OTHER: 'OTHER',
} as const;

export type IssueCategory = typeof IssueCategory[keyof typeof IssueCategory];

export const IssuePriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type IssuePriority = typeof IssuePriority[keyof typeof IssuePriority];

export const IssueStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type IssueStatus = typeof IssueStatus[keyof typeof IssueStatus];

export interface ProductionIssue {
  id: number;
  productionInstallationId: number;
  customerId: number;
  customerName?: string;
  title: string;
  description?: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  reportedBy?: string;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionIssueCreateRequest {
  customerId: number;
  title: string;
  description?: string;
  category: IssueCategory;
  priority: IssuePriority;
  assignedTo?: string;
}

export interface ProductionIssueUpdateRequest {
  title?: string;
  description?: string;
  category?: IssueCategory;
  priority?: IssuePriority;
  status?: IssueStatus;
  assignedTo?: string;
  resolution?: string;
}

