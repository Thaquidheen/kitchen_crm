/**
 * ReleaseFormModal — release a payment to a vendor: vendor select (+ inline "New vendor"),
 * amount, C/H | C/A mode, date, optional link to one of this customer's expense lines.
 *
 * Vendor-aware since V103: picking a vendor shows their expensed / released / balance strip for
 * this customer, prefills the amount with the open balance, groups the expense-line dropdown by
 * vendor, and warns (never blocks — the module's over-collection convention) when the amount
 * exceeds what was expensed.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGetActiveVendorsQuery } from '@/features/vendors/vendorsAPI';
import VendorFormModal from '@/features/vendors/components/VendorFormModal';
import { useAddFinanceReleaseMutation, useUpdateFinanceReleaseMutation } from '../financeAPI';
import type { FinanceExpense, FinanceRelease, PaymentMode, VendorTotal } from '../types';
import { MODE_LABEL, MODE_ST, inr, todayIso } from '../constants';

interface ReleaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  financeId: number;
  expenses: FinanceExpense[];
  /** Per-vendor expensed/released/balance for this customer (summary.vendorTotals). */
  vendorTotals?: VendorTotal[];
  release?: FinanceRelease | null;
}

export const ReleaseFormModal: React.FC<ReleaseFormModalProps> = ({
  isOpen,
  onClose,
  financeId,
  expenses,
  vendorTotals = [],
  release,
}) => {
  const [vendorId, setVendorId] = useState('');
  const [amount, setAmount] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);
  const [mode, setMode] = useState<PaymentMode>('CASH_IN_HAND');
  const [releaseDate, setReleaseDate] = useState(todayIso());
  const [expenseId, setExpenseId] = useState('');
  const [note, setNote] = useState('');
  const [vendorModalOpen, setVendorModalOpen] = useState(false);

  const { data: vendors = [] } = useGetActiveVendorsQuery(undefined, { skip: !isOpen });

  const [addRelease, { isLoading: isAdding }] = useAddFinanceReleaseMutation();
  const [updateRelease, { isLoading: isUpdating }] = useUpdateFinanceReleaseMutation();
  const busy = isAdding || isUpdating;

  useEffect(() => {
    if (isOpen) {
      setVendorId(release ? String(release.vendorId) : '');
      setAmount(release ? String(release.amount) : '');
      setAmountTouched(!!release); // editing: the stored amount is intentional, never overwrite
      setMode(release?.mode ?? 'CASH_IN_HAND');
      setReleaseDate(release?.releaseDate ?? todayIso());
      setExpenseId(release?.expenseId ? String(release.expenseId) : '');
      setNote(release?.note ?? '');
    }
  }, [isOpen, release]);

  const vendorTotal = useMemo(
    () => vendorTotals.find((v) => String(v.vendorId) === vendorId),
    [vendorTotals, vendorId]
  );

  /**
   * A vendor's money split by where it comes from. A release is wholly one bucket (mode is a
   * two-value enum), so the balance that matters when releasing is the SELECTED bucket's — not the
   * combined one. They routinely disagree: a vendor can sit at a flat ₹0 overall while being owed
   * from the bank and over-paid in cash, which the single figure hid completely.
   */
  const bucketOf = (vt: VendorTotal | undefined, m: PaymentMode) => {
    if (!vt) return null;
    return m === 'CASH_IN_HAND'
      ? {
          expensed: vt.expensedCashInHand ?? 0,
          released: vt.releasedCashInHand ?? 0,
          balance: vt.balanceCashInHand ?? 0,
        }
      : {
          expensed: vt.expensedCashInAccount ?? 0,
          released: vt.releasedCashInAccount ?? 0,
          balance: vt.balanceCashInAccount ?? 0,
        };
  };

  const selectedBucket = useMemo(() => bucketOf(vendorTotal, mode), [vendorTotal, mode]);

  // Prefill what is actually outstanding in the bucket being paid from, so the default is the
  // amount that clears THIS bucket rather than a combined figure that clears neither.
  const prefill = (vt: VendorTotal | undefined, m: PaymentMode) => {
    const b = bucketOf(vt, m);
    setAmount(b && b.balance > 0 ? String(b.balance) : '');
  };

  const pickVendor = (id: string) => {
    setVendorId(id);
    if (!amountTouched) prefill(vendorTotals.find((v) => String(v.vendorId) === id), mode);
  };

  // Switching bucket re-prefills, because the outstanding amount is bucket-specific.
  const pickMode = (m: PaymentMode) => {
    setMode(m);
    if (!amountTouched) prefill(vendorTotal, m);
  };

  // Vendor-aware grouping for the line dropdown: the picked vendor's lines first (with their
  // pending amounts), everything else under "Other lines". Never a hard filter — vendor-less
  // lines must stay linkable.
  const { vendorLines, otherLines } = useMemo(() => {
    const vid = vendorId ? Number(vendorId) : null;
    const mine = vid ? expenses.filter((ex) => ex.vendorId === vid) : [];
    const others = vid ? expenses.filter((ex) => ex.vendorId !== vid) : expenses;
    return { vendorLines: mine, otherLines: others };
  }, [expenses, vendorId]);

  const lineLabel = (ex: FinanceExpense) =>
    ex.pendingAmount > 0 ? `${ex.title} — ${inr(ex.pendingAmount)} pending` : `${ex.title} — cleared`;

  // Over-release: measured against the vendor balance, or the linked line's pending when a line
  // is chosen. Editing an existing release compares against balance + its own current amount so
  // resaving unchanged never warns about itself.
  const overWarning = useMemo(() => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return null;
    const selfAllowance = release && String(release.vendorId) === vendorId ? release.amount : 0;
    if (expenseId) {
      const line = expenses.find((ex) => String(ex.id) === expenseId);
      if (line) {
        const lineSelf = release && release.expenseId === line.id ? release.amount : 0;
        const room = line.pendingAmount + lineSelf;
        if (amt > room) return `${inr(amt - room)} more than this line's pending amount`;
      }
      return null;
    }
    // Measured against the SELECTED bucket: releasing from cash when only the bank side is
    // outstanding is exactly the mistake worth flagging, and a combined balance never catches it.
    if (selectedBucket) {
      const sameMode = release && release.mode === mode ? selfAllowance : 0;
      const room = selectedBucket.balance + sameMode;
      if (amt > room) {
        return `${inr(amt - room)} more than is outstanding for this vendor in ${MODE_LABEL[mode]}`;
      }
    }
    return null;
  }, [amount, selectedBucket, mode, expenseId, expenses, release, vendorId]);

  const handleSave = async () => {
    if (!vendorId) {
      toast.error('Pick the vendor');
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error('Enter an amount greater than zero');
      return;
    }
    const body = {
      vendorId: Number(vendorId),
      amount: amt,
      mode,
      releaseDate,
      expenseId: expenseId ? Number(expenseId) : null,
      note: note.trim() || undefined,
    };
    try {
      const res = release
        ? await updateRelease({ releaseId: release.id, ...body }).unwrap()
        : await addRelease({ financeId, ...body }).unwrap();
      if (res?.success === false) {
        toast.error(res?.message || 'Failed to save release');
        return;
      }
      toast.success(release ? 'Release updated' : 'Payment released');
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save release');
    }
  };

  const releasedPct =
    vendorTotal && vendorTotal.totalExpensed > 0
      ? Math.min(100, Math.round((vendorTotal.totalReleased / vendorTotal.totalExpensed) * 100))
      : null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={release ? 'Edit Release' : 'Release Payment'} size="sm">
        <ModalBody>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs sm:text-sm font-medium text-text-700">Vendor *</label>
                <button
                  type="button"
                  onClick={() => setVendorModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary-600 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  New vendor
                </button>
              </div>
              <select
                value={vendorId}
                onChange={(e) => pickVendor(e.target.value)}
                className="w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600"
              >
                <option value="">— Select vendor —</option>
                {(vendors as any[]).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendorName}
                  </option>
                ))}
              </select>

              {/* Balance strip: the combined position, then the split that actually decides how
                  much to release. The bucket being paid from is ringed so the amount below is
                  never read against the wrong balance. */}
              {vendorTotal && (
                <div className="mt-2 rounded-[10px] border border-background-600 bg-background-900 px-3 py-2">
                  <div className="flex items-center justify-between gap-2 text-[11.5px] text-text-700">
                    <span>
                      Expensed <span className="font-[650] text-text-900 tabular-nums">{inr(vendorTotal.totalExpensed)}</span>
                      {' · '}Released <span className="font-[650] text-text-900 tabular-nums">{inr(vendorTotal.totalReleased)}</span>
                    </span>
                    <span
                      className="font-[650] tabular-nums"
                      style={{
                        color:
                          vendorTotal.balance > 0
                            ? 'var(--st-potential-fg)'
                            : vendorTotal.balance === 0
                              ? 'var(--st-confirmed-fg)'
                              : 'var(--st-lost-fg)',
                      }}
                    >
                      {vendorTotal.balance >= 0
                        ? `Balance ${inr(vendorTotal.balance)}`
                        : `Over by ${inr(-vendorTotal.balance)}`}
                    </span>
                  </div>
                  {releasedPct !== null && (
                    <div className="mt-1.5 h-1.5 rounded-full bg-background-600 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${releasedPct}%`,
                          background:
                            vendorTotal.balance < 0 ? 'var(--st-lost-fg)' : 'var(--st-confirmed-fg)',
                        }}
                      />
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-background-600 grid grid-cols-2 gap-2">
                    {(['CASH_IN_HAND', 'CASH_IN_ACCOUNT'] as PaymentMode[]).map((m) => {
                      const b = bucketOf(vendorTotal, m)!;
                      const active = mode === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => pickMode(m)}
                          className="text-left rounded-[8px] px-2 py-1.5 border transition-colors"
                          style={{
                            borderColor: active ? `var(--st-${MODE_ST[m]}-fg)` : 'var(--color-background-600)',
                            background: active ? `var(--st-${MODE_ST[m]}-bg)` : 'transparent',
                          }}
                        >
                          <div
                            className="text-[10.5px] font-[650] uppercase tracking-[0.04em]"
                            style={{ color: `var(--st-${MODE_ST[m]}-fg)` }}
                          >
                            {MODE_LABEL[m]}
                          </div>
                          <div
                            className="text-[13px] font-[650] tabular-nums mt-0.5"
                            style={{
                              color:
                                b.balance > 0
                                  ? 'var(--st-potential-fg)'
                                  : b.balance === 0
                                    ? 'var(--st-confirmed-fg)'
                                    : 'var(--st-lost-fg)',
                            }}
                          >
                            {b.balance > 0
                              ? `${inr(b.balance)} due`
                              : b.balance === 0
                                ? 'Settled'
                                : `${inr(-b.balance)} over`}
                          </div>
                          <div className="text-[10.5px] text-text-600 tabular-nums mt-0.5">
                            {inr(b.released)} of {inr(b.expensed)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Input
                label="Amount (₹) *"
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAmountTouched(true);
                }}
                placeholder="e.g. 50000"
              />
              {overWarning && (
                <p
                  className="mt-1 text-[11.5px] font-medium"
                  style={{ color: 'var(--st-potential-fg)' }}
                >
                  ⚠ {overWarning} — allowed, but double-check.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Mode *</label>
              <div className="grid grid-cols-2 gap-0 rounded-[10px] border border-background-500 overflow-hidden">
                {(['CASH_IN_HAND', 'CASH_IN_ACCOUNT'] as PaymentMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => pickMode(m)}
                    className="h-[36px] text-[12.5px] font-semibold transition-colors"
                    style={
                      mode === m
                        ? { background: 'var(--color-primary-600)', color: 'var(--on-accent)' }
                        : { background: 'var(--color-background-800)', color: 'var(--color-text-700)' }
                    }
                  >
                    {MODE_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>

            <Input label="Date *" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />

            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Link to expense line</label>
              <select
                value={expenseId}
                onChange={(e) => setExpenseId(e.target.value)}
                className="w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600"
              >
                <option value="">— None —</option>
                {vendorLines.length > 0 && (
                  <optgroup label="This vendor's lines">
                    {vendorLines.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {lineLabel(ex)}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherLines.length > 0 && (
                  <optgroup label={vendorLines.length > 0 ? 'Other lines' : 'Expense lines'}>
                    {otherLines.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {lineLabel(ex)}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <Input label="Note" type="text" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={busy}>
            {busy ? 'Saving…' : release ? 'Save Changes' : 'Release Payment'}
          </Button>
        </ModalFooter>
      </Modal>

      <VendorFormModal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        onCreated={(v) => pickVendor(String(v.id))}
      />
    </>
  );
};
