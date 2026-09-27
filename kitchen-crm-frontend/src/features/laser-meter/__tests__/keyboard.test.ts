import { beforeEach, describe, expect, it } from 'vitest';
import { parseHidInput } from '../core/hidInputParser';
import { classifyKeystrokes, DEFAULT_KEYSTROKE_TIMING } from '../core/keystrokeTiming';
import { KeystrokeBuffer } from '../core/keystrokeBuffer';
import { LaserMeterService } from '../core/LaserMeterService';
import type { KeyboardCapture, LaserMeasurement } from '../core/types';
import { FakeTimers, MemoryStorage } from './fakeTimers';
import { resolveMode, mergeSettings, SettingsStore } from '../core/settings';

const opts = { defaultUnit: 'auto' as const, minMm: 50, maxMm: 15000 };

describe('parseHidInput', () => {
  it.each([
    ['2345', 2345],
    ['2345\r', 2345],
    ['2.345', 2345], // auto → metres
    ['2,345', 2345], // decimal comma
    ['2.345m', 2345],
    ['2,345 m', 2345],
    ['2345 mm', 2345],
    ['2345mm.', 2345],
    ['234.5cm', 2345],
    ['234,5 cm', 2345],
    ['92.32 in', 2345],
    ['92.32"', 2345],
    [`7' 8.3"`, 2344],
    ["7'8\"", 2337],
    ['7.5 ft', 2286],
    ['D: 2.345 m', 2345],
    ['1.234,5 mm', 1235],
    ['  3.1 M  ', 3100],
  ])('%j → %i mm', (text, mm) => {
    const r = parseHidInput(text, opts);
    expect(r).toMatchObject({ ok: true, valueMm: mm });
  });

  it('uses a fixed default unit when configured', () => {
    expect(parseHidInput('234.5', { ...opts, defaultUnit: 'cm' })).toMatchObject({ valueMm: 2345 });
    expect(parseHidInput('2345', { ...opts, defaultUnit: 'mm' })).toMatchObject({ valueMm: 2345 });
  });

  it.each([[''], ['abc'], ['12 yd'], ['0.01 m'], ['99 m']])('rejects %j', (text) => {
    expect(parseHidInput(text, opts).ok).toBe(false);
  });
});

const burst = (n: number, gap: number, t0 = 1000) => Array.from({ length: n }, (_, i) => t0 + i * gap);

describe('classifyKeystrokes', () => {
  it('recognises a device burst', () => {
    expect(classifyKeystrokes(burst(5, 8)).verdict).toBe('device');
  });

  it('recognises human typing', () => {
    expect(classifyKeystrokes(burst(4, 150)).verdict).toBe('human');
  });

  it('treats a single long pause inside a fast burst as human', () => {
    expect(classifyKeystrokes([0, 8, 16, 400, 408]).verdict).toBe('human');
  });

  it('needs a minimum number of characters', () => {
    expect(classifyKeystrokes(burst(2, 5)).verdict).toBe('human');
    expect(classifyKeystrokes([]).verdict).toBe('human');
  });

  it('respects configured thresholds', () => {
    const slowDevice = burst(5, 50);
    expect(classifyKeystrokes(slowDevice).verdict).toBe('human');
    expect(
      classifyKeystrokes(slowDevice, { ...DEFAULT_KEYSTROKE_TIMING, maxMedianIntervalMs: 60 }).verdict
    ).toBe('device');
  });
});

describe('KeystrokeBuffer', () => {
  let timers: FakeTimers;
  let captures: KeyboardCapture[];
  let buf: KeystrokeBuffer;

  beforeEach(() => {
    timers = new FakeTimers();
    captures = [];
    buf = new KeystrokeBuffer({ onCapture: (c) => captures.push(c), timers });
  });

  const type = (text: string, gap: number, t0 = 0) =>
    Array.from(text).forEach((c, i) => buf.handleKey(c, t0 + i * gap));

  it('finishes on Enter and on Tab', () => {
    type('2.345', 8);
    expect(buf.handleKey('Enter', 50)).toBe(true);
    type('1200', 8);
    buf.handleKey('Tab', 90);
    expect(captures.map((c) => [c.text, c.terminator])).toEqual([
      ['2.345', 'enter'],
      ['1200', 'tab'],
    ]);
  });

  it('finishes a device burst after a short idle', async () => {
    type('2345', 8);
    await timers.advance(299);
    expect(captures).toHaveLength(0);
    await timers.advance(1);
    expect(captures[0]).toMatchObject({ text: '2345', terminator: 'idle' });
  });

  it('waits longer for a person typing', async () => {
    type('23', 200);
    await timers.advance(1000);
    expect(captures).toHaveLength(0);
    await timers.advance(2000);
    expect(captures).toHaveLength(1);
  });

  it('handles backspace, escape and ignores modifier keys', () => {
    type('23x', 8);
    buf.handleKey('Backspace', 30);
    expect(buf.handleKey('Shift', 31)).toBe(false);
    type('45', 8, 40);
    buf.handleKey('Enter', 60);
    expect(captures[0].text).toBe('2345');
    type('99', 8);
    buf.handleKey('Escape', 20);
    buf.handleKey('Enter', 30);
    expect(captures).toHaveLength(1);
  });

  it('lets Tab through when nothing was typed', () => {
    expect(buf.handleKey('Tab', 0)).toBe(false);
  });
});

describe('LaserMeterService keyboard mode', () => {
  let svc: LaserMeterService;
  let readings: LaserMeasurement[];
  beforeEach(async () => {
    svc = new LaserMeterService({ timers: new FakeTimers(), storage: new MemoryStorage() });
    readings = [];
    svc.on('measurement', (m) => readings.push(m));
    await svc.enableKeyboard();
  });

  it('is connected in keyboard mode', () => {
    expect(svc.getState()).toMatchObject({ mode: 'keyboard', status: 'connected', battery: null });
  });

  it('tags device bursts as laser_hid', () => {
    const r = svc.submitKeyboardCapture({ text: '2.345', timestamps: burst(5, 8), terminator: 'enter' });
    expect(r).toMatchObject({ accepted: true, verdict: 'device' });
    expect(readings[0]).toMatchObject({ valueMm: 2345, source: 'laser_hid', raw: '2.345', adapterId: null });
  });

  it('tags slow typing as manual, or rejects it when configured', () => {
    svc.submitKeyboardCapture({ text: '2345', timestamps: burst(4, 200), terminator: 'enter' });
    expect(readings[0].source).toBe('manual');
    svc.configureKeyboard({ acceptHumanTyping: false });
    const r = svc.submitKeyboardCapture({ text: '2345', timestamps: burst(4, 200), terminator: 'enter' });
    expect(r.accepted).toBe(false);
    expect(readings).toHaveLength(1);
  });

  it('rejects unparseable text', () => {
    const r = svc.submitKeyboardCapture({ text: 'ERR', timestamps: burst(3, 8), terminator: 'enter' });
    expect(r).toMatchObject({ accepted: false });
    expect(r.reason).toMatch(/number/);
  });

  it('simulateReading types like a meter', () => {
    svc.simulateReading(3210);
    expect(readings[0]).toMatchObject({ valueMm: 3210, source: 'laser_hid' });
  });
});

describe('settings', () => {
  it('resolves Auto per device capability', () => {
    expect(resolveMode('auto', { bleSupported: true, hasAdapter: true })).toBe('ble');
    expect(resolveMode('auto', { bleSupported: true, hasAdapter: false })).toBe('keyboard');
    expect(resolveMode('auto', { bleSupported: false, hasAdapter: true })).toBe('keyboard');
    expect(resolveMode('ble', { bleSupported: false, hasAdapter: true })).toBe('keyboard');
    expect(resolveMode('manual', { bleSupported: true, hasAdapter: true })).toBe('manual');
  });

  it('merges stored settings over defaults and persists per user', () => {
    expect(mergeSettings({ hid: { timing: { minChars: 5 } } } as never).hid.timing).toMatchObject({
      minChars: 5,
      maxGapMs: 80,
    });
    const storage = new MemoryStorage();
    new SettingsStore(storage).update('u1', { displayUnit: 'm' });
    expect(new SettingsStore(storage).get('u1').displayUnit).toBe('m');
    expect(new SettingsStore(storage).get('u2').displayUnit).toBe('mm');
  });
});
