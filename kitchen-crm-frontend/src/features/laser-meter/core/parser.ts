/**
 * Pure packet parser: bytes + ParserConfig → integer millimetres.
 *
 * No I/O, no globals, no clock — so it is trivially unit-testable and safe to run on every
 * notification. Adapter configs come from an admin form, so every failure mode returns a reason
 * instead of throwing.
 */

import type {
  AsciiParserConfig,
  BinaryFormat,
  BinaryParserConfig,
  ParseResult,
  ParserConfig,
} from './types';
import { bytesToAscii } from './hex';
import { normalizeUnit, toMm } from './units';

export const FORMAT_SIZE: Record<BinaryFormat, number> = {
  uint16: 2,
  uint32: 4,
  int32: 4,
  float32: 4,
};

export interface RangeLimits {
  minMm: number;
  maxMm: number;
}

/** Read one number of `format` at `offset`. Returns null if the payload is too short. */
export const readBinaryValue = (
  bytes: Uint8Array,
  offset: number,
  format: BinaryFormat,
  littleEndian: boolean
): number | null => {
  const size = FORMAT_SIZE[format];
  if (offset < 0 || offset + size > bytes.length) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  switch (format) {
    case 'uint16':
      return view.getUint16(offset, littleEndian);
    case 'uint32':
      return view.getUint32(offset, littleEndian);
    case 'int32':
      return view.getInt32(offset, littleEndian);
    case 'float32':
      return view.getFloat32(offset, littleEndian);
  }
};

const checkRange = (valueMm: number, limits: RangeLimits): ParseResult => {
  if (valueMm < limits.minMm || valueMm > limits.maxMm) {
    return {
      ok: false,
      reason: `${valueMm} mm is outside the accepted range (${limits.minMm}–${limits.maxMm} mm)`,
    };
  }
  return { ok: true, valueMm };
};

export const parseBinary = (
  bytes: Uint8Array,
  cfg: BinaryParserConfig,
  limits: RangeLimits
): ParseResult => {
  const size = FORMAT_SIZE[cfg.format];
  if (!size) {
    return { ok: false, reason: `Unknown binary format "${cfg.format}"` };
  }
  if (cfg.length !== undefined && cfg.length !== null && cfg.length !== size) {
    return {
      ok: false,
      reason: `Parser length ${cfg.length} does not match ${cfg.format} (${size} bytes)`,
    };
  }
  const raw = readBinaryValue(bytes, cfg.offset, cfg.format, cfg.littleEndian);
  if (raw === null) {
    return {
      ok: false,
      reason: `Packet too short: need ${cfg.offset + size} bytes, got ${bytes.length}`,
    };
  }
  if (!Number.isFinite(raw)) {
    return { ok: false, reason: 'Decoded value is not a number' };
  }
  const scaled = raw * (cfg.scale ?? 1);
  return checkRange(toMm(scaled, cfg.sourceUnit), limits);
};

// Compiled regexes keyed by source — adapter configs are few and long-lived.
const regexCache = new Map<string, RegExp | Error>();

const compile = (source: string): RegExp | Error => {
  let re = regexCache.get(source);
  if (!re) {
    try {
      re = new RegExp(source, 'i');
    } catch (e) {
      re = e instanceof Error ? e : new Error(String(e));
    }
    regexCache.set(source, re);
  }
  return re;
};

/** Parse a decimal number that may use a comma as the decimal separator. */
export const parseDecimal = (text: string): number => {
  let t = text.trim().replace(/\s/g, '');
  if (t.includes(',') && t.includes('.')) {
    // Whichever separator comes last is the decimal point; the other groups thousands.
    t = t.lastIndexOf(',') > t.lastIndexOf('.')
      ? t.replace(/\./g, '').replace(',', '.')
      : t.replace(/,/g, '');
  } else {
    t = t.replace(',', '.');
  }
  return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : NaN;
};

export const parseAsciiText = (
  text: string,
  cfg: AsciiParserConfig,
  limits: RangeLimits
): ParseResult => {
  const re = compile(cfg.regex);
  if (re instanceof Error) {
    return { ok: false, reason: `Invalid parser regex: ${re.message}` };
  }
  const m = re.exec(text);
  if (!m) {
    return { ok: false, reason: 'Text did not match the parser pattern' };
  }
  const valueText = m.groups?.value ?? m[1];
  if (valueText === undefined) {
    return { ok: false, reason: 'Parser pattern has no capture group for the value' };
  }
  const n = parseDecimal(valueText);
  if (!Number.isFinite(n)) {
    return { ok: false, reason: `"${valueText}" is not a number` };
  }
  const unitText = m.groups?.unit ?? m[2];
  let unit = cfg.sourceUnit;
  if (unitText) {
    const u = normalizeUnit(unitText);
    if (!u) {
      return { ok: false, reason: `Unknown unit "${unitText}"` };
    }
    unit = u;
  }
  return checkRange(toMm(n * (cfg.scale ?? 1), unit), limits);
};

export const parseAscii = (
  bytes: Uint8Array,
  cfg: AsciiParserConfig,
  limits: RangeLimits
): ParseResult => parseAsciiText(bytesToAscii(bytes), cfg, limits);

/** Entry point used by config adapters. */
export const parseReading = (
  bytes: Uint8Array,
  cfg: ParserConfig,
  limits: RangeLimits
): ParseResult => {
  switch (cfg?.type) {
    case 'binary':
      return parseBinary(bytes, cfg, limits);
    case 'ascii':
      return parseAscii(bytes, cfg, limits);
    default:
      return { ok: false, reason: 'Adapter has no parser configured' };
  }
};

/** A sensible default ascii pattern: a number, optionally followed by a unit. */
export const DEFAULT_ASCII_REGEX =
  '([-+]?\\d+(?:[.,]\\d+)?)\\s*(mm|cm|m|in|ft|"|\')?';
