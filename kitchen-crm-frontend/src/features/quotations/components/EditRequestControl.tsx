/**
 * EditRequestControl — next to a quotation, the step it is at on the way to being edited again:
 *  - Completed, and this person may not change a status: "Request to edit" (asks the admin).
 *  - Somebody asked: "Edit requested" until the admin answers (Reminders → Edit requests).
 *  - The admin approved: the quotation is a draft again — "Reopened for editing", and whoever
 *    edits it hands it back with "Mark completed".
 */
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, PencilLine } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import {
  useFinishQuotationEditMutation,
  useRequestQuotationEditMutation,
  type PendingEditRequest,
} from '../editRequestsAPI';

interface Props {
  quotationId: number;
  /** The quotation's status (stored value). */
  status?: string | null;
  /** The request on this quotation: waiting, or approved and being edited. */
  pending?: PendingEditRequest;
  /** This person may edit quotations but not change their status: they have to ask. */
  canAsk: boolean;
  /** This person may hand a reopened quotation back as Completed (anyone who may edit). */
  canFinish?: boolean;
  /** Name shown in the window. */
  label?: string;
}

const chip = 'inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] font-semibold whitespace-nowrap';
const errMsg = (e: any, fallback: string) => e?.message || e?.data?.message || fallback;

export const EditRequestControl: React.FC<Props> = ({ quotationId, status, pending, canAsk, canFinish = false, label }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [send, { isLoading }] = useRequestQuotationEditMutation();
  const [finish, { isLoading: finishing }] = useFinishQuotationEditMutation();

  if (pending?.state === 'REOPENED') {
    // The list may still show the old status for a moment; the button waits for the draft.
    const markCompleted = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await finish({ quotationId }).unwrap();
        toast.success('Quotation completed');
      } catch (err) {
        toast.error(errMsg(err, 'Failed to mark the quotation completed'));
      }
    };
    return (
      <span className="inline-flex items-center gap-2 flex-wrap">
        <span
          className={chip}
          style={{ background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }}
          title={`The admin approved the request${pending.requestedByName ? ` of ${pending.requestedByName}` : ''}: this quotation can be edited`}
        >
          <PencilLine size={11} /> Reopened for editing
        </span>
        {canFinish && status === 'DRAFT' && (
          <button
            type="button"
            onClick={markCompleted}
            disabled={finishing}
            title="Finished editing: the quotation becomes Completed again"
            className="inline-flex items-center gap-1 text-[11.5px] font-medium text-primary-600 hover:underline whitespace-nowrap disabled:opacity-60"
          >
            <CheckCircle2 size={12} /> {finishing ? 'Saving…' : 'Mark completed'}
          </button>
        )}
      </span>
    );
  }
  if (pending) {
    return (
      <span
        className={chip}
        style={{ background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }}
        title={pending.mine ? 'You asked the admin to reopen this quotation' : `Asked by ${pending.requestedByName ?? 'staff'}`}
      >
        <Clock size={11} /> Edit requested{pending.mine ? '' : pending.requestedByName ? ` · ${pending.requestedByName}` : ''}
      </span>
    );
  }
  if (!canAsk || status !== 'COMPLETE') {return null;}

  const submit = async () => {
    try {
      await send({ quotationId, reason: reason.trim() || undefined }).unwrap();
      toast.success('Sent to the admin for approval');
      setOpen(false);
      setReason('');
    } catch (e) {
      toast.error(errMsg(e, 'Failed to send the request'));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 text-[11.5px] font-medium text-primary-600 hover:underline whitespace-nowrap"
      >
        <PencilLine size={12} /> Request to edit
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={label ? `Request to edit · ${label}` : 'Request to edit'} size="md">
        <ModalBody>
          <p className="m-0 mb-3 text-[12.5px] text-text-700">
            This quotation is completed, so it cannot be edited. The admin is asked to put it back to Draft. You are told
            when it is approved; until then nothing changes.
          </p>
          <label htmlFor="edit-request-reason" className="block text-[12.5px] font-medium text-text-800 mb-1.5">
            What needs to change
          </label>
          <textarea
            id="edit-request-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. Customer asked to change the hob and add two drawers"
            className="w-full px-3 py-2 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 resize-y placeholder:text-text-500"
          />
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            className="btn-raised-accent px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60"
          >
            {isLoading ? 'Sending…' : 'Send request'}
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
};

/**
 * What to change on a quotation that is being reopened: why it was asked, and the admin's note on
 * approving it. Shown where the quotation is worked on (the work board window, the quotation page).
 */
export const EditRequestNotes: React.FC<{ request?: PendingEditRequest; className?: string }> = ({ request, className = '' }) => {
  if (!request || (!request.reason && !request.decisionNote)) {return null;}
  return (
    <div className={`rounded-[10px] border border-background-600 bg-background-900 px-3 py-2.5 space-y-2 ${className}`}>
      {request.state === 'REOPENED' && request.decisionNote && (
        <div>
          <div className="text-[10.5px] font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--st-confirmed-fg)' }}>
            What to change{request.decidedByName ? ` · ${request.decidedByName}` : ''}
          </div>
          <p className="m-0 mt-0.5 text-[13px] text-text-900 whitespace-pre-wrap break-words">{request.decisionNote}</p>
        </div>
      )}
      {request.reason && (
        <div>
          <div className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-text-500">
            Asked{request.requestedByName ? ` by ${request.requestedByName}` : ''}
          </div>
          <p className="m-0 mt-0.5 text-[12.5px] text-text-700 whitespace-pre-wrap break-words">{request.reason}</p>
        </div>
      )}
    </div>
  );
};

export default EditRequestControl;
