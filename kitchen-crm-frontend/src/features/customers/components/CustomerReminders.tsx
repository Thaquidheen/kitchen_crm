/**
 * CustomerReminders
 * Reminders section on the customer detail page: list + add/edit + mark done/delete.
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlarmClock, Plus, Check, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetCustomerRemindersQuery,
  useGetApplianceRemindersQuery,
  useCreateReminderMutation,
  useUpdateReminderMutation,
  useMarkReminderDoneMutation,
  useDeleteReminderMutation,
} from '@/app/baseApi';

export interface CustomerReminder {
  id: number;
  customerId: number;
  customerName?: string;
  title: string;
  notes?: string;
  remindAt: string;
  status: 'PENDING' | 'DUE' | 'DONE';
  createdBy?: string;
}

interface CustomerRemindersProps {
  /** Owner: pass exactly one of these. */
  customerId?: number;
  applianceCustomerId?: number;
}

export function CustomerReminders({ customerId, applianceCustomerId }: CustomerRemindersProps) {
  // A reminder belongs to either a customer or an Appliance & Quartz entry; this component
  // serves both, so only the relevant query runs.
  const isAppliance = applianceCustomerId != null;
  const customerQuery = useGetCustomerRemindersQuery(customerId as number, {
    skip: isAppliance || customerId == null,
  });
  const applianceQuery = useGetApplianceRemindersQuery(applianceCustomerId as number, {
    skip: !isAppliance,
  });
  const reminders: CustomerReminder[] = (isAppliance ? applianceQuery.data : customerQuery.data) ?? [];
  const isLoading = isAppliance ? applianceQuery.isLoading : customerQuery.isLoading;
  const [createReminder, { isLoading: isCreating }] = useCreateReminderMutation();
  const [updateReminder, { isLoading: isUpdating }] = useUpdateReminderMutation();
  const [markDone] = useMarkReminderDoneMutation();
  const [deleteReminder] = useDeleteReminderMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerReminder | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');

  const openAdd = () => {
    setEditing(null);
    setTitle('');
    setNotes('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
    setTime('10:00');
    setModalOpen(true);
  };

  const openEdit = (r: CustomerReminder) => {
    setEditing(r);
    setTitle(r.title);
    setNotes(r.notes || '');
    const dt = new Date(r.remindAt);
    setDate(r.remindAt.split('T')[0]);
    setTime(dt.toTimeString().slice(0, 5));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return toast.error('Please enter what the reminder is for');
    if (!date || !time) return toast.error('Please pick a date and time');
    const remindAt = `${date}T${time}:00`;
    try {
      if (editing) {
        const res = await updateReminder({ id: editing.id, title: title.trim(), notes: notes.trim() || undefined, remindAt }).unwrap();
        if (res?.success === false) return toast.error(res?.message || 'Failed to update reminder');
        toast.success('Reminder updated');
      } else {
        const owner = isAppliance ? { applianceCustomerId } : { customerId };
        const res = await createReminder({ ...owner, title: title.trim(), notes: notes.trim() || undefined, remindAt }).unwrap();
        if (res?.success === false) return toast.error(res?.message || 'Failed to create reminder');
        toast.success('Reminder set');
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Operation failed');
    }
  };

  const handleDone = async (id: number) => {
    try {
      await markDone(id).unwrap();
      toast.success('Marked as done');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await deleteReminder(id).unwrap();
      toast.success('Reminder deleted');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed');
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="bg-background-800 border-background-600 p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-text-900 flex items-center gap-2">
          <AlarmClock className="h-5 w-5 text-primary-600" />
          Reminders
        </h2>
        <Button variant="primary" size="sm" onClick={openAdd} className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          Add Reminder
        </Button>
      </div>

      {isLoading ? (
        <p className="text-text-600 text-sm py-4">Loading reminders...</p>
      ) : reminders.length === 0 ? (
        <p className="text-text-600 text-sm py-4">No reminders yet. Add one to get notified at the right time.</p>
      ) : (
        <div className="divide-y divide-background-600">
          {(reminders as CustomerReminder[]).map((r) => {
            const done = r.status === 'DONE';
            return (
              <div key={r.id} className="py-3 flex items-start gap-3">
                {/* Circle check: click to mark done */}
                <button
                  onClick={() => !done && handleDone(r.id)}
                  title={done ? 'Done' : 'Mark done'}
                  disabled={done}
                  className={`mt-0.5 w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    done
                      ? 'cursor-default'
                      : 'border-background-500 hover:border-primary-600 cursor-pointer'
                  }`}
                  style={
                    done
                      ? { background: 'var(--st-confirmed-fg)', borderColor: 'var(--st-confirmed-fg)' }
                      : undefined
                  }
                >
                  {done && <Check className="h-3 w-3 text-background-900" strokeWidth={3} />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-text-900 text-sm font-medium ${done ? 'line-through opacity-60' : ''}`}>
                      {r.title}
                    </span>
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide"
                      style={
                        done
                          ? { background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }
                          : { background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }
                      }
                    >
                      {done ? 'DONE' : r.status === 'DUE' ? 'DUE NOW' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-text-600 text-xs mt-0.5">
                    {fmt(r.remindAt)}
                    {r.createdBy ? ` · by ${r.createdBy}` : ''}
                  </p>
                  {r.notes && <p className="text-text-700 text-xs mt-1">{r.notes}</p>}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!done && (
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)} title="Edit" className="p-1.5">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} title="Delete" className="p-1.5 text-error hover:text-error">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-800 p-6 rounded-lg max-w-md w-full mx-4 border border-background-600">
            <h3 className="text-lg font-semibold text-text-900 mb-4">
              {editing ? 'Edit Reminder' : 'Add Reminder'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-text-700 mb-1">What is this reminder for? *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Follow up about quotation"
                  className="w-full px-3 py-2 rounded-md bg-background-700 border border-background-600 text-text-900 text-sm focus:outline-none focus:border-primary-600"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-text-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-background-700 border border-background-600 text-text-900 text-sm focus:outline-none focus:border-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-700 mb-1">Time *</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-background-700 border border-background-600 text-text-900 text-sm focus:outline-none focus:border-primary-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-700 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Extra details..."
                  className="w-full px-3 py-2 rounded-md bg-background-700 border border-background-600 text-text-900 text-sm focus:outline-none focus:border-primary-600"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={isCreating || isUpdating}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'Saving...' : editing ? 'Save Changes' : 'Set Reminder'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default CustomerReminders;
