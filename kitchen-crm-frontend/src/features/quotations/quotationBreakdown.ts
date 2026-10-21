/**
 * How a quotation was priced, line by line: the rate before margin, the amount before margin, the
 * margin, and what the customer pays — worked out from the stored rates with the same rules the
 * quotation builder uses (no React, so it can be unit tested).
 *
 * The stored line "totalPrice" is NOT used: for cabinets it multiplies the per-cabinet rate by the
 * area a second time, and for doors it already holds margin and tax. The builder never trusted it
 * either. The category totals saved with each kitchen are the authoritative figures; the lines
 * explain them.
 */

export type LineKind = 'cabinets' | 'doors' | 'accessories' | 'lighting';

export const CATEGORY_TITLE: Record<LineKind, string> = {
  cabinets: 'Cabinets',
  doors: 'Doors',
  accessories: 'Accessories',
  lighting: 'Lighting',
};

const NAME_KEYS: Record<LineKind, string[]> = {
  cabinets: ['description', 'cabinetTypeName'],
  doors: ['description', 'doorTypeName'],
  accessories: ['description', 'accessoryName', 'customItemName'],
  lighting: ['itemName', 'description'],
};

const num = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '') {return undefined;}
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** 92 903 mm² = 1 sq ft. A door's rate is per square foot of its face (width × height). */
export const doorFaceSqft = (widthMm?: number | null, heightMm?: number | null): number =>
  widthMm && heightMm ? (widthMm * heightMm) / 92903 : 1;

export interface BreakdownLine {
  name: string;
  qty: number;
  /** Rate before margin; undefined when this person is not shown rates. */
  rate?: number;
  /** Doors: the rate is per square foot of this face area. */
  sqft?: number;
  /** Amount before margin. */
  base?: number;
  /** Amount with the category margin, before GST. */
  withMargin?: number;
  /** Rate with the category margin (per sq ft for a door), as the server sent it to staff shown codes. */
  rateWithMargin?: number;
}

export interface CategoryBreakdown {
  kind: LineKind;
  title: string;
  lines: BreakdownLine[];
  marginPct?: number;
  /** The administrator's code for the margin (null = "Custom"), for staff shown codes. */
  marginCode?: string | null;
  taxPct?: number;
  /** Before margin. */
  base?: number;
  margin?: number;
  /** Before margin + margin. */
  afterMargin?: number;
  tax?: number;
  /** What the customer pays for the category. */
  final?: number;
}

export interface StoredTotals {
  base?: unknown;
  margin?: unknown;
  tax?: unknown;
  final?: unknown;
}

export const breakdownLine = (kind: LineKind, item: any, marginPct?: number): BreakdownLine => {
  const qty = num(item?.quantity) ?? 1;
  const name = NAME_KEYS[kind].map((k) => item?.[k]).find((v) => v) || 'Item';
  const rate = num(item?.unitPrice);
  if (rate === undefined) {
    // No rate for this person: the server's amount with margin, when it sent one.
    const withMargin = num(item?.amountWithMargin);
    const rateWithMargin = num(item?.rateWithMargin);
    return withMargin === undefined && rateWithMargin === undefined
      ? { name, qty }
      : { name, qty, withMargin, rateWithMargin, sqft: kind === 'doors' ? num(item?.calculatedSqft) : undefined };
  }
  // The face area the server priced the door with; worked out from the size only when it is missing.
  const sqft =
    kind === 'doors' ? num(item?.calculatedSqft) ?? doorFaceSqft(num(item?.widthMm), num(item?.heightMm)) : undefined;
  const base = rate * (sqft ?? 1) * qty;
  return {
    name,
    qty,
    rate,
    sqft,
    base,
    withMargin: marginPct === undefined ? undefined : base * (1 + marginPct / 100),
  };
};

/**
 * One category of one kitchen. The stored totals win; what is missing (a quotation saved before
 * they were kept, or a figure this person is not sent) is worked out from the lines.
 */
export const categoryBreakdown = (
  kind: LineKind,
  items: any[] | undefined,
  pct: { margin?: unknown; tax?: unknown; code?: string | null },
  stored: StoredTotals = {},
): CategoryBreakdown => {
  const marginPct = num(pct.margin);
  const taxPct = num(pct.tax);
  const lines = (items ?? []).map((it) => breakdownLine(kind, it, marginPct));
  const haveRates = lines.length > 0 && lines.every((l) => l.base !== undefined);
  const lineBase = haveRates ? lines.reduce((s, l) => s + (l.base ?? 0), 0) : undefined;
  const base = num(stored.base) ?? lineBase;
  const margin = num(stored.margin) ?? (base !== undefined && marginPct !== undefined ? (base * marginPct) / 100 : undefined);
  let afterMargin = base !== undefined && margin !== undefined ? base + margin : undefined;
  const tax = num(stored.tax) ?? (afterMargin !== undefined && taxPct !== undefined ? (afterMargin * taxPct) / 100 : undefined);
  const final = num(stored.final) ?? (afterMargin !== undefined && tax !== undefined ? afterMargin + tax : undefined);
  // Without the rates or the margin (staff shown codes): what the customer pays less GST.
  if (afterMargin === undefined && final !== undefined && tax !== undefined) {
    afterMargin = final - tax;
  }
  return { kind, title: CATEGORY_TITLE[kind], lines, marginPct, marginCode: pct.code, taxPct, base, margin, afterMargin, tax, final };
};

export interface ExpenseBreakdown {
  rows: Array<{ name: string; amount: number; withMargin?: number }>;
  marginPct?: number;
  taxPct?: number;
  base: number;
  margin?: number;
  tax?: number;
  final?: number;
}

/** Other expenses (transport, installation, …): the miscellaneous margin and GST apply to them. */
export const expenseBreakdown = (expenses: any[] | undefined, pct: { margin?: unknown; tax?: unknown }): ExpenseBreakdown => {
  const marginPct = num(pct.margin);
  const taxPct = num(pct.tax);
  const rows = (expenses ?? [])
    .map((e) => ({ name: String(e?.name ?? 'Expense'), amount: num(e?.amount) ?? 0 }))
    .filter((e) => e.amount !== 0)
    .map((e) => ({ ...e, withMargin: marginPct === undefined ? undefined : e.amount * (1 + marginPct / 100) }));
  const base = rows.reduce((s, r) => s + r.amount, 0);
  // Without the margin (not sent to everyone) GST and the total cannot be worked out: unknown, not
  // a smaller figure.
  const margin = marginPct === undefined ? undefined : (base * marginPct) / 100;
  const after = margin === undefined ? undefined : base + margin;
  const tax = after === undefined || taxPct === undefined ? undefined : (after * taxPct) / 100;
  return { rows, marginPct, taxPct, base, margin, tax, final: after === undefined || tax === undefined ? undefined : after + tax };
};

/**
 * Transportation charged once for a quotation with several kitchens (kept on the quotation, not on
 * a kitchen), priced like the other expenses.
 */
export const commonTransport = (quotation: any): ExpenseBreakdown | null => {
  const kitchens: any[] = quotation?.kitchens ?? [];
  const amount = num(quotation?.transportationPrice) ?? 0;
  if (kitchens.length < 2 || amount <= 0) {return null;}
  return expenseBreakdown([{ name: 'Transportation (all kitchens)', amount }], {
    margin: quotation?.miscellaneousMarginPercentage,
    tax: quotation?.miscellaneousTaxPercentage,
  });
};

const KINDS: LineKind[] = ['cabinets', 'doors', 'accessories', 'lighting'];

/** Every category of a kitchen (or of a quotation saved without kitchens), in builder order. */
export const kitchenCategories = (source: any, quotation: any): CategoryBreakdown[] =>
  KINDS.map((kind) =>
    categoryBreakdown(
      kind,
      source?.[kind],
      {
        margin: quotation?.[`${kind}MarginPercentage`],
        tax: quotation?.[`${kind}TaxPercentage`],
        code: quotation?.[`${kind}MarginCode`] ?? null,
      },
      {
        base: source?.[`${kind}BaseTotal`],
        margin: source?.[`${kind}MarginAmount`],
        tax: source?.[`${kind}TaxAmount`],
        final: source?.[`${kind}FinalTotal`],
      },
    ),
  ).filter((c) => c.lines.length > 0);

/** Rupees with paise, Indian grouping: ₹1,23,456.78. */
export const money = (n?: number | null): string =>
  n === undefined || n === null || !Number.isFinite(n)
    ? '—'
    : `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const pctText = (n?: number): string => (n === undefined ? '—' : `${Number(n.toFixed(2))}%`);
