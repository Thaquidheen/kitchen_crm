/**
 * Unit conversion. Storage is always integer millimetres; everything else is display or input.
 */

import { LENGTH_UNITS, type LengthUnit } from './types';

export const MM_PER_UNIT: Record<LengthUnit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
};

export const UNIT_LABELS: Record<LengthUnit, string> = {
  mm: 'Millimetres (mm)',
  cm: 'Centimetres (cm)',
  m: 'Metres (m)',
  in: 'Inches (in)',
  ft: 'Feet & inches',
};

export const isLengthUnit = (u: unknown): u is LengthUnit =>
  typeof u === 'string' && (LENGTH_UNITS as readonly string[]).includes(u);

/**
 * Map the unit spellings meters and people actually produce onto a LengthUnit.
 * Returns null for anything unrecognised.
 */
export const normalizeUnit = (text: string | undefined | null): LengthUnit | null => {
  if (!text) {
    return null;
  }
  const t = text.trim().toLowerCase().replace(/\.$/, '');
  switch (t) {
    case 'mm':
    case 'millimeter':
    case 'millimeters':
    case 'millimetre':
    case 'millimetres':
      return 'mm';
    case 'cm':
    case 'centimeter':
    case 'centimeters':
    case 'centimetre':
    case 'centimetres':
      return 'cm';
    case 'm':
    case 'meter':
    case 'meters':
    case 'metre':
    case 'metres':
      return 'm';
    case 'in':
    case 'inch':
    case 'inches':
    case '"':
    case '″':
      return 'in';
    case 'ft':
    case 'foot':
    case 'feet':
    case "'":
    case '′':
      return 'ft';
    default:
      return null;
  }
};

/** Convert a value in `unit` to integer millimetres (rounded half away from zero). */
export const toMm = (value: number, unit: LengthUnit): number => {
  const mm = value * MM_PER_UNIT[unit];
  // Round in a way that is stable for float noise like 2.345 * 1000 = 2344.9999999999995.
  const r = Math.round(Math.abs(mm) + 1e-9);
  return mm < 0 ? -r : r;
};

export const fromMm = (mm: number, unit: LengthUnit): number => mm / MM_PER_UNIT[unit];

const trimZeros = (s: string) => (s.includes('.') ? s.replace(/\.?0+$/, '') : s);

/** Format millimetres for display in the user's preferred unit. */
export const formatMm = (
  mm: number | null | undefined,
  unit: LengthUnit,
  opts: { withUnit?: boolean } = {}
): string => {
  if (mm === null || mm === undefined || Number.isNaN(mm)) {
    return '';
  }
  const withUnit = opts.withUnit ?? true;
  switch (unit) {
    case 'mm':
      return withUnit ? `${mm} mm` : String(mm);
    case 'cm': {
      const s = trimZeros(fromMm(mm, 'cm').toFixed(1));
      return withUnit ? `${s} cm` : s;
    }
    case 'm': {
      const s = fromMm(mm, 'm').toFixed(3);
      return withUnit ? `${s} m` : s;
    }
    case 'in': {
      const s = trimZeros(fromMm(mm, 'in').toFixed(2));
      return withUnit ? `${s} in` : s;
    }
    case 'ft': {
      const totalIn = fromMm(Math.abs(mm), 'in');
      let ft = Math.floor(totalIn / 12);
      let inches = Math.round((totalIn - ft * 12) * 10) / 10;
      if (inches >= 12) {
        ft += 1;
        inches = 0;
      }
      const sign = mm < 0 ? '-' : '';
      return `${sign}${ft}' ${trimZeros(inches.toFixed(1))}"`;
    }
  }
};

/** Value to pre-fill an edit box with (number only, in the display unit). */
export const mmToInputText = (mm: number | null | undefined, unit: LengthUnit): string => {
  if (mm === null || mm === undefined) {
    return '';
  }
  // Feet are edited as ft-in text (7' 8.5"), which parseHidInput reads back.
  if (unit === 'ft') {
    return formatMm(mm, 'ft');
  }
  return formatMm(mm, unit, { withUnit: false });
};
