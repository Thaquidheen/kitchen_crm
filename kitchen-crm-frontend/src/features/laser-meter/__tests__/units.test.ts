import { describe, expect, it } from 'vitest';
import { formatMm, fromMm, mmToInputText, normalizeUnit, toMm } from '../core/units';
import { hexToBytes, normalizeUuid, shortUuid, bytesToHex } from '../core/hex';

describe('toMm', () => {
  it.each([
    [2345, 'mm', 2345],
    [234.5, 'cm', 2345],
    [2.345, 'm', 2345],
    [1, 'in', 25],
    [92.32, 'in', 2345],
    [1, 'ft', 305],
    [0.0005, 'm', 1], // rounds half up
  ] as const)('%s %s → %s mm', (v, u, mm) => {
    expect(toMm(v, u)).toBe(mm);
  });

  it('is stable against float noise', () => {
    expect(toMm(1.005, 'm')).toBe(1005);
    expect(toMm(4.35, 'm')).toBe(4350);
  });

  it('round-trips through fromMm', () => {
    expect(toMm(fromMm(3048, 'ft'), 'ft')).toBe(3048);
  });
});

describe('formatMm', () => {
  it('formats in every display unit', () => {
    expect(formatMm(2345, 'mm')).toBe('2345 mm');
    expect(formatMm(2345, 'cm')).toBe('234.5 cm');
    expect(formatMm(2340, 'cm')).toBe('234 cm');
    expect(formatMm(2345, 'm')).toBe('2.345 m');
    expect(formatMm(2345, 'in')).toBe('92.32 in');
    expect(formatMm(2345, 'ft')).toBe(`7' 8.3"`);
    expect(formatMm(3048, 'ft')).toBe(`10' 0"`);
    expect(formatMm(null, 'mm')).toBe('');
  });

  it('gives edit-box text without the unit', () => {
    expect(mmToInputText(2345, 'm')).toBe('2.345');
    expect(mmToInputText(null, 'm')).toBe('');
  });
});

describe('normalizeUnit', () => {
  it('maps common spellings', () => {
    expect(normalizeUnit('MM')).toBe('mm');
    expect(normalizeUnit('metres')).toBe('m');
    expect(normalizeUnit('"')).toBe('in');
    expect(normalizeUnit("'")).toBe('ft');
    expect(normalizeUnit('yd')).toBeNull();
  });
});

describe('hex helpers', () => {
  it('parses tolerant hex and rejects junk', () => {
    expect(bytesToHex(hexToBytes('0xAA:bb-01 02'))).toBe('aa bb 01 02');
    expect(() => hexToBytes('abc')).toThrow();
    expect(() => hexToBytes('zz')).toThrow();
  });

  it('normalises GATT uuids', () => {
    expect(normalizeUuid('FFF0')).toBe('0000fff0-0000-1000-8000-00805f9b34fb');
    expect(normalizeUuid('0x180F')).toBe('0000180f-0000-1000-8000-00805f9b34fb');
    expect(normalizeUuid('battery_service')).toBe('battery_service');
    expect(shortUuid('0000fff0-0000-1000-8000-00805f9b34fb')).toBe('0xfff0');
  });
});
