/**
 * DesignsTab — the Reminders view of designs.
 * Designer: their designs in the admin's order, with what is new (assigned, changes requested,
 * admin notes, due/overdue). Admin: designs that need attention (completed, notes, overdue).
 * Opening a row goes to the design on the Designs page.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Palette } from 'lucide-react';
import { useGetDesignAttentionQuery, useGetDesignJobsQuery } from '@/features/design/designAPI';
import { DesignStatusPill, PriorityPill, designNewsText, dueText } from '@/features/design/designUi';
import type { DesignJob } from '@/features/design/types';

const poll = { pollingInterval: 30000, refetchOnFocus: true, refetchOnMountOrArgChange: true } as const;

export const DesignsTab: React.FC<{ viewer: 'admin' | 'designer' }> = ({ viewer }) => {
  const navigate = useNavigate();
  const mine = useGetDesignJobsQuery(undefined, { ...poll, skip: viewer !== 'designer' });
  const attention = useGetDesignAttentionQuery(undefined, { ...poll, skip: viewer !== 'admin' });
  const jobs: DesignJob[] = viewer === 'designer' ? mine.data ?? [] : attention.data?.jobs ?? [];
  const loading = viewer === 'designer' ? mine.isLoading : attention.isLoading;

  const hasNews = (j: DesignJob) =>
    viewer === 'designer'
      ? j.newForDesigner || j.unreadForDesigner > 0 || j.overdue
      : j.newForAdmin || j.unreadForAdmin > 0 || j.overdue;

  return (
    <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-background-600">
        <Palette size={15} className="text-primary-600" />
        <span className="text-[13px] font-semibold text-text-900">
          {viewer === 'designer' ? 'My designs — in the order to do them' : 'Designs that need you'}
        </span>
        <span className="text-[11px] font-[650] px-2 py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
          {jobs.length}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => navigate('/designs')}
          className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary-600 hover:underline"
        >
          Open Designs <ArrowRight size={13} />
        </button>
      </div>
      {loading ? (
        <p className="m-0 px-4 py-8 text-center text-[13px] text-text-600">Loading designs…</p>
      ) : jobs.length === 0 ? (
        <p className="m-0 px-4 py-10 text-center text-[13px] text-text-600">
          {viewer === 'designer' ? 'No designs assigned to you right now.' : 'Nothing needs your attention.'}
        </p>
      ) : (
        <div className="divide-y divide-background-600">
          {jobs.map((j, i) => {
            const news = hasNews(j);
            const due = dueText(j);
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => navigate(`/designs?job=${j.id}`)}
                className="w-full text-left flex items-start gap-3 px-4 py-2.5 hover:bg-background-700 transition-colors"
              >
                {viewer === 'designer' && (
                  <span className="text-[11px] font-bold text-text-500 tabular-nums w-6 pt-0.5 shrink-0">#{i + 1}</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-text-900 truncate">{j.customerName}</span>
                    <DesignStatusPill status={j.status} />
                    <PriorityPill priority={j.priority} />
                    {due && (
                      <span className="text-[11.5px]" style={{ color: j.overdue ? 'var(--st-lost-fg)' : 'var(--color-text-600)' }}>
                        {due}
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[12.5px] mt-0.5 line-clamp-2 break-words ${news ? 'font-medium' : 'text-text-600'}`}
                    style={news ? { color: 'var(--st-potential-fg)' } : undefined}
                  >
                    {designNewsText(j, viewer)}
                    {viewer === 'admin' && j.designerName ? ` · ${j.designerName}` : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DesignsTab;
