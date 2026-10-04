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

/** How a version came to be: made by an assigned designer, or uploaded as an existing design. */
export type DesignOrigin = 'DESIGNER' | 'UPLOADED';

export interface DesignNote {
  id: number;
  authorUserId?: number | null;
  authorName?: string | null;
  /** true = the designer wrote it, false = an admin. */
  fromDesigner: boolean;
  message: string;
  createdAt: string;
  /** Design version the note was written under. */
  versionNo?: number | null;
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
  /** Design version the file belongs to. */
  versionNo?: number | null;
  createdAt?: string | null;
}

/** One version of a customer's design with the design files that belong to it. */
export interface DesignVersion {
  versionNo: number;
  origin: DesignOrigin;
  designerName?: string | null;
  /** The brief for version 1; what had to change for later versions. */
  requestNote?: string | null;
  requestedByName?: string | null;
  requestedAt?: string | null;
  completedAt?: string | null;
  /** Null while the version is open (or was cancelled). */
  approvedAt?: string | null;
  approvedByName?: string | null;
  files: DesignFile[];
}

export interface DesignJob {
  id: number;
  customerId: number;
  customerName: string;
  customerPlace?: string | null;
  /** The customer's pipeline stage (CustomerStatus value). */
  customerStatus?: string | null;
  designerId?: number | null;
  designerName?: string | null;
  status: DesignStatus;
  /** Version in work, or the last one approved. */
  version?: number | null;
  origin?: DesignOrigin | null;
  /** When the current version was approved; null while it is open. */
  approvedAt?: string | null;
  approvedByName?: string | null;
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
  /** Design files of the current version (plan documents are counted apart). */
  fileCount: number;
  planDocumentCount?: number | null;
  /** Newest design PDF of the current version — the file a quotation is made from. */
  currentDesignFile?: DesignFile | null;
  latestNote?: DesignNote | null;
  notes?: DesignNote[];
  /** Detail responses only: design files of the current version. */
  files?: DesignFile[];
  /** Detail responses only: plan documents from the admin. */
  planDocuments?: DesignFile[];
  /** Detail responses only: every version, oldest first. */
  versions?: DesignVersion[];
}

/** A customer at Quotation Stage or later, with their design — or none when it was never uploaded. */
export interface DesignLibraryRow {
  customerId: number;
  customerName: string;
  customerPlace?: string | null;
  customerStatus: string;
  design: DesignJob | null;
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
  /** May assign designers and attach plan documents: admins, and staff whose type is Admin staff. */
  canAssign?: boolean;
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
