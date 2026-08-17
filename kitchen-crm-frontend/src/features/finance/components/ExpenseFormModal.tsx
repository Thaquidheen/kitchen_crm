/**
 * ExpenseFormModal — expense name (suggestion combobox + free text), optional vendor
 * (feeds the per-vendor release balances), amount, auto-complementing C/H % + C/A % pair
 * with live computed amounts, optional quotation link, date and note.
 */

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGetQuotationsByCustomerQuery } from '@/app/baseApi';
import { useGetActiveVendorsQuery } from '@/features/vendors/vendorsAPI';
import VendorFormModal from '@/features/vendors/components/VendorFormModal';
import { useAddFinanceExpenseMutation, useUpdateFinanceExpenseMutation } from '../financeAPI';
import type { FinanceExpense } from '../types';
import { FINANCE_EXPENSE_SUGGESTIONS, inr } from '../constants';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  financeId: number;
  customerId: number;
  expense?: FinanceExpense | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose, financeId, customerId, expense }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [chPct, setChPct] = useState('100');
  const [caPct, setCaPct] = useState('0');
  const [vendorId, setVendorId] = useState('');
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [quotationId, setQuotationId] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [note, setNote] = useState('');

  const { data: quotationsResp } = useGetQuotationsByCustomerQuery(customerId, { skip: !isOpen });
  const { data: vendors = [] } = useGetActiveVendorsQuery(undefined, { skip: !isOpen });
  // /quotations/customer/{id} returns ApiResponse<Page<...>> — the array lives at data.content.
  const quotations: any[] = (() => {
    const raw: any = quotationsResp;
    if (Array.isArray(raw?.data?.content)) return raw.data.content;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.content)) return raw.content;
    if (Array.isArray(raw)) return raw;
    return [];
  })();

  const [addExpense, { isLoading: isAdding }] = useAddFinanceExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateFinanceExpenseMutation();
  const busy = isAdding || isUpdating;

  useEffect(() => {
    if (isOpen) {
      setTitle(expense?.title ?? '');
      setAmount(expense ? String(expense.amount) : '');
      setChPct(expense ? String(expense.cashInHandPct) : '100');
      setCaPct(expense ? String(expense.cashInAccountPct) : '0');
      setVendorId(expense?.vendorId ? String(expense.vendorId) : '');
      setQuotationId(expense?.quotationId ? String(expense.quotationId) : '');
      setExpenseDate(expense?.expenseDate ?? '');
      setNote(expense?.note ?? '');
    }
  }, [isOpen, expense]);

  // Typing one percentage auto-completes the other so the pair always sums to 100.
  const onChPct = (v: string) => {
    setChPct(v);
    const n = Number(v);
    if (!Number.isNaN(n) && n >= 0 && n <= 100) setCaPct(String(Math.round((100 - n) * 100) / 100));
  };
  const onCaPct = (v: string) => {
    setCaPct(v);
    const n = Number(v);
    if (!Number.isNaN(n) && n >= 0 && n <= 100) setChPct(String(Math.round((100 - n) * 100) / 100));
  };

  const amt = Number(amount) || 0;
  const chAmount = Math.round(amt * (Number(chPct) || 0)) / 100;
  const caAmount = amt - chAmount;

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Enter the expense name');
      return;
    }
    if (!amt || amt <= 0) {
      toast.error('Enter an amount greater than zero');
      return;
    }
    if (Math.abs((Number(chPct) || 0) + (Number(caPct) || 0) - 100) > 0.01) {
      toast.error('C/H % and C/A % must add up to 100');
      return;
    }
    const body = {
      title: title.trim(),
      amount: amt,
      cashInHandPct: Number(chPct) || 0,
      cashInAccountPct: Number(caPct) || 0,
      vendorId: vendorId ? Number(vendorId) : null,
      quotationId: quotationId ? Number(quotationId) : null,
      expenseDate: expenseDate || undefined,
      note: note.trim() || undefined,
    };
    try {
      const res = expense
        ? await updateExpense({ expenseId: expense.id, ...body }).unwrap()
        : await addExpense({ financeId, ...body }).unwrap();
      if (res?.success === false) {
        toast.error(res?.message || 'Failed to save expense');
        return;
      }
      toast.success(expense ? 'Expense updated' : 'Expense added');
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save expense');
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={expense ? 'Edit Expense' : 'Add Expense'} size="md">
      <ModalBody>
        <div className="space-y-4">
          <div>
            <Input
              label="Expense name *"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pick a suggestion or type your own…"
              list="finance-expense-suggestions"
            />
            <datalist id="finance-expense-suggestions">
              {FINANCE_EXPENSE_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs sm:text-sm font-medium text-text-700">Vendor</label>
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
              <option value="">— No vendor —</option>
              {(vendors as any[]).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vendorName}
                </option>
              ))}
            </select>
            <p className="mt-1 mb-0 text-[11.5px] text-text-500">
              Setting the vendor lets Release Payment show their expensed-vs-released balance.
            </p>
          </div>

          <Input
            label="Amount (₹) *"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 200000"
          />

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <Input label="Cash in Hand %" type="number" value={chPct} onChange={(e) => onChPct(e.target.value)} />
              <p className="mt-1 mb-0 text-[11.5px] text-text-500 tabular-nums">= {inr(chAmount)}</p>
            </div>
            <div>
              <Input label="Cash in Account %" type="number" value={caPct} onChange={(e) => onCaPct(e.target.value)} />
              <p className="mt-1 mb-0 text-[11.5px] text-text-500 tabular-nums">= {inr(caAmount)}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Based on quotation</label>
            <select
              value={quotationId}
              onChange={(e) => setQuotationId(e.target.value)}
              className="w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600"
            >
              <option value="">— None —</option>
              {quotations.map((q: any) => (
                <option key={q.id} value={q.id}>
                  {q.quotationNumber} — {inr(q.totalAmount)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <Input label="Date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
            <Input label="Note" type="text" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={busy}>
          {busy ? 'Saving…' : expense ? 'Save Changes' : 'Add Expense'}
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
