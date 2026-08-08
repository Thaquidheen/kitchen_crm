/**
 * ReleaseFormModal — release a payment to a vendor: vendor select (+ inline "New vendor"),
 * amount, C/H | C/A mode, date, optional link to one of this customer's expense lines.
 */

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGetActiveVendorsQuery } from '@/features/vendors/vendorsAPI';
import VendorFormModal from '@/features/vendors/components/VendorFormModal';
import { useAddFinanceReleaseMutation, useUpdateFinanceReleaseMutation } from '../financeAPI';
import type { FinanceExpense, FinanceRelease, PaymentMode } from '../types';
import { MODE_LABEL, todayIso } from '../constants';

interface ReleaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  financeId: number;
  expenses: FinanceExpense[];
  release?: FinanceRelease | null;
}

export const ReleaseFormModal: React.FC<ReleaseFormModalProps> = ({ isOpen, onClose, financeId, expenses, release }) => {
  const [vendorId, setVendorId] = useState('');
  const [amount, setAmount] = useState('');
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
      setMode(release?.mode ?? 'CASH_IN_HAND');
      setReleaseDate(release?.releaseDate ?? todayIso());
      setExpenseId(release?.expenseId ? String(release.expenseId) : '');
      setNote(release?.note ?? '');
    }
  }, [isOpen, release]);

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
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600"
              >
                <option value="">— Select vendor —</option>
                {(vendors as any[]).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendorName}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Amount (₹) *"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
            />

            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Mode *</label>
              <div className="grid grid-cols-2 gap-0 rounded-[10px] border border-background-500 overflow-hidden">
                {(['CASH_IN_HAND', 'CASH_IN_ACCOUNT'] as PaymentMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
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
                {expenses.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
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
        onCreated={(v) => setVendorId(String(v.id))}
      />
    </>
  );
};
