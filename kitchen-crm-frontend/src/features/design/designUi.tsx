/** Labels, colours and small display helpers for design jobs (shared by every design screen). */
import React from 'react';
import { DraftingCompass, FileText, Image as ImageIcon, Paperclip } from 'lucide-react';
import { fileUrl } from '@/utils/fileUrl';
import { fileKind, opensInBrowser } from './designFiles';
import type { DesignJob, DesignOrigin, DesignPriority, DesignStatus, DesignerStatus, StaffType } from './types';

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

/** The current version is not approved yet: with the designer, or with the admin for review. */
export const isOpenDesign = (s: DesignStatus) => isDesignerWork(s) || s === 'PENDING_SUPERADMIN_APPROVAL';

/** The current version is approved: a quotation can be made from this design. */
export const isApprovedDesign = (s: DesignStatus) =>
  s === 'APPROVED_BY_ADMIN' || s === 'SUBMITTED' || s === 'FEEDBACK_RECEIVED' || s === 'APPROVED' || s === 'FROZEN';

export const ORIGIN_LABEL: Record<DesignOrigin, string> = {
  DESIGNER: 'Designed here',
  UPLOADED: 'Uploaded',
};

/** "V2". Designs made before versions existed are version 1. */
export const versionLabel = (v?: number | null) => `V${v && v > 0 ? v : 1}`;

/** The icon for a design or plan file, by what kind of file its name says it is. */
export const FileKindIcon: React.FC<{ name?: string | null; size?: number }> = ({ name, size = 14 }) => {
  const kind = fileKind(name);
  if (kind === 'pdf') {return <FileText size={size} className="text-primary-600 shrink-0" />;}
  if (kind === 'image') {return <ImageIcon size={size} className="text-primary-600 shrink-0" />;}
  if (kind === 'cad') {return <DraftingCompass size={size} className="text-primary-600 shrink-0" />;}
  return <Paperclip size={size} className="text-text-500 shrink-0" />;
};

/**
 * How to link a stored file: a PDF or an image opens in a new tab; anything else (a CAD drawing,
 * a zip) is saved to the computer under the name it was uploaded with.
 */
export const fileLinkProps = (file: { fileUrl: string; originalFileName: string }) =>
  opensInBrowser(file.originalFileName)
    ? { href: fileUrl(file.fileUrl), target: '_blank', rel: 'noreferrer' }
    : { href: fileUrl(file.fileUrl), download: file.originalFileName };

/**
 * What moving a customer to Quotation Stage needs, given their design (null = none saved).
 * Mirrors the server rule so the status window can ask for the design before the request is made.
 */
export type QuotationGate = 'READY' | 'NEEDS_DESIGN' | 'WITH_DESIGNER';
export const quotationGate = (job: Pick<DesignJob, 'status'> | null | undefined): QuotationGate => {
  if (!job) {return 'NEEDS_DESIGN';}
  if (isApprovedDesign(job.status)) {return 'READY';}
  if (isOpenDesign(job.status)) {return 'WITH_DESIGNER';}
  return 'NEEDS_DESIGN';
};

/** A redesign pulls the customer back into Design — except from these stages, where only the design reopens. */
export const redesignKeepsStage = (customerStatus?: string | null) =>
  customerStatus === 'DESIGN_STAGE' || customerStatus === 'CONFIRMED' || customerStatus === 'LOST';

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
  if (job.newForDesigner) {
    const docs = job.planDocumentCount ?? 0;
    const withDocs = docs > 0 ? ` · ${docs} plan document${docs === 1 ? '' : 's'}` : '';
    // A second or later version is a redesign of a design that was already approved.
    if ((job.version ?? 1) > 1 && isDesignerWork(job.status)) {
      return `Redesign requested (${versionLabel(job.version)})${job.brief ? `: ${job.brief}` : ''}${withDocs}`;
    }
    return `New design assigned to you${withDocs}`;
  }
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
