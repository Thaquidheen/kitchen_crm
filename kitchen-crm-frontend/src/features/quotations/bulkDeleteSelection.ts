/**
 * What the "Delete cancelled quotations" window has ticked, and what it sends. Pure, so the rules
 * are tested without the window: the ids are always those of the cancelled quotations listed,
 * in their order.
 */
import type { BulkDeleteRequest, BulkDeleteResult } from './bulkDeleteAPI';

/** Ticks or unticks one quotation. */
export function toggleOne(selected: ReadonlySet<number>, id: number): Set<number> {
  const next = new Set(selected);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

/** "Select all": ticks every listed quotation, or unticks them all when they already are. */
export function toggleAll(selected: ReadonlySet<number>, listed: readonly number[]): Set<number> {
  return allSelected(selected, listed) ? new Set() : new Set(listed);
}

/** The ticked quotations that are still listed, in list order. */
export function selectedIds(selected: ReadonlySet<number>, listed: readonly number[]): number[] {
  return listed.filter((id) => selected.has(id));
}

export function allSelected(selected: ReadonlySet<number>, listed: readonly number[]): boolean {
  return listed.length > 0 && listed.every((id) => selected.has(id));
}

/** Some but not all are ticked: the "Select all" box shows a dash. */
export function someSelected(selected: ReadonlySet<number>, listed: readonly number[]): boolean {
  const n = selectedIds(selected, listed).length;
  return n > 0 && n < listed.length;
}

export type BulkDeleteMode = 'selected' | 'all';

/**
 * What is sent to the server. "All" asks the server for every cancelled quotation, so one
 * cancelled after the list was loaded goes too; "selected" sends the ticked ones that are still
 * listed. Null when there is nothing to delete.
 */
export function bulkDeleteRequest(
  mode: BulkDeleteMode,
  selected: ReadonlySet<number>,
  listed: readonly number[],
): BulkDeleteRequest | null {
  if (mode === 'all') {
    return listed.length > 0 ? { allCancelled: true } : null;
  }
  const ids = selectedIds(selected, listed);
  return ids.length > 0 ? { ids } : null;
}

/** How many quotations the confirmation says are about to be deleted. */
export function deleteCount(
  mode: BulkDeleteMode,
  selected: ReadonlySet<number>,
  listed: readonly number[],
  totalCancelled: number,
): number {
  return mode === 'all' ? Math.max(totalCancelled, listed.length) : selectedIds(selected, listed).length;
}

export const quotationsWord = (n: number) => (n === 1 ? '1 quotation' : `${n} quotations`);

/**
 * The toast after deleting: how many went, and for each one that stayed, which quotation and
 * why. `labelOf` names a quotation from the list; an unknown id is shown as its number.
 */
export function bulkDeleteSummary(
  result: BulkDeleteResult,
  labelOf: (id: number) => string | undefined,
): { message: string; skipped: string[] } {
  const message =
    result.deleted > 0 ? `${quotationsWord(result.deleted)} deleted` : 'No quotation was deleted';
  const skipped = result.skipped.map((s) => `${labelOf(s.id) ?? `Quotation #${s.id}`}: ${s.reason}`);
  return { message, skipped };
}
