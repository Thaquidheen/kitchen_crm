/**
 * LaserMeterService — the one object the rest of the app talks to.
 *
 * Owns the connection mode, device state and adapter choice, and emits:
 *   measurement  { valueMm, source, raw, at, adapterId }   an accepted reading
 *   rejected     { raw, reason, at, source }               a reading the parser refused
 *   state        LaserState                                any status change
 *   log          { at, level, message }                    diagnostics
 *
 * Framework-agnostic (no React). Use the `laserMeter` singleton in the app; construct your own
 * instance with injected deps in tests.
 */

import { failureReason } from './types';
import type {
  KeyboardCapture,
  KeystrokeTimingConfig,
  KeystrokeVerdict,
  LaserMeasurement,
  LaserMeterAdapter,
  LaserState,
  MeasurementSource,
  RejectedReading,
  RememberedDevice,
} from './types';
import { Emitter } from './emitter';
import { AdapterRegistry, safeLocalStorage, type StorageLike } from './adapters/registry';
import { MOCK_ADAPTER_ID } from './adapters/builtins';
import { bytesToHex } from './hex';
import {
  DEFAULT_RECONNECT_DELAYS_MS,
  ReconnectScheduler,
  realTimers,
  type Timers,
} from './reconnect';
import type { ConnectionHost, LaserConnection } from './connections/Connection';
import { MockConnection } from './connections/MockConnection';
import { KeyboardConnection } from './connections/KeyboardConnection';
import { parseHidInput, type HidDefaultUnit } from './hidInputParser';
import { classifyKeystrokes, DEFAULT_KEYSTROKE_TIMING } from './keystrokeTiming';

export interface LogEntry {
  at: number;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export type LaserEvents = {
  measurement: LaserMeasurement;
  rejected: RejectedReading;
  state: LaserState;
  log: LogEntry;
};

export interface KeyboardOptions {
  defaultUnit: HidDefaultUnit;
  timing: KeystrokeTimingConfig;
  acceptHumanTyping: boolean;
  minMm: number;
  maxMm: number;
}

export interface KeyboardCaptureResult {
  accepted: boolean;
  verdict: KeystrokeVerdict;
  measurement?: LaserMeasurement;
  reason?: string;
}

export interface LaserServiceDeps {
  registry?: AdapterRegistry;
  timers?: Timers;
  storage?: StorageLike | null;
  reconnectDelaysMs?: number[];
}

const REMEMBERED_KEY = 'laserMeter.lastDevice.v1';
const MAX_LOG = 200;

export const initialLaserState = (): LaserState => ({
  mode: 'manual',
  status: 'disconnected',
  adapterId: null,
  deviceId: null,
  deviceName: null,
  battery: null,
  canTrigger: false,
  reconnectAttempt: 0,
  nextRetryAt: null,
  lastError: null,
  needsManualReconnect: false,
  rememberedDevice: null,
});

export class LaserMeterService {
  readonly registry: AdapterRegistry;
  protected readonly timers: Timers;
  protected readonly storage: StorageLike | null;
  private readonly emitter = new Emitter<LaserEvents>();
  private state: LaserState = initialLaserState();
  protected connection: LaserConnection | null = null;
  private readonly reconnector: ReconnectScheduler;
  private logEntries: LogEntry[] = [];
  private keyboardOpts: KeyboardOptions = {
    defaultUnit: 'auto',
    timing: DEFAULT_KEYSTROKE_TIMING,
    acceptHumanTyping: true,
    minMm: 50,
    maxMm: 15000,
  };

  constructor(deps: LaserServiceDeps = {}) {
    this.timers = deps.timers ?? realTimers;
    this.storage = deps.storage === undefined ? safeLocalStorage() : deps.storage;
    this.registry = deps.registry ?? new AdapterRegistry(this.storage);
    this.reconnector = new ReconnectScheduler(
      {
        onScheduled: (attempt, at) =>
          this.update({ status: 'reconnecting', reconnectAttempt: attempt, nextRetryAt: at }),
        attempt: async (attempt) => {
          this.log(`Reconnect attempt ${attempt}`);
          return this.connection ? this.connection.reconnect() : false;
        },
        onSucceeded: () => {
          this.log('Reconnected');
          this.update({
            status: 'connected',
            reconnectAttempt: 0,
            nextRetryAt: null,
            lastError: null,
            needsManualReconnect: false,
          });
        },
        onGaveUp: () => {
          this.log('Automatic reconnect gave up', 'warn');
          this.update({
            status: 'disconnected',
            reconnectAttempt: 0,
            nextRetryAt: null,
            lastError: 'Connection lost. Tap Reconnect when the meter is on and nearby.',
            needsManualReconnect: true,
          });
        },
      },
      deps.reconnectDelaysMs ?? DEFAULT_RECONNECT_DELAYS_MS,
      this.timers
    );
    this.state.rememberedDevice = this.readRemembered();
  }

  // ------------------------------------------------------------------ events & state

  on<K extends keyof LaserEvents>(event: K, fn: (payload: LaserEvents[K]) => void): () => void {
    return this.emitter.on(event, fn);
  }

  getState(): LaserState {
    return this.state;
  }

  getLog(): LogEntry[] {
    return this.logEntries;
  }

  protected update(patch: Partial<LaserState>): void {
    this.state = { ...this.state, ...patch };
    this.emitter.emit('state', this.state);
  }

  protected log(message: string, level: LogEntry['level'] = 'info'): void {
    const entry = { at: this.timers.now(), level, message };
    this.logEntries = [...this.logEntries.slice(-(MAX_LOG - 1)), entry];
    this.emitter.emit('log', entry);
  }

  // ------------------------------------------------------------------ adapter

  get adapter(): LaserMeterAdapter | null {
    return this.registry.get(this.state.adapterId);
  }

  setAdapter(id: string | null): void {
    if (id === this.state.adapterId) {
      return;
    }
    this.update({ adapterId: id });
  }

  // ------------------------------------------------------------------ connection host

  /** The callbacks every connection gets. Kept as one object so connections can't reach further. */
  protected readonly host: ConnectionHost = {
    update: (patch) => this.update(patch),
    ingestPacket: (bytes, source) => this.ingestPacket(bytes, source),
    connectionLost: (reason) => {
      this.log(reason, 'warn');
      this.update({ lastError: reason });
      this.reconnector.start();
    },
    log: (message, level) => this.log(message, level),
  };

  /** Parse a payload with the current adapter and emit `measurement` or `rejected`. */
  ingestPacket(bytes: Uint8Array, source: MeasurementSource = 'laser_ble'): void {
    const raw = bytesToHex(bytes);
    const adapter = this.adapter;
    if (!adapter) {
      this.reject(raw, 'No adapter selected for this device', source);
      return;
    }
    const result = adapter.parse(bytes);
    if (result.ok) {
      this.accept(result.valueMm, source, raw);
    } else {
      this.reject(raw, failureReason(result), source);
    }
  }

  protected accept(valueMm: number, source: MeasurementSource, raw: string): LaserMeasurement {
    const m: LaserMeasurement = {
      valueMm,
      source,
      raw,
      at: this.timers.now(),
      // Keyboard meters have no adapter (the OS does the talking); only BLE readings carry one.
      adapterId: source === 'laser_ble' ? this.state.adapterId : null,
    };
    this.log(`Reading ${valueMm} mm (${source})`);
    this.emitter.emit('measurement', m);
    return m;
  }

  protected reject(raw: string, reason: string, source: MeasurementSource): void {
    this.log(`Rejected "${raw}": ${reason}`, 'warn');
    this.emitter.emit('rejected', { raw, reason, at: this.timers.now(), source });
  }

  // ------------------------------------------------------------------ lifecycle

  protected async useConnection(conn: LaserConnection): Promise<void> {
    await this.teardown();
    this.connection = conn;
    this.update({ mode: conn.mode, lastError: null, needsManualReconnect: false });
    try {
      await conn.connect();
    } catch (e) {
      this.connection = null;
      this.update({ status: 'disconnected', lastError: errorMessage(e) });
      throw e;
    }
  }

  /** Stop whatever is running (without the auto-reconnect kicking in). */
  protected async teardown(): Promise<void> {
    this.reconnector.cancel();
    const conn = this.connection;
    this.connection = null;
    if (conn) {
      try {
        await conn.disconnect();
      } catch {
        // Already gone.
      }
    }
    this.update({
      status: 'disconnected',
      deviceId: null,
      deviceName: null,
      battery: null,
      canTrigger: false,
      reconnectAttempt: 0,
      nextRetryAt: null,
      needsManualReconnect: false,
    });
  }

  async disconnect(): Promise<void> {
    await this.teardown();
    this.log('Disconnected by user');
  }

  /** Bluetooth-direct mode, not yet connected: connecting needs a user gesture (Connect button). */
  async prepareBle(): Promise<void> {
    await this.teardown();
    this.update({ mode: 'ble', lastError: null });
  }

  /** Manual mode: no device; values are typed. Always available. */
  async useManual(): Promise<void> {
    await this.teardown();
    this.update({ mode: 'manual', lastError: null });
  }

  /** Connect the simulated meter (dev mode). */
  async connectMock(): Promise<MockConnection> {
    this.setAdapter(MOCK_ADAPTER_ID);
    const conn = new MockConnection(this.host, this.timers);
    await this.useConnection(conn);
    return conn;
  }

  // ------------------------------------------------------------------ keyboard (HID) mode

  configureKeyboard(patch: Partial<KeyboardOptions>): void {
    this.keyboardOpts = { ...this.keyboardOpts, ...patch };
  }

  /** Keyboard mode: readings arrive as typed text in the capture input. */
  async enableKeyboard(): Promise<void> {
    await this.useConnection(new KeyboardConnection(this.host));
  }

  /**
   * Called by the capture input when a burst of keystrokes ends (Enter / Tab / idle).
   * Timing decides provenance: a fast burst is the meter (laser_hid); slow typing is a person
   * (manual) — accepted or refused per the `acceptHumanTyping` option.
   */
  submitKeyboardCapture(capture: KeyboardCapture): KeyboardCaptureResult {
    const { verdict } = classifyKeystrokes(capture.timestamps, this.keyboardOpts.timing);
    if (verdict === 'human' && !this.keyboardOpts.acceptHumanTyping) {
      const reason = 'That looked like typing by hand. Use "Type manually" to enter a value yourself.';
      this.reject(capture.text, reason, 'manual');
      return { accepted: false, verdict, reason };
    }
    const source: MeasurementSource = verdict === 'device' ? 'laser_hid' : 'manual';
    const result = parseHidInput(capture.text, this.keyboardOpts);
    if (!result.ok) {
      const reason = failureReason(result);
      this.reject(capture.text, reason, source);
      return { accepted: false, verdict, reason };
    }
    const measurement = this.accept(result.valueMm, source, capture.text);
    return { accepted: true, verdict, measurement };
  }

  get mock(): MockConnection | null {
    return this.connection instanceof MockConnection ? this.connection : null;
  }

  /** Manual retry after the automatic backoff gave up (or at any time while reconnecting). */
  async retryNow(): Promise<boolean> {
    if (!this.connection) {
      return false;
    }
    this.reconnector.cancel();
    this.update({ status: 'reconnecting', reconnectAttempt: 0, nextRetryAt: null });
    const ok = await this.connection.reconnect().catch(() => false);
    this.update(
      ok
        ? { status: 'connected', lastError: null, needsManualReconnect: false }
        : {
            status: 'disconnected',
            lastError: 'Could not reconnect. Is the meter on and nearby?',
            needsManualReconnect: true,
          }
    );
    return ok;
  }

  async trigger(): Promise<void> {
    if (!this.connection?.trigger || !this.state.canTrigger) {
      throw new Error('This meter cannot be triggered remotely');
    }
    await this.connection.trigger();
  }

  /**
   * Dev-mode "Simulate reading". Uses the mock device when connected (full parse path);
   * otherwise emits straight through as the current mode's source.
   */
  simulateReading(mm?: number): void {
    const value = mm ?? 800 + Math.round(Math.random() * 3500);
    const mock = this.mock;
    if (mock?.isConnected) {
      mock.emitReading(value);
      return;
    }
    if (this.state.mode === 'keyboard') {
      // Behave like a meter "typing" metres at ~8 ms per key, ending with Enter.
      const text = (value / 1000).toFixed(3);
      const t0 = this.timers.now();
      this.submitKeyboardCapture({
        text,
        timestamps: Array.from(text, (_c, i) => t0 + i * 8),
        terminator: 'enter',
      });
      return;
    }
    const source: MeasurementSource = this.state.mode === 'ble' ? 'laser_ble' : 'manual';
    this.accept(value, source, `simulated:${value}`);
  }

  simulateDisconnect(): void {
    this.mock?.simulateDrop();
  }

  // ------------------------------------------------------------------ remembered device

  protected remember(device: RememberedDevice | null): void {
    try {
      if (device) {
        this.storage?.setItem(REMEMBERED_KEY, JSON.stringify(device));
      } else {
        this.storage?.removeItem(REMEMBERED_KEY);
      }
    } catch {
      // Non-critical.
    }
    this.update({ rememberedDevice: device });
  }

  private readRemembered(): RememberedDevice | null {
    try {
      const raw = this.storage?.getItem(REMEMBERED_KEY);
      return raw ? (JSON.parse(raw) as RememberedDevice) : null;
    } catch {
      return null;
    }
  }
}

export const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : 'Unknown error';
