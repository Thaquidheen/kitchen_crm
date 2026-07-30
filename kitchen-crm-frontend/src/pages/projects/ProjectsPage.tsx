/**
 * ProjectsPage
 * HOCH ERP design: title + count pill, clickable status chips with distribution bar
 * (real counts from /projects/statistics), quiet inline financial stat, table card.
 * All existing functionality (search, status filter, actions, pagination) unchanged.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectList } from '@/features/projects/components/ProjectList';
import { useGetProjectStatisticsQuery } from '@/features/projects/projectsAPI';
import { Plus } from 'lucide-react';
import type { ProjectFilters } from '@/features/projects/types';

// Status -> chip token + label + statistics key (backend returns snake_case keys)
const STATUS_CHIPS: Array<{ status: string; st: string; label: string; statsKey: string }> = [
  { status: 'ACTIVE', st: 'lead', label: 'Active', statsKey: 'active_projects' },
  { status: 'IN_PROGRESS', st: 'design', label: 'In Progress', statsKey: 'in_progress_projects' },
  { status: 'COMPLETED', st: 'confirmed', label: 'Completed', statsKey: 'completed_projects' },
  { status: 'ON_HOLD', st: 'potential', label: 'On Hold', statsKey: 'on_hold_projects' },
  { status: 'CANCELLED', st: 'lost', label: 'Cancelled', statsKey: 'cancelled_projects' },
];

export function ProjectsPage() {
  const navigate = useNavigate();
  const { data: stats } = useGetProjectStatisticsQuery();
  const [filters, setFilters] = useState<ProjectFilters>({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const total: number = Number(stats?.total_projects ?? 0);
  const activeValue: number = Number(stats?.total_active_project_value ?? 0);
  const receivedValue: number = Number(stats?.total_received_amount ?? 0);
  const pendingValue: number = Number(stats?.total_pending_amount ?? 0);

  const activeStatus = filters.status ?? 'all';
  const setStatusFilter = (status?: string) => {
    setFilters((prev) => ({ ...prev, status: status as any, page: 0 }));
  };

  const chipCount = (key: string) => Number(stats?.[key] ?? 0);
  const segments = STATUS_CHIPS.map((c) => ({ ...c, count: chipCount(c.statsKey) })).filter((c) => c.count > 0);

  const chipStyle = (active: boolean) =>
    active
      ? {
          borderColor: 'var(--color-primary-600)',
          background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
        }
      : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' };

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">Projects</h1>
            <span className="text-xs font-[650] px-[9px] py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
              {total}
            </span>
          </div>
          <p className="mt-[5px] mb-0 text-[13px] text-text-700">
            Track every project from kickoff to handover.
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => navigate('/projects/new')}
          className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold whitespace-nowrap"
        >
          <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          New Project
        </button>
      </div>

      {/* Status chips + quiet financial stat */}
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
            All Projects
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
          const count = chipCount(c.statsKey);
          const active = activeStatus === c.status;
          return (
            <button
              key={c.status}
              onClick={() => setStatusFilter(c.status)}
              className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
              style={chipStyle(active)}
            >
              <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: `var(--st-${c.st}-fg)` }} />
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
        {activeValue > 0 && (
          <span className="text-[12.5px] text-text-700 whitespace-nowrap tabular-nums">
            Active value <span className="font-semibold text-text-900">₹{activeValue.toLocaleString('en-IN')}</span>
            {' · '}Received <span className="font-semibold" style={{ color: 'var(--st-confirmed-fg)' }}>₹{receivedValue.toLocaleString('en-IN')}</span>
            {' · '}Pending <span className="font-semibold" style={{ color: 'var(--st-potential-fg)' }}>₹{pendingValue.toLocaleString('en-IN')}</span>
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
              style={{ width: `${(c.count / total) * 100}%`, background: `var(--st-${c.st}-fg)` }}
            />
          ))}
        </div>
      )}

      {/* Table card */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] p-3.5">
        <ProjectList filters={filters} onFiltersChange={setFilters} />
      </div>
    </div>
  );
}

export default ProjectsPage;
