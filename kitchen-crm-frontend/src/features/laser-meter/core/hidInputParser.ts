/**
 * Parse text produced by a keyboard-mode (Bluetooth HID) meter, or typed by a person.
 *
 * Handles: mm / cm / m / in / ft, a decimal comma or dot, thousands separators, trailing unit
 * text ("2.345m", "234,5 cm", "92.3 in"), feet-and-inches ("7' 8.5\""), and stray prefixes or
 * control characters some meters send ("D: 2.345 m\r").
 *
 * When the text carries no unit, `defaultUnit` applies. 'auto' guesses from magnitude: below
 * AUTO_METRE_THRESHOLD it is metres (a meter printing "2.345"), otherwise millimetres ("2345").
 */

import type { LengthUnit, ParseResult } from './types';
import { normalizeUnit, toMm } from './units';
import { parseDecimal } from './parser';

export type HidDefaultUnit = LengthUnit | 'auto';

export interface HidParseOptions {
  defaultUnit: HidDefaultUnit;
  minMm: number;
  maxMm: number;
}

export const AUTO_METRE_THRESHOLD = 50;

export type HidParseResult = ParseResult & { unit?: LengthUnit };

const NUM = '[+-]?\\d+(?:[.,]\\d+)*|[+-]?[.,]\\d+';
const FEET_INCHES = new RegExp(
  `(${NUM})\\s*(?:'|′|ft|feet|foot)\\s*(?:(${NUM})\\s*(?:"|″|in|inch|inches)?)?\\s*$`,
  'i'
);
const VALUE_UNIT = new RegExp(`(${NUM})\\s*([a-z"'″′]+)?\\.?\\s*$`, 'i');

const inRange = (mm: number, o: HidParseOptions, unit: LengthUnit): HidParseResult =>
  mm < o.minMm || mm > o.maxMm
    ? { ok: false, reason: `${mm} mm is outside the accepted range (${o.minMm}–${o.maxMm} mm)` }
    : { ok: true, valueMm: mm, unit };

export const parseHidInput = (input: string, opts: HidParseOptions): HidParseResult => {
  // eslint-disable-next-line no-control-regex
  const text = (input ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  if (!text) {
    return { ok: false, reason: 'Nothing was entered' };
  }

  const fi = FEET_INCHES.exec(text);
  if (fi) {
    const ft = parseDecimal(fi[1]);
    const inches = fi[2] ? parseDecimal(fi[2]) : 0;
    if (!Number.isFinite(ft) || !Number.isFinite(inches)) {
      return { ok: false, reason: `"${text}" is not a valid feet-and-inches value` };
    }
    return inRange(toMm(ft * 12 + inches, 'in'), opts, 'ft');
  }

  const m = VALUE_UNIT.exec(text);
  if (!m) {
    return { ok: false, reason: `"${text}" does not contain a number` };
  }
  const value = parseDecimal(m[1]);
  if (!Number.isFinite(value)) {
    return { ok: false, reason: `"${m[1]}" is not a number` };
  }
  let unit: LengthUnit;
  if (m[2]) {
    const u = normalizeUnit(m[2]);
    if (!u) {
      return { ok: false, reason: `Unknown unit "${m[2]}"` };
    }
    unit = u;
  } else if (opts.defaultUnit === 'auto') {
    unit = Math.abs(value) < AUTO_METRE_THRESHOLD ? 'm' : 'mm';
  } else {
    unit = opts.defaultUnit;
  }
  return inRange(toMm(value, unit), opts, unit);
};
