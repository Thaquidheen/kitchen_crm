/**
 * EditRequestsTab — the admin's list of requests to reopen a completed quotation. Approving puts
 * that one quotation back to Draft so it can be edited; refusing leaves it as it is.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import { useDecideEditRequestMutation, useGetEditRequestsQuery, type QuotationEditRequest } from '@/features/quotations/editRequestsAPI';
import { movedToQuotationStage, quotationStageNotice } from '@/features/quotations/followUpMove';

const card = 'bg-background-800 border border-background-600 rounded-[14px]';

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '';

const title = (r: QuotationEditRequest) =>
  [r.customerName, r.projectName || r.quotationNumber, r.versionNumber && r.versionNumber > 1 ? `V${r.versionNumber}` : null]
    .filter(Boolean)
    .join(' · ') || 'Quotation removed';

export const EditRequestsTab: React.FC = () => {
  const { data: rows = [], isLoading } = useGetEditRequestsQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });
  const [decide, { isLoading: saving }] = useDecideEditRequestMutation();
  const [notes, setNotes] = useState<Record<number, string>>({});

  const open = rows.filter((r) => r.status === 'PENDING');
  const answered = rows.filter((r) => r.status !== 'PENDING');

  const answer = async (r: QuotationEditRequest, approve: boolean) => {
    try {
      const res = await decide({ id: r.id, approve, note: notes[r.id]?.trim() || undefined }).unwrap();
      toast.success(approve ? 'Approved: the quotation is a draft again' : 'Refused');
      const back = movedToQuotationStage(res.message);
      if (back) {
        toast.success(quotationStageNotice(back));
      }
      const designFirst = res.message.split('; ').find((part) => part.includes('is in Design Stage'));
      if (designFirst) {
        toast(designFirst);
      }
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to save the answer');
    }
  };

  if (isLoading) {
    return <div className={`${card} p-6 animate-pulse h-32`} />;
  }

  return (
    <div className="space-y-4">
      <div className={`${card} p-4`}>
        <div className="text-[13px] font-semibold text-text-900">Waiting for your answer · {open.length}</div>
        <p className="m-0 mt-1 text-[12px] text-text-600">
          Staff ask here to edit a completed quotation. Approving puts that one quotation back to Draft, and back in the
          list of whoever prepared it on the work board.
        </p>
        {open.length === 0 ? (
          <p className="m-0 mt-3 text-[12.5px] text-text-500">Nothing is waiting.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {open.map((r) => (
              <div key={r.id} className="rounded-[11px] border border-background-600 bg-background-900 p-3">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <Link to={`/quotations/${r.quotationId}`} className="text-[13px] font-semibold text-text-900 hover:underline">
                      {title(r)}
                    </Link>
                    <div className="text-[11.5px] text-text-600 mt-0.5">
                      Asked by {r.requestedByName ?? 'staff'} · {when(r.createdAt)}
                    </div>
                    {r.customerStatus === 'DESIGN_STAGE' && (
                      <div className="text-[11.5px] mt-1" style={{ color: 'var(--st-potential-fg)' }}>
                        The customer is in Design Stage (being redesigned): approving makes it a draft, but nothing goes on the
                        work board until the new design is approved.
                      </div>
                    )}
                    {r.reason && <p className="m-0 mt-1.5 text-[12.5px] text-text-800 whitespace-pre-wrap">{r.reason}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => answer(r, false)}
                      disabled={saving}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-[9px] border border-background-600 bg-background-800 text-[12.5px] font-medium text-text-900 hover:border-primary-600 disabled:opacity-60"
                    >
                      <X size={13} /> Refuse
                    </button>
                    <button
                      type="button"
                      onClick={() => answer(r, true)}
                      disabled={saving}
                      className="btn-raised-accent inline-flex items-center gap-1 h-8 px-3 rounded-[9px] text-[12.5px] font-semibold disabled:opacity-60"
                    >
                      <Check size={13} /> Approve
                    </button>
                  </div>
                </div>
                <input
                  value={notes[r.id] ?? ''}
                  onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                  maxLength={500}
                  placeholder="What needs to change — shown with the quotation while it is edited (optional)"
                  className="mt-2 w-full h-[34px] px-3 rounded-[9px] border border-background-600 bg-background-800 text-text-900 text-[12.5px] outline-none focus:border-primary-600 placeholder:text-text-500"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {answered.length > 0 && (
        <div className={`${card} p-4`}>
          <div className="text-[13px] font-semibold text-text-900">Answered in the last 14 days · {answered.length}</div>
          <div className="mt-3 flex flex-col divide-y divide-background-600">
            {answered.map((r) => (
              <div key={r.id} className="py-2 flex items-center gap-3 flex-wrap">
                <span
                  className="inline-flex items-center px-2 py-[2px] rounded-full text-[11px] font-semibold"
                  style={
                    r.status !== 'REFUSED'
                      ? { background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }
                      : { background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }
                  }
                >
                  {r.status === 'APPROVED' ? 'Approved' : r.status === 'DONE' ? 'Approved · edited' : 'Refused'}
                </span>
                <span className="min-w-0 flex-1 text-[12.5px] text-text-900 truncate">{title(r)}</span>
                <span className="text-[11.5px] text-text-600">
                  {r.requestedByName ?? 'staff'} · {when(r.decidedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditRequestsTab;
