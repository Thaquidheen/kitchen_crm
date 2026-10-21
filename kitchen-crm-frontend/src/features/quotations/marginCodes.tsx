/**
 * Margin codes on the quotation screens. The administrator types margin percentages; staff allowed
 * to see margins see the administrator's code for each category (R) and, when allowed to change
 * margins, choose a code. The code travels with the save; the server turns it into its percentage.
 */
import React, { createContext, useContext } from 'react';
import type { MarginCodeFields } from './types';
import { useQuotationAccess } from './useQuotationAccess';

export * from './marginCodeRules';
import { codeChoices, codeField, codeLabel, type MarginCodeCategory, type MarginKind } from './marginCodeRules';

// ---------------------------------------------------------------- the builder's context

interface MarginCodeState {
  codes: MarginCodeFields;
  offered: string[];
  setCode: (field: keyof MarginCodeFields, code: string | null) => void;
}

const MarginCodeContext = createContext<MarginCodeState | null>(null);
export const MarginCodeProvider = MarginCodeContext.Provider;

const chip = 'inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] font-semibold whitespace-nowrap';

/**
 * In place of the margin percentage, for staff: the category's code — a list to choose from for
 * those allowed to change margins, a label for the others. Nothing for the administrator (who
 * types the percentage) or for those not shown margins at all.
 */
export const MarginCodeField: React.FC<{ category: MarginCodeCategory; kind?: MarginKind; className?: string }> = ({
  category,
  kind = 'offer',
  className = '',
}) => {
  const access = useQuotationAccess();
  const ctx = useContext(MarginCodeContext);
  if (access.seesMargins || !access.seesMarginCodes) {return null;}
  const field = codeField(category, kind);
  const current = ctx?.codes[field] ?? null;

  if (access.picksMarginCodes && ctx) {
    const choices = codeChoices(ctx.offered, current);
    return (
      <div className={className}>
        <label className="block text-xs font-medium text-text-700 mb-1" htmlFor={`margin-code-${field}`}>
          Margin code
        </label>
        <select
          id={`margin-code-${field}`}
          value={current ?? ''}
          onChange={(e) => ctx.setCode(field, e.target.value || null)}
          className="w-full h-9 px-2.5 rounded-lg border border-background-600 bg-background-900 text-text-900 text-xs sm:text-sm outline-none focus:border-primary-600"
        >
          {!current && <option value="">Custom (as set by the admin)</option>}
          {choices.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-between text-xs ${className}`}>
      <span className="text-text-600">Margin</span>
      <span className={chip} style={{ background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }}>
        {codeLabel(current)}
      </span>
    </div>
  );
};

/** A read-only "Margin R" row for summaries (Category Breakdown, Review): staff only. */
export const MarginCodeRow: React.FC<{ code?: string | null; category?: MarginCodeCategory; kind?: MarginKind }> = ({
  code,
  category,
  kind = 'offer',
}) => {
  const access = useQuotationAccess();
  const ctx = useContext(MarginCodeContext);
  if (access.seesMargins || !access.seesMarginCodes) {return null;}
  const shown = code !== undefined ? code : category ? ctx?.codes[codeField(category, kind)] ?? null : null;
  return (
    <div className="flex justify-between">
      <span className="text-text-600">Margin</span>
      <span className={chip} style={{ background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }}>
        {codeLabel(shown)}
      </span>
    </div>
  );
};
