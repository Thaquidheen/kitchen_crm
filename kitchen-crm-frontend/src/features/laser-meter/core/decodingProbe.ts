/**
 * Device Lab: "which decoding of this packet gives the distance on the meter's screen?"
 *
 * Tries uint16/uint32/int32/float32, little- and big-endian, at every offset, with the unit and
 * scale combinations meters actually use (mm, 0.1 mm, cm, m as float, inches, feet…), plus ASCII
 * numbers anywhere in the payload. Every candidate is a complete ParserConfig that has been
 * checked by running the real parser on the packet, so "Save as Adapter" can use it as is.
 *
 * Marking several readings narrows it down: `rankAcrossMarks` keeps decodings that reproduce
 * every marked distance.
 */

import type { LengthUnit, ParserConfig } from './types';
import { BINARY_FORMATS } from './types';
import { FORMAT_SIZE, parseReading, readBinaryValue } from './parser';
import { bytesToAscii } from './hex';
import { toMm } from './units';

export interface DecodingCandidate {
  /** Stable identity of the decoding (same parser → same key), used across marks. */
  key: string;
  parser: ParserConfig;
  /** The number read from the packet before scaling. */
  decoded: number;
  valueMm: number;
  errorMm: number;
  description: string;
  /** Lower is more plausible. */
  score: number;
}

export interface ProbeOptions {
  /** Meters display rounded values; 1 mm tolerance by default. */
  toleranceMm?: number;
}

/** Unit/scale combos worth trying for binary values (redundant ones such as m×0.001 omitted). */
const BINARY_UNIT_SCALES: { unit: LengthUnit; scale: number }[] = [
  { unit: 'mm', scale: 1 },
  { unit: 'mm', scale: 0.1 },
  { unit: 'mm', scale: 0.01 },
  { unit: 'cm', scale: 1 },
  { unit: 'm', scale: 1 },
  { unit: 'in', scale: 1 },
  { unit: 'in', scale: 0.1 },
  { unit: 'in', scale: 0.01 },
  { unit: 'ft', scale: 1 },
  { unit: 'ft', scale: 0.01 },
];

const ASCII_UNITS: LengthUnit[] = ['mm', 'cm', 'm', 'in', 'ft'];

const NO_LIMITS = { minMm: -Number.MAX_SAFE_INTEGER, maxMm: Number.MAX_SAFE_INTEGER };

const scaleLabel = (unit: LengthUnit, scale: number) =>
  scale === 1 ? unit : `${scale} ${unit}`;

const escapeRegex = (s: string) =>
  s
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Control bytes (STX/ETX framing) as \xHH so the saved regex stays readable and portable.
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f-\xff]/g, (c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, '0')}`);

export const parserKey = (p: ParserConfig): string =>
  p.type === 'binary'
    ? `bin:${p.format}:${p.littleEndian ? 'le' : 'be'}:${p.offset}:${p.sourceUnit}:${p.scale}`
    : `ascii:${p.regex}:${p.sourceUnit}:${p.scale}`;

export const describeParser = (p: ParserConfig): string =>
  p.type === 'binary'
    ? `${p.format} ${p.littleEndian ? 'little-endian' : 'big-endian'} at byte ${p.offset}, in ${scaleLabel(p.sourceUnit, p.scale)}`
    : `ASCII /${p.regex}/, in ${scaleLabel(p.sourceUnit, p.scale)} unless the text has a unit`;

const binaryCandidates = (bytes: Uint8Array, targetMm: number, tol: number): DecodingCandidate[] => {
  const out: DecodingCandidate[] = [];
  for (const format of BINARY_FORMATS) {
    const size = FORMAT_SIZE[format];
    for (let offset = 0; offset + size <= bytes.length; offset++) {
      for (const littleEndian of [true, false]) {
        const v = readBinaryValue(bytes, offset, format, littleEndian);
        if (v === null || !Number.isFinite(v) || v === 0) {
          continue;
        }
        // Integers can't carry metres/feet at scale 1 in any real meter; floats rarely use 0.1 mm.
        // When uint16 and uint32 both fit (zero high bytes), uint32 is slightly preferred: the
        // zeros are more likely part of the value than unrelated padding.
        for (const { unit, scale } of BINARY_UNIT_SCALES) {
          if (format === 'float32' && scale !== 1) {
            continue;
          }
          if (format !== 'float32' && (unit === 'm' || unit === 'ft') && scale === 1) {
            continue;
          }
          const mm = toMm(v * scale, unit);
          const err = Math.abs(mm - targetMm);
          if (err > tol) {
            continue;
          }
          const parser: ParserConfig = { type: 'binary', offset, length: size, format, littleEndian, sourceUnit: unit, scale };
          out.push({
            key: parserKey(parser),
            parser,
            decoded: v,
            valueMm: mm,
            errorMm: err,
            description: describeParser(parser),
            score:
              err * 10 +
              (scale === 1 ? 0 : 1) +
              (unit === 'mm' ? 0 : 0.5) +
              (littleEndian ? 0 : 0.2) +
              (format === 'uint32' ? 0 : format === 'uint16' ? 0.05 : 0.3) +
              offset * 0.01,
          });
        }
      }
    }
  }
  return out;
};

const NUMBER_RE = /[-+]?\d+(?:[.,]\d+)?/g;
const UNIT_AFTER_RE = /^\s*(mm|cm|m|in|ft|"|')/i;

const asciiCandidates = (bytes: Uint8Array, targetMm: number, tol: number): DecodingCandidate[] => {
  const text = bytesToAscii(bytes);
  const out: DecodingCandidate[] = [];
  let m: RegExpExecArray | null;
  NUMBER_RE.lastIndex = 0;
  while ((m = NUMBER_RE.exec(text))) {
    const start = m.index;
    // Anchor on the non-digit text right before the number ("D=", "DIST:"), or the start.
    const before = text.slice(0, start);
    const anchorMatch = /[^\d.,+-]{1,8}$/.exec(before);
    const anchor = anchorMatch ? escapeRegex(anchorMatch[0].replace(/\s+$/, '')) : '';
    const prefix = anchor ? `${anchor}\\s*` : start === 0 ? '^' : '';
    if (!prefix) {
      continue; // No stable anchor (number glued to another number) — too fragile to save.
    }
    const regex = `${prefix}([-+]?\\d+(?:[.,]\\d+)?)\\s*(mm|cm|m|in|ft|"|')?`;
    const hasUnit = UNIT_AFTER_RE.test(text.slice(start + m[0].length));
    const units = hasUnit ? ['m' as LengthUnit] : ASCII_UNITS; // text unit overrides sourceUnit anyway
    for (const unit of units) {
      const parser: ParserConfig = { type: 'ascii', regex, sourceUnit: unit, scale: 1 };
      const r = parseReading(bytes, parser, NO_LIMITS);
      if (!r.ok) {
        continue;
      }
      const err = Math.abs(r.valueMm - targetMm);
      if (err > tol) {
        continue;
      }
      out.push({
        key: parserKey(parser),
        parser,
        decoded: Number(m[0].replace(',', '.')),
        valueMm: r.valueMm,
        errorMm: err,
        description: describeParser(parser),
        // Printable text containing the number is strong evidence.
        score: err * 10 - 0.5 + (hasUnit ? -0.2 : unit === 'mm' ? 0 : 0.3),
      });
    }
  }
  return out;
};

export const probeDecodings = (
  bytes: Uint8Array,
  targetMm: number,
  opts: ProbeOptions = {}
): DecodingCandidate[] => {
  const tol = opts.toleranceMm ?? 1;
  const all = [...asciiCandidates(bytes, targetMm, tol), ...binaryCandidates(bytes, targetMm, tol)];
  // Self-check: every candidate must reproduce its value through the real parser.
  const verified = all.filter((c) => {
    const r = parseReading(bytes, c.parser, NO_LIMITS);
    return r.ok && r.valueMm === c.valueMm;
  });
  const byKey = new Map<string, DecodingCandidate>();
  for (const c of verified) {
    const prev = byKey.get(c.key);
    if (!prev || c.score < prev.score) {
      byKey.set(c.key, c);
    }
  }
  return Array.from(byKey.values()).sort((a, b) => a.score - b.score);
};

export interface MarkedPacket {
  bytes: Uint8Array;
  targetMm: number;
}

export interface RankedCandidate extends DecodingCandidate {
  /** How many marked packets this decoding reproduces. */
  matches: number;
  total: number;
}

/**
 * Candidates from every mark, ranked by how many marks they reproduce (all of them = the
 * answer, usually), then by plausibility.
 */
export const rankAcrossMarks = (marks: MarkedPacket[], opts: ProbeOptions = {}): RankedCandidate[] => {
  const tol = opts.toleranceMm ?? 1;
  const pool = new Map<string, DecodingCandidate>();
  for (const mk of marks) {
    for (const c of probeDecodings(mk.bytes, mk.targetMm, opts)) {
      if (!pool.has(c.key)) {
        pool.set(c.key, c);
      }
    }
  }
  const ranked: RankedCandidate[] = [];
  for (const c of pool.values()) {
    let matches = 0;
    for (const mk of marks) {
      const r = parseReading(mk.bytes, c.parser, NO_LIMITS);
      if (r.ok && Math.abs(r.valueMm - mk.targetMm) <= tol) {
        matches += 1;
      }
    }
    ranked.push({ ...c, matches, total: marks.length });
  }
  return ranked.sort((a, b) => b.matches - a.matches || a.score - b.score);
};
