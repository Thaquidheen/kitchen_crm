/**
 * Tell a keyboard-mode meter from a person typing, by keystroke timing.
 *
 * A HID meter "types" its whole reading in one burst, a few milliseconds per character. A
 * person needs 80 ms or more per key, and is irregular. So: enough characters, a small median
 * gap and no long pause = device.
 */

import type { KeystrokeTimingConfig, KeystrokeVerdict } from './types';

export const DEFAULT_KEYSTROKE_TIMING: KeystrokeTimingConfig = {
  maxMedianIntervalMs: 35,
  maxGapMs: 80,
  minChars: 3,
};

export interface KeystrokeClassification {
  verdict: KeystrokeVerdict;
  count: number;
  medianIntervalMs: number | null;
  maxGapMs: number | null;
}

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export const classifyKeystrokes = (
  timestamps: number[],
  cfg: KeystrokeTimingConfig = DEFAULT_KEYSTROKE_TIMING
): KeystrokeClassification => {
  const count = timestamps.length;
  if (count < 2) {
    return { verdict: 'human', count, medianIntervalMs: null, maxGapMs: null };
  }
  const gaps: number[] = [];
  for (let i = 1; i < count; i++) {
    gaps.push(Math.max(0, timestamps[i] - timestamps[i - 1]));
  }
  const med = median(gaps);
  const maxGap = Math.max(...gaps);
  const device = count >= cfg.minChars && med <= cfg.maxMedianIntervalMs && maxGap <= cfg.maxGapMs;
  return {
    verdict: device ? 'device' : 'human',
    count,
    medianIntervalMs: med,
    maxGapMs: maxGap,
  };
};
