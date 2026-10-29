/**
 * StageRequestsSection — the admin's list of requests to move a Follow Up customer back to Design
 * Stage or Quotation Stage. Approving moves the customer and continues with their design or
 * quotation; refusing leaves them in Follow Up.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import { useDecideStageRequestMutation, useGetStageRequestsQuery, type CustomerStageRequest } from '@/features/customers/stageRequestsAPI';
import { approvalEffectText, stageMoveText } from '@/features/customers/stageRequestRules';

const card = 'bg-background-800 border border-background-600 rounded-[14px]';

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '';

const ANSWER: Record<string, string> = { APPROVED: 'Approved', REFUSED: 'Refused', CANCELLED: 'Closed' };

export const StageRequestsSection: React.FC = () => {
  const { data: rows = [], isLoading } = useGetStageRequestsQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });
  const [decide, { isLoading: saving }] = useDecideStageRequestMutation();
  const [notes, setNotes] = useState<Record<number, string>>({});

  const open = rows.filter((r) => r.status === 'PENDING');
  const answered = rows.filter((r) => r.status !== 'PENDING');

  const answer = async (r: CustomerStageRequest, approve: boolean) => {
    try {
      const res = await decide({ id: r.id, approve, note: notes[r.id]?.trim() || undefined }).unwrap();
      toast.success(approve ? res.message || 'Approved' : 'Refused: the customer stays in Follow Up');
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
        <div className="text-[13px] font-semibold text-text-900">Stage moves waiting for your answer · {open.length}</div>
        <p className="m-0 mt-1 text-[12px] text-text-600">
          Staff ask here to move a Follow Up customer back to Design Stage or Quotation Stage.
        </p>
        {open.length === 0 ? (
          <p className="m-0 mt-3 text-[12.5px] text-text-500">Nothing is waiting.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {open.map((r) => (
              <div key={r.id} className="rounded-[11px] border border-background-600 bg-background-900 p-3">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <Link to={`/customers/${r.customerId}`} className="text-[13px] font-semibold text-text-900 hover:underline">
                      {r.customerName ?? 'Customer'}
                    </Link>
                    <span className="ml-2 text-[12px] text-text-700">{stageMoveText(r)}</span>
                    <div className="text-[11.5px] text-text-600 mt-0.5">
                      Asked by {r.requestedByName ?? 'staff'} · {when(r.createdAt)}
                    </div>
                    {r.reason && <p className="m-0 mt-1.5 text-[12.5px] text-text-800 whitespace-pre-wrap">{r.reason}</p>}
                    <p className="m-0 mt-1.5 text-[11.5px] text-text-600">{approvalEffectText(r)}</p>
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
                  id={`stage-request-note-${r.id}`}
                  value={notes[r.id] ?? ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  placeholder="Note for the person who asked (optional)"
                  aria-label="Note for the person who asked"
                  className="mt-2 w-full h-8 px-2.5 rounded-[8px] border border-background-600 bg-background-800 text-[12.5px] text-text-900"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {answered.length > 0 && (
        <div className={`${card} p-4`}>
          <div className="text-[13px] font-semibold text-text-900">Answered lately</div>
          <div className="mt-2 flex flex-col divide-y divide-background-600">
            {answered.map((r) => (
              <div key={r.id} className="py-2 text-[12.5px] text-text-800 flex flex-wrap gap-x-2">
                <span className="font-medium text-text-900">{r.customerName}</span>
                <span>{stageMoveText(r)}</span>
                <span className="text-text-600">
                  · {ANSWER[r.status] ?? r.status}
                  {r.decidedByName ? ` by ${r.decidedByName}` : ''} · {when(r.decidedAt)}
                </span>
                {r.decisionNote && <span className="text-text-600">· {r.decisionNote}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StageRequestsSection;
