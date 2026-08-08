/**
 * IncomeTab — the payments ledger: 1st/2nd/… rows in date order with mode pills,
 * receipts, and a running balance so "when paid, how much pending" reads at a glance.
 */

import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useDeleteFinancePaymentMutation } from '../financeAPI';
import type { FinancePayment, FinanceSummary } from '../types';
import { MODE_LABEL, MODE_ST, fmtDate, inr } from '../constants';
import { PaymentFormModal } from './PaymentFormModal';
import { ReceiptsCell } from './ReceiptsCell';

const thClass = 'px-3 py-[9px] text-left text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500';

const ordinal = (n: number) => {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
};

interface IncomeTabProps {
  summary: FinanceSummary;
}

export const IncomeTab: React.FC<IncomeTabProps> = ({ summary }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FinancePayment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinancePayment | null>(null);
  const [deletePayment, { isLoading: isDeleting }] = useDeleteFinancePaymentMutation();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePayment(deleteTarget.id).unwrap();
      toast.success('Payment deleted');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete payment');
    }
    setDeleteTarget(null);
  };

  let running = summary.totalAmount;

  return (
    <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 flex-wrap">
        <h3 className="m-0 text-[14px] font-[650] text-text-900">Payments received</h3>
        <span className="text-[11px] font-[650] px-2 py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
          {summary.payments.length}
        </span>
        <span className="text-[12px] text-text-600 tabular-nums">
          Committed: C/H {inr(summary.committedCashInHand)} · C/A {inr(summary.committedCashInAccount)}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="btn-raised-accent inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] text-[12.5px] font-semibold"
        >
          <Plus size={13} />
          Add Payment
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-t border-background-600 bg-background-700">
              <th className={`${thClass} pl-4 w-[60px]`}>#</th>
              <th className={thClass}>Date</th>
              <th className={thClass}>Amount</th>
              <th className={thClass}>Mode</th>
              <th className={thClass}>Note</th>
              <th className={thClass}>Receipts</th>
              <th className={thClass}>Balance after</th>
              <th className="px-4 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 w-[80px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-background-600">
            {summary.payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <p className="m-0 text-[13px] text-text-600">No payments recorded yet.</p>
                </td>
              </tr>
            ) : (
              summary.payments.map((p, idx) => {
                running = running - p.amount;
                const bal = running;
                return (
                  <tr key={p.id} className="hover:bg-background-700 transition-colors">
                    <td className="px-4 py-3 text-[12.5px] font-[650] text-text-700 tabular-nums">{ordinal(idx + 1)}</td>
                    <td className="px-3 py-3 text-[12.5px] text-text-800 tabular-nums whitespace-nowrap">
                      {fmtDate(p.paymentDate)}
                    </td>
                    <td className="px-3 py-3 text-[13px] font-[650] text-text-900 tabular-nums whitespace-nowrap">
                      {inr(p.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
                        style={{ background: `var(--st-${MODE_ST[p.mode]}-bg)`, color: `var(--st-${MODE_ST[p.mode]}-fg)` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--st-${MODE_ST[p.mode]}-fg)` }} />
                        {MODE_LABEL[p.mode]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[12.5px] text-text-700 max-w-[200px]">
                      <div className="truncate" title={[p.note, p.comment].filter(Boolean).join(' — ')}>
                        {p.note || '—'}
                      </div>
                      {p.comment && (
                        <div className="truncate text-[11.5px] text-text-500" title={p.comment}>
                          {p.comment}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <ReceiptsCell owner="payments" ownerId={p.id} receipts={p.receipts} />
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] font-[650] tabular-nums whitespace-nowrap"
                      style={{ color: bal < 0 ? 'var(--st-lost-fg)' : 'var(--color-text-700)' }}
                    >
                      {inr(bal)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-0.5">
                        <button
                          onClick={() => {
                            setEditing(p);
                            setFormOpen(true);
                          }}
                          title="Edit payment"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          title="Delete payment"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {summary.payments.length > 0 && (
            <tfoot>
              <tr className="border-t border-background-600 bg-background-700">
                <td className="px-4 py-3 text-[12px] font-[650] uppercase tracking-[0.05em] text-text-500" colSpan={2}>
                  Total received
                </td>
                <td className="px-3 py-3 text-[13px] font-[650] text-text-900 tabular-nums">{inr(summary.receivedTotal)}</td>
                <td className="px-3 py-3 text-[12px] text-text-600 tabular-nums" colSpan={3}>
                  C/H {inr(summary.receivedCashInHand)} · C/A {inr(summary.receivedCashInAccount)}
                </td>
                <td
                  className="px-3 py-3 text-[13px] font-[650] tabular-nums"
                  style={{ color: summary.totalBalance < 0 ? 'var(--st-lost-fg)' : 'var(--color-text-900)' }}
                >
                  {inr(summary.totalBalance)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <PaymentFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        financeId={summary.financeId}
        payment={editing}
      />

      <ConfirmDialog
        isOpen={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Payment"
        message={deleteTarget ? `Delete the ${inr(deleteTarget.amount)} payment of ${fmtDate(deleteTarget.paymentDate)}? Its receipts are removed too.` : ''}
        confirmText={isDeleting ? 'Deleting…' : 'Delete'}
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
