/**
 * Collects keydown events from the capture input into one KeyboardCapture.
 *
 * A capture ends on Enter, on Tab, or after an idle pause (for meters that send no terminator).
 * The idle pause is short only while the input so far looks like a device burst; if it looks
 * like a person typing, we wait much longer so a slow typist isn't cut off after one digit.
 */

import type { KeyboardCapture, KeystrokeTimingConfig } from './types';
import { classifyKeystrokes, DEFAULT_KEYSTROKE_TIMING } from './keystrokeTiming';
import { realTimers, type Timers } from './reconnect';

export interface KeystrokeBufferOptions {
  onCapture: (capture: KeyboardCapture) => void;
  /** Called on every change, for a live preview. */
  onChange?: (text: string) => void;
  idleTimeoutMs?: number;
  humanIdleTimeoutMs?: number;
  timing?: KeystrokeTimingConfig;
  timers?: Timers;
}

export const DEFAULT_IDLE_TIMEOUT_MS = 300;
export const DEFAULT_HUMAN_IDLE_TIMEOUT_MS = 2500;

export class KeystrokeBuffer {
  private chars: string[] = [];
  private stamps: number[] = [];
  private idleHandle: unknown = null;
  private readonly opts: KeystrokeBufferOptions;
  private readonly timers: Timers;

  constructor(opts: KeystrokeBufferOptions) {
    this.opts = opts;
    this.timers = opts.timers ?? realTimers;
  }

  get text(): string {
    return this.chars.join('');
  }

  /**
   * Feed one KeyboardEvent.key. Returns true when the key was consumed (caller should
   * preventDefault), false for keys we leave alone (Shift, arrows…).
   */
  handleKey(key: string, timeStamp: number): boolean {
    if (key === 'Enter' || key === 'Tab') {
      if (!this.chars.length) {
        // Tab on an empty buffer is navigation, not a reading terminator.
        return key === 'Enter';
      }
      this.finish(key === 'Enter' ? 'enter' : 'tab');
      return true;
    }
    if (key === 'Backspace') {
      this.chars.pop();
      this.stamps.pop();
      this.changed();
      return true;
    }
    if (key === 'Escape') {
      this.clear();
      return true;
    }
    if (key.length !== 1) {
      return false;
    }
    this.chars.push(key);
    this.stamps.push(timeStamp);
    this.changed();
    return true;
  }

  clear(): void {
    this.cancelIdle();
    this.chars = [];
    this.stamps = [];
    this.opts.onChange?.('');
  }

  dispose(): void {
    this.cancelIdle();
  }

  private changed(): void {
    this.opts.onChange?.(this.text);
    this.cancelIdle();
    if (!this.chars.length) {
      return;
    }
    const looksLikeDevice =
      classifyKeystrokes(this.stamps, this.opts.timing ?? DEFAULT_KEYSTROKE_TIMING).verdict ===
      'device';
    const delay = looksLikeDevice
      ? (this.opts.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS)
      : (this.opts.humanIdleTimeoutMs ?? DEFAULT_HUMAN_IDLE_TIMEOUT_MS);
    this.idleHandle = this.timers.setTimeout(() => {
      this.idleHandle = null;
      this.finish('idle');
    }, delay);
  }

  private finish(terminator: KeyboardCapture['terminator']): void {
    this.cancelIdle();
    const capture: KeyboardCapture = {
      text: this.text,
      timestamps: [...this.stamps],
      terminator,
    };
    this.chars = [];
    this.stamps = [];
    this.opts.onChange?.('');
    if (capture.text.trim()) {
      this.opts.onCapture(capture);
    }
  }

  private cancelIdle(): void {
    if (this.idleHandle !== null) {
      this.timers.clearTimeout(this.idleHandle);
      this.idleHandle = null;
    }
  }
}
