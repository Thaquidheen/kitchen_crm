/**
 * RemindersPage
 * Cross-customer reminders, grouped by day bucket.
 *
 * Reminders work at day granularity: the time on a reminder is a note, not a trigger. The
 * server decides which bucket each reminder belongs to (in the business timezone) and sends
 * it down as `bucket`, so the browser never re-does that maths in its own timezone.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Check, Pencil, Trash2, BellRing } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Pagination } from '@/components/shared/Pagination';
import {
  useGetRemindersQuery,
  useGetReminderStatsQuery,
  useCreateReminderMutation,
  useUpdateReminderMutation,
  useMarkReminderDoneMutation,
  useDeleteReminderMutation,
} from '@/app/baseApi';
import { useGetCustomersPageQuery } from '@/features/customers/customersAPI';

interface Reminder {
  id: number;
  customerId: number;
  customerName?: string;
  title: string;
  notes?: string;
  remindAt: string;
  remindDate?: string;
  bucket?: 'TODAY' | 'OVERDUE' | 'UPCOMING' | 'DONE';
  status?: 'PENDING' | 'DUE' | 'DONE';
}

const BUCKETS = [
  { key: 'ALL', label: 'All', statKey: 'all', st: '' },
  { key: 'TODAY', label: 'Today', statKey: 'today', st: 'nego' },
  { key: 'OVERDUE', label: 'Overdue', statKey: 'overdue', st: 'lost' },
  { key: 'UPCOMING', label: 'Upcoming', statKey: 'upcoming', st: 'lead' },
  { key: 'DONE', label: 'Done', statKey: 'done', st: 'confirmed' },
] as const;

const BUCKET_PILL: Record<string, { st: string; label: string }> = {
  TODAY: { st: 'nego', label: 'Today' },
  OVERDUE: { st: 'lost', label: 'Overdue' },
  UPCOMING: { st: 'lead', label: 'Upcoming' },
  DONE: { st: 'confirmed', label: 'Done' },
};

const thClass = 'px-3 py-[9px] text-left text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500';

const initialsOf = (name?: string) =>
  (name ?? '')
    .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

/** Renders the stored wall-clock string without letting the browser shift it by timezone. */
const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const [datePart] = iso.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return datePart;
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = (iso?: string) => {
  if (!iso || !iso.includes('T')) return '';
  const [h, min] = iso.split('T')[1].split(':');
  const hour = Number(h);
  if (Number.isNaN(hour)) return '';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${min} ${suffix}`;
};

export function RemindersPage() {
  const navigate = useNavigate();

  const [bucket, setBucket] = useState<string>('TODAY');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useGetRemindersQuery({ bucket, search: search || undefined, page, size: 20 });
  const { data: stats } = useGetReminderStatsQuery();

  const reminders: Reminder[] = data?.content ?? [];
  const totalElements: number = data?.totalElements ?? 0;
  const totalPages: number = data?.totalPages ?? 0;

  const [createReminder, { isLoading: isCreating }] = useCreateReminderMutation();
  const [updateReminder, { isLoading: isUpdating }] = useUpdateReminderMutation();
  const [markDone] = useMarkReminderDoneMutation();
  const [deleteReminder, { isLoading: isDeleting }] = useDeleteReminderMutation();

  // Add / edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [deleteTarget, setDeleteTarget] = useState<Reminder | null>(null);

  const { data: customersPage } = useGetCustomersPageQuery(
    { name: customerSearch, page: 0, size: 20, sortBy: 'name', sortDir: 'asc' },
    { skip: !modalOpen }
  );
  const customers = customersPage?.content ?? [];

  const todayIso = useMemo(() => {
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
  }, []);

  const openCreate = () => {
    setEditing(null);
    setCustomerId('');
    setCustomerSearch('');
    setTitle('');
    setNotes('');
    setDate(todayIso);
    setTime('10:00');
    setModalOpen(true);
  };

  const openEdit = (r: Reminder) => {
    setEditing(r);
    setCustomerId(r.customerId);
    setCustomerSearch('');
    setTitle(r.title);
    setNotes(r.notes ?? '');
    setDate(r.remindAt.split('T')[0]);
    setTime((r.remindAt.split('T')[1] ?? '10:00:00').slice(0, 5));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !date) return;
    if (!editing && !customerId) return;
    const remindAt = `${date}T${time || '10:00'}:00`;
    try {
      if (editing) {
        await updateReminder({
          id: editing.id,
          title: title.trim(),
          notes: notes.trim() || undefined,
          remindAt,
        }).unwrap();
        toast.success('Reminder updated');
      } else {
        await createReminder({
          customerId: Number(customerId),
          title: title.trim(),
          notes: notes.trim() || undefined,
          remindAt,
        }).unwrap();
        toast.success('Reminder created');
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save reminder');
    }
  };

  const handleMarkDone = async (r: Reminder) => {
    try {
      await markDone(r.id).unwrap();
      toast.success('Marked as done');
    } catch {
      toast.error('Failed to update reminder');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReminder(deleteTarget.id).unwrap();
      toast.success('Reminder deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete reminder');
    }
  };

  const statusPill = (b?: string) => {
    const m = (b && BUCKET_PILL[b]) || { st: '', label: b ?? '—' };
    const fg = m.st ? `var(--st-${m.st}-fg)` : 'var(--color-text-700)';
    const bg = m.st ? `var(--st-${m.st}-bg)` : 'var(--color-background-700)';
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
        style={{ background: bg, color: fg }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: fg }} />
        {m.label}
      </span>
    );
  };

  const chipCount = (key: string) => Number((stats as any)?.[key] ?? 0);
  const openTotal = chipCount('all');

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">Reminders</h1>
            <span className="text-xs font-[650] px-[9px] py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
              {openTotal}
            </span>
          </div>
          <p className="mt-[5px] mb-0 text-[13px] text-text-700">
            A reminder shows for its whole day, from midnight — the time is just a note.
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
          Add Reminder
        </button>
      </div>

      {/* Bucket chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        {BUCKETS.map((b) => {
          const active = bucket === b.key;
          const count = chipCount(b.statKey);
          return (
            <button
              key={b.key}
              onClick={() => {
                setBucket(b.key);
                setPage(0);
              }}
              className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
              style={
                active
                  ? {
                      borderColor: 'var(--color-primary-600)',
                      background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
                    }
                  : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' }
              }
            >
              {b.st && (
                <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: `var(--st-${b.st}-fg)` }} />
              )}
              <span
                className={`text-[12.5px] whitespace-nowrap ${
                  active ? 'font-semibold text-text-900' : count === 0 ? 'font-medium text-text-500' : 'font-medium text-text-700'
                }`}
              >
                {b.label}
              </span>
              <span
                className={`text-[13px] font-[650] tabular-nums ${
                  active ? 'text-primary-600' : count === 0 ? 'text-text-500' : 'text-text-900'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table card */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <div className="relative flex-1 max-w-[420px]">
            <Search size={15} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by reminder or customer…"
              className="w-full h-[34px] pl-[34px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={`${thClass} pl-3.5`}>Reminder</th>
                <th className={thClass}>Customer</th>
                <th className={thClass}>When</th>
                <th className={thClass}>Status</th>
                <th className="px-3.5 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 w-[120px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-600">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-3.5 py-4"><div className="h-4 bg-background-700 rounded w-48" /></td>
                    <td className="px-3 py-4"><div className="h-4 bg-background-700 rounded w-32" /></td>
                    <td className="px-3 py-4"><div className="h-4 bg-background-700 rounded w-24" /></td>
                    <td className="px-3 py-4"><div className="h-6 bg-background-700 rounded w-20" /></td>
                    <td className="px-3.5 py-4"><div className="h-4 bg-background-700 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : reminders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <BellRing className="mx-auto h-8 w-8 text-text-500 mb-2" />
                    <p className="text-sm text-text-700">
                      {bucket === 'TODAY' ? 'Nothing due today.' : 'No reminders here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                reminders.map((r) => {
                  const isDone = r.bucket === 'DONE';
                  return (
                    <tr key={r.id} className="hover:bg-background-700 transition-colors">
                      <td className="px-3.5 py-3">
                        <div className={`text-[13.5px] font-medium ${isDone ? 'text-text-600 line-through' : 'text-text-900'}`}>
                          {r.title}
                        </div>
                        {r.notes && <div className="text-xs text-text-600 mt-0.5 line-clamp-1">{r.notes}</div>}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => navigate(`/customers/${r.customerId}`)}
                          className="flex items-center gap-2 min-w-0 group"
                        >
                          <span className="w-7 h-7 rounded-[9px] bg-background-600 border border-background-500 flex items-center justify-center text-[10px] font-[650] text-text-700 shrink-0">
                            {initialsOf(r.customerName)}
                          </span>
                          <span className="text-[13px] text-text-900 truncate group-hover:text-primary-600 transition-colors">
                            {r.customerName || '—'}
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div
                          className="text-[13px] tabular-nums"
                          style={{ color: r.bucket === 'OVERDUE' ? 'var(--st-lost-fg)' : 'var(--color-text-900)' }}
                        >
                          {fmtDate(r.remindAt)}
                        </div>
                        <div className="text-[11px] text-text-500 tabular-nums">{fmtTime(r.remindAt)}</div>
                      </td>
                      <td className="px-3 py-3">{statusPill(r.bucket)}</td>
                      <td className="px-3.5 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          {!isDone && (
                            <button
                              onClick={() => handleMarkDone(r)}
                              title="Mark as done"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-text-600 hover:text-[var(--st-confirmed-fg)] hover:bg-[var(--st-confirmed-bg)] transition-colors"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(r)}
                            title="Edit"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-text-600 hover:text-text-900 hover:bg-background-600 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(r)}
                            title="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-text-600 hover:text-error hover:bg-error/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

        {totalElements > 0 && (
          <div className="flex items-center justify-between gap-3 px-3.5 py-3 border-t border-background-600 flex-wrap">
            <span className="text-[12.5px] text-text-600">
              Showing {reminders.length} of {totalElements}
            </span>
            {totalPages > 1 && (
              <Pagination currentPage={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />
            )}
          </div>
        )}
      </div>

      {/* Add / edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Reminder' : 'New Reminder'}
        size="md"
      >
        <ModalBody>
          {!editing && (
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Customer *</label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customers…"
                className="w-full h-[34px] px-3 mb-2 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
              />
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600"
                size={5}
              >
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.contact ? ` · ${c.contact}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <Input
              label="Reminder *"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Call about the kitchen design"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input label="Date *" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <p className="text-xs text-text-500 -mt-2 mb-4">
            The reminder appears all day on this date, starting at midnight. The time is shown as a note.
          </p>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Notes</label>
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional details…" />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isCreating || isUpdating || !title.trim() || !date || (!editing && !customerId)}
          >
            {isCreating || isUpdating ? 'Saving…' : editing ? 'Save Changes' : 'Add Reminder'}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Reminder"
        message={`Delete "${deleteTarget?.title ?? ''}"? This cannot be undone.`}
        confirmText={isDeleting ? 'Deleting…' : 'Delete'}
        type="danger"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default RemindersPage;
