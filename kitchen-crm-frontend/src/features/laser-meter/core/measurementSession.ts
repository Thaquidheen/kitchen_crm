/**
 * Captured values for one measuring session, with per-value metadata and undo.
 * A pure reducer so it plugs into React's useReducer and is trivially testable.
 */

import type { LaserMeasurement, MeasurementSource } from './types';

export interface MeasurementValue {
  key: string;
  valueMm: number;
  source: MeasurementSource;
  deviceAdapterId: string | null;
  /** Raw payload (BLE hex / typed text) the value was parsed from. */
  raw: string | null;
  /** ISO timestamp of the original capture. */
  capturedAt: string;
  /** True when a device-captured value was later changed by hand. */
  editedAfterCapture: boolean;
}

export type ValueMap = Record<string, MeasurementValue>;

interface UndoEntry {
  key: string;
  previous: MeasurementValue | null;
  kind: 'capture' | 'edit' | 'clear';
}

export interface SessionState {
  values: ValueMap;
  currentKey: string | null;
  undo: UndoEntry[];
  /** Key of the value just captured, for the confirmation flash. */
  flashKey: string | null;
  /** Bumped whenever values change, so containers can mark the session dirty. */
  revision: number;
}

export type SessionAction =
  | { type: 'load'; values: MeasurementValue[]; currentKey?: string | null }
  | { type: 'capture'; key: string; measurement: LaserMeasurement }
  | { type: 'edit'; key: string; valueMm: number | null; at: number }
  | { type: 'undo' }
  | { type: 'setCurrent'; key: string | null }
  | { type: 'clearFlash' };

const MAX_UNDO = 50;

export const initialSession = (values: MeasurementValue[] = []): SessionState => ({
  values: Object.fromEntries(values.map((v) => [v.key, v])),
  currentKey: null,
  undo: [],
  flashKey: null,
  revision: 0,
});

const withUndo = (s: SessionState, entry: UndoEntry): UndoEntry[] =>
  [...s.undo, entry].slice(-MAX_UNDO);

const setValue = (values: ValueMap, key: string, v: MeasurementValue | null): ValueMap => {
  const next = { ...values };
  if (v) {
    next[key] = v;
  } else {
    delete next[key];
  }
  return next;
};

export const sessionReducer = (s: SessionState, a: SessionAction): SessionState => {
  switch (a.type) {
    case 'load':
      return { ...initialSession(a.values), currentKey: a.currentKey ?? null };

    case 'capture': {
      const m = a.measurement;
      const v: MeasurementValue = {
        key: a.key,
        valueMm: m.valueMm,
        source: m.source,
        deviceAdapterId: m.source === 'manual' ? null : m.adapterId,
        raw: m.raw ?? null,
        capturedAt: new Date(m.at).toISOString(),
        editedAfterCapture: false,
      };
      return {
        ...s,
        values: setValue(s.values, a.key, v),
        undo: withUndo(s, { key: a.key, previous: s.values[a.key] ?? null, kind: 'capture' }),
        flashKey: a.key,
        revision: s.revision + 1,
      };
    }

    case 'edit': {
      const prev = s.values[a.key] ?? null;
      if (a.valueMm === null) {
        if (!prev) {
          return s;
        }
        return {
          ...s,
          values: setValue(s.values, a.key, null),
          undo: withUndo(s, { key: a.key, previous: prev, kind: 'clear' }),
          revision: s.revision + 1,
        };
      }
      if (prev && prev.valueMm === a.valueMm) {
        return s;
      }
      const v: MeasurementValue = prev
        ? {
            ...prev,
            valueMm: a.valueMm,
            // A device reading corrected by hand keeps its provenance but is flagged.
            editedAfterCapture: prev.source !== 'manual' ? true : prev.editedAfterCapture,
          }
        : {
            key: a.key,
            valueMm: a.valueMm,
            source: 'manual',
            deviceAdapterId: null,
            raw: null,
            capturedAt: new Date(a.at).toISOString(),
            editedAfterCapture: false,
          };
      return {
        ...s,
        values: setValue(s.values, a.key, v),
        undo: withUndo(s, { key: a.key, previous: prev, kind: 'edit' }),
        revision: s.revision + 1,
      };
    }

    case 'undo': {
      const last = s.undo[s.undo.length - 1];
      if (!last) {
        return s;
      }
      return {
        ...s,
        values: setValue(s.values, last.key, last.previous),
        undo: s.undo.slice(0, -1),
        // Go back to the field that was undone so it can be re-measured straight away.
        currentKey: last.key,
        flashKey: null,
        revision: s.revision + 1,
      };
    }

    case 'setCurrent':
      return s.currentKey === a.key ? s : { ...s, currentKey: a.key };

    case 'clearFlash':
      return s.flashKey === null ? s : { ...s, flashKey: null };
  }
};

export const valueList = (values: ValueMap): MeasurementValue[] => Object.values(values);
