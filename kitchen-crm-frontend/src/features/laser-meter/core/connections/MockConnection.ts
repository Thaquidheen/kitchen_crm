/**
 * A fake BLE laser meter, so the whole flow (connect → battery → readings → drop → reconnect)
 * can be developed and demoed with no hardware. It speaks the mock adapter's packet format, so
 * every simulated reading goes through the real parser.
 */

import type { ConnectionHost, LaserConnection } from './Connection';
import { encodeMockPacket, MOCK_ADAPTER_ID } from '../adapters/builtins';
import { realTimers, type Timers } from '../reconnect';

export interface MockOptions {
  connectDelayMs?: number;
  battery?: number;
  deviceName?: string;
}

export class MockConnection implements LaserConnection {
  readonly mode = 'mock' as const;
  /** When false, reconnect attempts fail (simulates a meter that is switched off). */
  available = true;
  private connected = false;

  private readonly host: ConnectionHost;
  private readonly timers: Timers;
  private readonly opts: MockOptions;

  constructor(host: ConnectionHost, timers: Timers = realTimers, opts: MockOptions = {}) {
    this.host = host;
    this.timers = timers;
    this.opts = opts;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  connect(): Promise<void> {
    this.host.update({ status: 'connecting', lastError: null });
    return new Promise((resolve) => {
      this.timers.setTimeout(() => {
        this.connected = true;
        this.host.update({
          status: 'connected',
          deviceId: 'mock-device',
          deviceName: this.opts.deviceName ?? 'SIM-0001',
          battery: this.opts.battery ?? 87,
          adapterId: MOCK_ADAPTER_ID,
          canTrigger: true,
        });
        this.host.log('Simulated meter connected');
        resolve();
      }, this.opts.connectDelayMs ?? 300);
    });
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.host.update({ status: 'disconnected', battery: null });
  }

  async reconnect(): Promise<boolean> {
    if (!this.available) {
      return false;
    }
    this.connected = true;
    return true;
  }

  async trigger(): Promise<void> {
    // A real meter would measure; the simulator picks a plausible wall length.
    this.emitReading(1200 + Math.round(Math.random() * 3000));
  }

  /** Feed one reading as the device would send it. */
  emitReading(mm: number): void {
    if (!this.connected) {
      this.host.log('Simulated reading ignored: not connected', 'warn');
      return;
    }
    this.host.ingestPacket(encodeMockPacket(mm), 'laser_ble');
  }

  /** Feed an arbitrary payload (e.g. garbage) to exercise the rejection path. */
  emitRaw(bytes: Uint8Array): void {
    if (this.connected) {
      this.host.ingestPacket(bytes, 'laser_ble');
    }
  }

  /** Simulate the meter going out of range / switching off. */
  simulateDrop(): void {
    if (!this.connected) {
      return;
    }
    this.connected = false;
    this.host.connectionLost('Simulated meter went out of range');
  }
}
