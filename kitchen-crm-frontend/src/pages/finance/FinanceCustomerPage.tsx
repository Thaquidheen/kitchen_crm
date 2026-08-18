/**
 * FinanceCustomerPage — one customer's money story, and the Income | Expenses tabs. One summary
 * query powers everything.
 *
 * The KPI strip is two rows: money with the CUSTOMER (total, received, balance, total margin) and
 * money with the VENDORS (expenses, released, outstanding, extra, cash margin). Every figure
 * carries its Cash-in-Hand / Cash-in-Account split, and each tile is tinted with its own --st-*
 * token so a figure is found by colour rather than by reading nine labels.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Pencil } from 'lucide-react';
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

  /**
   * One figure in the KPI strip. `tone` is an --st-* status token: it tints the tile background
   * and colours the value, so a figure can be found by colour instead of by reading labels.
   *
   * The C/H · C/A lines are deliberately NOT colour-coded. On a tinted tile the mode colours
   * (C/H = draft grey, C/A = lead blue) would collide with the tile's own tint — blue-on-blue on
   * the Total Expenses tile. Inside a tile the prefix does the work; MODE_ST keeps its meaning in
   * the tables, where the background is neutral.
   */
  const kpi = (
    label: string,
    value: string,
    opts?: {
      tone?: string;
      sub?: string;
      split?: { ch: number; ca: number };
      negative?: boolean;
      warn?: boolean;
    }
  ) => {
    const { tone, sub, split, negative, warn } = opts ?? {};
    return (
      <div
        className="px-4 py-3 min-w-0"
        style={{ background: tone ? `var(--st-${tone}-bg)` : 'var(--color-background-800)' }}
      >
        <div className="text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 truncate">{label}</div>
        <div
          className="text-[16px] font-[650] mt-[3px] tabular-nums whitespace-nowrap"
          style={{
            color: negative
              ? 'var(--st-lost-fg)'
              : tone
                ? `var(--st-${tone}-fg)`
                : 'var(--color-text-900)',
          }}
        >
          {value}
        </div>
        {split && (
          <div className="mt-1 text-[11px] tabular-nums leading-[1.55] text-text-600">
            <div className="flex justify-between gap-2">
              <span>C/H</span>
              <span style={split.ch < 0 ? { color: 'var(--st-lost-fg)' } : undefined}>{inr(split.ch)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>C/A</span>
              <span style={split.ca < 0 ? { color: 'var(--st-lost-fg)' } : undefined}>{inr(split.ca)}</span>
            </div>
          </div>
        )}
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
  };

  // Every new field is read with ?? 0: the frontend ships alongside the backend, but if the jar is
  // ever rolled back these fields vanish from the payload and the tiles must not print "undefined".
  const n = (v: number | undefined) => v ?? 0;

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

        {/* KPI strip — row 1: money with the CUSTOMER */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px border-t border-background-600 bg-background-600">
          {kpi('Total Amount', inr(summary.totalAmount), {
            tone: 'design',
            split: { ch: n(summary.committedCashInHand), ca: n(summary.committedCashInAccount) },
          })}
          {kpi('Received', inr(summary.receivedTotal), {
            tone: 'quote',
            split: { ch: n(summary.receivedCashInHand), ca: n(summary.receivedCashInAccount) },
          })}
          {kpi('Balance', inr(summary.totalBalance), {
            tone: 'potential',
            split: { ch: n(summary.cashInHandBalance), ca: n(summary.cashInAccountBalance) },
            negative: summary.totalBalance < 0,
            warn: Boolean(summary.overCollected),
          })}
          {kpi('Total Margin', inr(summary.totalMargin), {
            tone: 'confirmed',
            split: {
              ch: n(summary.totalMarginCashInHand),
              ca: n(summary.totalMarginCashInAccount),
            },
            negative: summary.totalMargin < 0,
          })}
        </div>

        {/* KPI strip — row 2: money with the VENDORS */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-px border-t border-background-600 bg-background-600">
          {kpi('Total Expenses', inr(summary.expenseTotal), {
            tone: 'lead',
            split: { ch: n(summary.expenseCashInHand), ca: n(summary.expenseCashInAccount) },
          })}
          {kpi('Payment Released', inr(summary.releasedTotal), {
            tone: 'nego',
            split: { ch: n(summary.releasedCashInHand), ca: n(summary.releasedCashInAccount) },
          })}
          {kpi('Outstanding Expenses', inr(n(summary.outstandingTotal)), {
            tone: 'follow',
            split: {
              ch: n(summary.outstandingCashInHand),
              ca: n(summary.outstandingCashInAccount),
            },
          })}
          {/* Red only when there IS an over-release — a permanently red tile trains the eye to
              ignore it, which is the opposite of what a warning is for. */}
          {kpi('Extra Expenses', inr(n(summary.extraTotal)), {
            tone: n(summary.extraTotal) > 0 ? 'lost' : 'draft',
            split: { ch: n(summary.extraCashInHand), ca: n(summary.extraCashInAccount) },
            sub: n(summary.extraTotal) > 0 ? 'Released beyond expensed' : undefined,
          })}
          {kpi('Cash Margin', inr(summary.collectedMargin), {
            tone: 'confirmed',
            split: {
              ch: n(summary.collectedMarginCashInHand),
              ca: n(summary.collectedMarginCashInAccount),
            },
            negative: summary.collectedMargin < 0,
          })}
        </div>

        {/* The three header figures are stored independently and never validated against each
            other, so say so rather than letting the margin split silently fail to add up. */}
        {summary.committedSplitMismatch && (
          <div
            className="flex items-start gap-2 px-4 py-2.5 border-t border-background-600 text-[11.5px] leading-[1.5]"
            style={{ background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }}
          >
            <AlertTriangle size={14} className="mt-[1px] shrink-0" />
            <span>
              Committed C/H {inr(summary.committedCashInHand)} + C/A {inr(summary.committedCashInAccount)} ={' '}
              {inr(n(summary.committedCashInHand) + n(summary.committedCashInAccount))}, which does not match the
              total amount {inr(summary.totalAmount)}. The C/H and C/A margin figures will not add up to Total
              Margin until the header is corrected.
            </span>
          </div>
        )}
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
