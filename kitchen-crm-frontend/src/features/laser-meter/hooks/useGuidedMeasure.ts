import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  buildSequence,
  firstOpenTargetKey,
  nextTargetKey,
  prevTargetKey,
  progressOf,
  type RoomLayout,
  type SequenceConfig,
} from '../core/guidedSequence';
import {
  initialSession,
  sessionReducer,
  type MeasurementValue,
} from '../core/measurementSession';
import type { LaserMeasurement } from '../core/types';
import { captureFeedback } from '../core/feedback';

export interface GuidedMeasureOptions {
  autoAdvance: boolean;
  beep: boolean;
  vibrate: boolean;
  /** Delay between the capture flash and moving on. */
  advanceDelayMs?: number;
}

/**
 * Guided measuring: the target sequence, captured values (with metadata), the current target,
 * undo, and auto-advance after each capture.
 */
export const useGuidedMeasure = (
  layout: RoomLayout,
  sequence: SequenceConfig,
  opts: GuidedMeasureOptions
) => {
  const targets = useMemo(() => buildSequence(layout, sequence), [layout, sequence]);
  const [state, dispatch] = useReducer(sessionReducer, undefined, () => initialSession());
  const stateRef = useRef(state);
  stateRef.current = state;
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFilled = useCallback((key: string) => !!stateRef.current.values[key], []);

  // The current target: the explicit choice if it still exists, else the first gap.
  const currentKey = useMemo(() => {
    if (state.currentKey && targets.some((t) => t.key === state.currentKey)) {
      return state.currentKey;
    }
    return firstOpenTargetKey(targets, (k) => !!state.values[k]);
  }, [state.currentKey, state.values, targets]);

  const current = targets.find((t) => t.key === currentKey) ?? null;

  const cancelAdvance = () => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  };
  useEffect(() => cancelAdvance, []);

  const setCurrent = useCallback((key: string | null) => {
    cancelAdvance();
    dispatch({ type: 'clearFlash' });
    dispatch({ type: 'setCurrent', key });
  }, []);

  const capture = useCallback(
    (key: string, measurement: LaserMeasurement) => {
      cancelAdvance();
      dispatch({ type: 'capture', key, measurement });
      captureFeedback(optsRef.current, true);
      advanceTimer.current = setTimeout(() => {
        advanceTimer.current = null;
        dispatch({ type: 'clearFlash' });
        if (optsRef.current.autoAdvance) {
          // stateRef now holds the post-capture values.
          dispatch({ type: 'setCurrent', key: nextTargetKey(targets, key, isFilled) });
        }
      }, optsRef.current.advanceDelayMs ?? 650);
    },
    [targets, isFilled]
  );

  const edit = useCallback((key: string, valueMm: number | null) => {
    dispatch({ type: 'edit', key, valueMm, at: Date.now() });
  }, []);

  const undo = useCallback(() => {
    cancelAdvance();
    dispatch({ type: 'undo' });
  }, []);

  const load = useCallback((values: MeasurementValue[]) => {
    cancelAdvance();
    dispatch({ type: 'load', values });
  }, []);

  const next = useCallback(
    () => setCurrent(nextTargetKey(targets, currentKey, isFilled, { skipFilled: false })),
    [targets, currentKey, isFilled, setCurrent]
  );
  const prev = useCallback(() => {
    const k = prevTargetKey(targets, currentKey);
    if (k) {
      setCurrent(k);
    }
  }, [targets, currentKey, setCurrent]);

  const rejected = useCallback(() => captureFeedback(optsRef.current, false), []);

  const progress = progressOf(targets, (k) => !!state.values[k]);

  return {
    targets,
    values: state.values,
    revision: state.revision,
    currentKey,
    current,
    flashKey: state.flashKey,
    canUndo: state.undo.length > 0,
    progress,
    capture,
    edit,
    undo,
    load,
    setCurrent,
    next,
    prev,
    rejected,
  };
};

export type GuidedMeasure = ReturnType<typeof useGuidedMeasure>;
