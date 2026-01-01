/**
 * Design Phase related types and interfaces
 * Based on backend DesignPhase entity and DTOs
 */

export const DesignStatus = {
  PLANNING: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_SUPERADMIN_APPROVAL: 'PENDING_SUPERADMIN_APPROVAL',
  APPROVED_BY_ADMIN: 'APPROVED_BY_ADMIN',
  SUBMITTED: 'SUBMITTED',
  FEEDBACK_RECEIVED: 'FEEDBACK_RECEIVED',
  REVISION_REQUIRED: 'REVISION_REQUIRED',
  APPROVED: 'APPROVED',
  FROZEN: 'FROZEN',
  CANCELLED: 'CANCELLED',
} as const;

export type DesignStatus = typeof DesignStatus[keyof typeof DesignStatus];

export interface DesignPhase {
  id: number;
  customerId: number;
  customerName: string;
  quotationId?: number;
  quotationNumber?: string;
  plan?: string;
  design?: string;
  designRequirements?: string;
  submittedToClient: boolean;
  submissionDate?: string;
  clientFeedback?: string;
  feedbackDate?: string;
  meetingScheduled?: string;
  meetingCompleted: boolean;
  meetingNotes?: string;
  designAmountFrozen: boolean;
  frozenAmount?: number;
  clientGroupCreated: boolean;
  whatsappGroupLink?: string;
  designStatus: DesignStatus;
  staffAssignedId?: number; // Staff user ID
  staffAssignedName?: string; // Staff user name
  designCompletionPercentage: number;
  revisionCount: number;
  clientApprovalDate?: string;
  designFilesPath?: string;
  overallProgress: number;
  canFreezeDesign: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DesignPhaseCreateRequest {
  customerId: number;
  quotationId?: number;
  designRequirements?: string;
  staffAssignedId?: number; // Staff user ID for assignment
}

export interface DesignPhaseUpdateRequest {
  id: number;
  customerId: number;
  quotationId?: number;
  plan?: string;
  design?: string;
  designRequirements?: string;
  submittedToClient?: boolean;
  submissionDate?: string;
  clientFeedback?: string;
  feedbackDate?: string;
  meetingScheduled?: string;
  meetingCompleted?: boolean;
  meetingNotes?: string;
  designAmountFrozen?: boolean;
  frozenAmount?: number;
  clientGroupCreated?: boolean;
  whatsappGroupLink?: string;
  designStatus?: DesignStatus;
  staffAssignedId?: number; // Staff user ID
  designCompletionPercentage?: number;
  revisionCount?: number;
  clientApprovalDate?: string;
  designFilesPath?: string;
}

export interface DesignSubmissionRequest {
  design: string;
  designFilesPath?: string;
  submissionNotes?: string;
}

export interface StaffSubmissionRequest {
  design: string;
  designFilesPath?: string;
  submissionNotes?: string;
}

export interface ClientFeedbackRequest {
  clientFeedback: string;
  requiresRevision?: boolean;
  revisionNotes?: string;
}

export interface MeetingScheduleRequest {
  meetingDateTime: string;
  meetingPurpose?: string;
  meetingLocation?: string;
  attendees?: string;
}

export interface DesignPhaseFilters {
  designStatus?: DesignStatus;
  staffAssignedId?: number;
  customerName?: string;
  submittedToClient?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface DesignPhaseStatistics {
  totalDesigns: number;
  designsByStatus: Record<DesignStatus, number>;
  designsByDesigner: Record<string, number>;
  averageCompletionTime: number;
  averageRevisionCount: number;
  upcomingMeetings: number;
  designsPendingApproval: number;
  monthlyDesigns: Array<{
    month: string;
    count: number;
  }>;
}

export interface DesignPhaseFormData {
  customerId: number;
  quotationId?: number;
  designRequirements: string;
  plan: string;
  design: string;
  meetingDateTime: string;
  meetingPurpose: string;
  meetingLocation: string;
  attendees: string;
  whatsappGroupLink: string;
  frozenAmount: string;
}

export interface DesignPhaseFormErrors {
  customerId?: string;
  quotationId?: string;
  designRequirements?: string;
  plan?: string;
  design?: string;
  meetingDateTime?: string;
  meetingPurpose?: string;
  meetingLocation?: string;
  attendees?: string;
  whatsappGroupLink?: string;
  frozenAmount?: string;
}

// Helper types for design status display
export interface DesignStatusOption {
  value: DesignStatus;
  label: string;
  color: string;
  description: string;
}

export interface DesignerOption {
  value: string;
  label: string;
  active: boolean;
}

// API response types
export interface DesignPhaseApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface DesignPhaseListResponse {
  content: DesignPhase[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Workflow related types
export interface DesignWorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  description: string;
  completedAt?: string;
  assignedTo?: string;
}

export interface DesignWorkflow {
  customerId: number;
  currentStep: string;
  steps: DesignWorkflowStep[];
  overallProgress: number;
  estimatedCompletion?: string;
}

// Meeting related types
export interface UpcomingMeeting {
  id: number;
  customerId: number;
  customerName: string;
  meetingDateTime: string;
  meetingPurpose?: string;
  meetingLocation?: string;
  attendees?: string;
  designStatus: DesignStatus;
}

// File upload types
export const FileCategory = {
  DESIGN: 'DESIGN',
  PLAN: 'PLAN',
  REFERENCE: 'REFERENCE',
  TECHNICAL: 'TECHNICAL',
  DOCUMENT: 'DOCUMENT',
  OTHER: 'OTHER',
} as const;

export type FileCategory = typeof FileCategory[keyof typeof FileCategory];

export interface DesignPhaseFile {
  id: number;
  designPhaseId: number;
  customerId: number;
  customerName: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  fileCategory: FileCategory;
  description?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesignFileUploadRequest {
  designPhaseId?: number;
  customerId?: number;
  fileCategory?: FileCategory;
  description?: string;
}

// Legacy interface for compatibility
export interface DesignFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface DesignFileUpload {
  file: File;
  description?: string;
  category: 'plan' | 'design' | 'reference' | 'other';
}

// Validation types
export interface DesignPhaseValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Progress tracking types
export interface DesignProgress {
  overallProgress: number;
  designCompletionPercentage: number;
  revisionCount: number;
  lastActivity: string;
  nextMilestone?: string;
  estimatedCompletion?: string;
}

// Client communication types
export interface ClientCommunication {
  id: string;
  type: 'submission' | 'feedback' | 'meeting' | 'approval' | 'revision';
  content: string;
  timestamp: string;
  sentBy: string;
  attachments?: DesignFile[];
}

// Design phase summary for lists
export interface DesignPhaseSummary {
  id: number;
  customerId: number;
  customerName: string;
  designStatus: DesignStatus;
  staffAssignedName?: string;
  designCompletionPercentage: number;
  revisionCount: number;
  meetingScheduled?: string;
  submittedToClient: boolean;
  clientApprovalDate?: string;
  createdAt: string;
  updatedAt: string;
}
