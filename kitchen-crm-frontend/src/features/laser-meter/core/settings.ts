/**
 * Laser meter settings, per signed-in user *and* per device (browser localStorage): a surveyor's
 * tablet and their office desktop legitimately want different modes.
 */

import type { KeystrokeTimingConfig, LengthUnit, PreferredMode } from './types';
import type { HidDefaultUnit } from './hidInputParser';
import { DEFAULT_KEYSTROKE_TIMING } from './keystrokeTiming';
import { DEFAULT_IDLE_TIMEOUT_MS } from './keystrokeBuffer';
import { DEFAULT_SEQUENCE_CONFIG, type SequenceConfig } from './guidedSequence';
import { DEFAULT_LAB_OPTIONAL_SERVICES } from './adapters/builtins';
import { Emitter } from './emitter';
import { safeLocalStorage, type StorageLike } from './adapters/registry';

export interface LaserSettings {
  preferredMode: PreferredMode;
  /** Adapter used for Bluetooth-direct mode. */
  adapterId: string | null;
  displayUnit: LengthUnit;
  beep: boolean;
  vibrate: boolean;
  autoAdvance: boolean;
  hid: {
    defaultUnit: HidDefaultUnit;
    timing: KeystrokeTimingConfig;
    idleTimeoutMs: number;
    /** Accept values that look hand-typed into the capture box (stored as source "manual"). */
    acceptHumanTyping: boolean;
    minMm: number;
    maxMm: number;
  };
  /** Services the Device Lab requests access to when scanning unknown devices. */
  labOptionalServices: string[];
  sequence: SequenceConfig;
  /** Shows the simulated meter and "Simulate reading" outside dev builds. */
  devTools: boolean;
}

export const DEFAULT_SETTINGS: LaserSettings = {
  preferredMode: 'auto',
  adapterId: null,
  displayUnit: 'mm',
  beep: true,
  vibrate: true,
  autoAdvance: true,
  hid: {
    defaultUnit: 'auto',
    timing: DEFAULT_KEYSTROKE_TIMING,
    idleTimeoutMs: DEFAULT_IDLE_TIMEOUT_MS,
    acceptHumanTyping: true,
    minMm: 50,
    maxMm: 15000,
  },
  labOptionalServices: DEFAULT_LAB_OPTIONAL_SERVICES,
  sequence: DEFAULT_SEQUENCE_CONFIG,
  devTools: false,
};

const keyFor = (userKey: string) => `laserMeter.settings.v1:${userKey}`;

/** Merge stored settings over defaults so new fields get sane values after an upgrade. */
export const mergeSettings = (stored: Partial<LaserSettings> | null | undefined): LaserSettings => ({
  ...DEFAULT_SETTINGS,
  ...(stored ?? {}),
  hid: {
    ...DEFAULT_SETTINGS.hid,
    ...(stored?.hid ?? {}),
    timing: { ...DEFAULT_SETTINGS.hid.timing, ...(stored?.hid?.timing ?? {}) },
  },
  sequence: { ...DEFAULT_SETTINGS.sequence, ...(stored?.sequence ?? {}) },
  labOptionalServices: stored?.labOptionalServices?.length
    ? stored.labOptionalServices
    : DEFAULT_SETTINGS.labOptionalServices,
});

export class SettingsStore {
  private cache = new Map<string, LaserSettings>();
  private emitter = new Emitter<{ change: string }>();
  private readonly storage: StorageLike | null;

  constructor(storage: StorageLike | null = safeLocalStorage()) {
    this.storage = storage;
  }

  get(userKey: string): LaserSettings {
    let s = this.cache.get(userKey);
    if (!s) {
      let stored: Partial<LaserSettings> | null = null;
      try {
        const raw = this.storage?.getItem(keyFor(userKey));
        stored = raw ? JSON.parse(raw) : null;
      } catch {
        stored = null;
      }
      s = mergeSettings(stored);
      this.cache.set(userKey, s);
    }
    return s;
  }

  update(userKey: string, patch: Partial<LaserSettings>): LaserSettings {
    const next = mergeSettings({ ...this.get(userKey), ...patch });
    this.cache.set(userKey, next);
    try {
      this.storage?.setItem(keyFor(userKey), JSON.stringify(next));
    } catch {
      // Private mode / quota — keep the in-memory value for this session.
    }
    this.emitter.emit('change', userKey);
    return next;
  }

  subscribe(fn: (userKey: string) => void): () => void {
    return this.emitter.on('change', fn);
  }
}

/**
 * Which mode "Auto" means on this device: Bluetooth-direct when the browser supports it and
 * a device adapter is chosen; otherwise keyboard mode (which always allows typing by hand).
 */
export const resolveMode = (
  preferred: PreferredMode,
  caps: { bleSupported: boolean; hasAdapter: boolean }
): 'ble' | 'keyboard' | 'manual' => {
  if (preferred === 'auto') {
    return caps.bleSupported && caps.hasAdapter ? 'ble' : 'keyboard';
  }
  if (preferred === 'ble' && !caps.bleSupported) {
    return 'keyboard';
  }
  return preferred;
};
