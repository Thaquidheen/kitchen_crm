/** Contract between LaserMeterService and a transport (BLE, keyboard, mock). */

import type { ConnectionMode, LaserState, MeasurementSource } from '../types';

/** What a connection may do to the service. Parsing and events stay in the service. */
export interface ConnectionHost {
  update(patch: Partial<LaserState>): void;
  /** A raw payload arrived; the service parses it with the current adapter. */
  ingestPacket(bytes: Uint8Array, source: MeasurementSource): void;
  /** The link dropped without the user asking; the service starts the reconnect backoff. */
  connectionLost(reason: string): void;
  log(message: string, level?: 'info' | 'warn' | 'error'): void;
}

export interface LaserConnection {
  readonly mode: ConnectionMode;
  connect(): Promise<void>;
  /** User-initiated: must not trigger auto-reconnect. */
  disconnect(): Promise<void>;
  /** One reconnect attempt after a drop. Resolve true when the link is back. */
  reconnect(): Promise<boolean>;
  /** Fire a measurement remotely, when the adapter supports it. */
  trigger?(): Promise<void>;
}
