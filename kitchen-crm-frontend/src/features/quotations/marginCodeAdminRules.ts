/**
 * Margin code rules, as the server checks them (MarginCodeService). Checked here first so the
 * administrator sees what is wrong before anything is sent; the server still has the last word.
 */
import type { MarginCode } from './marginCodesAPI';

export const MAX_CODE_LENGTH = 12;
export const MAX_PERCENTAGE = 500;

const CODE = /^[A-Za-z0-9-]{1,12}$/;
// A plain number with at most two decimals: 45, 12.5, 0.75, .5 (no sign, no exponent).
const PERCENTAGE = /^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/;

/** A percentage in hundredths, rounded as the server stores it (two decimals, half up). */
const hundredths = (p: number) => Math.round(Number((p * 100).toPrecision(12)));

/** Two percentages are the same margin when they match to two decimals. */
export const samePercentage = (a: number, b: number) => hundredths(Number(a)) === hundredths(Number(b));

/** 45 → "45", 12.5 → "12.5", 12.345 → "12.35": as the server writes it in its messages. */
export const formatPercentage = (p: number) => String(hundredths(Number(p)) / 100);

/** The code that stands for a percentage (also a switched-off one), or undefined: staff see "Custom". */
export const codeForPercentage = (codes: MarginCode[] | undefined, percentage: number | null | undefined) =>
  percentage === null || percentage === undefined || Number.isNaN(Number(percentage))
    ? undefined
    : codes?.find((c) => samePercentage(c.percentage, percentage));

/** Lowest percentage first, as the server lists them; the code breaks a tie. */
export const sortMarginCodes = (codes: MarginCode[]) =>
  [...codes].sort((a, b) => hundredths(a.percentage) - hundredths(b.percentage) || a.code.localeCompare(b.code));

/** What the administrator typed, before it is sent. */
export interface MarginCodeDraft {
  code: string;
  percentage: string;
  note: string;
}

export type MarginCodeProblems = Partial<Record<'code' | 'percentage', string>>;

/**
 * What is wrong with a draft, field by field; empty when it can be sent. `codes` is the current
 * list and `editingId` the code being changed, which may keep its own code and percentage.
 */
export const marginCodeProblems = (draft: MarginCodeDraft, codes: MarginCode[], editingId?: number): MarginCodeProblems => {
  const problems: MarginCodeProblems = {};
  const others = codes.filter((c) => c.id !== editingId);

  const code = draft.code.trim();
  if (!code) {
    problems.code = 'Enter a code';
  } else if (!CODE.test(code)) {
    problems.code = `A code is 1 to ${MAX_CODE_LENGTH} letters, digits or dashes, for example R or K2`;
  } else {
    const taken = others.find((c) => c.code.toLowerCase() === code.toLowerCase());
    if (taken) {
      problems.code = `The code ${taken.code} already exists`;
    }
  }

  const text = draft.percentage.trim();
  if (!text) {
    problems.percentage = 'Enter a percentage';
  } else if (!PERCENTAGE.test(text)) {
    problems.percentage = 'Enter a number from 0 to 500, with at most 2 decimals';
  } else if (Number(text) > MAX_PERCENTAGE) {
    problems.percentage = `The percentage must be between 0 and ${MAX_PERCENTAGE}`;
  } else {
    const taken = others.find((c) => samePercentage(c.percentage, Number(text)));
    if (taken) {
      problems.percentage = `${formatPercentage(Number(text))}% already has the code ${taken.code}`;
    }
  }

  return problems;
};

/** The server's reason for refusing (a thrown Error or an error response), else the fallback. */
export const refusalMessage = (err: unknown, fallback: string): string => {
  const e = err as { message?: unknown; data?: { message?: unknown } } | null | undefined;
  const message = (e?.data && typeof e.data === 'object' ? e.data.message : undefined) ?? e?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
};
