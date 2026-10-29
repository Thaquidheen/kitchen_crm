/**
 * QuotationJobModal — one piece of quotation work: what was asked, the customer's quotations,
 * and what can be done with it. The person it is assigned to (or whoever manages the board)
 * starts it, opens or creates the quotation, and marks it completed; whoever manages can also
 * change it or take it off the board.
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, FilePlus2, FileText, Pencil, Play, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { followUpNotice, movedToFollowUp } from '@/features/quotations/followUpMove';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { dueText, PriorityPill } from '@/features/design/designUi';
import { QuotationStatusPill, quotationStatusLabel } from '@/features/quotations/components/QuotationStatusPill';
import { useQuotationAccess } from '@/features/quotations/useQuotationAccess';
import { usePendingEditRequests } from '@/features/quotations/usePendingEditRequests';
import { EditRequestControl, EditRequestNotes } from '@/features/quotations/components/EditRequestControl';
import { pendingFor } from '@/features/quotations/editRequestRules';
import { ROUTES } from '@/routes/routes.config';
import {
  useCancelQuotationJobMutation,
  useCompleteQuotationJobMutation,
  useStartQuotationJobMutation,
} from '../quotationWorkAPI';
import { defaultHandIn, isOpenJob, isReopenedJob, quotationLabel } from '../quotationWorkRules';
import { fmtDay, fmtDayTime, JobStatusPill } from '../quotationWorkUi';
import type { QuotationJob } from '../types';

interface Props {
  job: QuotationJob | null;
  /** Admin or Admin staff. */
  canManage: boolean;
  myId?: number | null;
  onClose: () => void;
  onEdit: (job: QuotationJob) => void;
}

const label = 'text-[11px] font-semibold uppercase tracking-wide text-text-500';
const ghostBtn =
  'inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] border border-background-600 bg-background-900 text-[12.5px] font-medium text-text-900 whitespace-nowrap hover:border-primary-600 transition-colors disabled:opacity-60';

export const QuotationJobModal: React.FC<Props> = ({ job, canManage, myId, onClose, onEdit }) => {
  const navigate = useNavigate();
  const access = useQuotationAccess();
  const [handIn, setHandIn] = useState<number | null>(null);
  // Until the person picks one, the choice follows the list (a version saved meanwhile in another tab).
  const [picked, setPicked] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [start, { isLoading: starting }] = useStartQuotationJobMutation();
  const [complete, { isLoading: completing }] = useCompleteQuotationJobMutation();
  const [cancel, { isLoading: removing }] = useCancelQuotationJobMutation();
  // The quotation handed in is Completed; editing it again goes through the admin. Work reopened
  // that way shows what the admin asked to change.
  const pendingEdits = usePendingEditRequests(!job || (job.status !== 'COMPLETED' && !isReopenedJob(job)) || !access.view);

  const quotations = job?.customerQuotations ?? [];
  const usable = quotations.filter((q) => q.status !== 'CANCELLED');
  useEffect(() => {
    setPicked(false);
    setConfirmRemove(false);
  }, [job?.id]);
  const quotationKey = (job?.customerQuotations ?? []).map((q) => `${q.id}:${q.status}`).join(',');
  useEffect(() => {
    if (!picked) {
      setHandIn(defaultHandIn(job?.customerQuotations, job?.quotation?.id)?.id ?? null);
    }
    // A refresh moves the default only while the person has not chosen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, quotationKey, job?.quotation?.id, picked]);

  if (!job) {
    return <Modal isOpen={false} onClose={onClose} title="" size="md"><ModalBody>{null}</ModalBody></Modal>;
  }

  const open = isOpenJob(job.status);
  const reopened = isReopenedJob(job);
  const canWork = open && (canManage || job.assigneeId === myId);
  const due = dueText(job);
  const fail = (e: any, fallback: string) => toast.error(e?.message || e?.data?.message || fallback);

  const onStart = async () => {
    try {
      await start(job.id).unwrap();
    } catch (e) {
      fail(e, 'Failed to start');
    }
  };
  const onComplete = async () => {
    if (!handIn) {return;}
    try {
      const res = await complete({ id: job.id, quotationId: handIn }).unwrap();
      toast.success('Quotation completed — the admin has been told');
      const moved = movedToFollowUp(res.message);
      if (moved) {
        toast.success(followUpNotice(moved));
      }
      onClose();
    } catch (e) {
      fail(e, 'Failed to complete');
    }
  };
  const onRemove = async () => {
    try {
      await cancel(job.id).unwrap();
      toast.success('Removed from the board');
      onClose();
    } catch (e) {
      fail(e, 'Failed to remove');
    }
  };
  const createQuotation = () => navigate(`${ROUTES.QUOTATIONS_NEW}?customerId=${job.customerId}`);

  return (
    <Modal isOpen onClose={onClose} title={job.customerName} size="lg">
      <ModalBody>
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <JobStatusPill status={job.status} />
            <PriorityPill priority={job.priority} />
            {open && job.position && <span className="text-[12px] font-semibold text-text-700 tabular-nums">#{job.position} in the list</span>}
            {open && due && (
              <span className="text-[12px]" style={{ color: job.overdue ? 'var(--st-lost-fg)' : 'var(--color-text-600)' }}>
                {due}
              </span>
            )}
            <span className="flex-1" />
            <Link to={`/customers/${job.customerId}`} className="text-[12.5px] font-medium text-primary-600 hover:underline">
              Open customer
            </Link>
          </div>

          <p className="m-0 text-[12.5px] text-text-700">
            With <span className="font-semibold text-text-900">{job.assigneeName ?? 'staff'}</span>
            {job.assignedByName ? ` · assigned by ${job.assignedByName}` : ''}
            {job.assignedAt ? ` · ${fmtDayTime(job.assignedAt)}` : ''}
          </p>

          {job.note && (
            <div>
              <div className={label}>Note from the admin</div>
              <p className="m-0 mt-1 text-[13px] text-text-900 whitespace-pre-wrap break-words">{job.note}</p>
            </div>
          )}

          {open && reopened && job.quotation && (
            <div>
              <div className={label}>Reopened for editing</div>
              <p className="m-0 mt-1 text-[12.5px] text-text-700">
                {job.quotation.status === 'DRAFT'
                  ? `${quotationLabel(job.quotation)} was completed and is a draft again. Edit it, then mark this completed to hand it in again.`
                  : `${quotationLabel(job.quotation)} was reopened for editing; it is ${quotationStatusLabel(job.quotation.status)} now.`}
              </p>
              <EditRequestNotes request={pendingFor(pendingEdits, job.quotation.id)} className="mt-2" />
            </div>
          )}

          {open ? (
            <div>
              <div className={label}>This customer&apos;s quotations ({quotations.length})</div>
              {quotations.length === 0 ? (
                <p className="m-0 mt-1 text-[12.5px] text-text-600">No quotation yet. Create it, then come back and mark this completed.</p>
              ) : (
                <div className="flex flex-col gap-1.5 mt-1.5">
                  {quotations.map((q) => {
                    const pickable = canWork && q.status !== 'CANCELLED';
                    return (
                      <div
                        key={q.id}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] border border-background-600 bg-background-900"
                      >
                        {pickable && usable.length > 1 && (
                          <input
                            type="radio"
                            name="hand-in"
                            checked={handIn === q.id}
                            onChange={() => {
                              setHandIn(q.id);
                              setPicked(true);
                            }}
                            aria-label={`Hand in ${quotationLabel(q)}`}
                          />
                        )}
                        <FileText size={14} className="text-text-500 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] text-text-900 truncate">{quotationLabel(q)}</span>
                          <span className="block text-[11.5px] text-text-600 truncate">
                            {[q.projectName ? q.quotationNumber : null, fmtDay(q.createdAt)].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        {q.status && <QuotationStatusPill status={q.status} />}
                        <Link to={`/quotations/${q.id}`} className="text-[12.5px] font-medium text-primary-600 hover:underline shrink-0">
                          Open
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
              {canWork && usable.length > 1 && (
                <p className="m-0 mt-1.5 text-[11.5px] text-text-600">Choose the quotation you are handing in.</p>
              )}
            </div>
          ) : (
            <div>
              <div className={label}>{job.status === 'COMPLETED' ? 'Completed' : 'Removed from the board'}</div>
              {job.status === 'COMPLETED' && (
                <p className="m-0 mt-1 text-[13px] text-text-900">
                  {job.completedByName ? `By ${job.completedByName}` : 'Completed'}
                  {job.completedAt ? ` · ${fmtDayTime(job.completedAt)}` : ''}
                </p>
              )}
              {job.quotation && (
                <Link
                  to={`/quotations/${job.quotation.id}`}
                  className="inline-flex items-center gap-1.5 mt-2 text-[13px] font-medium text-primary-600 hover:underline"
                >
                  <FileText size={14} /> {quotationLabel(job.quotation)} — open quotation
                </Link>
              )}
              {job.status === 'COMPLETED' && job.quotation && (
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  {job.quotation.status && <QuotationStatusPill status={job.quotation.status} />}
                  <EditRequestControl
                    quotationId={job.quotation.id}
                    status={job.quotation.status}
                    pending={pendingFor(pendingEdits, job.quotation.id)}
                    canAsk={access.edit && !access.changeStatus}
                    canFinish={access.edit}
                    label={quotationLabel(job.quotation)}
                  />
                </div>
              )}
              {job.status === 'COMPLETED' && job.quotation && (
                <EditRequestNotes request={pendingFor(pendingEdits, job.quotation.id)} className="mt-2.5" />
              )}
            </div>
          )}

          {canManage && open && confirmRemove && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-[12.5px]"
              style={{ background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }}
            >
              <span className="flex-1">Take this off the board? The quotation itself is not deleted.</span>
              <button type="button" onClick={() => setConfirmRemove(false)} className="font-medium underline">
                Keep
              </button>
              <button type="button" onClick={onRemove} disabled={removing} className="font-semibold underline">
                {removing ? 'Removing…' : 'Remove'}
              </button>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter className="flex-wrap">
        {canManage && open && (
          <div className="mr-auto flex items-center gap-1.5">
            <button type="button" onClick={() => onEdit(job)} className={ghostBtn}>
              <Pencil size={13} /> Change
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              className={ghostBtn}
              aria-label="Remove from the board"
              title="Remove from the board"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
        {canWork ? (
          <>
            {job.status === 'WAITING' && (
              <button type="button" onClick={onStart} disabled={starting} className={ghostBtn}>
                <Play size={13} /> {starting ? 'Starting…' : 'Start'}
              </button>
            )}
            {access.create && (
              <button type="button" onClick={createQuotation} className={ghostBtn}>
                <FilePlus2 size={13} /> {quotations.length === 0 ? 'Create quotation' : 'New quotation'}
              </button>
            )}
            <button
              type="button"
              onClick={onComplete}
              disabled={!handIn || completing}
              title={handIn ? undefined : 'Create the quotation first'}
              className="btn-raised-accent inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[12.5px] font-semibold whitespace-nowrap disabled:opacity-60"
            >
              <CheckCircle2 size={14} /> {completing ? 'Saving…' : 'Mark completed'}
            </button>
          </>
        ) : (
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700">
            Close
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default QuotationJobModal;
