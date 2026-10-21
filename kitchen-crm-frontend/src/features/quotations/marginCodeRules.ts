/**
 * Margin codes, the rules without React (unit tested): field names, what staff read, the codes a
 * quotation starts from or carries, and a line's amount with margin. See marginCodes.tsx.
 */
import type { MarginCodeFields } from './types';

export type MarginCodeCategory = 'accessories' | 'cabinets' | 'doors' | 'lighting' | 'miscellaneous';
export type MarginKind = 'offer' | 'mrp';

/** The quotation field holding a category's code. */
export const codeField = (category: MarginCodeCategory, kind: MarginKind = 'offer'): keyof MarginCodeFields =>
  `${category}${kind === 'mrp' ? 'Mrp' : ''}MarginCode` as keyof MarginCodeFields;

export const CODE_FIELDS: Array<keyof MarginCodeFields> = (['offer', 'mrp'] as MarginKind[]).flatMap((kind) =>
  (['accessories', 'cabinets', 'doors', 'lighting', 'miscellaneous'] as MarginCodeCategory[]).map((c) => codeField(c, kind)),
);

/** What staff read for a margin: its code, or "Custom" when no code stands for the percentage. */
export const codeLabel = (code?: string | null): string => (code && code.trim() ? code : 'Custom');

/** The codes carried by a quotation, as the builder keeps them (missing = null). */
export const pickCodes = (source: MarginCodeFields | null | undefined): MarginCodeFields =>
  Object.fromEntries(CODE_FIELDS.map((f) => [f, source?.[f] ?? null])) as MarginCodeFields;

/**
 * The codes a new quotation starts from: each category's default code, the MRP ones the same as
 * the offer ones (as the server does with the percentages).
 */
export const defaultCodes = (defaults: Partial<Record<MarginCodeCategory, string | null>> | undefined): MarginCodeFields => {
  const out: Record<string, string | null> = {};
  for (const c of ['accessories', 'cabinets', 'doors', 'lighting', 'miscellaneous'] as MarginCodeCategory[]) {
    out[codeField(c, 'offer')] = defaults?.[c] ?? null;
    out[codeField(c, 'mrp')] = defaults?.[c] ?? null;
  }
  return out as MarginCodeFields;
};

/** The choices of a code list: the codes on offer, plus the current one if it is not among them. */
export const codeChoices = (offered: string[], current?: string | null): string[] =>
  current && !offered.some((c) => c.toUpperCase() === current.toUpperCase()) ? [current, ...offered] : offered;

/**
 * A line's amount with margin, from the rate with margin the server sent: rate × quantity (× the
 * face area for a door, whose rate is per sq ft). Unknown (undefined) for a line the server has not
 * priced yet — one added or re-sized since the last save.
 */
export const lineAmountWithMargin = (
  item: { rateWithMargin?: number | null; quantity?: number | null; calculatedSqft?: number | null; widthMm?: number | null; heightMm?: number | null },
  perSqft = false,
): number | undefined => {
  if (item.rateWithMargin === null || item.rateWithMargin === undefined) {return undefined;}
  const qty = item.quantity ?? 1;
  const area = perSqft
    ? item.calculatedSqft ?? (item.widthMm && item.heightMm ? (item.widthMm * item.heightMm) / 92903 : 1)
    : 1;
  return Math.round(Number(item.rateWithMargin) * area * qty * 100) / 100;
};

/** The sum of the amounts with margin, or undefined when any of them is not known. */
export const sumWithMargin = (amounts: Array<number | undefined>): number | undefined =>
  amounts.some((a) => a === undefined) ? undefined : amounts.reduce((s: number, a) => s + (a as number), 0);
