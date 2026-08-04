/**
 * CustomerActivityPanel
 * The customer's activity feed, shown on the Overview tab: every status change with the note
 * recorded at the time, the creation entry, detail edits, and free-text notes anyone can add.
 *
 * All four kinds are rows in workflow_history, distinguished by previousState, so they arrive
 * as one already-ordered feed. The list scrolls inside a fixed height so Overview stays short
 * no matter how long the history gets.
 */

import React, { useState } from 'react';
import { Clock, User, ArrowRight, MessageSquare, UserPlus, Pencil, StickyNote, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useGetWorkflowHistoryByCustomerQuery, useAddCustomerNoteMutation } from '../customersAPI';
import { STATUS_PILL } from './CustomerList';
import type { WorkflowHistoryDto } from '../types';

export interface CustomerActivityPanelProps {
  customerId: number;
  /** Height of the scrolling region. */
  maxHeight?: number;
}

/** Markers written into previousState for the rows that are not status transitions. */
const EDIT_MARKER = 'Customer Update';
const NOTE_MARKER = 'Note';

const humanise = (state: string) =>
  state
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');

const statusMeta = (state: string) => STATUS_PILL[state] ?? { st: 'draft', label: humanise(state) };

const Pill: React.FC<{ state?: string | null }> = ({ state }) => {
  if (!state) return null;
  const meta = statusMeta(state);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: `var(--st-${meta.st}-bg)`, color: `var(--st-${meta.st}-fg)` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--st-${meta.st}-fg)` }} />
      {meta.label}
    </span>
  );
};

const formatTimestamp = (timestamp: string) => {
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

type EntryKind = 'created' | 'edited' | 'note' | 'status';

const kindOf = (item: WorkflowHistoryDto): EntryKind => {
  if (!item.previousState) return 'created';
  if (item.previousState === NOTE_MARKER) return 'note';
  if (item.previousState === EDIT_MARKER) return 'edited';
  return 'status';
};

/** The note is only meaningful when a human wrote one; backend defaults are noise. */
const BACKEND_DEFAULTS = new Set(['Status updated', 'Customer created', 'Customer information updated']);

export const CustomerActivityPanel: React.FC<CustomerActivityPanelProps> = ({
  customerId,
  maxHeight = 420,
}) => {
  const { data: history, isLoading, error } = useGetWorkflowHistoryByCustomerQuery(customerId);
  const [addNote, { isLoading: isSaving }] = useAddCustomerNoteMutation();
  const [draft, setDraft] = useState('');

  const submitNote = async () => {
    const note = draft.trim();
    if (!note || isSaving) return;
    try {
      await addNote({ customerId, note }).unwrap();
      setDraft('');
      toast.success('Note added');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Could not add the note');
    }
  };

  const noteCount = history?.filter((h) => kindOf(h) === 'note').length ?? 0;
  const statusChanges = history?.filter((h) => kindOf(h) === 'status').length ?? 0;

  const composer = (
    <div className="flex items-start gap-2">
      <textarea
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends, Shift+Enter makes a new line — the usual comment-box behaviour.
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void submitNote();
          }
        }}
        placeholder="Add a note about this customer…"
        disabled={isSaving}
        className="flex-1 px-3 py-2.5 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500 resize-none"
      />
      <button
        type="button"
        onClick={submitNote}
        disabled={!draft.trim() || isSaving}
        title="Add note"
        className="btn-raised-accent shrink-0 inline-flex items-center gap-1.5 px-3 h-[38px] rounded-[10px] text-[13px] font-semibold disabled:opacity-50"
      >
        <Send size={13} />
        {isSaving ? 'Adding…' : 'Add'}
      </button>
    </div>
  );

  return (
    <div className="bg-background-800 border border-background-600 rounded-[14px] p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[14.5px] font-semibold text-text-900 flex items-center gap-2 m-0">
            <Clock className="h-4 w-4 text-primary-600" />
            Activity &amp; Notes
          </h2>
          <p className="text-[12px] text-text-700 mt-0.5 mb-0">
            {history?.length ?? 0} record{(history?.length ?? 0) !== 1 ? 's' : ''}
            {statusChanges > 0 && ` · ${statusChanges} status change${statusChanges !== 1 ? 's' : ''}`}
            {noteCount > 0 && ` · ${noteCount} note${noteCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="mb-3.5">{composer}</div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-background-600 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-background-600 rounded w-1/3" />
                <div className="h-3 bg-background-600 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="px-6 py-10 text-center text-[13px]" style={{ color: 'var(--st-lost-fg)' }}>
          Failed to load the activity feed.
        </div>
      ) : !history || history.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <Clock className="w-9 h-9 text-text-600 mx-auto mb-3" strokeWidth={1.5} />
          <div className="text-[14.5px] font-semibold text-text-900">No activity yet</div>
          <div className="text-[12.5px] text-text-700 mt-1">
            Status changes appear here with the note recorded at the time — and you can add your own above.
          </div>
        </div>
      ) : (
        <div className="relative overflow-y-auto pr-1" style={{ maxHeight }}>
          {/* Vertical rail, inset to run through the middle of the 32px dots */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-background-600" aria-hidden="true" />

          <div className="space-y-3">
            {history.map((item, index) => {
              const { relative, full } = formatTimestamp(item.timestamp);
              const kind = kindOf(item);
              const isLatest = index === 0;
              const note = item.changeReason?.trim();
              const hasRealNote = !!note && !BACKEND_DEFAULTS.has(note);
              const dotColor =
                kind === 'status'
                  ? `var(--st-${statusMeta(item.newState).st}-fg)`
                  : kind === 'note'
                    ? 'var(--color-primary-600)'
                    : 'var(--color-text-500)';

              return (
                <div key={item.id} className="relative flex items-start gap-3">
                  <div
                    className="relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-background-600 bg-background-900"
                    title={
                      kind === 'status'
                        ? 'Status change'
                        : kind === 'created'
                          ? 'Created'
                          : kind === 'note'
                            ? 'Note'
                            : 'Details updated'
                    }
                  >
                    {kind === 'created' ? (
                      <UserPlus size={13} style={{ color: dotColor }} />
                    ) : kind === 'note' ? (
                      <StickyNote size={13} style={{ color: dotColor }} />
                    ) : kind === 'edited' ? (
                      <Pencil size={12} style={{ color: dotColor }} />
                    ) : (
                      <span className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 bg-background-900 border border-background-600 rounded-[10px] px-3.5 py-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        {kind === 'status' ? (
                          <>
                            <Pill state={item.previousState} />
                            <ArrowRight size={13} className="text-text-500 shrink-0" />
                            <Pill state={item.newState} />
                          </>
                        ) : kind === 'created' ? (
                          <>
                            <span className="text-[13px] font-semibold text-text-900">Customer created</span>
                            {item.newState && <Pill state={item.newState} />}
                          </>
                        ) : kind === 'note' ? (
                          <span className="text-[13px] font-semibold text-text-900">Note</span>
                        ) : (
                          <span className="text-[13px] font-semibold text-text-900">Details updated</span>
                        )}
                        {isLatest && (
                          <span className="px-2 py-[1.5px] rounded-full text-[10.5px] font-semibold bg-background-700 border border-background-600 text-text-700">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[12px] font-medium text-text-900 whitespace-nowrap">{relative}</div>
                        <div className="text-[11px] text-text-500 whitespace-nowrap">{full}</div>
                      </div>
                    </div>

                    {hasRealNote ? (
                      <div className="mt-2.5 flex items-start gap-2">
                        <MessageSquare size={13} className="text-text-500 mt-[3px] shrink-0" />
                        <p className="text-[13px] text-text-900 m-0 break-words whitespace-pre-wrap">{note}</p>
                      </div>
                    ) : (
                      kind === 'status' && (
                        <p className="mt-2.5 text-[12px] text-text-500 italic m-0">
                          No note recorded — this change predates required notes.
                        </p>
                      )
                    )}

                    {item.changedBy && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-text-600">
                        <User size={11.5} />
                        <span>{item.changedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerActivityPanel;
