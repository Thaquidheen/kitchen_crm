/**
 * ExpensesTab — expense lines with the C/H–C/A split and per-line released/pending,
 * the vendor payment-release ledger, vendor totals, and the TOTAL MARGIN box.
 */

import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useDeleteFinanceExpenseMutation, useDeleteFinanceReleaseMutation } from '../financeAPI';
import type { FinanceExpense, FinanceRelease, FinanceSummary } from '../types';
import { MODE_LABEL, MODE_ST, fmtDate, inr } from '../constants';
import { ExpenseFormModal } from './ExpenseFormModal';
import { ReleaseFormModal } from './ReleaseFormModal';
import { ReceiptsCell } from './ReceiptsCell';

const thClass = 'px-3 py-[9px] text-left text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500';

/**
 * The C/H · C/A pair under a margin figure. Each side is coloured on its own sign: one bucket can
 * be in profit while the other is not, and averaging that into one colour hides it.
 */
const MarginSplit: React.FC<{ ch?: number; ca?: number; align?: 'left' | 'right' }> = ({
  ch,
  ca,
  align = 'left',
}) => (
  <div
    className={`mt-1 text-[11px] tabular-nums text-text-600 ${align === 'right' ? 'text-right' : ''}`}
  >
    {(
      [
        ['CASH_IN_HAND', ch],
        ['CASH_IN_ACCOUNT', ca],
      ] as const
    ).map(([mode, v]) => (
      <span key={mode} className={align === 'right' ? 'ml-2.5' : 'mr-2.5'}>
        <span style={{ color: `var(--st-${MODE_ST[mode]}-fg)` }}>{mode === 'CASH_IN_HAND' ? 'C/H' : 'C/A'}</span>{' '}
        <span style={(v ?? 0) < 0 ? { color: 'var(--st-lost-fg)' } : undefined}>{inr(v ?? 0)}</span>
      </span>
    ))}
  </div>
);

interface ExpensesTabProps {
  summary: FinanceSummary;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({ summary }) => {
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FinanceExpense | null>(null);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<FinanceExpense | null>(null);
  const [releaseFormOpen, setReleaseFormOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<FinanceRelease | null>(null);
  const [deleteReleaseTarget, setDeleteReleaseTarget] = useState<FinanceRelease | null>(null);

  const [deleteExpense, { isLoading: isDeletingExpense }] = useDeleteFinanceExpenseMutation();
  const [deleteRelease, { isLoading: isDeletingRelease }] = useDeleteFinanceReleaseMutation();

  const handleDeleteExpense = async () => {
    if (!deleteExpenseTarget) return;
    try {
      await deleteExpense(deleteExpenseTarget.id).unwrap();
      toast.success('Expense deleted');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete expense');
    }
    setDeleteExpenseTarget(null);
  };

  const handleDeleteRelease = async () => {
    if (!deleteReleaseTarget) return;
    try {
      await deleteRelease(deleteReleaseTarget.id).unwrap();
      toast.success('Release deleted');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete release');
    }
    setDeleteReleaseTarget(null);
  };

  const iconBtn =
    'w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors';

  return (
    <div className="flex flex-col gap-4">
      {/* Expense lines */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 flex-wrap">
          <h3 className="m-0 text-[14px] font-[650] text-text-900">Expense lines</h3>
          <span className="text-[11px] font-[650] px-2 py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
            {summary.expenses.length}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => {
              setEditingExpense(null);
              setExpenseFormOpen(true);
            }}
            className="btn-raised-accent inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] text-[12.5px] font-semibold"
          >
            <Plus size={13} />
            Add Expense
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={`${thClass} pl-4`}>Expense</th>
                <th className={thClass}>Vendor</th>
                <th className={thClass}>Amount</th>
                <th className={thClass}>C/H %</th>
                <th className={thClass}>C/A %</th>
                <th className={thClass}>C/H Amt</th>
                <th className={thClass}>C/A Amt</th>
                <th className={thClass}>Quotation</th>
                <th className={thClass}>Released</th>
                <th className={thClass}>Pending</th>
                <th className={thClass}>Files</th>
                <th className="px-4 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 w-[80px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-600">
              {summary.expenses.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center">
                    <p className="m-0 text-[13px] text-text-600">No expenses added yet.</p>
                  </td>
                </tr>
              ) : (
                summary.expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-background-700 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-semibold text-text-900">{e.title}</div>
                      {(e.expenseDate || e.note) && (
                        <div className="text-[11.5px] text-text-500 truncate max-w-[160px]" title={e.note}>
                          {e.expenseDate ? fmtDate(e.expenseDate) : ''}
                          {e.expenseDate && e.note ? ' · ' : ''}
                          {e.note ?? ''}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[12.5px] text-text-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                      {e.vendorName ?? <span className="text-text-500">—</span>}
                    </td>
                    <td className="px-3 py-3 text-[13px] font-[650] text-text-900 tabular-nums whitespace-nowrap">
                      {inr(e.amount)}
                    </td>
                    <td className="px-3 py-3 text-[12.5px] text-text-700 tabular-nums">{e.cashInHandPct}%</td>
                    <td className="px-3 py-3 text-[12.5px] text-text-700 tabular-nums">{e.cashInAccountPct}%</td>
                    <td className="px-3 py-3 text-[12.5px] text-text-800 tabular-nums whitespace-nowrap">{inr(e.cashInHandAmount)}</td>
                    <td className="px-3 py-3 text-[12.5px] text-text-800 tabular-nums whitespace-nowrap">{inr(e.cashInAccountAmount)}</td>
                    <td className="px-3 py-3">
                      {e.quotationNumber ? (
                        <span
                          className="inline-flex px-2 py-[3px] rounded-full text-[11px] font-semibold whitespace-nowrap"
                          style={{ background: 'var(--st-design-bg)', color: 'var(--st-design-fg)' }}
                          title={e.quotationTotal != null ? inr(e.quotationTotal) : undefined}
                        >
                          {e.quotationNumber}
                        </span>
                      ) : (
                        <span className="text-[12.5px] text-text-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[12.5px] text-text-800 tabular-nums whitespace-nowrap">{inr(e.releasedAmount)}</td>
                    <td className="px-3 py-3">
                      {e.pendingAmount > 0 ? (
                        <span
                          className="inline-flex px-2 py-[3px] rounded-full text-[11px] font-semibold tabular-nums whitespace-nowrap"
                          style={{ background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }}
                        >
                          {inr(e.pendingAmount)}
                        </span>
                      ) : (
                        <span
                          className="inline-flex px-2 py-[3px] rounded-full text-[11px] font-semibold whitespace-nowrap"
                          style={{ background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }}
                        >
                          Cleared
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <ReceiptsCell owner="expenses" ownerId={e.id} receipts={e.receipts} allowQuote />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-0.5">
                        <button
                          onClick={() => {
                            setEditingExpense(e);
                            setExpenseFormOpen(true);
                          }}
                          title="Edit expense"
                          className={iconBtn}
                        >
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteExpenseTarget(e)} title="Delete expense" className={iconBtn}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {summary.expenses.length > 0 && (
              <tfoot>
                <tr className="border-t border-background-600 bg-background-700">
                  <td className="px-4 py-3 text-[12px] font-[650] uppercase tracking-[0.05em] text-text-500">Totals</td>
                  <td />
                  <td className="px-3 py-3 text-[13px] font-[650] text-text-900 tabular-nums">{inr(summary.expenseTotal)}</td>
                  <td colSpan={5} />
                  <td className="px-3 py-3 text-[12.5px] font-[650] text-text-900 tabular-nums">{inr(summary.releasedTotal)}</td>
                  <td className="px-3 py-3 text-[12.5px] font-[650] text-text-900 tabular-nums">
                    {inr(summary.expenseTotal - summary.releasedTotal)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Payment releases */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 flex-wrap">
          <h3 className="m-0 text-[14px] font-[650] text-text-900">Payment releases</h3>
          <span className="text-[11px] font-[650] px-2 py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
            {summary.releases.length}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => {
              setEditingRelease(null);
              setReleaseFormOpen(true);
            }}
            className="btn-raised-accent inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] text-[12.5px] font-semibold"
          >
            <Plus size={13} />
            Release Payment
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={`${thClass} pl-4`}>Vendor</th>
                <th className={thClass}>Amount</th>
                <th className={thClass}>Mode</th>
                <th className={thClass}>Date</th>
                <th className={thClass}>Linked expense</th>
                <th className={thClass}>Receipts</th>
                <th className="px-4 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 w-[80px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-600">
              {summary.releases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <p className="m-0 text-[13px] text-text-600">No payments released to vendors yet.</p>
                  </td>
                </tr>
              ) : (
                summary.releases.map((r) => (
                  <tr key={r.id} className="hover:bg-background-700 transition-colors">
                    <td className="px-4 py-3 text-[13px] font-semibold text-text-900">{r.vendorName}</td>
                    <td className="px-3 py-3 text-[13px] font-[650] text-text-900 tabular-nums whitespace-nowrap">
                      {inr(r.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
                        style={{ background: `var(--st-${MODE_ST[r.mode]}-bg)`, color: `var(--st-${MODE_ST[r.mode]}-fg)` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--st-${MODE_ST[r.mode]}-fg)` }} />
                        {MODE_LABEL[r.mode]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[12.5px] text-text-800 tabular-nums whitespace-nowrap">
                      {fmtDate(r.releaseDate)}
                    </td>
                    <td className="px-3 py-3">
                      {r.expenseTitle ? (
                        <span className="inline-flex px-2 py-[3px] rounded-full text-[11px] font-semibold bg-background-700 border border-background-600 text-text-700 whitespace-nowrap">
                          {r.expenseTitle}
                        </span>
                      ) : (
                        <span className="text-[12.5px] text-text-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <ReceiptsCell owner="releases" ownerId={r.id} receipts={r.receipts} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-0.5">
                        <button
                          onClick={() => {
                            setEditingRelease(r);
                            setReleaseFormOpen(true);
                          }}
                          title="Edit release"
                          className={iconBtn}
                        >
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteReleaseTarget(r)} title="Delete release" className={iconBtn}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Per-vendor balances: expensed vs released, with a status pill. The bar shows how
            much of the expensed amount has been released; over-released renders the bar red. */}
        {summary.vendorTotals.length > 0 && (
          <div className="px-4 py-3 border-t border-background-600">
            <div className="text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 mb-2">
              Vendor balances
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {summary.vendorTotals.map((v) => {
                const pct =
                  v.totalExpensed > 0
                    ? Math.min(100, Math.round((v.totalReleased / v.totalExpensed) * 100))
                    : v.totalReleased > 0
                      ? 100
                      : 0;
                const over = v.balance < 0;
                const cleared = v.balance === 0 && v.totalExpensed > 0;
                return (
                  <div
                    key={v.vendorId}
                    className="rounded-[12px] border border-background-600 bg-background-700/50 px-3.5 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-semibold text-text-900 truncate">{v.vendorName}</span>
                      <span
                        className="inline-flex px-2 py-[2.5px] rounded-full text-[10.5px] font-semibold tabular-nums whitespace-nowrap"
                        style={
                          over
                            ? { background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }
                            : cleared
                              ? { background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }
                              : { background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }
                        }
                      >
                        {over ? `${inr(-v.balance)} over-released` : cleared ? 'Cleared' : `${inr(v.balance)} pending`}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-background-600 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: over ? 'var(--st-lost-fg)' : 'var(--st-confirmed-fg)',
                        }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] text-text-600 tabular-nums">
                      Released {inr(v.totalReleased)} of {inr(v.totalExpensed)} expensed
                      {' · '}{v.expenseCount} {v.expenseCount === 1 ? 'line' : 'lines'}, {v.releaseCount}{' '}
                      {v.releaseCount === 1 ? 'release' : 'releases'}
                    </div>
                    {/* Cash vs bank per vendor. The two can disagree in sign — settling a cash
                        expense from the bank leaves one bucket owed and the other over — so each
                        side is coloured on its own balance, not on the combined one. */}
                    <div className="mt-1.5 pt-1.5 border-t border-background-600 grid grid-cols-2 gap-2 text-[10.5px] tabular-nums">
                      {(
                        [
                          ['CASH_IN_HAND', v.expensedCashInHand, v.releasedCashInHand, v.balanceCashInHand],
                          ['CASH_IN_ACCOUNT', v.expensedCashInAccount, v.releasedCashInAccount, v.balanceCashInAccount],
                        ] as const
                      ).map(([mode, expensed, released, bal]) => (
                        <div key={mode} className="min-w-0">
                          <span
                            className="inline-flex px-1.5 py-[1px] rounded-md font-semibold"
                            style={{
                              background: `var(--st-${MODE_ST[mode]}-bg)`,
                              color: `var(--st-${MODE_ST[mode]}-fg)`,
                            }}
                          >
                            {MODE_LABEL[mode]}
                          </span>
                          <div className="mt-0.5 text-text-600">
                            {inr(released ?? 0)} of {inr(expensed ?? 0)}
                          </div>
                          <div
                            style={{
                              color:
                                (bal ?? 0) < 0
                                  ? 'var(--st-lost-fg)'
                                  : (bal ?? 0) === 0
                                    ? 'var(--st-confirmed-fg)'
                                    : 'var(--st-potential-fg)',
                            }}
                          >
                            {(bal ?? 0) < 0
                              ? `${inr(-(bal ?? 0))} over`
                              : (bal ?? 0) === 0
                                ? 'Cleared'
                                : `${inr(bal ?? 0)} pending`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* TOTAL MARGIN */}
      <div
        className="rounded-[14px] px-5 py-4 border"
        style={{
          borderColor: 'color-mix(in oklab, var(--color-primary-600) 35%, transparent)',
          background: 'color-mix(in oklab, var(--color-primary-600) 6%, transparent)',
        }}
      >
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500">Total Margin</div>
            <div
              className="text-[26px] font-[650] tabular-nums mt-0.5"
              style={{ color: summary.totalMargin >= 0 ? 'var(--st-confirmed-fg)' : 'var(--st-lost-fg)' }}
            >
              {inr(summary.totalMargin)}
            </div>
            <div className="text-[11.5px] text-text-600 mt-0.5">Total amount − total expenses</div>
            <MarginSplit ch={summary.totalMarginCashInHand} ca={summary.totalMarginCashInAccount} />
          </div>
          <div className="flex-1" />
          <div className="text-right">
            <div className="text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500">Cash margin</div>
            <div
              className="text-[16px] font-[650] tabular-nums mt-0.5"
              style={{ color: summary.collectedMargin >= 0 ? 'var(--st-confirmed-fg)' : 'var(--st-lost-fg)' }}
            >
              {inr(summary.collectedMargin)}
            </div>
            <div className="text-[11.5px] text-text-600 mt-0.5">Received − released</div>
            <MarginSplit
              ch={summary.collectedMarginCashInHand}
              ca={summary.collectedMarginCashInAccount}
              align="right"
            />
          </div>
        </div>
      </div>

      <ExpenseFormModal
        isOpen={expenseFormOpen}
        onClose={() => {
          setExpenseFormOpen(false);
          setEditingExpense(null);
        }}
        financeId={summary.financeId}
        customerId={summary.customerId}
        expense={editingExpense}
      />

      <ReleaseFormModal
        isOpen={releaseFormOpen}
        onClose={() => {
          setReleaseFormOpen(false);
          setEditingRelease(null);
        }}
        financeId={summary.financeId}
        expenses={summary.expenses}
        vendorTotals={summary.vendorTotals}
        release={editingRelease}
      />

      <ConfirmDialog
        isOpen={deleteExpenseTarget != null}
        onClose={() => setDeleteExpenseTarget(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message={
          deleteExpenseTarget
            ? `Delete "${deleteExpenseTarget.title}" (${inr(deleteExpenseTarget.amount)})? Linked releases stay but lose the link.`
            : ''
        }
        confirmText={isDeletingExpense ? 'Deleting…' : 'Delete'}
        type="danger"
        isLoading={isDeletingExpense}
      />

      <ConfirmDialog
        isOpen={deleteReleaseTarget != null}
        onClose={() => setDeleteReleaseTarget(null)}
        onConfirm={handleDeleteRelease}
        title="Delete Release"
        message={
          deleteReleaseTarget
            ? `Delete the ${inr(deleteReleaseTarget.amount)} release to ${deleteReleaseTarget.vendorName}?`
            : ''
        }
        confirmText={isDeletingRelease ? 'Deleting…' : 'Delete'}
        type="danger"
        isLoading={isDeletingRelease}
      />
    </div>
  );
};
