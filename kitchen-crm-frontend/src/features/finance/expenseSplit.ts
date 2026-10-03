/**
 * Cash-in-hand / cash-in-account split maths for one expense line. The form lets the split be
 * typed either as percentages or as exact rupees; these helpers keep the two fields of a pair
 * adding up, and turn one representation into the other with the same 2-decimal rounding the
 * server uses.
 */

export type SplitMode = 'PCT' | 'AMOUNT';

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** A typed field as a number, or null while it is blank / not a number / negative. */
export const parseField = (value: string): number | null => {
  if (value.trim() === '') {return null;}
  const n = Number(value);
  return Number.isNaN(n) || n < 0 ? null : n;
};

/**
 * The other field of a pair that must add up to `total` — null (leave the other field alone)
 * while what was typed is not a usable number or is more than the total.
 */
export const complementOf = (total: number, value: string): string | null => {
  const n = parseField(value);
  if (n === null || n > total) {return null;}
  return String(round2(total - n));
};

/** `part` as a percentage of `total`, 2 decimals. */
export const pctOf = (part: number, total: number): number => (total > 0 ? round2((part / total) * 100) : 0);

/** Rupees for a percentage of `total`, 2 decimals. */
export const amountOf = (pct: number, total: number): number => round2((total * pct) / 100);

export interface SplitResult {
  /** Set when the split cannot be saved; show it to the user as-is. */
  error?: string;
  cashInHandPct: number;
  cashInAccountPct: number;
  /** Exact rupees when the split was typed as amounts, null when typed as percentages. */
  cashInHandAmount: number | null;
}

/** Validates the typed split and shapes it for the save request. */
export const resolveSplit = (
  mode: SplitMode,
  total: number,
  hand: string,
  account: string,
  money: (n: number) => string = String,
): SplitResult => {
  const h = parseField(hand);
  const a = parseField(account);
  if (mode === 'PCT') {
    const hp = h ?? 0;
    const ap = a ?? 0;
    return {
      error: Math.abs(hp + ap - 100) > 0.01 ? 'C/H % and C/A % must add up to 100' : undefined,
      cashInHandPct: hp,
      cashInAccountPct: ap,
      cashInHandAmount: null,
    };
  }
  const blank: SplitResult = { cashInHandPct: 0, cashInAccountPct: 0, cashInHandAmount: null };
  if (total <= 0) {
    // No amount yet (it can be added later), so there is nothing to split — unless rupees were
    // typed into the split, which only make sense once the amount is there.
    const typed = round2((h ?? 0) + (a ?? 0));
    return typed > 0
      ? { ...blank, error: `Enter the amount — cash in hand + cash in account is ${money(typed)}` }
      : { cashInHandPct: 100, cashInAccountPct: 0, cashInHandAmount: null };
  }
  if (h === null && a === null) {
    return { ...blank, error: 'Enter how much is cash in hand and how much is cash in account' };
  }
  // One side typed, the other left empty: the empty one is simply the rest.
  const ch = round2(h ?? total - (a ?? 0));
  const ca = round2(a ?? total - ch);
  if (ch < 0 || ca < 0 || Math.abs(ch + ca - total) > 0.005) {
    return {
      ...blank,
      error: `Cash in hand + cash in account must equal the amount ${money(total)} — now ${money(round2(ch + ca))}`,
    };
  }
  const pct = pctOf(ch, total);
  return { cashInHandPct: pct, cashInAccountPct: round2(100 - pct), cashInHandAmount: ch };
};
