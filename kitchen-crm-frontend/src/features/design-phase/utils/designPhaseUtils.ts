/**
 * Design Phase utility functions and constants
 */

import {
  DesignStatus,
} from '../types';
import type {
  DesignStatusOption,
  DesignerOption,
  DesignPhase,
  DesignWorkflowStep,
} from '../types';

export const DESIGN_STATUS_OPTIONS: DesignStatusOption[] = [
  {
    value: DesignStatus.PLANNING,
    label: 'Planning',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500',
    description: 'Initial planning phase',
  },
  {
    value: DesignStatus.IN_PROGRESS,
    label: 'In Progress',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500',
    description: 'Design work in progress',
  },
  {
    value: DesignStatus.PENDING_SUPERADMIN_APPROVAL,
    label: 'Pending Approval',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
    description: 'Submitted for superadmin approval',
  },
  {
    value: DesignStatus.APPROVED_BY_ADMIN,
    label: 'Approved by Admin',
    color: 'bg-green-500/20 text-green-400 border-green-500',
    description: 'Approved by superadmin, ready to submit to client',
  },
  {
    value: DesignStatus.SUBMITTED,
    label: 'Submitted',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500',
    description: 'Submitted to client for review',
  },
  {
    value: DesignStatus.FEEDBACK_RECEIVED,
    label: 'Feedback Received',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
    description: 'Client feedback received',
  },
  {
    value: DesignStatus.REVISION_REQUIRED,
    label: 'Revision Required',
    color: 'bg-red-500/20 text-red-400 border-red-500',
    description: 'Revisions needed',
  },
  {
    value: DesignStatus.APPROVED,
    label: 'Approved',
    color: 'bg-green-500/20 text-green-400 border-green-500',
    description: 'Client approved design',
  },
  {
    value: DesignStatus.FROZEN,
    label: 'Frozen',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500',
    description: 'Design frozen, ready for production',
  },
  {
    value: DesignStatus.CANCELLED,
    label: 'Cancelled',
    color: 'bg-gray-600/20 text-gray-500 border-gray-600',
    description: 'Design cancelled',
  },
];

export const DESIGNER_OPTIONS: DesignerOption[] = [
  { value: 'designer1', label: 'John Designer', active: true },
  { value: 'designer2', label: 'Sarah Creative', active: true },
  { value: 'designer3', label: 'Mike Architect', active: true },
  { value: 'designer4', label: 'Lisa Interior', active: false },
];

export const DESIGN_PHASE_FORMATTERS = {
  currency: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  },

  date: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  },

  dateTime: (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  designStatus: (status: DesignStatus): string => {
    const option = DESIGN_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
  },

  progress: (percentage: number): string => {
    return `${percentage}%`;
  },
};

export const DESIGN_PHASE_CONSTANTS = {
  MAX_DESIGN_LENGTH: 5000,
  MAX_REQUIREMENTS_LENGTH: 2000,
  MAX_FEEDBACK_LENGTH: 1000,
  MAX_NOTES_LENGTH: 1000,
  MAX_MEETING_PURPOSE_LENGTH: 500,
  MAX_ATTENDEES_LENGTH: 500,
  MIN_PROGRESS: 0,
  MAX_PROGRESS: 100,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export const DESIGN_PHASE_VALIDATION_MESSAGES = {
  REQUIRED_FIELDS: {
    CUSTOMER_ID: 'Customer is required',
    DESIGN_REQUIREMENTS: 'Design requirements are required',
    DESIGNER_ASSIGNED: 'Designer assignment is required',
    DESIGN_CONTENT: 'Design content is required',
    MEETING_DATETIME: 'Meeting date and time is required',
    CLIENT_FEEDBACK: 'Client feedback is required',
  },
  INVALID_FORMAT: {
    MEETING_DATETIME: 'Meeting must be scheduled for future date',
    PROGRESS_PERCENTAGE: 'Progress percentage must be between 0 and 100',
    FILE_SIZE: 'File size must be less than 10MB',
    FILE_TYPE: 'Invalid file type',
  },
  LENGTH_LIMITS: {
    DESIGN_REQUIREMENTS: 'Design requirements cannot exceed 2000 characters',
    DESIGN_CONTENT: 'Design content cannot exceed 5000 characters',
    CLIENT_FEEDBACK: 'Client feedback cannot exceed 1000 characters',
    MEETING_NOTES: 'Meeting notes cannot exceed 1000 characters',
  },
};

export const DESIGN_PHASE_SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'designStatus', label: 'Status' },
  { value: 'designerAssigned', label: 'Designer' },
  { value: 'customerName', label: 'Customer Name' },
  { value: 'designCompletionPercentage', label: 'Progress' },
  { value: 'meetingScheduled', label: 'Meeting Date' },
];

export const DESIGN_PHASE_FILTER_OPTIONS = {
  designStatuses: DESIGN_STATUS_OPTIONS.map(opt => ({
    value: opt.value,
    label: opt.label,
  })),
  designers: DESIGNER_OPTIONS.filter(opt => opt.active).map(opt => ({
    value: opt.value,
    label: opt.label,
  })),
};

export const DESIGN_WORKFLOW_STEPS: DesignWorkflowStep[] = [
  {
    id: 'requirements',
    name: 'Requirements Gathering',
    status: 'pending',
    description: 'Collect and analyze client requirements',
  },
  {
    id: 'planning',
    name: 'Design Planning',
    status: 'pending',
    description: 'Create initial design plan and layout',
  },
  {
    id: 'design',
    name: 'Design Creation',
    status: 'pending',
    description: 'Create detailed design drawings',
  },
  {
    id: 'review',
    name: 'Internal Review',
    status: 'pending',
    description: 'Internal team review and approval',
  },
  {
    id: 'submission',
    name: 'Client Submission',
    status: 'pending',
    description: 'Submit design to client for review',
  },
  {
    id: 'feedback',
    name: 'Client Feedback',
    status: 'pending',
    description: 'Collect and process client feedback',
  },
  {
    id: 'revision',
    name: 'Design Revision',
    status: 'pending',
    description: 'Implement client feedback and revisions',
  },
  {
    id: 'approval',
    name: 'Client Approval',
    status: 'pending',
    description: 'Obtain final client approval',
  },
  {
    id: 'freeze',
    name: 'Design Freeze',
    status: 'pending',
    description: 'Freeze design and prepare for production',
  },
];

/**
 * Utility functions for design phase operations
 */
export class DesignPhaseUtils {
  /**
   * Gets design status display info
   */
  static getDesignStatusInfo(status: DesignStatus): DesignStatusOption | undefined {
    return DESIGN_STATUS_OPTIONS.find(opt => opt.value === status);
  }

  /**
   * Gets designer display info
   */
  static getDesignerInfo(designer: string): DesignerOption | undefined {
    return DESIGNER_OPTIONS.find(opt => opt.value === designer);
  }

  /**
   * Calculates overall progress based on design phase data
   */
  static calculateOverallProgress(designPhase: DesignPhase): number {
    const statusProgress = this.getStatusProgress(designPhase.designStatus);
    const completionProgress = designPhase.designCompletionPercentage || 0;
    
    // Weighted average: 70% status progress, 30% completion percentage
    return Math.round((statusProgress * 0.7) + (completionProgress * 0.3));
  }

  /**
   * Gets progress percentage based on design status
   */
  static getStatusProgress(status: DesignStatus): number {
    const statusProgressMap: Record<DesignStatus, number> = {
      [DesignStatus.PLANNING]: 10,
      [DesignStatus.IN_PROGRESS]: 30,
      [DesignStatus.PENDING_SUPERADMIN_APPROVAL]: 40,
      [DesignStatus.APPROVED_BY_ADMIN]: 45,
      [DesignStatus.SUBMITTED]: 50,
      [DesignStatus.FEEDBACK_RECEIVED]: 60,
      [DesignStatus.REVISION_REQUIRED]: 70,
      [DesignStatus.APPROVED]: 90,
      [DesignStatus.FROZEN]: 100,
      [DesignStatus.CANCELLED]: 0,
    };

    return statusProgressMap[status] || 0;
  }

  /**
   * Checks if design phase can be frozen
   */
  static canFreezeDesign(designPhase: DesignPhase): boolean {
    return (
      designPhase.designStatus === DesignStatus.APPROVED &&
      designPhase.clientApprovalDate != null &&
      !designPhase.designAmountFrozen
    );
  }

  /**
   * Checks if design phase can be submitted to client
   */
  static canSubmitToClient(designPhase: DesignPhase): boolean {
    return (
      designPhase.designStatus === DesignStatus.IN_PROGRESS &&
      designPhase.design != null &&
      designPhase.design.trim().length > 0
    );
  }

  /**
   * Checks if meeting can be scheduled
   */
  static canScheduleMeeting(designPhase: DesignPhase): boolean {
    return designPhase.designStatus !== DesignStatus.CANCELLED && 
           designPhase.designStatus !== DesignStatus.FROZEN;
  }

  /**
   * Gets next workflow step
   */
  static getNextWorkflowStep(currentStatus: DesignStatus): DesignWorkflowStep | null {
    const statusStepMap: Record<DesignStatus, string> = {
      [DesignStatus.PLANNING]: 'planning',
      [DesignStatus.IN_PROGRESS]: 'design',
      [DesignStatus.PENDING_SUPERADMIN_APPROVAL]: 'review',
      [DesignStatus.APPROVED_BY_ADMIN]: 'submission',
      [DesignStatus.SUBMITTED]: 'feedback',
      [DesignStatus.FEEDBACK_RECEIVED]: 'revision',
      [DesignStatus.REVISION_REQUIRED]: 'revision',
      [DesignStatus.APPROVED]: 'freeze',
      [DesignStatus.FROZEN]: 'freeze',
      [DesignStatus.CANCELLED]: 'requirements',
    };

    const nextStepId = statusStepMap[currentStatus];
    return DESIGN_WORKFLOW_STEPS.find(step => step.id === nextStepId) || null;
  }

  /**
   * Formats design phase for display
   */
  static formatDesignPhase(designPhase: DesignPhase): string {
    return `${designPhase.customerName} - ${this.getDesignStatusInfo(designPhase.designStatus)?.label}`;
  }

  /**
   * Gets estimated completion time based on status
   */
  static getEstimatedCompletionTime(status: DesignStatus): string {
    const timeEstimates: Record<DesignStatus, string> = {
      [DesignStatus.PLANNING]: '2-3 days',
      [DesignStatus.IN_PROGRESS]: '5-7 days',
      [DesignStatus.PENDING_SUPERADMIN_APPROVAL]: '1-2 days',
      [DesignStatus.APPROVED_BY_ADMIN]: '1 day',
      [DesignStatus.SUBMITTED]: '1-2 days',
      [DesignStatus.FEEDBACK_RECEIVED]: '2-3 days',
      [DesignStatus.REVISION_REQUIRED]: '3-5 days',
      [DesignStatus.APPROVED]: '1 day',
      [DesignStatus.FROZEN]: 'Completed',
      [DesignStatus.CANCELLED]: 'N/A',
    };

    return timeEstimates[status] || 'Unknown';
  }

  /**
   * Validates design phase form data
   */
  static validateDesignPhaseForm(formData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.customerId || formData.customerId <= 0) {
      errors.push('Customer is required');
    }

    if (!formData.designRequirements || formData.designRequirements.trim() === '') {
      errors.push('Design requirements are required');
    }

    if (!formData.designerAssigned || formData.designerAssigned.trim() === '') {
      errors.push('Designer assignment is required');
    }

    if (formData.designRequirements && formData.designRequirements.length > DESIGN_PHASE_CONSTANTS.MAX_REQUIREMENTS_LENGTH) {
      errors.push(`Design requirements cannot exceed ${DESIGN_PHASE_CONSTANTS.MAX_REQUIREMENTS_LENGTH} characters`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Formats currency amount for display
   */
  static formatAmount(amount: number): string {
    return DESIGN_PHASE_FORMATTERS.currency(amount);
  }

  /**
   * Formats date for display
   */
  static formatDate(dateString: string): string {
    return DESIGN_PHASE_FORMATTERS.date(dateString);
  }

  /**
   * Formats date and time for display
   */
  static formatDateTime(dateString: string): string {
    return DESIGN_PHASE_FORMATTERS.dateTime(dateString);
  }

  /**
   * Gets priority level based on status and age
   */
  static getPriorityLevel(designPhase: DesignPhase): 'low' | 'medium' | 'high' | 'urgent' {
    const daysSinceUpdate = this.getDaysSinceUpdate(designPhase.updatedAt);
    
    if (designPhase.designStatus === DesignStatus.REVISION_REQUIRED && daysSinceUpdate > 3) {
      return 'urgent';
    }
    
    if (designPhase.designStatus === DesignStatus.SUBMITTED && daysSinceUpdate > 5) {
      return 'high';
    }
    
    if (designPhase.designStatus === DesignStatus.IN_PROGRESS && daysSinceUpdate > 7) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Calculates days since last update
   */
  static getDaysSinceUpdate(updatedAt: string): number {
    const updateDate = new Date(updatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updateDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
