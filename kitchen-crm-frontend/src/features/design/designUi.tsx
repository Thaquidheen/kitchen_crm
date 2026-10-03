/** Labels, colours and small display helpers for design jobs (shared by every design screen). */
import React from 'react';
import type { DesignJob, DesignPriority, DesignStatus, DesignerStatus, StaffType } from './types';

export const STAFF_TYPE_LABEL: Record<StaffType, string> = {
  SALES: 'Sales',
  DESIGNER: 'Designer',
  ADMIN_STAFF: 'Admin staff',
};

/** User-facing names for the stored statuses (step 1 uses the first six). */
export const DESIGN_STATUS: Record<DesignStatus, { label: string; st: string }> = {
  PLANNING: { label: 'Waiting', st: 'draft' },
  IN_PROGRESS: { label: 'In progress', st: 'lead' },
  PENDING_SUPERADMIN_APPROVAL: { label: 'Completed · review', st: 'potential' },
  REVISION_REQUIRED: { label: 'Changes requested', st: 'nego' },
  APPROVED_BY_ADMIN: { label: 'Approved', st: 'confirmed' },
  CANCELLED: { label: 'Cancelled', st: 'lost' },
  SUBMITTED: { label: 'Sent to client', st: 'quote' },
  FEEDBACK_RECEIVED: { label: 'Client feedback', st: 'follow' },
  APPROVED: { label: 'Client approved', st: 'confirmed' },
  FROZEN: { label: 'Final', st: 'confirmed' },
};

export const DESIGNER_STATUS: Record<DesignerStatus, { label: string; color: string }> = {
  AVAILABLE: { label: 'Available', color: 'var(--st-confirmed-fg)' },
  BUSY: { label: 'Busy', color: 'var(--st-nego-fg)' },
  ON_LEAVE: { label: 'On leave', color: 'var(--st-lost-fg)' },
};

export const PRIORITY_LABEL: Record<DesignPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const PRIORITY_ST: Record<DesignPriority, string> = { LOW: 'draft', MEDIUM: 'lead', HIGH: 'nego', URGENT: 'lost' };

/** The designer still has work on these (queue + bell). */
export const isDesignerWork = (s: DesignStatus) => s === 'PLANNING' || s === 'IN_PROGRESS' || s === 'REVISION_REQUIRED';

export const DesignStatusPill: React.FC<{ status: DesignStatus }> = ({ status }) => {
  const m = DESIGN_STATUS[status] ?? { label: status, st: 'draft' };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: `var(--st-${m.st}-bg)`, color: `var(--st-${m.st}-fg)` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--st-${m.st}-fg)` }} />
      {m.label}
    </span>
  );
};

export const PriorityPill: React.FC<{ priority?: DesignPriority | null }> = ({ priority }) => {
  const p = priority ?? 'MEDIUM';
  return (
    <span
      className="inline-flex items-center px-2 py-[2px] rounded-full text-[10.5px] font-semibold whitespace-nowrap"
      style={{ background: `var(--st-${PRIORITY_ST[p]}-bg)`, color: `var(--st-${PRIORITY_ST[p]}-fg)` }}
    >
      {PRIORITY_LABEL[p]}
    </span>
  );
};

export const DesignerStatusDot: React.FC<{ status?: DesignerStatus | null; size?: number }> = ({ status, size = 8 }) => (
  <span
    className="inline-block rounded-full shrink-0"
    style={{
      width: size,
      height: size,
      background: status ? DESIGNER_STATUS[status].color : 'var(--color-background-500)',
    }}
    title={status ? DESIGNER_STATUS[status].label : 'Status not set'}
  />
);

/** "Due 12 Oct" / "Due today" / "Overdue · 2 Oct". */
export const dueText = (job: Pick<DesignJob, 'dueDate' | 'overdue'>): string | null => {
  if (!job.dueDate) {return null;}
  const d = new Date(job.dueDate + 'T00:00:00');
  const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (job.overdue) {return `Overdue · ${label}`;}
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() === today.getTime() ? 'Due today' : `Due ${label}`;
};

/** One line saying why a design is in someone's bell / reminders. */
export const designNewsText = (job: DesignJob, side: 'admin' | 'designer'): string => {
  const note = job.latestNote;
  if (side === 'admin') {
    if (job.newForAdmin) {return `Completed by ${job.designerName ?? 'the designer'} — review it`;}
    if (job.unreadForAdmin > 0 && note && note.fromDesigner) {return `${note.authorName ?? job.designerName ?? 'Designer'}: ${note.message}`;}
    if (job.overdue) {return `Overdue · ${job.designerName ?? 'designer'}`;}
    return DESIGN_STATUS[job.status]?.label ?? job.status;
  }
  if (job.newForDesigner && job.status === 'REVISION_REQUIRED') {return 'Changes requested by admin';}
  if (job.newForDesigner && job.status === 'APPROVED_BY_ADMIN') {return 'Approved by admin';}
  if (job.newForDesigner) {return 'New design assigned to you';}
  if (job.unreadForDesigner > 0 && note && !note.fromDesigner) {return `Admin: ${note.message}`;}
  if (job.overdue) {return 'Overdue';}
  const due = dueText(job);
  return due ?? DESIGN_STATUS[job.status]?.label ?? job.status;
};

/** Default due date offered when assigning: a week from today (yyyy-mm-dd, local). */
export const defaultDueDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};
