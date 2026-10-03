import React from 'react';

// Semantic quotation status pills, same palette as the Quotations list (shared --st-* tokens).
// COMPLETE is the stored value; it is shown as "Completed".
const QSTATUS: Record<string, { st: string; label: string }> = {
  DRAFT: { st: 'draft', label: 'Draft' },
  ON_HOLD: { st: 'nego', label: 'On Hold' },
  COMPLETE: { st: 'confirmed', label: 'Completed' },
  APPROVED: { st: 'lead', label: 'Approved' },
  CANCELLED: { st: 'lost', label: 'Cancelled' },
  PENDING: { st: 'potential', label: 'Pending' },
};

export const quotationStatusLabel = (status?: string | null): string =>
  (status && QSTATUS[status]?.label) || status || '—';

export const QuotationStatusPill: React.FC<{ status?: string | null }> = ({ status }) => {
  const m = (status && QSTATUS[status]) || { st: '', label: status ?? '—' };
  const fg = m.st ? `var(--st-${m.st}-fg)` : 'var(--color-text-700)';
  const bg = m.st ? `var(--st-${m.st}-bg)` : 'var(--color-background-700)';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: bg, color: fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: fg }} />
      {m.label}
    </span>
  );
};

const INR_EXACT = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Exact quotation value in rupees and paise ("₹21,10,800.76"); "—" when the value is absent. */
export const formatQuotationValue = (amount: unknown): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '—';
  }
  const n = Number(amount);
  return Number.isFinite(n) ? INR_EXACT.format(n) : '—';
};

export default QuotationStatusPill;
