/**
 * The figures the server worked out, as staff screens use them (no React, so it can be unit tested).
 * Staff are not sent the margin percentages, so a screen cannot work a total out for them. It shows
 * what the server worked out for the form as it is: the saved figures while nothing that changes
 * the price has been changed, else the server's preview of the changed form (priced as a save
 * would, nothing kept). Until that preview is back it shows "—".
 */
import type { MarginCodeFields } from './types';
import { codeField, type MarginCodeCategory } from './marginCodeRules';

const round2 = (n: number) => Math.round(n * 100) / 100;

const known = (v: number | null | undefined): v is number => v !== null && v !== undefined && !Number.isNaN(Number(v));

/**
 * What the other expenses come to on the server, with margin and GST: the total less the category
 * totals it is made of. Unknown (null) when any of them is.
 */
export const otherExpensesFromServer = (
  total: number | null | undefined,
  categoryTotals: Array<number | null | undefined>,
): number | null => {
  if (!known(total) || !categoryTotals.every(known)) {return null;}
  return round2(Number(total) - categoryTotals.reduce((s: number, v) => s + Number(v), 0));
};

/** The GST inside an amount that includes it. */
export const taxInside = (withTax: number, taxPct: number): number =>
  taxPct > 0 ? (withTax * taxPct) / (100 + taxPct) : 0;

type Row = Record<string, unknown>;

const LINE_LISTS = ['accessories', 'cabinets', 'doors', 'lighting'] as const;
type LineList = (typeof LINE_LISTS)[number];
/** Fields holding the server's figures rather than what was entered. */
const LINE_FIGURES = ['rateWithMargin', 'amountWithMargin'];
const KITCHEN_FIGURES = ['totalAmount', 'taxAmount', 'accessoriesFinalTotal', 'cabinetsFinalTotal', 'doorsFinalTotal', 'lightingFinalTotal'];

const omit = (o: Row, keys: string[]): Row => {
  const c = { ...o };
  keys.forEach((k) => delete c[k]);
  return c;
};
const withoutLineFigures = (o: Row): Row => {
  const c = { ...o };
  for (const list of LINE_LISTS) {
    if (Array.isArray(c[list])) {
      c[list] = (c[list] as Row[]).map((l) => omit(l, LINE_FIGURES));
    }
  }
  return c;
};

/** The form as the person entered it: without the server's figures that the screen keeps in it. */
export const withoutFigures = (form: Row): Row => {
  const rest = withoutLineFigures(form);
  if (Array.isArray(rest.kitchens)) {
    rest.kitchens = (rest.kitchens as Row[]).map((k) => omit(withoutLineFigures(k), KITCHEN_FIGURES));
  }
  return rest;
};

/** The form's content for "unsaved changes": what was entered, not the figures shown with it. */
export const formKey = (form: Row | null | undefined): string => (form ? JSON.stringify(withoutFigures(form)) : '');

const WORDING = [
  'customerId', 'projectName', 'validUntil', 'notes', 'termsConditions', 'warrantyAndService', 'importantNote',
  'paymentAcceptancePct', 'paymentDeliveryPct', 'paymentInstallationPct',
];
const KITCHEN_WORDING = ['kitchenName', 'scopeDetails', 'planImages'];

/** The part of the quotation form that sets its price: everything entered but the wording and the plans. */
export const pricingSnapshot = (form: Row | null | undefined): string => {
  if (!form) {return '';}
  const rest = omit(withoutFigures(form), WORDING);
  if (Array.isArray(rest.kitchens)) {
    rest.kitchens = (rest.kitchens as Row[]).map((k) => omit(k, KITCHEN_WORDING));
  }
  return JSON.stringify(rest);
};

/** A line's identity as the save sends it (form) and as the server answers it (server). */
const LINE_KEY: Record<LineList, { form: (l: Row) => unknown; server: (l: Row) => unknown }> = {
  accessories: { form: (l) => l.id, server: (l) => l.accessoryId },
  cabinets: { form: (l) => l.cabinetTypeId || l.id, server: (l) => l.cabinetTypeId },
  doors: { form: (l) => l.doorTypeId || l.id, server: (l) => l.doorTypeId },
  lighting: { form: (l) => l.id || 0, server: (l) => l.itemId },
};
const num = (v: unknown) => (v === null || v === undefined || v === '' ? NaN : Number(v));
const sameLine = (list: LineList, f: Row, s: Row | undefined) =>
  s !== undefined && num(LINE_KEY[list].form(f)) === num(LINE_KEY[list].server(s)) && num(f.quantity || 1) === num(s.quantity);

const pricedLines = (list: LineList, formLines: unknown, serverLines: unknown): unknown => {
  if (!Array.isArray(formLines)) {return formLines;}
  const server = Array.isArray(serverLines) ? (serverLines as Row[]) : [];
  // Line for line: a list of another length matches nothing; else each line on its own.
  const sameLength = server.length === formLines.length;
  return (formLines as Row[]).map((f, i) => {
    const match = sameLength && sameLine(list, f, server[i]);
    return {
      ...f,
      rateWithMargin: match ? server[i].rateWithMargin ?? undefined : undefined,
      amountWithMargin: match ? server[i].amountWithMargin ?? undefined : undefined,
    };
  });
};

/**
 * The form with the figures of the server's preview of it. The server answers the lines in the
 * order they were saved, which is the order they were sent; a line that does not match its
 * counterpart (product and quantity) gets no figures — it shows "—" — rather than another line's.
 * Kitchens are matched in order.
 */
export const withPricedFigures = <F extends Row>(form: F, priced: Row): F => {
  const out: Row = { ...form };
  const formKitchens = Array.isArray(form.kitchens) ? (form.kitchens as Row[]) : [];
  if (formKitchens.length > 0) {
    const pk = Array.isArray(priced.kitchens) ? (priced.kitchens as Row[]) : [];
    out.kitchens = formKitchens.map((k, i) => {
      const p = pk.length === formKitchens.length ? pk[i] : undefined;
      const kitchen: Row = { ...k };
      KITCHEN_FIGURES.forEach((f) => {
        kitchen[f] = p?.[f] ?? null;
      });
      LINE_LISTS.forEach((list) => {
        kitchen[list] = pricedLines(list, k[list], p?.[list]);
      });
      return kitchen;
    });
  } else {
    LINE_LISTS.forEach((list) => {
      out[list] = pricedLines(list, form[list], priced[list]);
    });
  }
  return out as F;
};

const MONEY = /(Amount|Total|Final|WithMargin)$/;

/**
 * The server's answer with its amounts to the paisa, as a save stores them (the database keeps two
 * decimals; a preview's figures come straight from the calculation).
 */
export const roundAmounts = <T,>(value: T, key = ''): T => {
  if (typeof value === 'number') {
    return (MONEY.test(key) ? Math.round(value * 100) / 100 : value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => roundAmounts(v, key)) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Row).map(([k, v]) => [k, roundAmounts(v, k)])) as T;
  }
  return value;
};

const CATEGORIES: MarginCodeCategory[] = ['accessories', 'cabinets', 'doors', 'lighting', 'miscellaneous'];
const same = (a?: string | null, b?: string | null) => (a ?? '').trim().toUpperCase() === (b ?? '').trim().toUpperCase();

/**
 * The categories whose (offer) margin code differs from the one the figures on screen were worked
 * out with: the amounts with margin of their lines are out of date.
 */
export const changedCodeCategories = (
  opened: Partial<MarginCodeFields> | null | undefined,
  now: Partial<MarginCodeFields> | null | undefined,
): MarginCodeCategory[] =>
  opened ? CATEGORIES.filter((c) => !same(opened[codeField(c)], now?.[codeField(c)])) : [];
