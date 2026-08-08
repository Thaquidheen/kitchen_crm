/**
 * PaymentFormModal — add or edit one income payment: amount, C/H | C/A toggle,
 * date (default today), note, comment.
 */

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { useAddFinancePaymentMutation, useUpdateFinancePaymentMutation } from '../financeAPI';
import type { FinancePayment, PaymentMode } from '../types';
import { MODE_LABEL, todayIso } from '../constants';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  financeId: number;
  payment?: FinancePayment | null;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({ isOpen, onClose, financeId, payment }) => {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<PaymentMode>('CASH_IN_HAND');
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [note, setNote] = useState('');
  const [comment, setComment] = useState('');

  const [addPayment, { isLoading: isAdding }] = useAddFinancePaymentMutation();
  const [updatePayment, { isLoading: isUpdating }] = useUpdateFinancePaymentMutation();
  const busy = isAdding || isUpdating;

  useEffect(() => {
    if (isOpen) {
      setAmount(payment ? String(payment.amount) : '');
      setMode(payment?.mode ?? 'CASH_IN_HAND');
      setPaymentDate(payment?.paymentDate ?? todayIso());
      setNote(payment?.note ?? '');
      setComment(payment?.comment ?? '');
    }
  }, [isOpen, payment]);

  const handleSave = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error('Enter an amount greater than zero');
      return;
    }
    if (!paymentDate) {
      toast.error('Pick the payment date');
      return;
    }
    const body = { amount: amt, mode, paymentDate, note: note.trim() || undefined, comment: comment.trim() || undefined };
    try {
      const res = payment
        ? await updatePayment({ paymentId: payment.id, ...body }).unwrap()
        : await addPayment({ financeId, ...body }).unwrap();
      if (res?.success === false) {
        toast.error(res?.message || 'Failed to save payment');
        return;
      }
      toast.success(payment ? 'Payment updated' : 'Payment recorded');
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save payment');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={payment ? 'Edit Payment' : 'Add Payment'} size="sm">
      <ModalBody>
        <div className="space-y-4">
          <Input
            label="Amount (₹) *"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 300000"
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

          <Input label="Date *" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />

          <Input
            label="Note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Advance on confirmation"
          />

          <TextArea label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={busy}>
          {busy ? 'Saving…' : payment ? 'Save Changes' : 'Add Payment'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
