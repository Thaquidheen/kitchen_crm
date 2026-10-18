/**
 * QuotationBreakdown — the Line Items tab of a quotation: every line with its rate and amount
 * before margin, the margin, GST and what the customer pays, per category, then the kitchen's
 * summary. Rates show only with "See rates", margins only with "See margins" (the administrator
 * sees both); the server does not even send what a person may not see.
 */
import React from 'react';
import { FileText } from 'lucide-react';
import {
  commonTransport,
  expenseBreakdown,
  kitchenCategories,
  money,
  pctText,
  type CategoryBreakdown,
  type ExpenseBreakdown,
} from '../quotationBreakdown';

interface Access {
  seesRates: boolean;
  seesMargins: boolean;
}

const card = 'bg-background-800 border border-background-600 rounded-[14px]';
const label = 'text-[10.5px] font-semibold tracking-[0.09em] uppercase text-text-500';
const th = 'px-3 py-[8px] text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 whitespace-nowrap';
const td = 'px-3 py-2 text-[13px] tabular-nums whitespace-nowrap';

const SumRow: React.FC<{ name: string; value?: number; strong?: boolean; tone?: 'margin' }> = ({ name, value, strong, tone }) => (
  <div className={`flex items-center justify-end gap-6 px-3 py-1 text-[12.5px] ${strong ? 'font-[650] text-text-900' : 'text-text-700'}`}>
    <span className="uppercase tracking-wide text-[11.5px]">{name}</span>
    <span
      className="w-36 text-right tabular-nums"
      style={tone === 'margin' ? { color: 'var(--st-confirmed-fg)' } : undefined}
    >
      {money(value)}
    </span>
  </div>
);

const CategoryTable: React.FC<{ c: CategoryBreakdown; access: Access }> = ({ c, access }) => {
  const rates = access.seesRates;
  const margins = access.seesMargins;
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-baseline gap-3 mb-1.5">
        <span className={label}>{c.title}</span>
        {margins && c.marginPct !== undefined && (
          <span className="text-[11.5px] font-semibold" style={{ color: 'var(--st-confirmed-fg)' }}>
            Margin {pctText(c.marginPct)}
          </span>
        )}
        {c.taxPct !== undefined && <span className="text-[11.5px] text-text-500">GST {pctText(c.taxPct)}</span>}
      </div>
      <div className="overflow-x-auto rounded-[10px] border border-background-600">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="bg-background-700">
              <th className={`${th} text-left`}>Item / Description</th>
              <th className={`${th} text-center w-14`}>Qty</th>
              {rates && <th className={`${th} text-right`}>Rate before margin</th>}
              {rates && <th className={`${th} text-right`}>Amount before margin</th>}
              {rates && margins && <th className={`${th} text-right`}>With margin</th>}
            </tr>
          </thead>
          <tbody>
            {c.lines.map((l, i) => (
              <tr key={i} className="border-t border-background-600">
                <td className="px-3 py-2 text-[13px] text-text-900">
                  {l.name}
                  {rates && l.sqft !== undefined && l.rate !== undefined && (
                    <div className="text-[11.5px] text-text-500 tabular-nums">
                      {money(l.rate)} per sq ft × {l.sqft.toFixed(2)} sq ft
                    </div>
                  )}
                </td>
                <td className={`${td} text-center text-text-700`}>{l.qty}</td>
                {rates && (
                  <td className={`${td} text-right text-text-700`}>
                    {money(l.rate)}
                    {l.sqft !== undefined && <span className="text-text-500"> /sq ft</span>}
                  </td>
                )}
                {rates && <td className={`${td} text-right text-text-900`}>{money(l.base)}</td>}
                {rates && margins && <td className={`${td} text-right font-semibold text-text-900`}>{money(l.withMargin)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-background-600 bg-background-700/40 py-1.5">
          {rates && <SumRow name="Before margin" value={c.base} />}
          {margins && <SumRow name={`Margin ${pctText(c.marginPct)}`} value={c.margin} tone="margin" />}
          {rates && margins && <SumRow name="After margin" value={c.afterMargin} />}
          <SumRow name={`GST ${pctText(c.taxPct)}`} value={c.tax} />
          <SumRow name={`${c.title} total`} value={c.final} strong />
        </div>
      </div>
    </div>
  );
};

const ExpensesTable: React.FC<{ e: ExpenseBreakdown; access: Access }> = ({ e, access }) => {
  if (e.rows.length === 0) {return null;}
  const margins = access.seesMargins;
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-baseline gap-3 mb-1.5">
        <span className={label}>Other expenses</span>
        {margins && e.marginPct !== undefined && (
          <span className="text-[11.5px] font-semibold" style={{ color: 'var(--st-confirmed-fg)' }}>
            Margin {pctText(e.marginPct)}
          </span>
        )}
        {e.taxPct !== undefined && <span className="text-[11.5px] text-text-500">GST {pctText(e.taxPct)}</span>}
      </div>
      <div className="overflow-x-auto rounded-[10px] border border-background-600">
        <table className="w-full min-w-[420px]">
          <thead>
            <tr className="bg-background-700">
              <th className={`${th} text-left`}>Expense</th>
              <th className={`${th} text-right`}>Amount</th>
              {margins && <th className={`${th} text-right`}>With margin</th>}
            </tr>
          </thead>
          <tbody>
            {e.rows.map((r, i) => (
              <tr key={i} className="border-t border-background-600">
                <td className="px-3 py-2 text-[13px] text-text-900">{r.name}</td>
                <td className={`${td} text-right text-text-900`}>{money(r.amount)}</td>
                {margins && <td className={`${td} text-right font-semibold text-text-900`}>{money(r.withMargin)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-background-600 bg-background-700/40 py-1.5">
          <SumRow name="Expenses" value={e.base} />
          {margins && <SumRow name={`Margin ${pctText(e.marginPct)}`} value={e.margin} tone="margin" />}
          <SumRow name={`GST ${pctText(e.taxPct)}`} value={e.tax} />
          <SumRow name="Other expenses total" value={e.final} strong />
        </div>
      </div>
    </div>
  );
};

/** One row per category: how the kitchen's price is built up. */
const Summary: React.FC<{ cats: CategoryBreakdown[]; exp: ExpenseBreakdown; total?: number; access: Access }> = ({
  cats,
  exp,
  total,
  access,
}) => {
  const rates = access.seesRates;
  const margins = access.seesMargins;
  const rows = [
    ...cats.map((c) => ({ name: c.title, base: c.base, pct: c.marginPct, margin: c.margin, after: c.afterMargin, tax: c.tax, final: c.final })),
    ...(exp.rows.length
      ? [{ name: 'Other expenses', base: exp.base, pct: exp.marginPct, margin: exp.margin, after: exp.base + (exp.margin ?? 0), tax: exp.tax, final: exp.final }]
      : []),
  ];
  const sum = (k: 'base' | 'margin' | 'after' | 'tax' | 'final') =>
    rows.every((r) => r[k] !== undefined) ? rows.reduce((s, r) => s + (r[k] ?? 0), 0) : undefined;
  return (
    <div>
      <div className={`${label} mb-1.5`}>How this price is made</div>
      <div className="overflow-x-auto rounded-[10px] border border-background-600">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="bg-background-700">
              <th className={`${th} text-left`}>Category</th>
              {rates && <th className={`${th} text-right`}>Before margin</th>}
              {margins && <th className={`${th} text-right`}>Margin %</th>}
              {margins && <th className={`${th} text-right`}>Margin</th>}
              {rates && margins && <th className={`${th} text-right`}>After margin</th>}
              <th className={`${th} text-right`}>GST</th>
              <th className={`${th} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-background-600">
                <td className="px-3 py-2 text-[13px] text-text-900">{r.name}</td>
                {rates && <td className={`${td} text-right text-text-700`}>{money(r.base)}</td>}
                {margins && <td className={`${td} text-right text-text-700`}>{pctText(r.pct)}</td>}
                {margins && (
                  <td className={`${td} text-right`} style={{ color: 'var(--st-confirmed-fg)' }}>
                    {money(r.margin)}
                  </td>
                )}
                {rates && margins && <td className={`${td} text-right text-text-700`}>{money(r.after)}</td>}
                <td className={`${td} text-right text-text-700`}>{money(r.tax)}</td>
                <td className={`${td} text-right font-semibold text-text-900`}>{money(r.final)}</td>
              </tr>
            ))}
            <tr className="border-t border-background-600 bg-background-700/50">
              <td className="px-3 py-2 text-[12.5px] font-[650] text-text-900 uppercase tracking-wide">Total</td>
              {rates && <td className={`${td} text-right font-[650] text-text-900`}>{money(sum('base'))}</td>}
              {margins && <td className={td} />}
              {margins && (
                <td className={`${td} text-right font-[650]`} style={{ color: 'var(--st-confirmed-fg)' }}>
                  {money(sum('margin'))}
                </td>
              )}
              {rates && margins && <td className={`${td} text-right font-[650] text-text-900`}>{money(sum('after'))}</td>}
              <td className={`${td} text-right font-[650] text-text-900`}>{money(sum('tax'))}</td>
              <td className={`${td} text-right font-[650] text-text-900`}>{money(total ?? sum('final'))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface Props {
  /** The quotation as the server sent it. */
  quotation: any;
  access: Access;
}

export const QuotationBreakdown: React.FC<Props> = ({ quotation, access }) => {
  const kitchens: any[] = quotation?.kitchens ?? [];
  const miscPct = { margin: quotation?.miscellaneousMarginPercentage, tax: quotation?.miscellaneousTaxPercentage };
  // Expenses are kept per kitchen; a quotation that has them only at its own level shows them
  // with its only kitchen, or on their own when there are several.
  const quotationExpenses: any[] = quotation?.otherExpenses ?? [];
  const kitchenHasExpenses = kitchens.some((k) => (k.otherExpenses ?? []).length > 0);
  const sections = kitchens.length
    ? kitchens.map((k, i) => ({
        key: k.id ?? i,
        name: k.kitchenName || `Kitchen ${i + 1}`,
        cats: kitchenCategories(k, quotation),
        exp: expenseBreakdown(
          (k.otherExpenses ?? []).length ? k.otherExpenses : !kitchenHasExpenses && kitchens.length === 1 ? quotationExpenses : [],
          miscPct,
        ),
        total: k.totalAmount === null || k.totalAmount === undefined ? undefined : Number(k.totalAmount),
      }))
    : [
        {
          key: 'all',
          name: 'Line items',
          cats: kitchenCategories(quotation, quotation),
          exp: expenseBreakdown(quotationExpenses, miscPct),
          total: quotation?.totalAmount === null || quotation?.totalAmount === undefined ? undefined : Number(quotation.totalAmount),
        },
      ];
  const looseExpenses = kitchens.length > 1 && !kitchenHasExpenses ? expenseBreakdown(quotationExpenses, miscPct) : null;
  const transport = commonTransport(quotation);

  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <div key={s.key} className={`${card} p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={15} className="text-primary-600" />
            <span className="text-[14px] font-[650] text-text-900">{s.name}</span>
            <span className="flex-1" />
            <span className="text-[13px] font-semibold text-text-900 tabular-nums">{money(s.total)}</span>
          </div>
          {s.cats.length === 0 && s.exp.rows.length === 0 && (
            <p className="m-0 text-[12.5px] text-text-500">No line items.</p>
          )}
          {s.cats.map((c) => (
            <CategoryTable key={c.kind} c={c} access={access} />
          ))}
          <ExpensesTable e={s.exp} access={access} />
          {(s.cats.length > 0 || s.exp.rows.length > 0) && <Summary cats={s.cats} exp={s.exp} total={s.total} access={access} />}
        </div>
      ))}
      {transport && (
        <div className={`${card} p-4`}>
          <ExpensesTable e={transport} access={access} />
          <div className="flex items-center justify-end gap-6 px-3 pt-2 text-[13px] font-[650] text-text-900">
            <span className="uppercase tracking-wide text-[12px]">Quotation total</span>
            <span className="w-36 text-right tabular-nums">
              {money(quotation?.totalAmount === null || quotation?.totalAmount === undefined ? undefined : Number(quotation.totalAmount))}
            </span>
          </div>
        </div>
      )}
      {looseExpenses && looseExpenses.rows.length > 0 && (
        <div className={`${card} p-4`}>
          <ExpensesTable e={looseExpenses} access={access} />
        </div>
      )}
    </div>
  );
};

export default QuotationBreakdown;
