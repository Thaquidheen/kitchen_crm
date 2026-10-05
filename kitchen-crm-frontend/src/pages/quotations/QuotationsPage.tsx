/**
 * QuotationsPage
 * Two views behind one header:
 *  - Work board: who prepares which customer's quotation and in which order (admin and Admin
 *    staff assign and order it; everybody else sees their own list).
 *  - All quotations: title + count pill, clickable status chips with distribution bar (real
 *    counts from /quotations/statistics), quiet inline value stat, filters and list.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QuotationList } from '@/features/quotations/components/QuotationList';
import { useGetQuotationStatisticsQuery } from '@/app/baseApi';
import { Plus } from 'lucide-react';
import type { QuotationListParams } from '@/features/quotations/types';
import { QuotationWorkBoard } from '@/features/quotation-work/components/QuotationWorkBoard';
import { useQuotationBoardCount } from '@/features/quotation-work/useQuotationBoardCount';
import { useGetQuotationWorkMeQuery } from '@/features/quotation-work/quotationWorkAPI';

type PageView = 'board' | 'list';

// Status -> chip token + label (semantic colors shared with the customers pipeline)
const STATUS_CHIPS: Array<{ status: string; st: string; label: string }> = [
  { status: 'DRAFT', st: 'draft', label: 'Draft' },
  { status: 'ON_HOLD', st: 'nego', label: 'On Hold' },
  { status: 'COMPLETE', st: 'confirmed', label: 'Completed' },
  { status: 'APPROVED', st: 'lead', label: 'Approved' },
  { status: 'CANCELLED', st: 'lost', label: 'Cancelled' },
];

const tabCount = 'text-[11px] font-[650] px-1.5 py-px rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums';

/** All quotations: status chips with their distribution bar, then the list with its filters. */
function QuotationListView({ stats }: { stats: Record<string, any> }) {
  const [filters, setFilters] = useState<QuotationListParams>({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const handleResetFilters = () => {
    setFilters({ page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' });
  };

  const activeStatus = (filters as any).status ?? 'all';
  const setStatusFilter = (status?: string) => {
    setFilters((prev) => ({ ...prev, status: status as any, page: 0 }));
  };

  const chipCount = (s: string) => Number(stats[s.toLowerCase()] ?? 0);
  const segments = STATUS_CHIPS.map((c) => ({ ...c, count: chipCount(c.status) })).filter((c) => c.count > 0);

  const chipStyle = (active: boolean) =>
    active
      ? {
          borderColor: 'var(--color-primary-600)',
          background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
        }
      : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' };

  const dotColor = (st: string) => `var(--st-${st}-fg)`;

  const total: number = stats.total ?? 0;
  const approvedValue: number = Number(stats.totalApprovedAmount ?? 0);

  return (
    <>
      {/* Status chips + quiet value stat */}
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        <button
          onClick={() => setStatusFilter(undefined)}
          className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
          style={chipStyle(activeStatus === 'all')}
        >
          <span
            className={`text-[12.5px] whitespace-nowrap ${
              activeStatus === 'all' ? 'font-semibold text-text-900' : 'font-medium text-text-700'
            }`}
          >
            All
          </span>
          <span
            className={`text-[13px] font-[650] tabular-nums ${
              activeStatus === 'all' ? 'text-primary-600' : 'text-text-900'
            }`}
          >
            {total}
          </span>
        </button>
        {STATUS_CHIPS.map((c) => {
          const count = chipCount(c.status);
          const active = activeStatus === c.status;
          return (
            <button
              key={c.status}
              onClick={() => setStatusFilter(c.status)}
              className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
              style={chipStyle(active)}
            >
              <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: dotColor(c.st) }} />
              <span
                className={`text-[12.5px] whitespace-nowrap ${
                  active ? 'font-semibold text-text-900' : count === 0 ? 'font-medium text-text-500' : 'font-medium text-text-700'
                }`}
              >
                {c.label}
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
        <div className="flex-1" />
        {approvedValue > 0 && (
          <span className="text-[12.5px] text-text-700 whitespace-nowrap tabular-nums">
            Approved value <span className="font-semibold text-text-900">₹{approvedValue.toLocaleString('en-IN')}</span>
          </span>
        )}
      </div>

      {/* Distribution bar */}
      {total > 0 && segments.length > 0 && (
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mx-0.5 mb-5">
          {segments.map((c) => (
            <div
              key={c.status}
              title={`${c.label} · ${c.count}`}
              style={{ width: `${(c.count / total) * 100}%`, background: dotColor(c.st) }}
            />
          ))}
        </div>
      )}

      {/* List — search & filters now live inside the list card's toolbar */}
      <QuotationList filters={filters} onFiltersChange={setFilters} onResetFilters={handleResetFilters} />
    </>
  );
}

export function QuotationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: me, isError: meFailed } = useGetQuotationWorkMeQuery();
  const board = useQuotationBoardCount(me);
  // Without a chosen view the page opens on the board when there is something on it for this
  // person (work to do, customers to assign, news) and on the list otherwise, as before. That is
  // decided once per visit, so a refresh in the background never switches the view under you.
  // A notification link (?job=) always lands on the board.
  const asked = searchParams.get('view');
  const [opening, setOpening] = useState<PageView | null>(null);
  useEffect(() => {
    if (opening !== null) {return;}
    if (meFailed) {
      // The board cannot be reached: the list still works on its own.
      setOpening('list');
    } else if (board.loaded) {
      setOpening(board.waiting + board.open > 0 ? 'board' : 'list');
    }
  }, [opening, meFailed, board.loaded, board.waiting, board.open]);
  const view: PageView =
    asked === 'board' || asked === 'list' ? asked : searchParams.get('job') ? 'board' : opening ?? 'list';
  const setView = (next: PageView) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', next);
    params.delete('job');
    setSearchParams(params, { replace: true });
  };
  const { data: statsRaw } = useGetQuotationStatisticsQuery();
  const stats = (statsRaw as any)?.data ?? {};
  const total: number = stats.total ?? 0;
  // Nothing is chosen yet and the board has not answered: wait instead of flashing the wrong view.
  const deciding = !asked && !searchParams.get('job') && opening === null;

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">Quotations</h1>
            <span className="text-xs font-[650] px-[9px] py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
              {total}
            </span>
          </div>
          <p className="mt-[5px] mb-0 text-[13px] text-text-700">
            {view === 'list'
              ? 'Create, send and track quotations through approval.'
              : me?.canManage
                ? 'Who prepares which quotation, and in which order.'
                : 'Your quotations in the order the admin set. Mark each one completed when it is done.'}
          </p>
        </div>
        <div className="flex-1" />
        <div role="tablist" aria-label="Quotations views" className="inline-flex p-[3px] gap-[3px] rounded-[11px] border border-background-600 bg-background-800">
          {(['board', 'list'] as PageView[]).map((key) => {
            const active = view === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setView(key)}
                className={`inline-flex items-center gap-2 h-8 px-3 rounded-[8px] text-[12.5px] whitespace-nowrap transition-colors ${
                  active ? 'font-semibold text-text-900' : 'font-medium text-text-600 hover:text-text-900'
                }`}
                style={active ? { background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)' } : undefined}
              >
                {key === 'board' ? 'Work board' : 'All quotations'}
                {key === 'board' ? (
                  board.waiting > 0 ? (
                    <span
                      className="text-[11px] font-[650] px-1.5 py-px rounded-full tabular-nums"
                      style={{ background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }}
                      title={`${board.waiting} waiting for you`}
                    >
                      {board.waiting}
                    </span>
                  ) : (
                    <span className={tabCount}>{board.open}</span>
                  )
                ) : (
                  <span className={tabCount}>{total}</span>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => navigate('/quotations/new')}
          className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold whitespace-nowrap"
        >
          <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          New Quotation
        </button>
      </div>

      {deciding ? (
        <div className="bg-background-800 border border-background-600 rounded-[14px] p-6 animate-pulse h-40" />
      ) : view === 'board' ? (
        <QuotationWorkBoard me={me} />
      ) : (
        <QuotationListView stats={stats} />
      )}
    </div>
  );
}

export default QuotationsPage;
