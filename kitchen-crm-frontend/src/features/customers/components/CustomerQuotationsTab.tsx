import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText } from 'lucide-react';
import { useGetQuotationsByCustomerQuery } from '@/app/baseApi';
import {
  QuotationStatusPill,
  formatQuotationValue,
} from '@/features/quotations/components/QuotationStatusPill';

export interface CustomerQuotationsTabProps {
  customerId: number;
}

export interface CustomerQuotationRow {
  id: number;
  quotationNumber: string;
  projectName?: string | null;
  totalAmount?: number | null;
  status?: string | null;
  validUntil?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
  folderId?: number | null;
  versionNumber?: number | null;
}

export interface QuotationSet {
  folderId: number | null;
  rows: CustomerQuotationRow[];
}

const ts = (d?: string | null) => (d ? new Date(d).getTime() || 0 : 0);

/**
 * Groups a customer's quotations into their folders (a folder holds the versions/options sent
 * for one enquiry), each folder in version order v1, v2, … and folders oldest first. Every
 * quotation appears exactly once — values are listed individually, never added together:
 * the versions are alternatives, so a sum would mean nothing.
 */
export function groupCustomerQuotations(list: CustomerQuotationRow[]): QuotationSet[] {
  const seen = new Set<number>();
  const byFolder = new Map<string, CustomerQuotationRow[]>();
  for (const q of list) {
    if (!q || seen.has(q.id)) {
      continue;
    }
    seen.add(q.id);
    const key = q.folderId === null || q.folderId === undefined ? `q${q.id}` : `f${q.folderId}`;
    const rows = byFolder.get(key) ?? [];
    rows.push(q);
    byFolder.set(key, rows);
  }
  const sets: QuotationSet[] = [...byFolder.values()].map((rows) => ({
    folderId: rows[0].folderId ?? null,
    rows: rows.sort(
      (a, b) => (a.versionNumber ?? 0) - (b.versionNumber ?? 0) || ts(a.createdAt) - ts(b.createdAt)
    ),
  }));
  const firstCreated = (s: QuotationSet) => Math.min(...s.rows.map((r) => ts(r.createdAt)));
  return sets.sort((a, b) => firstCreated(a) - firstCreated(b));
}

/** The most recently created quotation across all sets (marked "Latest" when there are several). */
export function latestQuotationId(sets: QuotationSet[]): number | null {
  let best: CustomerQuotationRow | null = null;
  for (const set of sets) {
    for (const r of set.rows) {
      if (!best || ts(r.createdAt) > ts(best.createdAt)) {
        best = r;
      }
    }
  }
  return best?.id ?? null;
}

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Theme colours are plain CSS variables, so Tailwind's /NN opacity modifiers don't apply —
// tints use color-mix like the rest of the app.
const TINT_HEAD = 'color-mix(in oklab, var(--color-background-700) 45%, transparent)';
const TINT_SET = 'color-mix(in oklab, var(--color-background-700) 28%, transparent)';
const TINT_ACCENT = 'color-mix(in oklab, var(--color-primary-600) 12%, transparent)';

const thCls =
  'px-4 py-2.5 text-left text-[10.5px] font-semibold tracking-[0.07em] uppercase text-text-500 whitespace-nowrap';

export const CustomerQuotationsTab: React.FC<CustomerQuotationsTabProps> = ({ customerId }) => {
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useGetQuotationsByCustomerQuery(customerId);

  const list: CustomerQuotationRow[] = (response as any)?.data?.content ?? [];
  const sets = useMemo(() => groupCustomerQuotations(list), [list]);
  const count = sets.reduce((n, s) => n + s.rows.length, 0);
  const latestId = useMemo(() => latestQuotationId(sets), [sets]);

  const open = (id: number) => navigate(`/quotations/${id}`);

  if (isLoading) {
    return (
      <div className="bg-background-800 border border-background-600 rounded-[14px] p-4 space-y-3 animate-pulse">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 bg-background-700 rounded-[10px]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-800 border border-background-600 rounded-[14px] px-6 py-10 text-center text-[13px] text-error">
        Failed to load quotations.
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="bg-background-800 border border-background-600 rounded-[14px] px-6 py-16 text-center">
        <FileText size={28} className="mx-auto text-text-500" />
        <div className="text-[14.5px] font-semibold text-text-900 mt-3">No quotations yet</div>
        <div className="text-[12.5px] text-text-700 mt-1">Quotations sent to this customer will be listed here.</div>
      </div>
    );
  }

  const multiSet = sets.length > 1;

  return (
    <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
      <div className="px-4 py-3 border-b border-background-600 flex items-center gap-2">
        <FileText size={16} className="text-primary-600" />
        <div className="text-[14px] font-semibold text-text-900">Quotations</div>
        <span className="text-[12px] text-text-600 tabular-nums">
          {count} quotation{count === 1 ? '' : 's'}
        </span>
      </div>

      {/* Desktop / tablet: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead style={{ background: TINT_HEAD }}>
            <tr>
              <th className={thCls}>Quotation</th>
              <th className={thCls}>Version</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Created</th>
              <th className={thCls}>Valid until</th>
              <th className={`${thCls} text-right`}>Value</th>
              <th className="w-10" />
            </tr>
          </thead>
          {sets.map((set, si) => (
            <tbody key={set.folderId ?? `single-${set.rows[0].id}`} className="divide-y divide-background-600">
              {multiSet && (
                <tr style={{ background: TINT_SET }}>
                  <td colSpan={7} className="px-4 py-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-text-600">
                    Quotation set {si + 1} · {set.rows.length} version{set.rows.length === 1 ? '' : 's'}
                  </td>
                </tr>
              )}
              {set.rows.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => open(q.id)}
                  className="cursor-pointer hover:bg-background-700 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-text-900 tabular-nums">{q.quotationNumber}</div>
                    {q.projectName && <div className="text-[12px] text-text-600 mt-0.5">{q.projectName}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-text-900 font-medium tabular-nums">v{q.versionNumber ?? 1}</span>
                    {q.id === latestId && count > 1 && (
                      <span className="ml-2 px-1.5 py-[1px] rounded-md text-[10.5px] font-semibold text-primary-600"
                        style={{ background: TINT_ACCENT }}>
                        Latest
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <QuotationStatusPill status={q.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-text-700">
                    {fmtDate(q.createdAt)}
                    {q.createdBy && <div className="text-[11.5px] text-text-500">{q.createdBy}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-text-700">{fmtDate(q.validUntil)}</td>
                  <td className="px-4 py-3 text-right font-[650] text-text-900 tabular-nums whitespace-nowrap">
                    {formatQuotationValue(q.totalAmount)}
                  </td>
                  <td className="pr-3 text-text-500">
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      {/* Phone: stacked rows */}
      <div className="md:hidden divide-y divide-background-600">
        {sets.map((set, si) => (
          <div key={set.folderId ?? `single-${set.rows[0].id}`}>
            {multiSet && (
              <div style={{ background: TINT_SET }}
                className="px-4 py-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-text-600">
                Quotation set {si + 1}
              </div>
            )}
            {set.rows.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => open(q.id)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-background-700 border-t border-background-600 first:border-t-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-text-900 text-[13px] tabular-nums">v{q.versionNumber ?? 1}</span>
                    <QuotationStatusPill status={q.status} />
                    {q.id === latestId && count > 1 && (
                      <span className="px-1.5 py-[1px] rounded-md text-[10.5px] font-semibold text-primary-600"
                        style={{ background: TINT_ACCENT }}>
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-text-600 mt-1 tabular-nums">
                    {q.quotationNumber} · {fmtDate(q.createdAt)}
                  </div>
                </div>
                <div className="text-[14px] font-[650] text-text-900 tabular-nums whitespace-nowrap">
                  {formatQuotationValue(q.totalAmount)}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const SUMMARY_ROWS = 6;

/**
 * Overview card: every quotation with its own exact value (replaces the old summed
 * "Total Value", which added alternative versions together). Same order as the Quotations tab.
 */
export const CustomerQuotationsSummary: React.FC<{ customerId: number; onViewAll: () => void }> = ({
  customerId,
  onViewAll,
}) => {
  const navigate = useNavigate();
  const { data: response, isLoading } = useGetQuotationsByCustomerQuery(customerId);
  const list: CustomerQuotationRow[] = (response as any)?.data?.content ?? [];
  const sets = useMemo(() => groupCustomerQuotations(list), [list]);
  const rows = useMemo(() => sets.flatMap((s) => s.rows), [sets]);
  const latestId = useMemo(() => latestQuotationId(sets), [sets]);

  return (
    <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-background-600">
        <div
          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-primary-600 shrink-0"
          style={{ background: 'color-mix(in oklab, var(--color-primary-600) 14%, transparent)' }}
        >
          <FileText size={15} />
        </div>
        <div className="min-w-0">
          <div className="text-[10.5px] font-semibold tracking-[0.07em] uppercase text-text-500">Quotations</div>
          <div className="text-[15px] font-[650] text-text-900 tabular-nums">{isLoading ? '…' : rows.length}</div>
        </div>
        <div className="flex-1" />
        {rows.length > 0 && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-[12.5px] font-medium text-primary-600 hover:underline whitespace-nowrap"
          >
            View all
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-4 text-[12.5px] text-text-600">{isLoading ? 'Loading…' : 'No quotations yet.'}</div>
      ) : (
        <div className="divide-y divide-background-600">
          {rows.slice(0, SUMMARY_ROWS).map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => navigate(`/quotations/${q.id}`)}
              className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-background-700 transition-colors"
            >
              <span className="text-[12.5px] font-semibold text-text-900 tabular-nums w-7 shrink-0">
                v{q.versionNumber ?? 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-700 tabular-nums">
                {q.quotationNumber}
                {q.id === latestId && rows.length > 1 && (
                  <span
                    className="ml-2 px-1.5 py-[1px] rounded-md text-[10.5px] font-semibold text-primary-600"
                    style={{ background: TINT_ACCENT }}
                  >
                    Latest
                  </span>
                )}
              </span>
              <span className="hidden sm:inline-flex">
                <QuotationStatusPill status={q.status} />
              </span>
              <span className="text-[13px] font-[650] text-text-900 tabular-nums whitespace-nowrap">
                {formatQuotationValue(q.totalAmount)}
              </span>
            </button>
          ))}
          {rows.length > SUMMARY_ROWS && (
            <button
              type="button"
              onClick={onViewAll}
              className="w-full px-4 py-2 text-[12.5px] font-medium text-primary-600 hover:bg-background-700 text-left"
            >
              View all {rows.length} quotations
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerQuotationsTab;
