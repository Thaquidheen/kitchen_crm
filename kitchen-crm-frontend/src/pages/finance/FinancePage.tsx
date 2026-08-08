/**
 * FinancePage — Income & Expenses index (super-admin only): every tracked customer
 * with total / received / balance / expenses / margin, plus "Start Finance" for a
 * customer not tracked yet.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Plus, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import {
  useGetFinanceListQuery,
  useGetEligibleFinanceCustomersQuery,
  useCreateFinanceMutation,
} from '@/features/finance/financeAPI';
import { inr } from '@/features/finance/constants';
import { getFinanceDetailRoute } from '@/routes/routes.config';

const thClass = 'px-3 py-[9px] text-left text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500';

const initialsOf = (name?: string) =>
  (name ?? '')
    .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

export function FinancePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [custSearch, setCustSearch] = useState('');
  const [picked, setPicked] = useState<any>(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [committedCH, setCommittedCH] = useState('');
  const [committedCA, setCommittedCA] = useState('');
  const [notes, setNotes] = useState('');

  const { data: listData, isLoading } = useGetFinanceListQuery({ search: search || undefined, page: 0, size: 100 });
  const rows = listData?.content ?? [];
  const totalElements = listData?.totalElements ?? 0;

  const { data: eligible = [] } = useGetEligibleFinanceCustomersQuery(
    { search: custSearch || undefined },
    { skip: !createOpen }
  );
  const [createFinance, { isLoading: isCreating }] = useCreateFinanceMutation();

  const totals = useMemo(() => {
    let booked = 0;
    let received = 0;
    let pending = 0;
    rows.forEach((r) => {
      booked += Number(r.totalAmount ?? 0);
      received += Number(r.receivedTotal ?? 0);
      pending += Math.max(0, Number(r.totalBalance ?? 0));
    });
    return { booked, received, pending };
  }, [rows]);

  const openCreate = () => {
    setPicked(null);
    setCustSearch('');
    setTotalAmount('');
    setCommittedCH('');
    setCommittedCA('');
    setNotes('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!picked) return;
    const total = Number(totalAmount);
    if (!total || total <= 0) {
      toast.error('Enter the total amount');
      return;
    }
    try {
      const res = await createFinance({
        customerId: picked.id,
        totalAmount: total,
        committedCashInHand: Number(committedCH) || 0,
        committedCashInAccount: Number(committedCA) || 0,
        notes: notes.trim() || undefined,
      }).unwrap();
      if (res?.success === false) {
        toast.error(res?.message || 'Failed to start finance tracking');
        return;
      }
      toast.success('Finance tracking started');
      setCreateOpen(false);
      const financeId = res?.data?.financeId;
      if (financeId) navigate(getFinanceDetailRoute(financeId));
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to start finance tracking');
    }
  };

  const chip = (label: string, value: string) => (
    <div className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border border-background-600 bg-background-800">
      <span className="text-[12.5px] font-medium text-text-700 whitespace-nowrap">{label}</span>
      <span className="text-[13px] font-[650] tabular-nums text-text-900 whitespace-nowrap">{value}</span>
    </div>
  );

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">Income &amp; Expenses</h1>
            <span className="text-xs font-[650] px-[9px] py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
              {totalElements}
            </span>
          </div>
          <p className="mt-[5px] mb-0 text-[13px] text-text-700">
            Customer money in, money out, and margin — balances calculate automatically.
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={openCreate}
          className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold"
        >
          <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
            <Plus size={14} />
          </span>
          Start Finance
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        {chip('Customers tracked', String(totalElements))}
        {chip('Total booked', inr(totals.booked))}
        {chip('Received', inr(totals.received))}
        {chip('Pending', inr(totals.pending))}
      </div>

      {/* Table card */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <div className="relative flex-1 min-w-[200px] max-w-[420px]">
            <Search size={15} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by customer, place or phone…"
              className="w-full h-[34px] pl-[34px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={`${thClass} pl-3.5`}>Customer</th>
                <th className={thClass}>Total amount</th>
                <th className={thClass}>Received</th>
                <th className={thClass}>Balance</th>
                <th className={thClass}>Expenses</th>
                <th className={thClass}>Margin</th>
                <th className="px-3.5 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 w-[70px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-600">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-3.5 py-4">
                        <div className="h-4 bg-background-700 rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Wallet className="w-8 h-8 mx-auto mb-2 text-text-500" />
                    <p className="m-0 text-[13px] text-text-600">
                      {search ? 'No customers match this filter.' : 'No customers tracked yet.'}
                    </p>
                    {!search && (
                      <button
                        onClick={openCreate}
                        className="mt-3 btn-raised-accent inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] text-[12.5px] font-semibold"
                      >
                        <Plus size={13} />
                        Start Finance
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const over = Number(r.totalBalance) < 0;
                  const pct =
                    Number(r.totalAmount) > 0
                      ? Math.min(100, Math.round((Number(r.receivedTotal) / Number(r.totalAmount)) * 100))
                      : 0;
                  return (
                    <tr
                      key={r.financeId}
                      onClick={() => navigate(getFinanceDetailRoute(r.financeId))}
                      className="hover:bg-background-700 transition-colors cursor-pointer"
                    >
                      <td className="px-3.5 py-[13px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-[9px] bg-background-600 border border-background-500 flex items-center justify-center text-[11px] font-[650] text-text-700 shrink-0">
                            {initialsOf(r.customerName)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-semibold text-text-900 whitespace-nowrap overflow-hidden text-ellipsis">
                              {r.customerName}
                            </div>
                            <div className="text-[11.5px] text-text-500 whitespace-nowrap">
                              {[r.customerPlace, r.customerContact].filter(Boolean).join(' · ') || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-[13px] text-[13px] font-[650] text-text-900 tabular-nums whitespace-nowrap">
                        {inr(r.totalAmount)}
                      </td>
                      <td className="px-3 py-[13px] min-w-[140px]">
                        <div className="text-[12.5px] text-text-800 tabular-nums whitespace-nowrap">
                          {inr(r.receivedTotal)}
                          <span className="text-text-500"> · {r.paymentCount} pmt{Number(r.paymentCount) === 1 ? '' : 's'}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-background-600 overflow-hidden mt-1.5 max-w-[130px]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 100 ? 'var(--st-confirmed-fg)' : 'var(--color-primary-600)',
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-[13px] whitespace-nowrap">
                        {over ? (
                          <span
                            className="inline-flex px-2 py-[3px] rounded-full text-[11px] font-semibold tabular-nums"
                            style={{ background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }}
                          >
                            Over-collected {inr(Math.abs(Number(r.totalBalance)))}
                          </span>
                        ) : (
                          <span className="text-[12.5px] text-text-800 tabular-nums">{inr(r.totalBalance)}</span>
                        )}
                      </td>
                      <td className="px-3 py-[13px] text-[12.5px] text-text-800 tabular-nums whitespace-nowrap">
                        {inr(r.expenseTotal)}
                      </td>
                      <td
                        className="px-3 py-[13px] text-[13px] font-[650] tabular-nums whitespace-nowrap"
                        style={{ color: Number(r.totalMargin) >= 0 ? 'var(--st-confirmed-fg)' : 'var(--st-lost-fg)' }}
                      >
                        {inr(r.totalMargin)}
                      </td>
                      <td className="px-3.5 py-[13px]">
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(getFinanceDetailRoute(r.financeId));
                            }}
                            title="Open"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center px-3.5 py-3 border-t border-background-600">
          <span className="text-[12.5px] text-text-600">
            Showing {rows.length} of {totalElements} customers
          </span>
        </div>
      </div>

      {/* Start Finance */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Start Finance" size="md">
        <ModalBody>
          <p className="text-[12.5px] text-text-600 mb-4 -mt-1">
            Balances calculate automatically as payments are recorded.
          </p>

          <div className="mb-4">
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Customer *</label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none" />
              <input
                type="text"
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                placeholder="Search by name…"
                className="w-full h-[34px] pl-[32px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
              />
            </div>
            <div className="border border-background-600 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              {eligible.length === 0 ? (
                <div className="px-3 py-4 text-center text-[12.5px] text-text-500">
                  No untracked customers found.
                </div>
              ) : (
                eligible.map((c) => {
                  const sel = picked?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPicked(c)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 border-t border-background-600 first:border-t-0 text-left transition-colors ${
                        sel ? 'bg-primary-600/[0.08]' : 'hover:bg-background-700'
                      }`}
                    >
                      <span className="w-7 h-7 rounded-[9px] bg-background-600 border border-background-500 flex items-center justify-center text-[10px] font-[650] text-text-700 shrink-0">
                        {initialsOf(c.name)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-text-900 truncate">{c.name}</span>
                        <span className="block text-[11.5px] text-text-500 truncate">
                          {[c.place, c.contact].filter(Boolean).join(' · ') || '—'}
                        </span>
                      </span>
                      <span
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
                        style={
                          sel
                            ? { background: 'var(--color-primary-600)', color: 'var(--on-accent)' }
                            : { border: '1.5px solid var(--color-background-500)', color: 'transparent' }
                        }
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="mb-4">
            <Input
              label="Total Amount (₹) *"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="e.g. 1200000"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
            <Input
              label="Committed Cash in Hand (₹)"
              type="number"
              value={committedCH}
              onChange={(e) => setCommittedCH(e.target.value)}
              placeholder="0"
            />
            <Input
              label="Committed Cash in Account (₹)"
              type="number"
              value={committedCA}
              onChange={(e) => setCommittedCA(e.target.value)}
              placeholder="0"
            />
          </div>

          <TextArea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={!picked || isCreating}>
            {isCreating ? 'Starting…' : 'Start Finance'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default FinancePage;
