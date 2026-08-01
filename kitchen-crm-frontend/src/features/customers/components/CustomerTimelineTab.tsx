/**
 * CustomerTimelineTab
 * The customer's audit trail: every status change, who made it, when, and the note
 * that was required at the time (WorkflowHistory.changeReason).
 *
 * The same table also carries two non-status rows written elsewhere in the backend —
 * customer creation (previousState = null) and a generic "Customer Update" marker —
 * so both are rendered as their own entry kinds instead of as bogus status pills.
 */

import React from 'react';
import { Clock, User, ArrowRight, MessageSquare, UserPlus, Pencil } from 'lucide-react';
import { useGetWorkflowHistoryByCustomerQuery } from '../customersAPI';
import { STATUS_PILL } from './CustomerList';
import type { WorkflowHistoryDto } from '../types';

export interface CustomerTimelineTabProps {
  customerId: number;
}

/** Marker written by CustomerServiceImpl.updateCustomer for non-status edits. */
const EDIT_MARKER = 'Customer Update';

/** Humanise a status the pill map doesn't know (legacy or removed values). */
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

type EntryKind = 'created' | 'edited' | 'status';

const kindOf = (item: WorkflowHistoryDto): EntryKind => {
  if (!item.previousState) return 'created';
  if (item.previousState === EDIT_MARKER) return 'edited';
  return 'status';
};

/** The note is only meaningful when a human wrote one; backend defaults are noise. */
const BACKEND_DEFAULTS = new Set(['Status updated', 'Customer created', 'Customer information updated']);

export const CustomerTimelineTab: React.FC<CustomerTimelineTabProps> = ({ customerId }) => {
  const { data: history, isLoading, error } = useGetWorkflowHistoryByCustomerQuery(customerId);

  if (isLoading) {
    return (
      <div className="bg-background-800 border border-background-600 rounded-[14px] p-4 space-y-4">
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
    );
  }

  if (error) {
    return (
      <div className="bg-background-800 border border-background-600 rounded-[14px] px-6 py-10 text-center">
        <div className="text-[13px]" style={{ color: 'var(--st-lost-fg)' }}>
          Failed to load the timeline.
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="bg-background-800 border border-background-600 rounded-[14px] px-6 py-16 text-center">
        <Clock className="w-9 h-9 text-text-600 mx-auto mb-3" strokeWidth={1.5} />
        <div className="text-[14.5px] font-semibold text-text-900">No activity yet</div>
        <div className="text-[12.5px] text-text-700 mt-1">
          Status changes will appear here, each with the note recorded at the time.
        </div>
      </div>
    );
  }

  const statusChanges = history.filter((h) => kindOf(h) === 'status').length;

  return (
    <div className="bg-background-800 border border-background-600 rounded-[14px] p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[14.5px] font-semibold text-text-900 flex items-center gap-2 m-0">
            <Clock className="h-4 w-4 text-primary-600" />
            Timeline
          </h2>
          <p className="text-[12px] text-text-700 mt-0.5 mb-0">
            {history.length} record{history.length !== 1 ? 's' : ''}
            {statusChanges > 0 && ` · ${statusChanges} status change${statusChanges !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Entries */}
      <div className="relative">
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
                : 'var(--color-text-500)';

            return (
              <div key={item.id} className="relative flex items-start gap-3">
                {/* Dot */}
                <div
                  className="relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-background-600 bg-background-900"
                  title={kind === 'status' ? 'Status change' : kind === 'created' ? 'Created' : 'Details updated'}
                >
                  {kind === 'created' ? (
                    <UserPlus size={13} style={{ color: dotColor }} />
                  ) : kind === 'edited' ? (
                    <Pencil size={12} style={{ color: dotColor }} />
                  ) : (
                    <span className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
                  )}
                </div>

                {/* Card */}
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

                  {/* The note */}
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
    </div>
  );
};

export default CustomerTimelineTab;
