/**
 * StatusChangeModal
 * Captures the mandatory note that accompanies every customer status change.
 * The note is stored as WorkflowHistory.changeReason and is what the customer's
 * Timeline tab renders, so a status change is never left without a reason.
 *
 * Serves both the single-customer change (detail page header) and the bulk
 * change from the customers list, where one note is written to every selected row.
 */

import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from '../../../components/ui/Modal';
import { STATUS_PILL } from './CustomerList';
import type { CustomerStatus } from '../types';

export interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Receives the trimmed, non-empty note. */
  onConfirm: (note: string) => void;
  /** Status being moved to. Null keeps the modal closed. */
  targetStatus: CustomerStatus | null;
  /** Current status — omitted for bulk changes, where rows differ. */
  currentStatus?: CustomerStatus;
  /** Number of customers affected; > 1 switches to the bulk wording. */
  count?: number;
  isSubmitting?: boolean;
}

/**
 * The backend takes the note as a `reason` query parameter, so it shares the request
 * line's size budget. 500 is far more than a status note needs and leaves the URL
 * comfortably inside Tomcat's limit even after encoding.
 */
const NOTE_MAX = 500;

const pill = (status: string) => {
  const meta = STATUS_PILL[status] ?? { st: 'lead', label: status };
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

export function StatusChangeModal({
  isOpen,
  onClose,
  onConfirm,
  targetStatus,
  currentStatus,
  count = 1,
  isSubmitting = false,
}: StatusChangeModalProps) {
  const [note, setNote] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Start every change with an empty box, and focus it so the note is the
  // obvious next action rather than an afterthought.
  useEffect(() => {
    if (isOpen) {
      setNote('');
      const t = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const trimmed = note.trim();
  const canSubmit = trimmed.length > 0 && !isSubmitting;
  const isBulk = count > 1;

  const submit = () => {
    if (!canSubmit) return;
    onConfirm(trimmed);
  };

  return (
    <Modal
      isOpen={isOpen && targetStatus !== null}
      onClose={onClose}
      title={isBulk ? `Change status · ${count} customers` : 'Change status'}
      size="md"
    >
      <ModalBody>
        {/* What is about to happen */}
        <div className="flex items-center gap-2.5 flex-wrap px-3.5 py-3 rounded-[10px] bg-background-900 border border-background-600 mb-4">
          {isBulk ? (
            <span className="text-[13px] text-text-800">
              <span className="font-semibold text-text-900 tabular-nums">{count}</span> customers move to
            </span>
          ) : (
            <>
              {currentStatus ? pill(currentStatus) : null}
              <ArrowRight size={14} className="text-text-500 shrink-0" />
            </>
          )}
          {targetStatus ? pill(targetStatus) : null}
        </div>

        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <label htmlFor="status-change-note" className="block text-[12.5px] font-medium text-text-800">
            Note <span className="text-error">*</span>
          </label>
          <span
            className={`text-[11px] tabular-nums ${
              note.length > NOTE_MAX - 50 ? 'text-text-800' : 'text-text-500'
            }`}
          >
            {note.length}/{NOTE_MAX}
          </span>
        </div>
        <textarea
          id="status-change-note"
          ref={textareaRef}
          rows={3}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            // Ctrl/Cmd+Enter submits, matching the quick-entry feel of the other modals.
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            isBulk
              ? 'Why are these customers moving stage? Saved to each timeline…'
              : 'Why is this customer moving stage? e.g. Quote sent after site visit'
          }
          className="w-full px-3 py-2.5 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500 resize-none"
        />
        <p className="text-[11.5px] text-text-600 mt-1.5">
          {isBulk
            ? 'This note is saved to the timeline of every selected customer.'
            : 'This note is saved to the customer’s timeline.'}
        </p>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700 hover:text-text-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          title={trimmed.length === 0 ? 'Add a note to continue' : undefined}
          className="btn-raised-accent inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving…' : 'Update status'}
        </button>
      </ModalFooter>
    </Modal>
  );
}

export default StatusChangeModal;
