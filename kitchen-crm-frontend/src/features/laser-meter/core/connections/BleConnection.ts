/**
 * Mode A — Web Bluetooth. Talks GATT to a meter described by an adapter:
 *   requestDevice (adapter filters, or acceptAllDevices + optionalServices for unknown devices)
 *   → subscribe to the measurement characteristic → hand payloads to the service for parsing;
 *   battery level from the standard Battery Service when present; optional remote trigger.
 * Drops are reported to the service, which runs the reconnect backoff and calls reconnect().
 */

import type { ConnectionHost, LaserConnection } from './Connection';
import type { AdapterIO, LaserMeterAdapter } from '../types';
import { toBytes } from '../hex';
import { BATTERY_LEVEL_CHAR, BATTERY_SERVICE } from '../adapters/configAdapter';
import {
  writeCharacteristic,
  type BluetoothLike,
  type BTCharacteristic,
  type BTDevice,
  type BTRequestDeviceOptions,
  type BTServer,
} from './webBluetooth';

export interface BleConnectionOptions {
  /** A device obtained earlier (getDevices) — connects without showing the chooser. */
  device?: BTDevice;
  /** Show every nearby device in the chooser instead of filtering by the adapter. */
  showAllDevices?: boolean;
  /** How long to wait for a remembered device to advertise before giving up. */
  advertisementTimeoutMs?: number;
}

export const buildRequestOptions = (
  adapter: LaserMeterAdapter,
  showAllDevices = false
): BTRequestDeviceOptions => {
  const ble = adapter.ble;
  if (!ble) {
    throw new Error(`${adapter.displayName} has no Bluetooth settings`);
  }
  const optionalServices = Array.from(
    new Set([...(ble.serviceUuid ? [ble.serviceUuid] : []), BATTERY_SERVICE, ...ble.optionalServices])
  );
  if (showAllDevices || ble.acceptAllDevices || !ble.filters.length) {
    return { acceptAllDevices: true, optionalServices };
  }
  return { filters: ble.filters, optionalServices };
};

export class BleConnection implements LaserConnection {
  readonly mode = 'ble' as const;
  private readonly host: ConnectionHost;
  private readonly adapter: LaserMeterAdapter;
  private readonly bluetooth: BluetoothLike;
  private readonly opts: BleConnectionOptions;

  private device: BTDevice | null = null;
  private measurementChar: BTCharacteristic | null = null;
  private batteryChar: BTCharacteristic | null = null;
  private triggerChar: BTCharacteristic | null = null;
  private closedByUser = false;

  constructor(
    host: ConnectionHost,
    adapter: LaserMeterAdapter,
    bluetooth: BluetoothLike,
    opts: BleConnectionOptions = {}
  ) {
    this.host = host;
    this.adapter = adapter;
    this.bluetooth = bluetooth;
    this.opts = opts;
  }

  get deviceId(): string | null {
    return this.device?.id ?? null;
  }

  get deviceName(): string | null {
    return this.device?.name ?? null;
  }

  async connect(): Promise<void> {
    this.closedByUser = false;
    this.host.update({ status: 'connecting', lastError: null });
    const device =
      this.opts.device ??
      (await this.bluetooth.requestDevice(buildRequestOptions(this.adapter, this.opts.showAllDevices)));
    this.device = device;
    device.addEventListener('gattserverdisconnected', this.onDisconnected);
    this.host.log(`Selected ${device.name ?? device.id}`);

    try {
      await this.openGatt(!!this.opts.device);
    } catch (e) {
      device.removeEventListener('gattserverdisconnected', this.onDisconnected);
      try {
        device.gatt?.disconnect();
      } catch {
        // ignore
      }
      throw e;
    }
    this.host.update({
      status: 'connected',
      deviceId: device.id,
      deviceName: device.name ?? null,
      adapterId: this.adapter.id,
      canTrigger: !!this.triggerChar,
    });
  }

  async disconnect(): Promise<void> {
    this.closedByUser = true;
    const device = this.device;
    this.detachCharacteristics();
    if (device) {
      device.removeEventListener('gattserverdisconnected', this.onDisconnected);
      try {
        device.gatt?.disconnect();
      } catch {
        // Already gone.
      }
    }
    this.host.update({ status: 'disconnected', battery: null, canTrigger: false });
  }

  async reconnect(): Promise<boolean> {
    if (!this.device || this.closedByUser) {
      return false;
    }
    try {
      await this.openGatt(false);
      this.host.update({ canTrigger: !!this.triggerChar });
      return true;
    } catch (e) {
      this.host.log(`Reconnect failed: ${e instanceof Error ? e.message : String(e)}`, 'warn');
      return false;
    }
  }

  async trigger(): Promise<void> {
    const payload = this.adapter.ble?.triggerPayload;
    if (!this.triggerChar || !payload) {
      throw new Error('This meter has no remote trigger configured');
    }
    await writeCharacteristic(this.triggerChar, payload);
  }

  // ------------------------------------------------------------------ internals

  private readonly onDisconnected = () => {
    this.detachCharacteristics();
    this.host.update({ battery: null, canTrigger: false });
    if (!this.closedByUser) {
      this.host.connectionLost(`${this.device?.name ?? 'Meter'} disconnected`);
    }
  };

  private readonly onMeasurement = (event: Event) => {
    const value = (event.target as BTCharacteristic).value;
    if (value) {
      this.host.ingestPacket(toBytes(value), 'laser_ble');
    }
  };

  private readonly onBattery = (event: Event) => {
    const value = (event.target as BTCharacteristic).value;
    if (value && value.byteLength) {
      this.host.update({ battery: Math.min(100, value.getUint8(0)) });
    }
  };

  private async gattConnect(allowAdvertisementWait: boolean): Promise<BTServer> {
    const gatt = this.device?.gatt;
    if (!gatt) {
      throw new Error('This device has no GATT server');
    }
    try {
      return await gatt.connect();
    } catch (e) {
      // Devices from getDevices() sometimes need to be seen advertising before connect works.
      if (!allowAdvertisementWait || !this.device?.watchAdvertisements) {
        throw e;
      }
      await this.waitForAdvertisement();
      return gatt.connect();
    }
  }

  private waitForAdvertisement(): Promise<void> {
    const device = this.device as BTDevice;
    const timeoutMs = this.opts.advertisementTimeoutMs ?? 8000;
    return new Promise((resolve, reject) => {
      const abort = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const done = (ok: boolean) => {
        clearTimeout(timer);
        device.removeEventListener('advertisementreceived', onAdv);
        abort?.abort();
        if (ok) {
          resolve();
        } else {
          reject(new Error('Meter not found nearby. Switch it on and try again.'));
        }
      };
      const onAdv = () => done(true);
      const timer = setTimeout(() => done(false), timeoutMs);
      device.addEventListener('advertisementreceived', onAdv);
      device.watchAdvertisements?.({ signal: abort?.signal }).catch(() => done(false));
    });
  }

  private async openGatt(allowAdvertisementWait: boolean): Promise<void> {
    const ble = this.adapter.ble;
    if (!ble?.serviceUuid || !ble.measurementCharUuid) {
      throw new Error(`${this.adapter.displayName} does not define a measurement characteristic`);
    }
    this.detachCharacteristics();
    const server = await this.gattConnect(allowAdvertisementWait);

    let service;
    try {
      service = await server.getPrimaryService(ble.serviceUuid);
    } catch {
      throw new Error(
        `The meter does not offer the expected service (${ble.serviceUuid}). Is the right model selected?`
      );
    }
    const ch = await service.getCharacteristic(ble.measurementCharUuid);
    ch.addEventListener('characteristicvaluechanged', this.onMeasurement);
    await ch.startNotifications();
    this.measurementChar = ch;

    this.triggerChar = null;
    if (ble.triggerCharUuid && ble.triggerPayload) {
      try {
        this.triggerChar = await service.getCharacteristic(ble.triggerCharUuid);
      } catch {
        this.host.log('Trigger characteristic not found; remote trigger disabled', 'warn');
      }
    }

    await this.readBattery(server);

    if (this.adapter.setup) {
      const io: AdapterIO = {
        write: async (svc, char, bytes) =>
          writeCharacteristic(await (await server.getPrimaryService(svc)).getCharacteristic(char), bytes),
        read: async (svc, char) =>
          toBytes(await (await (await server.getPrimaryService(svc)).getCharacteristic(char)).readValue()),
      };
      await this.adapter.setup(io);
    }
  }

  private async readBattery(server: BTServer): Promise<void> {
    try {
      const svc = await server.getPrimaryService(BATTERY_SERVICE);
      const ch = await svc.getCharacteristic(BATTERY_LEVEL_CHAR);
      const v = await ch.readValue();
      this.host.update({ battery: v.byteLength ? Math.min(100, v.getUint8(0)) : null });
      if (ch.properties.notify) {
        ch.addEventListener('characteristicvaluechanged', this.onBattery);
        await ch.startNotifications().catch(() => undefined);
        this.batteryChar = ch;
      }
    } catch {
      // Many meters have no battery service; that's fine.
      this.host.update({ battery: null });
    }
  }

  private detachCharacteristics(): void {
    if (this.measurementChar) {
      this.measurementChar.removeEventListener('characteristicvaluechanged', this.onMeasurement);
      this.measurementChar.stopNotifications().catch(() => undefined);
      this.measurementChar = null;
    }
    if (this.batteryChar) {
      this.batteryChar.removeEventListener('characteristicvaluechanged', this.onBattery);
      this.batteryChar = null;
    }
  }
}
