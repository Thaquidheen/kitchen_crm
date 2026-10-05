import React from 'react';
import type { QuotationJobStatus } from './types';

export const JOB_STATUS: Record<QuotationJobStatus, { label: string; st: string }> = {
  WAITING: { label: 'Waiting', st: 'draft' },
  IN_PROGRESS: { label: 'In progress', st: 'lead' },
  COMPLETED: { label: 'Completed', st: 'confirmed' },
  CANCELLED: { label: 'Removed', st: 'lost' },
};

export const JobStatusPill: React.FC<{ status: QuotationJobStatus }> = ({ status }) => {
  const s = JOB_STATUS[status] ?? JOB_STATUS.WAITING;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10.5px] font-semibold whitespace-nowrap"
      style={{ background: `var(--st-${s.st}-bg)`, color: `var(--st-${s.st}-fg)` }}
    >
      <span className="w-[5px] h-[5px] rounded-full" style={{ background: `var(--st-${s.st}-fg)` }} />
      {s.label}
    </span>
  );
};

export const fmtDay = (iso?: string | null): string =>
  iso ? new Date(iso.length > 10 ? iso : iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const fmtDayTime = (iso?: string | null): string =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
    : '';
