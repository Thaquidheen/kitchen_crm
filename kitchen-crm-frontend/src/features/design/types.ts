/**
 * Design jobs: a customer's design, assigned to a Designer-type staff member and ordered in that
 * designer's queue by an admin. Wire contract of /api/v1/design-jobs.
 */

export type StaffType = 'SALES' | 'DESIGNER' | 'ADMIN_STAFF';

export type DesignerStatus = 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';

/** Existing design_phase statuses (only values the backend enum already has). */
export type DesignStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'PENDING_SUPERADMIN_APPROVAL'
  | 'APPROVED_BY_ADMIN'
  | 'SUBMITTED'
  | 'FEEDBACK_RECEIVED'
  | 'REVISION_REQUIRED'
  | 'APPROVED'
  | 'FROZEN'
  | 'CANCELLED';

export type DesignPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface DesignNote {
  id: number;
  authorUserId?: number | null;
  authorName?: string | null;
  /** true = the designer wrote it, false = an admin. */
  fromDesigner: boolean;
  message: string;
  createdAt: string;
}

export interface DesignFile {
  id: number;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileSize?: number | null;
  fileType?: string | null;
  fileCategory?: string | null;
  description?: string | null;
  uploadedBy?: string | null;
  createdAt?: string | null;
}

export interface DesignJob {
  id: number;
  customerId: number;
  customerName: string;
  customerPlace?: string | null;
  designerId?: number | null;
  designerName?: string | null;
  status: DesignStatus;
  queuePosition?: number | null;
  dueDate?: string | null;
  priority: DesignPriority;
  brief?: string | null;
  revisionCount: number;
  assignedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  completionSeenAt?: string | null;
  updatedAt?: string | null;
  overdue: boolean;
  newForDesigner: boolean;
  newForAdmin: boolean;
  unreadForAdmin: number;
  unreadForDesigner: number;
  noteCount: number;
  fileCount: number;
  latestNote?: DesignNote | null;
  notes?: DesignNote[];
  /** Detail responses only. */
  files?: DesignFile[];
}

export interface DesignerSummary {
  id: number;
  name: string;
  designerStatus?: DesignerStatus | null;
  waiting: number;
  inProgress: number;
  changesRequested: number;
  awaitingReview: number;
  overdue: number;
  activeCount: number;
  currentJobId?: number | null;
  currentCustomerName?: string | null;
}

export interface DesignMe {
  userId: number;
  staffType?: StaffType | null;
  designerStatus?: DesignerStatus | null;
  designer: boolean;
}

export interface UnassignedDesignCustomer {
  customerId: number;
  customerName: string;
  customerPlace?: string | null;
}

export interface DesignFeed {
  count: number;
  jobs: DesignJob[];
}
