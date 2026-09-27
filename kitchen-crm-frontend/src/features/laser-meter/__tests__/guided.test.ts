import { describe, expect, it } from 'vitest';
import {
  buildSequence,
  DEFAULT_SEQUENCE_CONFIG,
  firstOpenTargetKey,
  nextTargetKey,
  prevTargetKey,
  progressOf,
  sanitizeLayout,
  type RoomLayout,
} from '../core/guidedSequence';
import { initialSession, sessionReducer, type SessionState } from '../core/measurementSession';
import type { LaserMeasurement } from '../core/types';

const layout: RoomLayout = {
  wallCount: 3,
  includeCeiling: true,
  openings: [
    { id: 'w1', kind: 'window', wall: 2 },
    { id: 'd1', kind: 'door', wall: 1 },
    { id: 'w2', kind: 'window', wall: 3, label: 'Small window' },
  ],
  servicePoints: [{ id: 's1', kind: 'water', wall: 2 }],
};

describe('buildSequence', () => {
  it('orders walls → ceiling → openings → services with the configured fields', () => {
    const keys = buildSequence(layout).map((t) => t.key);
    expect(keys).toEqual([
      'wall.1.length',
      'wall.2.length',
      'wall.3.length',
      'ceiling.height',
      'opening.w1.offset',
      'opening.w1.width',
      'opening.w1.height',
      'opening.w1.sill',
      'opening.d1.offset',
      'opening.d1.width',
      'opening.d1.height',
      'opening.d1.sill',
      'opening.w2.offset',
      'opening.w2.width',
      'opening.w2.height',
      'opening.w2.sill',
      'service.s1.offset',
      'service.s1.height',
    ]);
  });

  it('numbers items per kind and honours custom labels', () => {
    const labels = buildSequence(layout).map((t) => t.itemLabel);
    expect(labels).toContain('Window 1 (wall 2)');
    expect(labels).toContain('Door 1 (wall 1)');
    expect(labels).toContain('Small window (wall 3)');
    expect(labels).toContain('Water point 1 (wall 2)');
  });

  it('is configurable', () => {
    const keys = buildSequence(
      { ...layout, includeCeiling: false },
      { order: ['services', 'walls'], openingFields: ['width'], serviceFields: ['height'] }
    ).map((t) => t.key);
    expect(keys).toEqual(['service.s1.height', 'wall.1.length', 'wall.2.length', 'wall.3.length']);
  });
});

describe('navigation', () => {
  const targets = buildSequence({ wallCount: 4, includeCeiling: true, openings: [], servicePoints: [] }, DEFAULT_SEQUENCE_CONFIG);
  const filled = new Set<string>();
  const isFilled = (k: string) => filled.has(k);

  it('moves to the next unfilled target and wraps to earlier gaps', () => {
    expect(nextTargetKey(targets, 'wall.1.length', isFilled)).toBe('wall.2.length');
    filled.add('wall.2.length');
    expect(nextTargetKey(targets, 'wall.1.length', isFilled)).toBe('wall.3.length');
    filled.add('wall.3.length').add('wall.4.length').add('ceiling.height');
    expect(nextTargetKey(targets, 'ceiling.height', isFilled)).toBe('wall.1.length');
    filled.add('wall.1.length');
    expect(nextTargetKey(targets, 'ceiling.height', isFilled)).toBeNull();
    expect(nextTargetKey(targets, 'wall.1.length', isFilled, { skipFilled: false })).toBe('wall.2.length');
    expect(nextTargetKey(targets, 'ceiling.height', isFilled, { skipFilled: false })).toBeNull();
  });

  it('prev, first-open and progress', () => {
    expect(prevTargetKey(targets, 'wall.2.length')).toBe('wall.1.length');
    expect(prevTargetKey(targets, 'wall.1.length')).toBeNull();
    expect(firstOpenTargetKey(targets, () => false)).toBe('wall.1.length');
    expect(progressOf(targets, isFilled)).toEqual({ done: 5, total: 5 });
  });

  it('sanitizes stored layouts', () => {
    expect(sanitizeLayout({ wallCount: 0 } as never).wallCount).toBe(4);
    expect(sanitizeLayout(null).openings).toEqual([]);
  });
});

const m = (valueMm: number, source: LaserMeasurement['source'] = 'laser_ble'): LaserMeasurement => ({
  valueMm,
  source,
  raw: 'aa bb',
  at: Date.UTC(2026, 0, 1),
  adapterId: source === 'laser_ble' ? 'acme' : null,
});

describe('sessionReducer', () => {
  const run = (...actions: Parameters<typeof sessionReducer>[1][]): SessionState =>
    actions.reduce(sessionReducer, initialSession());

  it('stores captures with metadata and flashes', () => {
    const s = run({ type: 'capture', key: 'wall.1.length', measurement: m(2345) });
    expect(s.values['wall.1.length']).toEqual({
      key: 'wall.1.length',
      valueMm: 2345,
      source: 'laser_ble',
      deviceAdapterId: 'acme',
      raw: 'aa bb',
      capturedAt: '2026-01-01T00:00:00.000Z',
      editedAfterCapture: false,
    });
    expect(s.flashKey).toBe('wall.1.length');
  });

  it('flags hand edits of device readings, but not of manual ones', () => {
    let s = run(
      { type: 'capture', key: 'a', measurement: m(2345) },
      { type: 'edit', key: 'a', valueMm: 2350, at: 0 }
    );
    expect(s.values.a).toMatchObject({ valueMm: 2350, source: 'laser_ble', editedAfterCapture: true });
    s = run({ type: 'edit', key: 'b', valueMm: 1000, at: 0 }, { type: 'edit', key: 'b', valueMm: 1100, at: 0 });
    expect(s.values.b).toMatchObject({ source: 'manual', editedAfterCapture: false, valueMm: 1100 });
  });

  it('ignores no-op edits and clears with null', () => {
    let s = run({ type: 'capture', key: 'a', measurement: m(2345) }, { type: 'edit', key: 'a', valueMm: 2345, at: 0 });
    expect(s.undo).toHaveLength(1);
    s = sessionReducer(s, { type: 'edit', key: 'a', valueMm: null, at: 0 });
    expect(s.values.a).toBeUndefined();
  });

  it('undoes the last change and returns to that field', () => {
    let s = run(
      { type: 'capture', key: 'a', measurement: m(1000) },
      { type: 'capture', key: 'b', measurement: m(2000) },
      { type: 'capture', key: 'a', measurement: m(1100) },
      { type: 'setCurrent', key: 'c' }
    );
    s = sessionReducer(s, { type: 'undo' });
    expect(s.values.a.valueMm).toBe(1000);
    expect(s.currentKey).toBe('a');
    s = sessionReducer(s, { type: 'undo' });
    expect(s.values.b).toBeUndefined();
    expect(s.currentKey).toBe('b');
    s = sessionReducer(sessionReducer(s, { type: 'undo' }), { type: 'undo' });
    expect(s.values).toEqual({});
  });

  it('loads saved values', () => {
    const s = sessionReducer(initialSession(), {
      type: 'load',
      values: [{ key: 'a', valueMm: 1, source: 'manual', deviceAdapterId: null, raw: null, capturedAt: 'x', editedAfterCapture: false }],
      currentKey: 'b',
    });
    expect(Object.keys(s.values)).toEqual(['a']);
    expect(s.currentKey).toBe('b');
  });
});
