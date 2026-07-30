/**
 * CustomerFollowUps
 * Follow-up log on the customer detail page: timeline of contact attempts
 * (call/whatsapp/meeting/...) + optional "next follow-up" that auto-creates a reminder.
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PhoneCall, MessageCircle, Users, MapPin, Mail, StickyNote, Plus, Trash2, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetCustomerFollowUpsQuery,
  useCreateFollowUpMutation,
  useDeleteFollowUpMutation,
} from '@/app/baseApi';

export interface CustomerFollowUp {
  id: number;
  customerId: number;
  followupType: 'CALL' | 'WHATSAPP' | 'MEETING' | 'SITE_VISIT' | 'EMAIL' | 'OTHER';
  notes?: string;
  nextFollowUpAt?: string;
  createdBy?: string;
  createdAt: string;
}

const TYPES: { value: CustomerFollowUp['followupType']; label: string; icon: React.ReactNode }[] = [
  { value: 'CALL', label: 'Call', icon: <PhoneCall className="h-3.5 w-3.5" /> },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: <MessageCircle className="h-3.5 w-3.5" /> },
  { value: 'MEETING', label: 'Meeting', icon: <Users className="h-3.5 w-3.5" /> },
  { value: 'SITE_VISIT', label: 'Site Visit', icon: <MapPin className="h-3.5 w-3.5" /> },
  { value: 'EMAIL', label: 'Email', icon: <Mail className="h-3.5 w-3.5" /> },
  { value: 'OTHER', label: 'Other', icon: <StickyNote className="h-3.5 w-3.5" /> },
];

interface CustomerFollowUpsProps {
  customerId: number;
}

export function CustomerFollowUps({ customerId }: CustomerFollowUpsProps) {
  const { data: followUps = [], isLoading } = useGetCustomerFollowUpsQuery(customerId);
  const [createFollowUp, { isLoading: isCreating }] = useCreateFollowUpMutation();
  const [deleteFollowUp] = useDeleteFollowUpMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<CustomerFollowUp['followupType']>('CALL');
  const [notes, setNotes] = useState('');
  const [scheduleNext, setScheduleNext] = useState(true);
  const [nextDate, setNextDate] = useState('');
  const [nextTime, setNextTime] = useState('10:00');

  const openAdd = () => {
    setType('CALL');
    setNotes('');
    setScheduleNext(true);
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);
    setNextDate(inThreeDays.toISOString().split('T')[0]);
    setNextTime('10:00');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!notes.trim() && !scheduleNext) return toast.error('Add a note or schedule the next follow-up');
    if (scheduleNext && (!nextDate || !nextTime)) return toast.error('Pick the next follow-up date and time');
    try {
      const res = await createFollowUp({
        customerId,
        followupType: type,
        notes: notes.trim() || undefined,
        nextFollowUpAt: scheduleNext ? `${nextDate}T${nextTime}:00` : undefined,
      }).unwrap();
      if (res?.success === false) return toast.error(res?.message || 'Failed to save follow-up');
      toast.success(scheduleNext ? 'Follow-up saved — reminder set for next one' : 'Follow-up saved');
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this follow-up entry?')) return;
    try {
      await deleteFollowUp(id).unwrap();
      toast.success('Follow-up deleted');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed');
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const typeMeta = (t: string) => TYPES.find((x) => x.value === t) ?? TYPES[TYPES.length - 1];

  return (
    <Card className="bg-background-800 border-background-600 p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-text-900 flex items-center gap-2">
          <PhoneCall className="h-5 w-5 text-primary-600" />
          Follow-ups
        </h2>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[10px] text-[12.5px] font-semibold text-primary-600 border border-transparent hover:brightness-105 transition-all"
          style={{ background: 'color-mix(in oklab, var(--color-primary-600) 14%, transparent)' }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Follow-up
        </button>
      </div>

      {isLoading ? (
        <p className="text-text-600 text-sm py-4">Loading follow-ups...</p>
      ) : followUps.length === 0 ? (
        <p className="text-text-600 text-sm py-4">
          No follow-ups yet. Log each call/visit here — scheduling the next one sets a reminder automatically.
        </p>
      ) : (
        <div className="divide-y divide-background-600">
          {(followUps as CustomerFollowUp[]).map((f) => {
            const meta = typeMeta(f.followupType);
            return (
              <div key={f.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary-600/15 text-primary-600 font-medium">
                      {meta.icon}
                      {meta.label}
                    </span>
                    <span className="text-text-600 text-xs">{fmt(f.createdAt)}</span>
                    {f.createdBy && <span className="text-text-600 text-xs">· by {f.createdBy}</span>}
                  </div>
                  {f.notes && <p className="text-text-800 text-sm mt-1">{f.notes}</p>}
                  {f.nextFollowUpAt && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold mt-1.5"
                      style={{ background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }}
                    >
                      <CalendarClock className="h-3 w-3" />
                      Next follow-up: {fmt(f.nextFollowUpAt)}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(f.id)}
                  title="Delete"
                  className="p-1.5 text-error hover:text-error shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Follow-up modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-800 p-6 rounded-lg max-w-md w-full mx-4 border border-background-600">
            <h3 className="text-lg font-semibold text-text-900 mb-4">Add Follow-up</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-text-700 mb-1.5">How did you contact?</label>
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
                        type === t.value
                          ? 'bg-primary-600/20 border-primary-600 text-primary-600 font-medium'
                          : 'bg-background-700 border-background-600 text-text-700 hover:border-primary-600/50'
                      }`}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-700 mb-1">What happened?</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g., Spoke to customer, wants revised quotation with SS cabinets..."
                  className="w-full px-3 py-2 rounded-md bg-background-700 border border-background-600 text-text-900 text-sm focus:outline-none focus:border-primary-600"
                  autoFocus
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-text-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleNext}
                    onChange={(e) => setScheduleNext(e.target.checked)}
                  />
                  Schedule next follow-up (sets a reminder)
                </label>
                {scheduleNext && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <input
                      type="date"
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-background-700 border border-background-600 text-text-900 text-sm focus:outline-none focus:border-primary-600"
                    />
                    <input
                      type="time"
                      value={nextTime}
                      onChange={(e) => setNextTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-background-700 border border-background-600 text-text-900 text-sm focus:outline-none focus:border-primary-600"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={isCreating}>
                {isCreating ? 'Saving...' : 'Save Follow-up'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default CustomerFollowUps;
