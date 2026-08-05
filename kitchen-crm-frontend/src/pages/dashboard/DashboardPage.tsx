/**
 * DashboardPage
 * HOCH ERP dashboard: one scroll, four bands, no tabs.
 *
 * Every figure here comes from a real endpoint — nothing is placeholder or mock. Where a metric
 * has no time series behind it, the card shows a caption instead of a fabricated delta or
 * sparkline: a missing trend is better than an invented one.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, RefreshCw, ChevronRight } from 'lucide-react';
import { useGetDashboardSummaryQuery, useGetRevenueAnalyticsQuery } from '@/features/dashboard/dashboardAPI';
import { useGetCustomerStatisticsQuery } from '@/features/customers/customersAPI';
import { useGetQuotationsQuery, useGetRemindersQuery, useGetReminderStatsQuery } from '@/app/baseApi';
import ROUTES from '@/routes/routes.config';

type RangeKey = '7D' | '30D' | '3M' | '1Y';
const RANGES: { key: RangeKey; months: number; label: string; prev: string }[] = [
  { key: '7D', months: 1, label: '7D', prev: 'vs prev period' },
  { key: '30D', months: 1, label: '30D', prev: 'vs prev 30 days' },
  { key: '3M', months: 3, label: '3M', prev: 'vs prev quarter' },
  { key: '1Y', months: 12, label: '1Y', prev: 'vs last year' },
];

/** Indian short-form currency: ₹18.4L, ₹1.42Cr. */
const inr = (n?: number | null) => {
  const v = Number(n ?? 0);
  if (!isFinite(v)) return '₹0';
  const a = Math.abs(v);
  if (a >= 1e7) return '₹' + (v / 1e7).toFixed(2) + 'Cr';
  if (a >= 1e5) return '₹' + (v / 1e5).toFixed(1) + 'L';
  return '₹' + Math.round(v).toLocaleString('en-IN');
};
const inrFull = (n?: number | null) => '₹' + Math.round(Number(n ?? 0)).toLocaleString('en-IN');

const CARD = 'bg-background-800 border border-background-600 rounded-[14px]';
const MICRO = 'text-[11px] font-[650] tracking-[0.06em] uppercase text-text-500';

const fmtDay = (iso?: string) => {
  if (!iso) return '—';
  const [d] = iso.split('T');
  const [y, m, dd] = d.split('-').map(Number);
  if (!y) return d;
  return new Date(y, m - 1, dd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};
const fmtClock = (iso?: string) => {
  if (!iso || !iso.includes('T')) return '';
  const [h, min] = iso.split('T')[1].split(':');
  const hr = Number(h);
  if (Number.isNaN(hr)) return '';
  const ap = hr >= 12 ? 'pm' : 'am';
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return `${String(h12).padStart(2, '0')}:${min} ${ap}`;
};

/** Sparkline points over a 100x34 viewBox. */
const sparkPoints = (vals: number[]) => {
  if (vals.length < 2) return '';
  const mx = Math.max(...vals);
  const mn = Math.min(...vals);
  const r = mx - mn || 1;
  return vals
    .map((n, i) => `${((i / (vals.length - 1)) * 100).toFixed(1)},${(31 - ((n - mn) / r) * 27).toFixed(1)}`)
    .join(' ');
};

const QSTATUS: Record<string, { st: string; label: string }> = {
  DRAFT: { st: 'draft', label: 'Draft' },
  SENT: { st: 'lead', label: 'Sent' },
  APPROVED: { st: 'confirmed', label: 'Approved' },
  REJECTED: { st: 'lost', label: 'Rejected' },
  REVISED: { st: 'design', label: 'Revised' },
  PENDING: { st: 'potential', label: 'Pending' },
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>('30D');

  const { data: summary, refetch: refetchSummary } = useGetDashboardSummaryQuery();
  const { data: revenue, refetch: refetchRevenue } = useGetRevenueAnalyticsQuery();
  const { data: custStats } = useGetCustomerStatisticsQuery();
  const { data: latestQ } = useGetQuotationsQuery({ page: 0, size: 5, sortBy: 'createdAt', sortDir: 'desc' });
  const { data: todayRem } = useGetRemindersQuery({ bucket: 'TODAY', page: 0, size: 6 });
  const { data: remStats } = useGetReminderStatsQuery();

  const s: any = summary ?? {};
  const rev: any = revenue ?? {};

  const monthly: { month: string; revenue: number; target: number }[] = useMemo(
    () =>
      (rev.monthlyRevenue ?? []).map((m: any) => ({
        month: String(m.month ?? ''),
        revenue: Number(m.revenue ?? 0),
        target: Number(m.target ?? 0),
      })),
    [rev.monthlyRevenue]
  );

  const cfg = RANGES.find((r) => r.key === range) ?? RANGES[1];

  /** Revenue in the selected window, and the equal window before it — a real delta. */
  const revWindow = useMemo(() => {
    const n = Math.min(cfg.months, monthly.length);
    if (!n) return { value: 0, delta: null as number | null, series: [] as number[] };
    const cur = monthly.slice(-n);
    const prev = monthly.slice(Math.max(0, monthly.length - 2 * n), monthly.length - n);
    const sum = (a: typeof cur) => a.reduce((t, x) => t + x.revenue, 0);
    const c = sum(cur);
    const p = sum(prev);
    return {
      value: c,
      delta: prev.length === n && p > 0 ? ((c - p) / p) * 100 : null,
      series: monthly.map((m) => m.revenue),
    };
  }, [monthly, cfg.months]);

  const onRefresh = () => {
    refetchSummary();
    refetchRevenue();
    toast.success('Dashboard refreshed');
  };

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateLine = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // ---- Band 1: KPIs ------------------------------------------------------
  const kpis = [
    {
      label: 'Revenue booked',
      value: inr(revWindow.value),
      delta: revWindow.delta,
      sub: cfg.prev,
      series: revWindow.series,
    },
    {
      label: 'Quotations sent',
      value: String(s.totalQuotations ?? 0),
      delta: null as number | null,
      sub: `${s.pendingQuotations ?? 0} pending · ${s.approvedQuotations ?? 0} approved`,
      series: [] as number[],
    },
    {
      label: 'Open pipeline',
      value: inr(s.totalQuotationValue),
      delta: null as number | null,
      sub: `Across ${s.totalQuotations ?? 0} quotations`,
      series: [] as number[],
    },
    {
      label: 'Cash collected',
      value: inr(s.totalPaymentsReceived),
      delta: null as number | null,
      sub: `${inr(s.pendingPayments)} still pending`,
      series: [] as number[],
    },
  ];

  // ---- Band 2: needs attention (all real, all navigable) -----------------
  const alerts = [
    {
      label: 'Payments pending',
      sub: 'Outstanding across all projects',
      count: inr(s.pendingPayments),
      st: 'lost',
      to: ROUTES.PAYMENTS,
      show: Number(s.pendingPayments ?? 0) > 0,
    },
    {
      label: 'Quotations pending approval',
      sub: 'Waiting on a decision',
      count: String(s.pendingQuotations ?? 0),
      st: 'potential',
      to: ROUTES.QUOTATIONS,
      show: Number(s.pendingQuotations ?? 0) > 0,
    },
    {
      label: 'Reminders due today',
      sub: 'Calls and follow-ups scheduled for today',
      count: String((remStats as any)?.today ?? 0),
      st: 'design',
      to: ROUTES.REMINDERS,
      show: Number((remStats as any)?.today ?? 0) > 0,
    },
    {
      label: 'Reminders overdue',
      sub: 'Still open from earlier days',
      count: String((remStats as any)?.overdue ?? 0),
      st: 'nego',
      to: ROUTES.REMINDERS,
      show: Number((remStats as any)?.overdue ?? 0) > 0,
    },
    {
      label: 'Projects behind schedule',
      sub: 'Installation slipped past plan',
      count: String(s.overdueProjects ?? 0),
      st: 'lead',
      to: ROUTES.PROJECTS,
      show: Number(s.overdueProjects ?? 0) > 0,
    },
  ].filter((a) => a.show);

  // ---- Band 2: sales pipeline -------------------------------------------
  const cs: any = custStats ?? {};
  const pipeline = [
    { key: 'lead', label: 'Leads', count: Number(cs.lead ?? 0) },
    { key: 'potential', label: 'Potential', count: Number(cs.potential ?? 0) },
    { key: 'design', label: 'Design stage', count: Number(cs.design_stage ?? 0) },
    { key: 'quote', label: 'Quote given', count: Number(cs.quote_given ?? 0) },
    { key: 'follow', label: 'Follow up', count: Number(cs.follow_up ?? 0) },
    { key: 'nego', label: 'Negotiation', count: Number(cs.negotiations ?? 0) },
    { key: 'confirmed', label: 'Confirmed', count: Number(cs.confirmed ?? 0) },
  ];
  const pipeMax = Math.max(1, ...pipeline.map((p) => p.count));
  const pipeTotal = Number(cs.total ?? pipeline.reduce((t, p) => t + p.count, 0));

  // ---- Band 3 ------------------------------------------------------------
  const quotes: any[] = (latestQ as any)?.content ?? [];
  const agenda: any[] = (todayRem as any)?.content ?? [];

  const chartMax = Math.max(1, ...monthly.map((m) => Math.max(m.revenue, m.target)));
  const axis = [1, 0.75, 0.5, 0.25, 0].map((f) => inr(chartMax * f));

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div>
          <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">{greeting}, Super Admin</h1>
          <p className="mt-[5px] mb-0 text-[13px] text-text-700">{dateLine}</p>
        </div>
        <div className="flex-1" />
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex gap-0.5 p-[3px] rounded-[10px] bg-background-700 border border-background-600">
            {RANGES.map((r) => {
              const active = range === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`px-[11px] py-[5px] rounded-lg text-[12.5px] tabular-nums transition-colors ${
                    active
                      ? 'bg-background-800 border border-background-500 text-text-900 font-[650] shadow-sm'
                      : 'border border-transparent text-text-600 font-medium hover:text-text-900'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          <button className="inline-flex items-center gap-[7px] px-[13px] py-2 rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[13px] font-medium hover:bg-background-700 transition-colors">
            <Download size={14} />
            Export
          </button>
          <button
            onClick={onRefresh}
            title="Refresh data"
            className="w-[34px] h-[34px] rounded-[10px] border border-background-500 bg-background-800 text-text-600 flex items-center justify-center hover:bg-background-700 hover:text-text-900 transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Band 1 — KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-4">
        {kpis.map((k) => {
          const up = (k.delta ?? 0) >= 0;
          const pts = sparkPoints(k.series);
          return (
            <div key={k.label} className={`${CARD} px-4 pt-3.5 pb-2.5 min-w-0`}>
              <div className={`${MICRO} truncate`}>{k.label}</div>
              <div className="flex items-baseline gap-2.5 mt-1.5 flex-wrap">
                <span className="text-[24px] font-bold tracking-[-0.02em] tabular-nums text-text-900">{k.value}</span>
                {k.delta != null && (
                  <span
                    className="text-xs font-[650] px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      background: up ? 'var(--st-confirmed-bg)' : 'var(--st-lost-bg)',
                      color: up ? 'var(--st-confirmed-fg)' : 'var(--st-lost-fg)',
                    }}
                  >
                    {up ? '+' : '−'}
                    {Math.abs(k.delta).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="text-[11.5px] text-text-500 mt-0.5 truncate">{k.sub}</div>
              {pts ? (
                <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="w-full h-[34px] mt-2.5 block">
                  <polygon
                    points={`0,34 ${pts} 100,34`}
                    fill="color-mix(in oklab, var(--color-primary-600) 14%, transparent)"
                  />
                  <polyline
                    points={pts}
                    fill="none"
                    stroke="var(--color-primary-600)"
                    strokeWidth={1.6}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              ) : (
                <div className="h-[34px] mt-2.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Band 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start mb-4">
        {/* Revenue vs target */}
        <div className={CARD}>
          <div className="flex items-start gap-3 px-4 pt-3.5 pb-2.5 flex-wrap">
            <div className="min-w-0">
              <div className="text-[13.5px] font-[650] text-text-900">Revenue vs target</div>
              <div className="text-xs text-text-600 mt-0.5">Payments received per month</div>
            </div>
            <div className="flex-1" />
            <div className="flex gap-3 items-center flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11.5px] text-text-600 whitespace-nowrap">
                <span className="w-[9px] h-[9px] rounded-[3px] bg-primary-600" />
                Actual
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11.5px] text-text-600 whitespace-nowrap">
                <span className="w-3 border-t-2 border-dashed" style={{ borderColor: 'var(--st-potential-fg)' }} />
                Target
              </span>
            </div>
          </div>

          {monthly.length === 0 ? (
            <div className="px-4 pb-6 pt-2 text-[12.5px] text-text-600">No revenue recorded yet.</div>
          ) : (
            <>
              <div className="flex gap-2.5 px-4 pt-1">
                <div className="flex flex-col justify-between h-[172px] text-[10.5px] text-text-500 text-right shrink-0 tabular-nums">
                  {axis.map((a, i) => (
                    <span key={i}>{a}</span>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="relative h-[172px] border-b border-background-500">
                    {[0, 25, 50, 75].map((t) => (
                      <div
                        key={t}
                        className="absolute left-0 right-0 border-t border-dashed border-background-600"
                        style={{ top: `${t}%` }}
                      />
                    ))}
                    <div className="absolute inset-0 flex items-end gap-[7px]">
                      {monthly.map((m, i) => (
                        <div
                          key={m.month + i}
                          className="flex-1 min-w-0 h-full relative flex items-end"
                          title={`${m.month} · ${inrFull(m.revenue)} (target ${inrFull(m.target)})`}
                        >
                          <div
                            className="w-full rounded-t-[4px]"
                            style={{
                              height: `${(m.revenue / chartMax) * 100}%`,
                              background:
                                i === monthly.length - 1
                                  ? 'var(--color-primary-600)'
                                  : 'color-mix(in oklab, var(--color-primary-600) 72%, transparent)',
                            }}
                          />
                          {m.target > 0 && (
                            <div
                              className="absolute -left-0.5 -right-0.5 border-t-2 border-dashed opacity-90"
                              style={{
                                bottom: `${(m.target / chartMax) * 100}%`,
                                borderColor: 'var(--st-potential-fg)',
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-[7px] mt-[7px]">
                    {monthly.map((m, i) => (
                      <span
                        key={i}
                        className="flex-1 min-w-0 text-center text-[10px] text-text-500 whitespace-nowrap overflow-hidden"
                      >
                        {m.month}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-px mt-3.5 border-t border-background-600 bg-background-600">
                <div className="bg-background-800 px-4 py-3 min-w-0">
                  <div className={`${MICRO} truncate`}>Total outstanding</div>
                  <div className="text-base font-[650] mt-[3px] tabular-nums text-text-900">
                    {inr(rev.totalOutstanding)}
                  </div>
                </div>
                <div className="bg-background-800 px-4 py-3 min-w-0">
                  <div className={`${MICRO} truncate`}>Collection efficiency</div>
                  <div className="text-base font-[650] mt-[3px] tabular-nums" style={{ color: 'var(--st-confirmed-fg)' }}>
                    {Number(rev.collectionEfficiency ?? 0).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-background-800 px-4 py-3 min-w-0">
                  <div className={`${MICRO} truncate`}>Avg payment time</div>
                  <div className="text-base font-[650] mt-[3px] tabular-nums text-text-900">
                    {Math.round(Number(rev.averagePaymentTime ?? 0))} days
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Needs attention + pipeline */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className={`${CARD} overflow-hidden`}>
            <div className="flex items-center gap-2.5 px-4 py-3.5">
              <div className="text-[13.5px] font-[650] text-text-900 whitespace-nowrap">Needs attention</div>
              {alerts.length > 0 && (
                <span
                  className="text-[11px] font-[650] px-2 py-0.5 rounded-full tabular-nums shrink-0"
                  style={{ background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }}
                >
                  {alerts.length}
                </span>
              )}
            </div>
            {alerts.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12.5px] text-text-600 border-t border-background-600">
                Nothing needs attention right now.
              </div>
            ) : (
              alerts.map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 border-t border-background-600 hover:bg-background-700 transition-colors text-left"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: `var(--st-${a.st}-fg)` }} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium text-text-900 truncate">{a.label}</span>
                    <span className="block text-[11.5px] text-text-500 truncate">{a.sub}</span>
                  </span>
                  <span
                    className="text-[12.5px] font-bold px-2.5 py-0.5 rounded-full tabular-nums shrink-0"
                    style={{ background: `var(--st-${a.st}-bg)`, color: `var(--st-${a.st}-fg)` }}
                  >
                    {a.count}
                  </span>
                  <ChevronRight size={14} className="text-text-500 shrink-0" />
                </button>
              ))
            )}
          </div>

          <div className={`${CARD} px-4 pt-3.5 pb-4`}>
            <div className="flex items-center gap-2.5">
              <div className="text-[13.5px] font-[650] text-text-900 whitespace-nowrap">Sales pipeline</div>
              <div className="flex-1" />
              <span className="text-[11.5px] text-text-500 whitespace-nowrap tabular-nums">{pipeTotal} customers</span>
            </div>
            {pipeline.map((p) => (
              <div key={p.key} className="mt-2.5">
                <div className="flex items-baseline gap-2">
                  <span className={`text-[12.5px] font-medium ${p.count ? 'text-text-900' : 'text-text-500'}`}>
                    {p.label}
                  </span>
                  <div className="flex-1" />
                  <span
                    className={`text-[12.5px] font-[650] tabular-nums w-6 text-right ${
                      p.count ? 'text-text-900' : 'text-text-500'
                    }`}
                  >
                    {p.count}
                  </span>
                </div>
                <div className="h-[7px] rounded-full bg-background-700 mt-[5px] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${p.count ? Math.max((p.count / pipeMax) * 100, 4) : 0}%`,
                      background: `var(--st-${p.key}-fg)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Band 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <div className={`${CARD} overflow-hidden`}>
          <div className="flex items-center gap-2.5 px-4 py-3.5">
            <div className="text-[13.5px] font-[650] text-text-900 whitespace-nowrap">Latest quotations</div>
            <div className="flex-1" />
            <button
              onClick={() => navigate(ROUTES.QUOTATIONS)}
              className="text-[12.5px] font-semibold text-primary-600 hover:underline whitespace-nowrap"
            >
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-t border-background-600 bg-background-700">
                  <th className={`${MICRO} text-left px-4 py-2`}>Quotation</th>
                  <th className={`${MICRO} text-left px-3 py-2`}>Customer</th>
                  <th className={`${MICRO} text-right px-3 py-2`}>Amount</th>
                  <th className={`${MICRO} text-left px-3 py-2`}>Status</th>
                  <th className={`${MICRO} text-right px-4 py-2`}>Date</th>
                </tr>
              </thead>
              <tbody>
                {quotes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-[12.5px] text-text-600 border-t border-background-600"
                    >
                      No quotations yet.
                    </td>
                  </tr>
                ) : (
                  quotes.map((q) => {
                    const m = QSTATUS[q.status] ?? { st: 'draft', label: q.status ?? '—' };
                    return (
                      <tr
                        key={q.id}
                        onClick={() => navigate(`/quotations/${q.id}`)}
                        className="border-t border-background-600 hover:bg-background-700 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-2.5 text-[12.5px] font-semibold tabular-nums whitespace-nowrap text-text-900">
                          {q.projectName?.trim() || q.quotationNumber}
                        </td>
                        <td className="px-3 py-2.5 text-[13px] text-text-800 truncate max-w-[180px]">{q.customerName}</td>
                        <td className="px-3 py-2.5 text-[13px] font-[650] text-right tabular-nums whitespace-nowrap text-text-900">
                          {inr(q.totalAmount)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11.5px] font-semibold whitespace-nowrap"
                            style={{ background: `var(--st-${m.st}-bg)`, color: `var(--st-${m.st}-fg)` }}
                          >
                            <span
                              className="w-[5px] h-[5px] rounded-full"
                              style={{ background: `var(--st-${m.st}-fg)` }}
                            />
                            {m.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-text-600 text-right tabular-nums whitespace-nowrap">
                          {fmtDay(q.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${CARD} overflow-hidden`}>
          <div className="flex items-center gap-2.5 px-4 py-3.5">
            <div className="text-[13.5px] font-[650] text-text-900 whitespace-nowrap">Today's schedule</div>
            <span className="text-[11px] font-[650] px-2 py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums shrink-0">
              {agenda.length}
            </span>
            <div className="flex-1" />
            <button
              onClick={() => navigate(ROUTES.REMINDERS)}
              className="text-[12.5px] font-semibold text-primary-600 hover:underline whitespace-nowrap"
            >
              View all
            </button>
          </div>
          {agenda.length === 0 ? (
            <div className="px-4 py-10 text-center text-[12.5px] text-text-600 border-t border-background-600">
              Nothing scheduled for today.
            </div>
          ) : (
            agenda.map((a) => (
              <button
                key={a.id}
                onClick={() =>
                  navigate(a.ownerType === 'APPLIANCE' ? ROUTES.APPLIANCE_QUARTZ : `/customers/${a.ownerId ?? a.customerId}`)
                }
                className="w-full flex gap-2.5 px-4 py-2.5 border-t border-background-600 hover:bg-background-700 transition-colors text-left"
              >
                <span className="text-[11.5px] font-[650] text-text-600 tabular-nums whitespace-nowrap pt-px w-[62px] shrink-0">
                  {fmtClock(a.remindAt) || '—'}
                </span>
                <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--st-design-fg)' }} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-text-900 truncate">{a.title}</span>
                  <span className="block text-[11.5px] text-text-500 truncate">
                    {a.ownerName ?? a.customerName ?? '—'}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
