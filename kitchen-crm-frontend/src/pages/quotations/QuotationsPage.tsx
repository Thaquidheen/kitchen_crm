/**
 * QuotationsPage
 * HOCH ERP design: title + count pill, clickable status chips with distribution bar
 * (real counts from /quotations/statistics), quiet inline value stat, existing
 * filters and list untouched functionally.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuotationFilters } from '@/features/quotations/components/QuotationFilters';
import { QuotationList } from '@/features/quotations/components/QuotationList';
import { useGetQuotationStatisticsQuery } from '@/app/baseApi';
import { Plus } from 'lucide-react';
import type { QuotationListParams } from '@/features/quotations/types';

// Status -> chip token + label (semantic colors shared with the customers pipeline)
const STATUS_CHIPS: Array<{ status: string; st: string; label: string }> = [
  { status: 'DRAFT', st: 'draft', label: 'Draft' },
  { status: 'SENT', st: 'lead', label: 'Sent' },
  { status: 'APPROVED', st: 'confirmed', label: 'Approved' },
  { status: 'REJECTED', st: 'lost', label: 'Rejected' },
  { status: 'REVISED', st: 'design', label: 'Revised' },
];

export function QuotationsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<QuotationListParams>({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const { data: statsRaw } = useGetQuotationStatisticsQuery();
  const stats = (statsRaw as any)?.data ?? {};
  const total: number = stats.total ?? 0;
  const approvedValue: number = Number(stats.totalApprovedAmount ?? 0);

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

  const dotColor = (st: string) => (st === 'draft' ? 'var(--color-text-500)' : `var(--st-${st}-fg)`);

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
            Create, send and track quotations through approval.
          </p>
        </div>
        <div className="flex-1" />
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

      {/* Filters (unchanged functionality) */}
      <div className="mb-4">
        <QuotationFilters filters={filters} onFiltersChange={setFilters} onReset={handleResetFilters} />
      </div>

      {/* List */}
      <QuotationList filters={filters} onFiltersChange={setFilters} />
    </div>
  );
}

export default QuotationsPage;
