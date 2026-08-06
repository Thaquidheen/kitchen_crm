/**
 * ProductionPage
 * Production jobs in the HOCH table idiom: page header with count pill, status chips with a
 * distribution bar, then a single table card with an inline filter toolbar. Every job runs
 * the standard 3-stage checklist; progress and current stage come from it.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Filter } from 'lucide-react';
import {
  useGetProductionInstallationsQuery,
  useGetProductionStatisticsQuery,
} from '@/features/production/productionAPI';
import type { InstallationStatus, ProductionFilters } from '@/features/production/types';

const STATUS_META: Record<string, { st: string; label: string; statKey: string }> = {
  NOT_STARTED: { st: 'draft', label: 'Not Started', statKey: 'not_started_installations' },
  PRODUCTION: { st: 'lead', label: 'Production', statKey: 'production_installations' },
  SITE_PREPARATION: { st: 'potential', label: 'Site Prep', statKey: 'site_preparation_installations' },
  DELIVERY: { st: 'nego', label: 'Delivery', statKey: 'delivery_installations' },
  INSTALLATION: { st: 'design', label: 'Installation', statKey: 'installation_installations' },
  QUALITY_CHECK: { st: 'follow', label: 'Quality Check', statKey: 'quality_check_installations' },
  COMPLETED: { st: 'confirmed', label: 'Completed', statKey: 'completed_installations' },
  ON_HOLD: { st: 'potential', label: 'On Hold', statKey: 'on_hold_installations' },
  CANCELLED: { st: 'lost', label: 'Cancelled', statKey: 'cancelled_installations' },
};
const STATUS_ORDER = Object.keys(STATUS_META);

const thClass = 'px-3 py-[9px] text-left text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500';

const initialsOf = (name?: string) =>
  (name ?? '')
    .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const isPast = (iso?: string) => !!iso && new Date(iso) < new Date(new Date().toDateString());

export function ProductionPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState<InstallationStatus | undefined>(undefined);
  const [customerName, setCustomerName] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [teamLead, setTeamLead] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [page, setPage] = useState(0);

  const filters: ProductionFilters = {
    status,
    customerName: customerName || undefined,
    projectManager: projectManager || undefined,
    teamLead: teamLead || undefined,
    page,
    size: 20,
    sortBy: 'createdAt',
    sortDir: 'desc',
  };

  const { data: listResponse, isLoading } = useGetProductionInstallationsQuery(filters);
  const { data: statsResponse } = useGetProductionStatisticsQuery();

  const rows: any[] = listResponse?.data?.content ?? [];
  const totalElements = listResponse?.data?.totalElements ?? 0;
  const totalPages = listResponse?.data?.totalPages ?? 0;

  // Statistics come back snake_case; per-status counts are "<status>_installations"
  const stats: any = statsResponse?.data ?? {};
  const num = (k: string) => Number(stats[k] ?? 0);
  const total = num('total_installations');

  const segments = useMemo(
    () =>
      STATUS_ORDER.map((s) => ({ key: s, ...STATUS_META[s], count: num(STATUS_META[s].statKey) })).filter(
        (s) => s.count > 0
      ),
    [stats]
  );

  const pill = (st: string, label: string) => (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: `var(--st-${st}-bg)`, color: `var(--st-${st}-fg)` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--st-${st}-fg)` }} />
      {label}
    </span>
  );

  /** Stage pill from the checklist when present, otherwise the status pill. */
  const stageCell = (r: any) => {
    if (r.currentStageName) {
      const done = r.checklistTotal != null && r.checklistDone === r.checklistTotal;
      const st = done
        ? 'confirmed'
        : r.currentStageName.startsWith('Stage 1')
        ? 'lead'
        : r.currentStageName.startsWith('Stage 2')
        ? 'design'
        : 'quote';
      return pill(st, done ? 'All stages done' : r.currentStageName.replace(' · ', ' · '));
    }
    const m = STATUS_META[r.overallStatus] ?? STATUS_META.NOT_STARTED;
    return pill(m.st, m.label);
  };

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">Production</h1>
            <span className="text-xs font-[650] px-[9px] py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
              {total}
            </span>
          </div>
          <p className="mt-[5px] mb-0 text-[13px] text-text-700">
            Every job runs the standard 3-stage checklist — progress is computed from it.
          </p>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex gap-2 flex-wrap mb-2.5">
        <button
          onClick={() => {
            setStatus(undefined);
            setPage(0);
          }}
          className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
          style={
            !status
              ? {
                  borderColor: 'var(--color-primary-600)',
                  background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
                }
              : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' }
          }
        >
          <span className={`text-[12.5px] whitespace-nowrap ${!status ? 'font-semibold text-text-900' : 'font-medium text-text-700'}`}>
            All
          </span>
          <span className={`text-[13px] font-[650] tabular-nums ${!status ? 'text-primary-600' : 'text-text-900'}`}>{total}</span>
        </button>
        {STATUS_ORDER.map((s) => {
          const meta = STATUS_META[s];
          const count = num(meta.statKey);
          const active = status === s;
          if (count === 0 && !active) return null; // quiet page: only real statuses shown
          return (
            <button
              key={s}
              onClick={() => {
                setStatus(active ? undefined : (s as InstallationStatus));
                setPage(0);
              }}
              className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
              style={
                active
                  ? {
                      borderColor: 'var(--color-primary-600)',
                      background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
                    }
                  : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' }
              }
            >
              <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: `var(--st-${meta.st}-fg)` }} />
              <span className={`text-[12.5px] whitespace-nowrap ${active ? 'font-semibold text-text-900' : 'font-medium text-text-700'}`}>
                {meta.label}
              </span>
              <span className={`text-[13px] font-[650] tabular-nums ${active ? 'text-primary-600' : 'text-text-900'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Distribution bar */}
      {total > 0 && segments.length > 0 && (
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mx-0.5 mb-5">
          {segments.map((s) => (
            <div
              key={s.key}
              title={`${s.label} · ${s.count}`}
              style={{ width: `${(s.count / total) * 100}%`, background: `var(--st-${s.st}-fg)` }}
            />
          ))}
        </div>
      )}

      {/* Table card */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
        <div className="flex items-center gap-2.5 px-3.5 py-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[420px]">
            <Search size={15} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setPage(0);
              }}
              placeholder="Filter by customer…"
              className="w-full h-[34px] pl-[34px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
            />
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            {moreOpen ? 'Hide' : 'More'} Filters
            {(projectManager || teamLead) && !moreOpen && (
              <span className="px-1.5 py-px rounded-full text-[10px] font-semibold bg-primary-600/15 text-primary-600 tabular-nums">
                {(projectManager ? 1 : 0) + (teamLead ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {moreOpen && (
          <div className="flex gap-2.5 px-3.5 pb-3 flex-wrap border-b border-background-600">
            <input
              type="text"
              value={projectManager}
              onChange={(e) => {
                setProjectManager(e.target.value);
                setPage(0);
              }}
              placeholder="Filter by project manager…"
              className="h-[34px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500 w-56"
            />
            <input
              type="text"
              value={teamLead}
              onChange={(e) => {
                setTeamLead(e.target.value);
                setPage(0);
              }}
              placeholder="Filter by team lead…"
              className="h-[34px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500 w-56"
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={`${thClass} pl-3.5`}>Customer</th>
                <th className={thClass}>Current stage</th>
                <th className={thClass}>Progress</th>
                <th className={thClass}>Team</th>
                <th className={thClass}>Est. completion</th>
                <th className="px-3.5 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 w-[90px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-600">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-3.5 py-4"><div className="h-4 bg-background-700 rounded w-40" /></td>
                    <td className="px-3 py-4"><div className="h-6 bg-background-700 rounded w-32" /></td>
                    <td className="px-3 py-4"><div className="h-4 bg-background-700 rounded w-28" /></td>
                    <td className="px-3 py-4"><div className="h-4 bg-background-700 rounded w-24" /></td>
                    <td className="px-3 py-4"><div className="h-4 bg-background-700 rounded w-20" /></td>
                    <td className="px-3.5 py-4"><div className="h-4 bg-background-700 rounded w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-text-600">
                    {status || customerName || projectManager || teamLead
                      ? 'No jobs match the current filters.'
                      : 'No production jobs yet — start one from a customer’s Production tab.'}
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const hasChecklist = r.checklistTotal != null && r.checklistTotal > 0;
                  const pct = Number(r.overallProgressPercentage ?? 0);
                  const overdue = isPast(r.estimatedCompletionDate) && r.overallStatus !== 'COMPLETED';
                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/production/customer/${r.customerId}`)}
                      className="hover:bg-background-700 transition-colors cursor-pointer"
                    >
                      <td className="px-3.5 py-[13px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-[9px] bg-background-600 border border-background-500 flex items-center justify-center text-[11px] font-[650] text-text-700 shrink-0">
                            {initialsOf(r.customerName)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-semibold text-text-900 whitespace-nowrap overflow-hidden text-ellipsis">
                              {r.customerName || `Customer #${r.customerId}`}
                            </div>
                            <div className="text-[11.5px] text-text-500">Job #{r.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-[13px]">{stageCell(r)}</td>
                      <td className="px-3 py-[13px] min-w-[150px]">
                        <div className="text-[12.5px] text-text-800 tabular-nums whitespace-nowrap">
                          {hasChecklist ? `${r.checklistDone}/${r.checklistTotal} · ${pct}%` : `${pct}%`}
                        </div>
                        <div className="h-1.5 rounded-full bg-background-600 overflow-hidden mt-1.5 max-w-[140px]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: pct === 100 ? 'var(--st-confirmed-fg)' : 'var(--color-primary-600)',
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-[13px] text-[12.5px] text-text-700 whitespace-nowrap leading-[1.5]">
                        {r.projectManagerAssigned || r.installationTeamLead ? (
                          <>
                            {r.projectManagerAssigned && <div>PM {r.projectManagerAssigned}</div>}
                            {r.installationTeamLead && <div>Lead {r.installationTeamLead}</div>}
                          </>
                        ) : (
                          <span className="text-text-500">Unassigned</span>
                        )}
                      </td>
                      <td
                        className="px-3 py-[13px] text-[12.5px] tabular-nums whitespace-nowrap"
                        style={{ color: overdue ? 'var(--st-lost-fg)' : 'var(--color-text-700)' }}
                      >
                        {fmtDate(r.estimatedCompletionDate)}
                        {overdue && <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em]">Overdue</div>}
                      </td>
                      <td className="px-3.5 py-[13px]">
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/production/customer/${r.customerId}`);
                            }}
                            title="View job"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3 px-3.5 py-3 border-t border-background-600 flex-wrap">
          <span className="text-[12.5px] text-text-600">
            Showing {rows.length} of {totalElements} jobs
          </span>
          <div className="flex-1" />
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="h-7 px-2.5 rounded-lg border border-background-600 text-[12.5px] text-text-700 disabled:opacity-40 hover:bg-background-700 transition-colors"
              >
                Prev
              </button>
              <span className="text-[12.5px] text-text-600 tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 px-2.5 rounded-lg border border-background-600 text-[12.5px] text-text-700 disabled:opacity-40 hover:bg-background-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductionPage;
