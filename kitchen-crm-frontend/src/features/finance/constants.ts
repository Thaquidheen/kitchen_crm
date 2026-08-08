/** Client-specified expense suggestions — shown in the expense-name combobox; free text is allowed. */
export const FINANCE_EXPENSE_SUGGESTIONS = [
  'Ss Cabinet',
  'Wood cabinet',
  'Ss door',
  'Wood door',
  'Glass door',
  'Installation',
  'Transportation',
  'Light',
  'Incentive',
  'Light fabrication',
  'Ebco',
  'Hafele',
  'Hettich',
  'Kessebohmer',
  'Higold',
  'Blum',
] as const;

export const MODE_LABEL: Record<string, string> = {
  CASH_IN_HAND: 'Cash in Hand',
  CASH_IN_ACCOUNT: 'Cash in Account',
};

/** Status-pill tokens per mode: C/H = grey-blue, C/A = blue. */
export const MODE_ST: Record<string, string> = {
  CASH_IN_HAND: 'draft',
  CASH_IN_ACCOUNT: 'lead',
};

/** Indian formatting for money — lakh grouping, no decimals for whole rupees. */
export const inr = (n?: number | null) => {
  const v = Number(n ?? 0);
  return (
    '₹' +
    v.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: Number.isInteger(v) ? 0 : 2,
    })
  );
};

export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const todayIso = () => {
  const now = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
};
