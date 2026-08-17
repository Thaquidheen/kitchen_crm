/**
 * tableKit — the HOCH table idiom (Customers / Architects / Vendors) as small reusable pieces,
 * so the eight product tabs don't each carry a private copy of the same forty class strings.
 * Purely presentational; data fetching, sorting and modals stay in each manager.
 */

import { useEffect, useState } from 'react';
import { Pagination } from '@/components/shared/Pagination';

export const thClass =
  'px-3 py-[9px] text-left text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500';

export const thActionsClass =
  'px-3.5 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 w-[110px]';

export const iconBtn =
  'w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors';

export const selectCls =
  'h-[34px] px-2.5 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[12.5px] outline-none cursor-pointer focus:border-primary-600 transition-colors';

export const searchInputCls =
  'w-full h-[34px] pl-[34px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500';

export const cardCls = 'bg-background-800 border border-background-600 rounded-[14px] overflow-hidden';

/** Modal form field classes — match CustomerForm's tokens. */
export const inputCls =
  'w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500';
export const textareaCls =
  'w-full px-3 py-2.5 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500 resize-none';
export const labelCls = 'block text-[12.5px] font-medium text-text-800 mb-1.5';

/** Status/type pill on the shared --st-* tokens. */
export function Pill({ st, label }: { st: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: `var(--st-${st}-bg)`, color: `var(--st-${st}-fg)` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--st-${st}-fg)` }} />
      {label}
    </span>
  );
}

export function ActivePill({ active }: { active: boolean }) {
  return <Pill st={active ? 'confirmed' : 'lost'} label={active ? 'Active' : 'Inactive'} />;
}

/** Loading skeleton rows; first cell mimics the avatar+name shape. */
export function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t border-background-600 animate-pulse">
          <td className="px-3 py-[13px]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-background-600 rounded-[9px]" />
              <div className="h-4 bg-background-600 rounded w-32" />
            </div>
          </td>
          {Array.from({ length: cols - 2 }).map((_, j) => (
            <td key={j} className="px-3 py-[13px]">
              <div className="h-4 bg-background-600 rounded w-20" />
            </td>
          ))}
          <td className="px-3.5 py-[13px]">
            <div className="h-4 bg-background-600 rounded w-16 ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}

/** A failed fetch must say so — the old tabs showed "Create your first X" on errors. */
export function ErrorRow({ cols, entity }: { cols: number; entity: string }) {
  return (
    <tr className="border-t border-background-600">
      <td colSpan={cols} className="px-5 py-14 text-center text-[13px] text-text-700">
        Failed to load {entity} — check the connection and try again.
      </td>
    </tr>
  );
}

export function EmptyRow({
  cols,
  filtered,
  title,
  sub,
}: {
  cols: number;
  filtered: boolean;
  title: string;
  sub: string;
}) {
  return (
    <tr className="border-t border-background-600">
      <td colSpan={cols} className="px-5 py-14 text-center">
        {filtered ? (
          <>
            <div className="text-[14.5px] font-semibold text-text-900">No matching records</div>
            <div className="text-[12.5px] text-text-700 mt-1">
              Nothing here for the current filters — try different ones or clear the search.
            </div>
          </>
        ) : (
          <>
            <div className="text-[14.5px] font-semibold text-text-900">{title}</div>
            <div className="text-[12.5px] text-text-700 mt-1">{sub}</div>
          </>
        )}
      </td>
    </tr>
  );
}

/** "Showing x of y" + pagination, the standard card footer. */
export function TableFooter({
  shown,
  total,
  page,
  totalPages,
  onPage,
}: {
  shown: number;
  total: number;
  page: number;
  totalPages: number;
  onPage: (zeroBased: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-[11px] border-t border-background-600">
      <span className="text-[12.5px] text-text-700">
        Showing {shown} of {total}
      </span>
      <div className="flex-1" />
      <Pagination currentPage={page + 1} totalPages={totalPages} onPageChange={(p) => onPage(p - 1)} />
    </div>
  );
}

/**
 * Debounced search draft (350ms, the CustomerList idiom). Returns the immediate draft for the
 * input plus the settled value for the query; onSettle fires when it lands (reset page there).
 */
export function useDebouncedSearch(onSettle?: () => void) {
  const [draft, setDraft] = useState('');
  const [settled, setSettled] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setSettled((prev) => {
        if (prev !== draft.trim()) onSettle?.();
        return draft.trim();
      });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);
  return { draft, setDraft, search: settled };
}
