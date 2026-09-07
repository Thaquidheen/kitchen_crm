/**
 * ApplianceFollowUpsModal
 * A running, append-only follow-up (call) history for an Appliance & Quartz entry — the same idea
 * as the architect notes feed: each call is its own row with when it happened and what was said,
 * and every previous call stays listed below the composer, newest first. The newest call also
 * stamps the entry's "Last called" column in the list.
 *
 * calledAt is sent as a naive local date-time (no timezone suffix): the app treats these as
 * business-local wall-clock, matching how reminders are stored — never toISOString().
 */

import { useEffect, useState } from 'react';
import { PhoneCall, Send, User, Clock, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  useGetApplianceFollowUpsQuery,
  useAddApplianceFollowUpMutation,
  useDeleteApplianceFollowUpMutation,
} from '@/app/baseApi';
import { fmtReminderDateTime } from '@/utils/reminderFormat';

export interface ApplianceFollowUp {
  id: number;
  applianceCustomerId: number;
  calledAt: string;
  note: string;
  createdBy?: string;
  createdAt?: string;
}

interface ApplianceFollowUpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: { id: number; name: string } | null;
}

/** Local "now" in the datetime-local input format (yyyy-MM-ddTHH:mm). */
const localDefault = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return { relative: '', full: '' };
  const date = new Date(timestamp);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relative: string;
  if (diffMins < 1) relative = 'Just now';
  else if (diffMins < 60) relative = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  else if (diffHours < 24) relative = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  else if (diffDays < 7) relative = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  else relative = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const full = date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return { relative, full };
};

const fieldCls =
  'px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500';

export default function ApplianceFollowUpsModal({ isOpen, onClose, entry }: ApplianceFollowUpsModalProps) {
  const entryId = entry?.id ?? 0;
  const { data: followUps, isLoading, error } = useGetApplianceFollowUpsQuery(entryId, {
    skip: !isOpen || !entry,
  });
  const [addFollowUp, { isLoading: isSaving }] = useAddApplianceFollowUpMutation();
  const [deleteFollowUp, { isLoading: isDeleting }] = useDeleteApplianceFollowUpMutation();
  const [draft, setDraft] = useState('');
  const [calledAt, setCalledAt] = useState(localDefault());
  const [deleteTarget, setDeleteTarget] = useState<ApplianceFollowUp | null>(null);

  // Fresh composer every time the dialog opens: empty note, call time = now.
  useEffect(() => {
    if (isOpen) {
      setDraft('');
      setCalledAt(localDefault());
      setDeleteTarget(null);
    }
  }, [isOpen, entry]);

  const submitFollowUp = async () => {
    const note = draft.trim();
    if (!note || isSaving || !entry) return;
    if (!calledAt) {
      toast.error('Pick when the call happened');
      return;
    }
    try {
      const res: any = await addFollowUp({
        id: entry.id,
        // strip any seconds the picker may add; backend wants yyyy-MM-ddTHH:mm[:ss]
        calledAt: calledAt.length === 16 ? `${calledAt}:00` : calledAt,
        note,
      }).unwrap();
      if (res?.success === false) {
        toast.error(res?.message || 'Could not add the follow-up');
        return;
      }
      setDraft('');
      setCalledAt(localDefault());
      toast.success('Follow-up added');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Could not add the follow-up');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !entry) return;
    try {
      const res: any = await deleteFollowUp({ id: entry.id, followUpId: deleteTarget.id }).unwrap();
      if (res?.success === false) {
        toast.error(res?.message || 'Could not remove the follow-up');
        return;
      }
      toast.success('Follow-up removed');
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Could not remove the follow-up');
    }
  };

  if (!entry) return null;

  const list: ApplianceFollowUp[] = (followUps as ApplianceFollowUp[] | undefined) ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Follow-ups — ${entry.name}`} size="lg">
      <div className="space-y-4">
        {/* Composer */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-[12.5px] font-medium text-text-800 whitespace-nowrap">Called at</label>
            <input
              type="datetime-local"
              value={calledAt}
              onChange={(e) => setCalledAt(e.target.value)}
              disabled={isSaving}
              className={`${fieldCls} h-[34px]`}
            />
          </div>
          <div className="flex items-start gap-2">
            <textarea
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter makes a new line — the usual comment-box behaviour.
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void submitFollowUp();
                }
              }}
              placeholder="What was discussed on the call…"
              disabled={isSaving}
              className={`${fieldCls} flex-1 py-2.5 resize-none`}
            />
            <button
              type="button"
              onClick={submitFollowUp}
              disabled={!draft.trim() || isSaving}
              title="Add follow-up"
              className="btn-raised-accent shrink-0 inline-flex items-center gap-1.5 px-3 h-[38px] rounded-[10px] text-[13px] font-semibold disabled:opacity-50"
            >
              <Send size={13} />
              {isSaving ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="max-h-[55vh] overflow-y-auto -mx-1 px-1">
          {isLoading ? (
            <div className="py-10 text-center text-[13px] text-text-700">Loading follow-ups…</div>
          ) : error ? (
            <div className="py-10 text-center text-[13px] text-text-700">Failed to load follow-ups</div>
          ) : list.length === 0 ? (
            <div className="py-10 text-center">
              <PhoneCall className="mx-auto mb-2 text-text-500" size={22} />
              <div className="text-[13.5px] font-semibold text-text-900">No follow-ups yet</div>
              <div className="text-[12.5px] text-text-700 mt-1">
                Log the first call above — every follow-up you add is kept here.
              </div>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {list.map((f) => {
                const ts = formatTimestamp(f.createdAt);
                return (
                  <li
                    key={f.id}
                    className="rounded-[11px] border border-background-600 bg-background-900 px-3.5 py-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-text-900">
                          <PhoneCall size={12} className="text-primary-600" />
                          {fmtReminderDateTime(f.calledAt)}
                        </div>
                        <div className="mt-1 text-[13.5px] text-text-900 whitespace-pre-wrap break-words">
                          {f.note}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(f)}
                        title="Remove this follow-up"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:text-error hover:bg-error/10 transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[11.5px] text-text-500">
                      {f.createdBy && (
                        <span className="inline-flex items-center gap-1">
                          <User size={12} />
                          {f.createdBy}
                        </span>
                      )}
                      {ts.relative && (
                        <span className="inline-flex items-center gap-1" title={ts.full}>
                          <Clock size={12} />
                          {ts.relative}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Per-row delete confirmation — Modal is a Headless UI Dialog, so this stacks on top. */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove follow-up"
        message={
          deleteTarget
            ? `Remove the call logged for ${fmtReminderDateTime(deleteTarget.calledAt)}? "Last called" will fall back to the previous call.`
            : ''
        }
        confirmText="Remove"
        type="danger"
        isLoading={isDeleting}
      />
    </Modal>
  );
}
