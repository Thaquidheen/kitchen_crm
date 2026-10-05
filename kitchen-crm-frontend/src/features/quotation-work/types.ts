import type { DesignPriority } from '@/features/design/types';

export type QuotationJobStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type QuotationWorkPriority = DesignPriority;
/** Why a job is in someone's bell. */
export type QuotationFeedKind = 'NEW' | 'CHANGED' | 'OVERDUE' | 'COMPLETED';

/** A quotation as the work board names it — never carries amounts. */
export interface QuotationRef {
  id: number;
  quotationNumber: string;
  projectName?: string | null;
  versionNumber?: number | null;
  status?: string | null;
  createdAt?: string | null;
}

/** A customer's quotation handed to one person to prepare. */
export interface QuotationJob {
  id: number;
  customerId: number;
  customerName: string;
  customerPlace?: string | null;
  customerStatus?: string | null;
  assigneeId: number;
  assigneeName?: string | null;
  status: QuotationJobStatus;
  priority: QuotationWorkPriority;
  dueDate?: string | null;
  overdue: boolean;
  note?: string | null;
  /** Place in the assignee's queue, 1 = first (open jobs only). */
  position?: number | null;
  assignedByName?: string | null;
  assignedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  completedByName?: string | null;
  /** The quotation handed in (completed jobs). */
  quotation?: QuotationRef | null;
  /** The customer's quotations, newest first (open jobs). */
  customerQuotations?: QuotationRef[];
  newForAssignee?: boolean;
  assigneeNews?: string | null;
  newlyCompleted?: boolean;
  feedKind?: QuotationFeedKind | null;
}

export interface QuotationWorkMe {
  userId: number;
  /** Admin or Admin staff: sees the whole board, assigns, sets priority and order. */
  canManage: boolean;
  openCount: number;
}

export interface QuotationAssignee {
  id: number;
  name: string;
  /** SALES | DESIGNER | ADMIN_STAFF, or ADMIN for a super admin. */
  staffType?: string | null;
  openCount: number;
  overdue: number;
}

export interface UnassignedQuotationCustomer {
  customerId: number;
  customerName: string;
  customerPlace?: string | null;
}

export interface QuotationWorkFeed {
  count: number;
  jobs: QuotationJob[];
}
