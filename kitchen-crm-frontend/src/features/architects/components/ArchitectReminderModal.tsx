/**
 * Set a reminder on an architect / builder. Posts to the same unified reminders endpoint every
 * other module uses (customers, appliance, production), tagged source=ARCHITECT and owned by the
 * architect — so it appears in the Reminders page, the notification bell, and the Architect filter
 * automatically. remindAt is sent as a naive local date-time (no timezone suffix): the app treats
 * reminder times as business-local wall-clock, matching how customer reminders are stored.
 */

import { useEffect, useState } from 'react';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { useCreateReminderMutation } from '@/app/baseApi';
import type { Architect } from '../types';
import { partnerTypeLabel, partnerTypeOf } from '../types';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  architect: Architect | null;
}

const localDefault = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1); // default: tomorrow 10:00
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T10:00`;
};

export default function ArchitectReminderModal({ isOpen, onClose, architect }: Props) {
  const [title, setTitle] = useState('');
  const [remindAt, setRemindAt] = useState(localDefault());
  const [notes, setNotes] = useState('');
  const [createReminder, { isLoading }] = useCreateReminderMutation();

  useEffect(() => {
    if (isOpen && architect) {
      setTitle(`Follow up with ${architect.architectureName}`);
      setRemindAt(localDefault());
      setNotes('');
    }
  }, [isOpen, architect]);

  const save = async () => {
    if (!architect) return;
    if (!title.trim()) {
      toast.error('Give the reminder a title');
      return;
    }
    if (!remindAt) {
      toast.error('Pick a date');
      return;
    }
    try {
      const res: any = await createReminder({
        architectId: architect.id,
        title: title.trim(),
        notes: notes.trim() || undefined,
        // strip any seconds the picker may add; backend wants yyyy-MM-ddTHH:mm[:ss]
        remindAt: remindAt.length === 16 ? `${remindAt}:00` : remindAt,
        source: 'ARCHITECT',
      }).unwrap();
      if (res?.success === false) {
        toast.error(res?.message || 'Could not set the reminder');
        return;
      }
      toast.success('Reminder set');
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Could not set the reminder');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set reminder" size="sm">
      <ModalBody>
        <div className="space-y-4">
          {architect && (
            <div className="text-[12.5px] text-text-600">
              For{' '}
              <span className="font-semibold text-text-900">{architect.architectureName}</span>
              <span className="ml-1.5 inline-flex px-1.5 py-[1px] rounded-md text-[10.5px] font-semibold"
                style={{ background: 'var(--st-lead-bg)', color: 'var(--st-lead-fg)' }}>
                {partnerTypeLabel(partnerTypeOf(architect))}
              </span>
            </div>
          )}
          <Input label="Reminder *" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Call about the Villa project" />
          <Input label="Date & time *" type="datetime-local" value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)} />
          <TextArea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional" rows={3} />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={isLoading}>{isLoading ? 'Saving…' : 'Set reminder'}</Button>
      </ModalFooter>
    </Modal>
  );
}
