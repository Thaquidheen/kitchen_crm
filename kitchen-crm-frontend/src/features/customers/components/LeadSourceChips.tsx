/**
 * LeadSourceChips
 * A customer's lead sources as compact chips. Shared by the customers table and the detail
 * page so the two never drift apart.
 */

import { Building2 } from 'lucide-react';
import {
  customerLeadSourceRows,
  isLinkedSource,
  leadSourceDetailLines,
  leadSourceRowLabel,
} from '../leadSource';
import type { Customer } from '../types';

export interface LeadSourceChipsProps {
  customer: Customer;
  /** Show at most this many chips, with a "+N" counter for the rest. */
  max?: number;
}

export function LeadSourceChips({ customer, max }: LeadSourceChipsProps) {
  const rows = customerLeadSourceRows(customer);
  if (rows.length === 0) return <span className="text-text-600">—</span>;

  const shown = max ? rows.slice(0, max) : rows;
  const hidden = rows.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((row, i) => (
        <span
          key={row.id ?? i}
          title={leadSourceDetailLines(row).join('\n') || undefined}
          className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full bg-background-700 border border-background-600 text-[11.5px] font-medium text-text-800 max-w-[190px]"
        >
          {isLinkedSource(row.sourceType) && (
            <Building2 size={11} className="text-primary-600 shrink-0" />
          )}
          <span className="truncate">{leadSourceRowLabel(row)}</span>
        </span>
      ))}
      {hidden > 0 && <span className="text-[11.5px] text-text-600 tabular-nums">+{hidden}</span>}
    </div>
  );
}

export default LeadSourceChips;
