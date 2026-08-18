/**
 * ActivityLogTab — Settings > Activity Log (SUPER_ADMIN).
 * Top: per-user sign-in cards (last login, count, source IPs). Below: the filterable audit
 * table — event chips, module select, user search, date range — in the house table idiom.
 * Data refreshes on mount and every 60s while open.
 */

import { useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import {
  useGetActivityLogsQuery,
  useGetActivityStatsQuery,
  useGetLoginSummaryQuery,
} from './activityAPI';
import type { ActivityLogRow } from './activityAPI';
import { FilterChips } from '../../components/shared/FilterChips';
import {
  thClass,
  selectCls,
  searchInputCls,
  cardCls,
  inputCls,
  Pill,
  SkeletonRows,
  ErrorRow,
  EmptyRow,
  TableFooter,
  useDebouncedSearch,
} from '../products/components/tableKit';

const EVENT_META: Record<string, { st: string; label: string }> = {
  LOGIN: { st: 'confirmed', label: 'Sign-in' },
  LOGIN_FAILED: { st: 'lost', label: 'Failed sign-in' },
  LOGOUT: { st: 'draft', label: 'Sign-out' },
  ACTION: { st: 'design', label: 'Action' },
};

const COL_COUNT = 7;

/** Naive LocalDateTime string → "17 Aug 2026, 3:42 PM" without browser timezone shifts. */
const fmtStamp = (iso?: string): string => {
  if (!iso) return '—';
  const [d, t] = iso.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, day ?? 1).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  if (!t) return date;
  const hour = Number(t.split(':')[0]);
  const min = t.split(':')[1] ?? '00';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${date}, ${h12}:${min} ${hour >= 12 ? 'PM' : 'AM'}`;
};

export function ActivityLogTab() {
  const [page, setPage] = useState(0);
  const [eventFilter, setEventFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  // Reset inside the debounce callback, not in an effect on [search]: an effect renders once
  // with the new search term and the OLD page index first, firing and caching a wasted request
  // (and briefly showing a false "no results" if that page is out of range).
  const { draft, setDraft, search } = useDebouncedSearch(() => setPage(0));


  const { data, isLoading, isError } = useGetActivityLogsQuery(
    {
      eventType: eventFilter || undefined,
      module: moduleFilter || undefined,
      actor: search || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page,
      size: 25,
    },
    { pollingInterval: 60000 }
  );
  const { data: stats, isError: statsError } = useGetActivityStatsQuery(
    {
      module: moduleFilter || undefined,
      actor: search || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    },
    { pollingInterval: 60000 }
  );
  const {
    data: sessions = [],
    isError: sessionsError,
    isLoading: sessionsLoading,
  } = useGetLoginSummaryQuery(undefined, { pollingInterval: 60000 });

  const rows: ActivityLogRow[] = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  // With stats unavailable, omit counts entirely - a "0" beside a populated table reads as fact.
  const byEvent = stats?.byEvent ?? {};
  const n = (v?: number) => (statsError || !stats ? undefined : v ?? 0);
  const chips = [
    { key: '', label: 'All', count: n(stats?.total) },
    { key: 'LOGIN', label: 'Sign-ins', st: 'confirmed', count: n(byEvent.LOGIN) },
    { key: 'LOGIN_FAILED', label: 'Failed', st: 'lost', count: n(byEvent.LOGIN_FAILED) },
    { key: 'LOGOUT', label: 'Sign-outs', st: 'draft', count: n(byEvent.LOGOUT) },
    { key: 'ACTION', label: 'Actions', st: 'design', count: n(byEvent.ACTION) },
  ];

  const modules = Object.keys(stats?.byModule ?? {});
  const hasFilters = !!(eventFilter || moduleFilter || search || fromDate || toDate);

  return (
    <div className="space-y-4">
      {/* Sign-in footprint per user */}
      <div className={`${cardCls} p-4`}>
        <div className="text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 mb-2.5">
          Sign-ins by user
        </div>
        {sessionsError ? (
          <p className="m-0 text-[12.5px]" style={{ color: 'var(--st-lost-fg)' }}>
            Could not load sign-in data. It will retry automatically.
          </p>
        ) : sessionsLoading ? (
          <p className="m-0 text-[12.5px] text-text-600">Loading sign-ins...</p>
        ) : sessions.length === 0 ? (
          <p className="m-0 text-[12.5px] text-text-600">
            No sign-ins recorded yet — entries appear from the next login onward.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {sessions.map((u) => (
              <div
                key={u.email}
                className="rounded-[12px] border border-background-600 bg-background-700/50 px-3.5 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-text-900 truncate">
                      {u.name || u.email}
                    </div>
                    <div className="text-[11px] text-text-600 truncate">{u.email}</div>
                  </div>
                  <span className="text-[11px] text-text-600 tabular-nums whitespace-nowrap">
                    {u.loginCount} sign-in{u.loginCount === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-text-600">
                  Last: <span className="text-text-800 tabular-nums">{fmtStamp(u.lastLogin)}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {u.recentIps.map((ip) => (
                    <span
                      key={ip}
                      className="inline-flex px-1.5 py-[1.5px] rounded-md border border-background-600 bg-background-900 text-[10.5px] text-text-700 tabular-nums"
                    >
                      {ip}
                    </span>
                  ))}
                  {u.distinctIpCount > u.recentIps.length && (
                    <span className="text-[10.5px] text-text-500">
                      +{u.distinctIpCount - u.recentIps.length} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event chips */}
      <FilterChips items={chips} value={eventFilter} onChange={(k) => { setEventFilter(k); setPage(0); }} />

      {/* Log table */}
      <div className={cardCls}>
        <div className="flex items-center gap-2.5 px-3.5 py-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[380px]">
            <Search
              size={15}
              className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none"
            />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search user or email…"
              className={searchInputCls}
            />
          </div>
          <div className="flex-1" />
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(0);
            }}
            className={selectCls}
            aria-label="Module"
          >
            <option value="">All modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(0);
            }}
            className={`${inputCls} w-auto h-[34px]`}
            aria-label="From date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(0);
            }}
            className={`${inputCls} w-auto h-[34px]`}
            aria-label="To date"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={thClass}>Time</th>
                <th className={thClass}>User</th>
                <th className={thClass}>Event</th>
                <th className={thClass}>Module</th>
                <th className={thClass}>What</th>
                <th className={thClass}>IP</th>
                <th className={thClass}>Device</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows cols={COL_COUNT} />
              ) : isError ? (
                <ErrorRow cols={COL_COUNT} entity="the activity log" />
              ) : rows.length === 0 ? (
                <EmptyRow
                  cols={COL_COUNT}
                  filtered={hasFilters}
                  title="No activity recorded yet"
                  sub="Sign-ins, sign-outs and write actions appear here from now on — the log starts with this deploy."
                />
              ) : (
                rows.map((r) => {
                  const meta = EVENT_META[r.eventType] ?? EVENT_META.ACTION;
                  const failed = r.eventType === 'LOGIN_FAILED';
                  return (
                    <tr key={r.id} className="border-t border-background-600 hover:bg-background-700 transition-colors">
                      <td className="px-3 py-[11px] text-[12.5px] text-text-700 tabular-nums whitespace-nowrap">
                        {fmtStamp(r.createdAt)}
                      </td>
                      <td className="px-3 py-[11px]">
                        <div className="text-[13px] font-medium text-text-900 truncate max-w-[180px]">
                          {r.actorName || r.actorEmail || '—'}
                        </div>
                        {r.actorName && r.actorEmail && (
                          <div className="text-[11px] text-text-600 truncate max-w-[180px]">
                            {r.actorEmail}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-[11px]">
                        <span className="inline-flex items-center gap-1.5">
                          {failed && <ShieldAlert size={13} style={{ color: 'var(--st-lost-fg)' }} />}
                          <Pill st={meta.st} label={meta.label} />
                        </span>
                      </td>
                      <td className="px-3 py-[11px] text-[12.5px] text-text-800 whitespace-nowrap capitalize">
                        {r.module || '—'}
                      </td>
                      <td className="px-3 py-[11px]">
                        <div className="flex items-center gap-1.5 max-w-[300px]">
                          <span className="text-[12px] text-text-700 truncate" title={r.summary}>
                            {r.summary || '—'}
                          </span>
                          {r.statusCode != null && r.statusCode >= 400 && (
                            <span className="text-[11px] font-semibold shrink-0" style={{ color: 'var(--st-lost-fg)' }}>
                              {r.statusCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-[11px] text-[12px] text-text-800 tabular-nums whitespace-nowrap">
                        {r.ipAddress || '—'}
                      </td>
                      <td className="px-3 py-[11px]">
                        <div className="text-[11.5px] text-text-600 truncate max-w-[210px]" title={r.userAgent}>
                          {r.userAgent || '—'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TableFooter shown={rows.length} total={totalElements} page={page} totalPages={totalPages} onPage={setPage} />
      </div>
    </div>
  );
}

export default ActivityLogTab;
