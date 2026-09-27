import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ASCII_REGEX,
  parseAscii,
  parseAsciiText,
  parseBinary,
  parseDecimal,
  parseReading,
} from '../core/parser';
import { failureReason, type AsciiParserConfig, type BinaryParserConfig } from '../core/types';
import { asciiToBytes, hexToBytes } from '../core/hex';

const limits = { minMm: 50, maxMm: 15000 };

const bin = (over: Partial<BinaryParserConfig> = {}): BinaryParserConfig => ({
  type: 'binary',
  offset: 0,
  format: 'uint16',
  littleEndian: true,
  sourceUnit: 'mm',
  scale: 1,
  ...over,
});

const ascii = (over: Partial<AsciiParserConfig> = {}): AsciiParserConfig => ({
  type: 'ascii',
  regex: DEFAULT_ASCII_REGEX,
  sourceUnit: 'm',
  scale: 1,
  ...over,
});

describe('parseBinary', () => {
  // 2345 = 0x0929
  it('reads uint16 little-endian', () => {
    expect(parseBinary(hexToBytes('29 09'), bin(), limits)).toEqual({ ok: true, valueMm: 2345 });
  });

  it('reads uint16 big-endian', () => {
    expect(parseBinary(hexToBytes('09 29'), bin({ littleEndian: false }), limits)).toEqual({
      ok: true,
      valueMm: 2345,
    });
  });

  it('honours the offset', () => {
    expect(parseBinary(hexToBytes('aa bb 29 09 ff'), bin({ offset: 2 }), limits)).toEqual({
      ok: true,
      valueMm: 2345,
    });
  });

  it('reads uint32 LE and BE', () => {
    expect(parseBinary(hexToBytes('29 09 00 00'), bin({ format: 'uint32' }), limits)).toEqual({
      ok: true,
      valueMm: 2345,
    });
    expect(
      parseBinary(hexToBytes('00 00 09 29'), bin({ format: 'uint32', littleEndian: false }), limits)
    ).toEqual({ ok: true, valueMm: 2345 });
  });

  it('reads int32 and rejects negatives via range', () => {
    const neg = new Uint8Array(4);
    new DataView(neg.buffer).setInt32(0, -100, true);
    const r = parseBinary(neg, bin({ format: 'int32' }), limits);
    expect(r.ok).toBe(false);
  });

  it('reads float32 metres', () => {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setFloat32(0, 2.345, true);
    expect(parseBinary(b, bin({ format: 'float32', sourceUnit: 'm' }), limits)).toEqual({
      ok: true,
      valueMm: 2345,
    });
    new DataView(b.buffer).setFloat32(0, 2.345, false);
    expect(
      parseBinary(b, bin({ format: 'float32', sourceUnit: 'm', littleEndian: false }), limits)
    ).toEqual({ ok: true, valueMm: 2345 });
  });

  it('applies scale (tenths of a millimetre)', () => {
    // 23450 = 0x5B9A
    expect(parseBinary(hexToBytes('9a 5b'), bin({ scale: 0.1 }), limits)).toEqual({
      ok: true,
      valueMm: 2345,
    });
  });

  it('converts inches, feet and centimetres', () => {
    // 100 in = 2540 mm ; 10 ft = 3048 mm ; 250 cm = 2500 mm
    expect(parseBinary(hexToBytes('64 00'), bin({ sourceUnit: 'in' }), limits)).toEqual({
      ok: true,
      valueMm: 2540,
    });
    expect(parseBinary(hexToBytes('0a 00'), bin({ sourceUnit: 'ft' }), limits)).toEqual({
      ok: true,
      valueMm: 3048,
    });
    expect(parseBinary(hexToBytes('fa 00'), bin({ sourceUnit: 'cm' }), limits)).toEqual({
      ok: true,
      valueMm: 2500,
    });
  });

  it('rejects short packets', () => {
    const r = parseBinary(hexToBytes('29'), bin(), limits);
    expect(r).toMatchObject({ ok: false });
    expect(failureReason(r)).toMatch(/too short/);
  });

  it('rejects out-of-range values (both ends)', () => {
    expect(parseBinary(hexToBytes('0a 00'), bin(), limits)).toMatchObject({ ok: false }); // 10 mm
    expect(parseBinary(hexToBytes('ff ff'), bin(), limits)).toMatchObject({ ok: false }); // 65535
  });

  it('accepts values exactly on the limits', () => {
    expect(parseBinary(hexToBytes('32 00'), bin(), limits)).toEqual({ ok: true, valueMm: 50 });
    expect(parseBinary(hexToBytes('98 3a'), bin(), limits)).toEqual({ ok: true, valueMm: 15000 });
  });

  it('rejects a length that disagrees with the format', () => {
    expect(parseBinary(hexToBytes('29 09'), bin({ length: 4 }), limits)).toMatchObject({ ok: false });
  });

  it('rejects NaN floats', () => {
    expect(parseBinary(hexToBytes('00 00 c0 7f'), bin({ format: 'float32' }), limits)).toMatchObject({
      ok: false,
    });
  });
});

describe('parseAscii', () => {
  it('reads metres with the configured unit', () => {
    expect(parseAscii(asciiToBytes('2.345'), ascii(), limits)).toEqual({ ok: true, valueMm: 2345 });
  });

  it('lets a unit in the text override the configured unit', () => {
    expect(parseAsciiText('D=2345mm', ascii(), limits)).toEqual({ ok: true, valueMm: 2345 });
    expect(parseAsciiText('234.5 cm\r\n', ascii(), limits)).toEqual({ ok: true, valueMm: 2345 });
    expect(parseAsciiText('92.32in', ascii(), limits)).toEqual({ ok: true, valueMm: 2345 });
    expect(parseAsciiText('7.5 ft', ascii(), limits)).toEqual({ ok: true, valueMm: 2286 });
  });

  it('accepts a decimal comma', () => {
    expect(parseAsciiText('2,345 m', ascii(), limits)).toEqual({ ok: true, valueMm: 2345 });
  });

  it('supports named groups', () => {
    const cfg = ascii({ regex: 'DIST:(?<value>\\d+)(?<unit>mm|m)?', sourceUnit: 'mm' });
    expect(parseAsciiText('DIST:2345', cfg, limits)).toEqual({ ok: true, valueMm: 2345 });
  });

  it('reports non-matching text, bad regex and range', () => {
    expect(parseAsciiText('ERR 204', ascii({ regex: 'D=(\\d+)' }), limits)).toMatchObject({ ok: false });
    expect(parseAsciiText('1', ascii({ regex: '(' }), limits)).toMatchObject({ ok: false });
    expect(parseAsciiText('0.01 m', ascii(), limits)).toMatchObject({ ok: false });
  });
});

describe('parseReading', () => {
  it('dispatches on parser type and handles a missing parser', () => {
    expect(parseReading(hexToBytes('29 09'), bin(), limits)).toEqual({ ok: true, valueMm: 2345 });
    // Deliberately broken config from the server.
    expect(parseReading(hexToBytes('29 09'), undefined, limits)).toMatchObject({ ok: false });
  });
});

describe('parseDecimal', () => {
  it.each([
    ['2.345', 2.345],
    ['2,345', 2.345],
    ['1.234,5', 1234.5],
    ['1,234.5', 1234.5],
    ['.5', 0.5],
    ['-3', -3],
    ['abc', NaN],
    ['1.2.3', NaN],
  ])('%s → %s', (text, expected) => {
    expect(parseDecimal(text)).toBe(expected);
  });
});
