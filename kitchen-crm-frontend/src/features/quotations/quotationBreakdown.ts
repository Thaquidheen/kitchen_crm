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
  /** What it is made of, in words: a cabinet's material, size and inner panel; a brand. No prices. */
  detail?: string;
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

/**
 * What a line is made of, in words, for everyone who sees the line: a cabinet's material (SS 304…),
 * its size unless the name already gives it, and its inner panel; an accessory's or door's brand.
 */
export const lineDetail = (kind: LineKind, item: any, name = ''): string | undefined => {
  const parts: string[] = [];
  if (kind === 'cabinets') {
    if (item?.materialName) {parts.push(String(item.materialName));}
    const w = num(item?.widthMm);
    const h = num(item?.heightMm);
    const d = num(item?.depthMm);
    if (w && h && !name.includes('×')) {parts.push(d ? `${w}×${h}×${d} mm` : `${w}×${h} mm`);}
    const panels = num(item?.innerPanelQuantity);
    if (item?.innerPanelTypeName && panels && panels > 0) {parts.push(`${item.innerPanelTypeName} ×${panels}`);}
  } else if ((kind === 'accessories' || kind === 'doors') && item?.brandName) {
    parts.push(String(item.brandName));
  }
  return parts.length > 0 ? parts.join(' · ') : undefined;
};

export const breakdownLine = (kind: LineKind, item: any, marginPct?: number): BreakdownLine => {
  const qty = num(item?.quantity) ?? 1;
  const name = NAME_KEYS[kind].map((k) => item?.[k]).find((v) => v) || 'Item';
  const detail = lineDetail(kind, item, String(name));
  const described = detail ? { name, detail } : { name };
  const rate = num(item?.unitPrice);
  if (rate === undefined) {
    // No rate for this person: the server's amount with margin, when it sent one.
    const withMargin = num(item?.amountWithMargin);
    const rateWithMargin = num(item?.rateWithMargin);
    return withMargin === undefined && rateWithMargin === undefined
      ? { ...described, qty }
      : { ...described, qty, withMargin, rateWithMargin, sqft: kind === 'doors' ? num(item?.calculatedSqft) : undefined };
  }
  // The face area the server priced the door with; worked out from the size only when it is missing.
  const sqft =
    kind === 'doors' ? num(item?.calculatedSqft) ?? doorFaceSqft(num(item?.widthMm), num(item?.heightMm)) : undefined;
  const base = rate * (sqft ?? 1) * qty;
  return {
    ...described,
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

/** One row of the quotation summary: what was priced, the margin on it, and what the customer pays. */
export interface SummaryRow {
  name: string;
  /** Before margin. */
  base?: number;
  margin?: number;
  /** The category's margin % (the same in every kitchen), or the share worked out from the amounts. */
  pct?: number;
  /** The administrator's code for that margin (staff shown codes). */
  code?: string | null;
  /** Before margin + margin: what is charged before GST. */
  after?: number;
  tax?: number;
  final?: number;
}

const known = (v: number | undefined): v is number => v !== undefined && Number.isFinite(v);
/** A sum that is unknown as soon as one part is (better a dash than a figure that is quietly short). */
const total = (parts: Array<number | undefined>): number | undefined =>
  parts.every(known) ? parts.reduce((s: number, v) => s + (v as number), 0) : undefined;

/** A row from parts: summed, with "after" = before + margin, or what is paid less GST when only that is known. */
const rowOf = (name: string, parts: SummaryRow[], extra: Partial<SummaryRow> = {}): SummaryRow => {
  const base = total(parts.map((p) => p.base));
  const margin = total(parts.map((p) => p.margin));
  const tax = total(parts.map((p) => p.tax));
  const final = total(parts.map((p) => p.final));
  const after = known(base) && known(margin) ? base + margin : total(parts.map((p) => p.after)) ?? (known(final) && known(tax) ? final - tax : undefined);
  return { name, base, margin, after, tax, final, ...extra };
};

const categoryRow = (c: CategoryBreakdown): SummaryRow => ({
  name: c.title, base: c.base, margin: c.margin, pct: c.marginPct, code: c.marginCode, after: c.afterMargin, tax: c.tax, final: c.final,
});
const expenseRow = (name: string, e: ExpenseBreakdown): SummaryRow => ({
  name,
  base: e.base,
  margin: e.margin,
  pct: e.marginPct,
  // Without the margin (staff): what is charged less GST.
  after: e.margin !== undefined ? e.base + e.margin : known(e.final) && known(e.tax) ? e.final - e.tax : undefined,
  tax: e.tax,
  final: e.final,
});

/** The share a margin is of an amount, in %: the markup on the cost (÷ before margin) or of the price (÷ after margin). */
export const shareOf = (part?: number, whole?: number): number | undefined =>
  known(part) && known(whole) && whole !== 0 ? (part / whole) * 100 : undefined;

export interface QuotationSummary {
  /** One row per kitchen, then the transportation shared by all kitchens (none when there is one kitchen). */
  byKitchen: SummaryRow[];
  /** Every category over all kitchens, then the other expenses (including the shared transportation). */
  byCategory: SummaryRow[];
  total: SummaryRow;
}

/**
 * The whole quotation at a glance, from its kitchens' breakdowns: per kitchen and per category, what
 * was priced, the margin and what the customer pays. The stored quotation total wins for the total.
 */
export const quotationSummary = (
  sections: Array<{ name: string; cats: CategoryBreakdown[]; exp: ExpenseBreakdown; total?: number }>,
  transport: ExpenseBreakdown | null,
  quotationTotal?: number,
  miscCode?: string | null,
): QuotationSummary => {
  const kitchenRows = sections.map((s) => {
    const parts = [...s.cats.map(categoryRow), ...(s.exp.rows.length ? [expenseRow('Other expenses', s.exp)] : [])];
    const row = rowOf(s.name, parts);
    return known(s.total) ? { ...row, final: s.total, after: row.after ?? (known(row.tax) ? s.total - row.tax : undefined) } : row;
  });
  const transportRow = transport ? expenseRow('Transportation (all kitchens)', transport) : null;
  const byKitchen = sections.length > 1 ? [...kitchenRows, ...(transportRow ? [transportRow] : [])] : [];

  const kinds = Array.from(new Set(sections.flatMap((s) => s.cats.map((c) => c.kind))));
  const order: LineKind[] = ['cabinets', 'doors', 'accessories', 'lighting'];
  const byCategory: SummaryRow[] = order
    .filter((k) => kinds.includes(k))
    .map((k) => {
      const cats = sections.flatMap((s) => s.cats.filter((c) => c.kind === k));
      const pcts = Array.from(new Set(cats.map((c) => c.marginPct)));
      const row = rowOf(CATEGORY_TITLE[k], cats.map(categoryRow), { code: cats[0]?.marginCode });
      return { ...row, pct: pcts.length === 1 && known(pcts[0]) ? pcts[0] : shareOf(row.margin, row.base) };
    });
  const expenseParts = [
    ...sections.filter((s) => s.exp.rows.length > 0).map((s) => expenseRow('Other expenses', s.exp)),
    ...(transportRow ? [transportRow] : []),
  ];
  if (expenseParts.length > 0) {
    const row = rowOf('Other expenses', expenseParts, { code: miscCode ?? null });
    const pct = sections.map((s) => s.exp.marginPct).find(known) ?? transport?.marginPct;
    byCategory.push({ ...row, pct: known(pct) ? pct : shareOf(row.margin, row.base) });
  }

  const totalRow = rowOf('Total', byCategory);
  return {
    byKitchen,
    byCategory,
    total: known(quotationTotal) ? { ...totalRow, final: quotationTotal, after: totalRow.after ?? (known(totalRow.tax) ? quotationTotal - totalRow.tax : undefined) } : totalRow,
  };
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * For someone not sent the miscellaneous margin (staff), other expenses cannot be priced on the
 * screen. They are what the server priced them at: a kitchen's saved total less its categories,
 * with the GST inside that; the transportation shared by all kitchens likewise is the quotation's
 * total less the kitchens'. Figures already known are left as they are.
 */
export const fillServerExpenses = <S extends { cats: CategoryBreakdown[]; exp: ExpenseBreakdown; total?: number }>(
  sections: S[],
  transport: ExpenseBreakdown | null,
  quotationTotal?: number,
): { sections: S[]; transport: ExpenseBreakdown | null } => {
  const fill = (e: ExpenseBreakdown, final?: number): ExpenseBreakdown => {
    if (known(e.final) || !known(final) || e.rows.length === 0) {return e;}
    const tax = known(e.taxPct) ? (final * e.taxPct) / (100 + e.taxPct) : undefined;
    return { ...e, final: round2(final), tax: tax === undefined ? undefined : round2(tax) };
  };
  // Only from totals the server really priced: a category with lines but a 0 total was never priced
  // (a duplicated quotation is saved with its category totals at 0) and leaves nothing to work from.
  const priced = (c: CategoryBreakdown) => c.lines.length === 0 || (known(c.final) && c.final > 0);
  const filled = sections.map((s) => {
    const finals = s.cats.map((c) => c.final);
    const rest =
      known(s.total) && finals.every(known) && s.cats.every(priced)
        ? s.total - finals.reduce((a: number, v) => a + (v as number), 0)
        : undefined;
    return { ...s, exp: fill(s.exp, rest !== undefined && rest >= 0 ? rest : undefined) };
  });
  const kitchenTotals = sections.map((s) => s.total);
  const shared =
    transport && known(quotationTotal) && kitchenTotals.every(known)
      ? fill(transport, quotationTotal - kitchenTotals.reduce((a: number, v) => a + (v as number), 0))
      : transport;
  return { sections: filled, transport: shared };
};
