/**
 * Shared types for the laser meter module. Framework-agnostic: nothing here may import React.
 * All distances are integer millimetres unless a name says otherwise.
 */

export const LENGTH_UNITS = ['mm', 'cm', 'm', 'in', 'ft'] as const;
export type LengthUnit = (typeof LENGTH_UNITS)[number];

export const BINARY_FORMATS = ['uint16', 'uint32', 'int32', 'float32'] as const;
export type BinaryFormat = (typeof BINARY_FORMATS)[number];

/** Where a stored value came from. Persisted with every value. */
export type MeasurementSource = 'laser_ble' | 'laser_hid' | 'manual';

/** The event LaserMeterService emits for every accepted reading. */
export interface LaserMeasurement {
  valueMm: number;
  source: MeasurementSource;
  /** Raw payload as received: hex for BLE packets, the typed text for keyboard meters. */
  raw: string;
  /** Epoch milliseconds. */
  at: number;
  adapterId: string | null;
}

/** A reading the parser refused (garbled, out of range…). Surfaced so the UI can say why. */
export interface RejectedReading {
  raw: string;
  reason: string;
  at: number;
  source: MeasurementSource;
}

// ---------------------------------------------------------------------------------------------
// Parser configuration (stored inside adapter configs)
// ---------------------------------------------------------------------------------------------

interface ParserCommon {
  /** Unit of the decoded number after `scale` is applied. */
  sourceUnit: LengthUnit;
  /** Multiplier applied to the decoded number, e.g. 0.1 for a value in tenths of a mm. */
  scale: number;
}

export interface BinaryParserConfig extends ParserCommon {
  type: 'binary';
  /** Byte offset of the value inside the notification payload. */
  offset: number;
  /** Byte length; optional, implied by `format`. When given it must agree with it. */
  length?: number;
  format: BinaryFormat;
  littleEndian: boolean;
}

export interface AsciiParserConfig extends ParserCommon {
  type: 'ascii';
  /**
   * Regex source (no slashes). Capture group 1 (or the named group `value`) is the number;
   * group 2 (or the named group `unit`) is an optional unit that overrides `sourceUnit`.
   */
  regex: string;
}

export type ParserConfig = BinaryParserConfig | AsciiParserConfig;

// ---------------------------------------------------------------------------------------------
// Adapter configuration (admin-managed, stored as JSON on the server)
// ---------------------------------------------------------------------------------------------

export interface BleFilter {
  namePrefix?: string;
  services?: string[];
}

export interface LaserAdapterConfig {
  /** Stable slug, e.g. "acme-x1". Also stored in measurement metadata. */
  id: string;
  displayName: string;
  active: boolean;
  bleFilters: BleFilter[];
  serviceUuid: string;
  measurementCharUuid: string;
  triggerCharUuid?: string;
  triggerPayloadHex?: string;
  /** Extra GATT services the page may access (always includes the battery service). */
  optionalServices?: string[];
  parser: ParserConfig;
  minMm: number;
  maxMm: number;
  notes?: string;
}

export type ParseResult =
  | { ok: true; valueMm: number }
  | { ok: false; reason: string };

/**
 * Narrowing helper. The app compiles with `strict: false`, where `if (!r.ok)` does not narrow
 * this union, so read the failure reason through here.
 */
export const failureReason = (r: ParseResult): string | null =>
  r.ok ? null : (r as { reason: string }).reason;

// ---------------------------------------------------------------------------------------------
// Runtime adapter (what connections talk to). Config adapters and code adapters both implement it.
// ---------------------------------------------------------------------------------------------

/** Minimal GATT I/O given to code adapters that need a handshake. */
export interface AdapterIO {
  write(serviceUuid: string, charUuid: string, bytes: Uint8Array): Promise<void>;
  read(serviceUuid: string, charUuid: string): Promise<Uint8Array>;
}

export interface LaserMeterAdapter {
  id: string;
  displayName: string;
  kind: 'config' | 'code' | 'builtin';
  active: boolean;
  /** Present when the adapter can talk to a device over Web Bluetooth. */
  ble?: {
    filters: BleFilter[];
    acceptAllDevices?: boolean;
    optionalServices: string[];
    serviceUuid: string;
    measurementCharUuid: string;
    triggerCharUuid?: string;
    triggerPayload?: Uint8Array;
  };
  minMm: number;
  maxMm: number;
  /** Turn one notification payload into millimetres. Must be pure. */
  parse(bytes: Uint8Array): ParseResult;
  /** Optional post-connect handshake for code adapters (e.g. enable streaming). */
  setup?(io: AdapterIO): Promise<void>;
  /** The source config, for config-driven adapters. */
  config?: LaserAdapterConfig;
}

// ---------------------------------------------------------------------------------------------
// Service state
// ---------------------------------------------------------------------------------------------

/** How readings reach the app. `mock` is the simulated BLE device used in dev mode. */
export type ConnectionMode = 'ble' | 'keyboard' | 'manual' | 'mock';
export type PreferredMode = 'auto' | 'ble' | 'keyboard' | 'manual';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

export interface LaserState {
  mode: ConnectionMode;
  status: ConnectionStatus;
  adapterId: string | null;
  deviceId: string | null;
  deviceName: string | null;
  /** 0–100, or null when the device has no battery service. */
  battery: number | null;
  /** Adapter can fire a measurement remotely. */
  canTrigger: boolean;
  /** 1-based reconnect attempt while `reconnecting`. */
  reconnectAttempt: number;
  /** Epoch ms of the next reconnect attempt, while `reconnecting`. */
  nextRetryAt: number | null;
  lastError: string | null;
  /** A previously used device that can be reconnected without the chooser. */
  rememberedDevice: RememberedDevice | null;
}

export interface RememberedDevice {
  id: string;
  name: string | null;
  adapterId: string;
}

// ---------------------------------------------------------------------------------------------
// Keyboard (HID) mode
// ---------------------------------------------------------------------------------------------

export interface KeystrokeTimingConfig {
  /** Median gap between keystrokes at or below which input counts as a device burst. */
  maxMedianIntervalMs: number;
  /** Any single gap longer than this means a human was typing. */
  maxGapMs: number;
  /** Fewer characters than this can't be classified (treated as human). */
  minChars: number;
}

export type KeystrokeVerdict = 'device' | 'human';

export interface KeyboardCapture {
  text: string;
  /** keydown timestamps (ms, monotonic) of the characters in `text`. */
  timestamps: number[];
  /** How the capture ended. */
  terminator: 'enter' | 'tab' | 'idle';
}
