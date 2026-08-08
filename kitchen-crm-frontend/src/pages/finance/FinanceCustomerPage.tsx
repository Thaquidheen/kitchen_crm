/**
 * FinanceCustomerPage — one customer's money story: header KPI strip (total,
 * received with the C/H–C/A split, balances, expenses, TOTAL MARGIN) and the
 * Income | Expenses tabs. One summary query powers everything.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { useGetFinanceSummaryQuery, useUpdateFinanceHeaderMutation } from '@/features/finance/financeAPI';
import { IncomeTab } from '@/features/finance/components/IncomeTab';
import { ExpensesTab } from '@/features/finance/components/ExpensesTab';
import { inr } from '@/features/finance/constants';
import { ROUTES } from '@/routes/routes.config';

const initialsOf = (name?: string) =>
  (name ?? '')
    .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

export function FinanceCustomerPage() {
  const navigate = useNavigate();
  const { financeId } = useParams<{ financeId: string }>();
  const id = Number(financeId);

  const { data: summary, isLoading, error } = useGetFinanceSummaryQuery(id, { skip: !id });
  const [updateHeader, { isLoading: isSavingHeader }] = useUpdateFinanceHeaderMutation();

  const [tab, setTab] = useState<'income' | 'expenses'>('income');
  const [headerOpen, setHeaderOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');
  const [committedCH, setCommittedCH] = useState('');
  const [committedCA, setCommittedCA] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (headerOpen && summary) {
      setTotalAmount(String(summary.totalAmount ?? 0));
      setCommittedCH(String(summary.committedCashInHand ?? 0));
      setCommittedCA(String(summary.committedCashInAccount ?? 0));
      setNotes(summary.notes ?? '');
    }
  }, [headerOpen, summary]);

  const handleSaveHeader = async () => {
    try {
      const res = await updateHeader({
        financeId: id,
        totalAmount: Number(totalAmount) || 0,
        committedCashInHand: Number(committedCH) || 0,
        committedCashInAccount: Number(committedCA) || 0,
        notes: notes.trim() || undefined,
      }).unwrap();
      if (res?.success === false) {
        toast.error(res?.message || 'Failed to save');
        return;
      }
      toast.success('Header updated');
      setHeaderOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-background-800 border border-background-600 rounded-[14px]" />
          <div className="h-28 bg-background-800 border border-background-600 rounded-[14px]" />
          <div className="h-64 bg-background-800 border border-background-600 rounded-[14px]" />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="w-full">
        <div className="bg-background-800 border border-background-600 rounded-[14px] px-6 py-12 text-center">
          <p className="m-0 text-[13.5px] text-text-700">Finance record not found.</p>
          <button
            onClick={() => navigate(ROUTES.FINANCE)}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Income &amp; Expenses
          </button>
        </div>
      </div>
    );
  }

  const kpi = (
    label: string,
    value: string,
    sub?: string,
    color?: string,
    warn?: boolean
  ) => (
    <div className="bg-background-800 px-4 py-3 min-w-0">
      <div className="text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 truncate">{label}</div>
      <div
        className="text-[16px] font-[650] mt-[3px] tabular-nums whitespace-nowrap"
        style={{ color: color ?? 'var(--color-text-900)' }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] text-text-500 mt-0.5 tabular-nums leading-[1.5]" title={sub}>
          {sub}
        </div>
      )}
      {warn && (
        <span
          className="inline-flex mt-1 px-2 py-[2px] rounded-full text-[10.5px] font-semibold"
          style={{ background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }}
        >
          Over-collected
        </span>
      )}
    </div>
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden mb-4">
        <div className="flex items-center gap-3 px-4 py-3.5 flex-wrap">
          <button
            onClick={() => navigate(ROUTES.FINANCE)}
            title="Back"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-700 hover:text-text-900 transition-colors shrink-0"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="w-10 h-10 rounded-[11px] bg-background-600 border border-background-500 flex items-center justify-center text-[13px] font-[650] text-text-700 shrink-0">
            {initialsOf(summary.customerName)}
          </div>
          <div className="min-w-0">
            <h1 className="m-0 text-[17px] font-[650] tracking-[-0.01em] text-text-900 truncate">{summary.customerName}</h1>
            <p className="m-0 mt-0.5 text-[12px] text-text-600 truncate" title={summary.customerAddress}>
              {[summary.customerPlace, summary.customerContact].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setHeaderOpen(true)}
            className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Header
          </button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-px border-t border-background-600 bg-background-600">
          {kpi('Total Amount', inr(summary.totalAmount))}
          {kpi(
            'Received',
            inr(summary.receivedTotal),
            `C/H ${inr(summary.receivedCashInHand)} · C/A ${inr(summary.receivedCashInAccount)}`
          )}
          {kpi(
            'Balance',
            inr(summary.totalBalance),
            `C/H bal ${inr(summary.cashInHandBalance)} · C/A bal ${inr(summary.cashInAccountBalance)}`,
            summary.totalBalance < 0 ? 'var(--st-lost-fg)' : undefined,
            Boolean(summary.overCollected)
          )}
          {kpi('Expenses', inr(summary.expenseTotal), `Released ${inr(summary.releasedTotal)}`)}
          {kpi(
            'Total Margin',
            inr(summary.totalMargin),
            'Total − expenses',
            summary.totalMargin >= 0 ? 'var(--st-confirmed-fg)' : 'var(--st-lost-fg)'
          )}
          {kpi(
            'Cash Margin',
            inr(summary.collectedMargin),
            'Received − released',
            summary.collectedMargin >= 0 ? undefined : 'var(--st-lost-fg)'
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(
          [
            { key: 'income', label: 'Income', count: summary.payments.length },
            { key: 'expenses', label: 'Expenses', count: summary.expenses.length },
          ] as const
        ).map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
              style={
                active
                  ? {
                      borderColor: 'var(--color-primary-600)',
                      background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
                    }
                  : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' }
              }
            >
              <span className={`text-[12.5px] whitespace-nowrap ${active ? 'font-semibold text-text-900' : 'font-medium text-text-700'}`}>
                {t.label}
              </span>
              <span className={`text-[13px] font-[650] tabular-nums ${active ? 'text-primary-600' : 'text-text-900'}`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'income' ? <IncomeTab summary={summary} /> : <ExpensesTab summary={summary} />}

      {/* Edit header */}
      <Modal isOpen={headerOpen} onClose={() => setHeaderOpen(false)} title="Edit Finance Header" size="sm">
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Total Amount (₹) *"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3.5">
              <Input
                label="Committed C/H (₹)"
                type="number"
                value={committedCH}
                onChange={(e) => setCommittedCH(e.target.value)}
              />
              <Input
                label="Committed C/A (₹)"
                type="number"
                value={committedCA}
                onChange={(e) => setCommittedCA(e.target.value)}
              />
            </div>
            <TextArea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setHeaderOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveHeader} disabled={isSavingHeader}>
            {isSavingHeader ? 'Saving…' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default FinanceCustomerPage;
