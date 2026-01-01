/**
 * StatusBadge Component
 * Dynamic status badge based on status value
 */

import { Badge } from '../ui/Badge';
import type { BadgeVariant } from '../ui/Badge';

export type Status =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'in_progress'
  | 'cancelled'
  | 'draft'
  | 'published'
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'PENDING_SUPERADMIN_APPROVAL'
  | 'APPROVED_BY_ADMIN'
  | 'SUBMITTED'
  | 'FEEDBACK_RECEIVED'
  | 'REVISION_REQUIRED'
  | 'APPROVED'
  | 'FROZEN'
  | 'CANCELLED'
  | 'NOT_STARTED'
  | 'PRODUCTION'
  | 'SITE_PREPARATION'
  | 'DELIVERY'
  | 'INSTALLATION'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'ON_HOLD';

export interface StatusBadgeProps {
  status: Status | string;
  className?: string;
  variant?: BadgeVariant;
}

const statusConfig: Record<
  Status,
  { variant: BadgeVariant; label: string; dot?: boolean }
> = {
  active: { variant: 'success', label: 'Active', dot: true },
  inactive: { variant: 'danger', label: 'Inactive', dot: true },
  pending: { variant: 'warning', label: 'Pending', dot: true },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
  completed: { variant: 'success', label: 'Completed' },
  in_progress: { variant: 'info', label: 'In Progress', dot: true },
  cancelled: { variant: 'danger', label: 'Cancelled' },
  draft: { variant: 'default', label: 'Draft' },
  published: { variant: 'primary', label: 'Published' },
  // Design Phase Statuses
  PLANNING: { variant: 'default', label: 'Planning', dot: true },
  IN_PROGRESS: { variant: 'info', label: 'In Progress', dot: true },
  PENDING_SUPERADMIN_APPROVAL: { variant: 'warning', label: 'Pending Approval', dot: true },
  APPROVED_BY_ADMIN: { variant: 'success', label: 'Approved by Admin', dot: true },
  SUBMITTED: { variant: 'warning', label: 'Submitted', dot: true },
  FEEDBACK_RECEIVED: { variant: 'warning', label: 'Feedback Received', dot: true },
  REVISION_REQUIRED: { variant: 'danger', label: 'Revision Required', dot: true },
  APPROVED: { variant: 'success', label: 'Approved' },
  FROZEN: { variant: 'primary', label: 'Frozen' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
  // Production Installation Statuses
  NOT_STARTED: { variant: 'default', label: 'Not Started', dot: true },
  PRODUCTION: { variant: 'warning', label: 'Production', dot: true },
  SITE_PREPARATION: { variant: 'info', label: 'Site Preparation', dot: true },
  DELIVERY: { variant: 'info', label: 'Delivery', dot: true },
  INSTALLATION: { variant: 'warning', label: 'Installation', dot: true },
  QUALITY_CHECK: { variant: 'info', label: 'Quality Check', dot: true },
  COMPLETED: { variant: 'success', label: 'Completed' },
  ON_HOLD: { variant: 'warning', label: 'On Hold', dot: true },
};

export const StatusBadge = ({ status, className, variant }: StatusBadgeProps) => {
  const config =
    statusConfig[status as Status] ||
    statusConfig.draft;

  return (
    <Badge variant={variant || config.variant} dot={config.dot} className={className}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
