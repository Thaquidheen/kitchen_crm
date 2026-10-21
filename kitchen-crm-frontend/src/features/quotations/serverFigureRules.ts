/**
 * The figures the server saved, as staff screens use them (no React, so it can be unit tested).
 * Staff are not sent the margin percentages, so a screen cannot work a total out for them: it shows
 * what the server worked out at the last save — and only while nothing that changes the price has
 * been changed since. After such a change it shows "—" until the quotation is saved again.
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

const WORDING = [
  'customerId', 'projectName', 'validUntil', 'notes', 'termsConditions', 'warrantyAndService', 'importantNote',
  'paymentAcceptancePct', 'paymentDeliveryPct', 'paymentInstallationPct',
];
const KITCHEN_WORDING = ['kitchenName', 'scopeDetails', 'planImages'];

/** The part of the quotation form that sets its price: everything but the wording and the plans. */
export const pricingSnapshot = (form: Record<string, unknown> | null | undefined): string => {
  if (!form) {return '';}
  const rest: Record<string, unknown> = { ...form };
  WORDING.forEach((k) => delete rest[k]);
  if (Array.isArray(rest.kitchens)) {
    rest.kitchens = (rest.kitchens as Array<Record<string, unknown>>).map((k) => {
      const kitchen = { ...k };
      KITCHEN_WORDING.forEach((f) => delete kitchen[f]);
      return kitchen;
    });
  }
  return JSON.stringify(rest);
};

const CATEGORIES: MarginCodeCategory[] = ['accessories', 'cabinets', 'doors', 'lighting', 'miscellaneous'];
const same = (a?: string | null, b?: string | null) => (a ?? '').trim().toUpperCase() === (b ?? '').trim().toUpperCase();

/**
 * The categories whose (offer) margin code was changed since the quotation was opened: the amounts
 * with margin the server sent for their lines are out of date.
 */
export const changedCodeCategories = (
  opened: Partial<MarginCodeFields> | null | undefined,
  now: Partial<MarginCodeFields> | null | undefined,
): MarginCodeCategory[] =>
  opened ? CATEGORIES.filter((c) => !same(opened[codeField(c)], now?.[codeField(c)])) : [];
