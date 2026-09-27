/**
 * Device Lab session: a GATT explorer for unknown meters. Connects to any device, lists every
 * service/characteristic the browser lets us see (only services named in optionalServices are
 * visible with acceptAllDevices), subscribes/reads/writes, and logs every packet with a
 * timestamp in hex + ASCII. Readings can be "marked" with the distance shown on the meter's
 * screen to feed the decoding probe. Framework-agnostic; the React screen renders its state.
 */

import { Emitter } from '../emitter';
import { bytesToHex, bytesToPrintable, hexToBytes, normalizeUuid, toBytes } from '../hex';
import { parseHidInput } from '../hidInputParser';
import { failureReason } from '../types';
import {
  writeCharacteristic,
  type BluetoothLike,
  type BTCharacteristic,
  type BTDevice,
} from './webBluetooth';

export interface LabCharacteristic {
  key: string;
  serviceUuid: string;
  uuid: string;
  properties: { read: boolean; write: boolean; writeWithoutResponse: boolean; notify: boolean; indicate: boolean };
  subscribed: boolean;
}

export interface LabService {
  uuid: string;
  characteristics: LabCharacteristic[];
}

export type LabEntryKind = 'notify' | 'read' | 'write' | 'info' | 'error';

export interface LabEntry {
  id: number;
  at: number;
  kind: LabEntryKind;
  serviceUuid: string | null;
  charUuid: string | null;
  hex: string;
  ascii: string;
  bytes: number[];
  message?: string;
}

export interface LabMark {
  entryId: number;
  text: string;
  targetMm: number;
}

export interface LabState {
  status: 'idle' | 'connecting' | 'connected' | 'disconnected';
  deviceId: string | null;
  deviceName: string | null;
  services: LabService[];
  entries: LabEntry[];
  marks: LabMark[];
  error: string | null;
}

const MAX_ENTRIES = 2000;
const charKey = (svc: string, ch: string) => `${svc}|${ch}`;

export class LabSession {
  private state: LabState = {
    status: 'idle',
    deviceId: null,
    deviceName: null,
    services: [],
    entries: [],
    marks: [],
    error: null,
  };
  private readonly emitter = new Emitter<{ change: LabState }>();
  private device: BTDevice | null = null;
  private handles = new Map<string, BTCharacteristic>();
  private listeners = new Map<string, (e: Event) => void>();
  private seq = 0;
  private readonly now: () => number;

  constructor(opts: { now?: () => number } = {}) {
    this.now = opts.now ?? (() => Date.now());
  }

  getState(): LabState {
    return this.state;
  }

  subscribe(fn: (s: LabState) => void): () => void {
    return this.emitter.on('change', fn);
  }

  private set(patch: Partial<LabState>): void {
    this.state = { ...this.state, ...patch };
    this.emitter.emit('change', this.state);
  }

  private log(kind: LabEntryKind, svc: string | null, ch: string | null, bytes: Uint8Array, message?: string): LabEntry {
    const entry: LabEntry = {
      id: ++this.seq,
      at: this.now(),
      kind,
      serviceUuid: svc,
      charUuid: ch,
      hex: bytesToHex(bytes),
      ascii: bytesToPrintable(bytes),
      bytes: Array.from(bytes),
      message,
    };
    this.set({ entries: [...this.state.entries.slice(-(MAX_ENTRIES - 1)), entry] });
    return entry;
  }

  private info(message: string, kind: 'info' | 'error' = 'info'): void {
    this.log(kind, null, null, new Uint8Array(), message);
  }

  /** Must be called from a click (requestDevice needs user activation). */
  async connect(bt: BluetoothLike, opts: { optionalServices: string[]; namePrefix?: string }): Promise<boolean> {
    await this.disconnect();
    this.set({ status: 'connecting', error: null, services: [] });
    const optionalServices = Array.from(new Set(opts.optionalServices.map(normalizeUuid)));
    let device: BTDevice;
    try {
      device = await bt.requestDevice(
        opts.namePrefix?.trim()
          ? { filters: [{ namePrefix: opts.namePrefix.trim() }], optionalServices }
          : { acceptAllDevices: true, optionalServices }
      );
    } catch (e) {
      const cancelled = e instanceof Error && e.name === 'NotFoundError';
      this.set({ status: 'idle', error: cancelled ? null : errorText(e) });
      return false;
    }
    this.device = device;
    device.addEventListener('gattserverdisconnected', this.onDisconnected);
    this.set({ deviceId: device.id, deviceName: device.name ?? null });
    try {
      await device.gatt?.connect();
      this.set({ status: 'connected' });
      this.info(`Connected to ${device.name ?? device.id}`);
      await this.discover();
      return true;
    } catch (e) {
      this.set({ status: 'disconnected', error: errorText(e) });
      this.info(`Connect failed: ${errorText(e)}`, 'error');
      return false;
    }
  }

  async discover(): Promise<void> {
    const gatt = this.device?.gatt;
    if (!gatt?.connected) {
      return;
    }
    const services: LabService[] = [];
    let primary;
    try {
      primary = await gatt.getPrimaryServices();
    } catch (e) {
      this.info(
        `No services visible (${errorText(e)}). Add the meter's service UUIDs to "Services to request" and reconnect.`,
        'error'
      );
      this.set({ services: [] });
      return;
    }
    for (const svc of primary) {
      const chars: LabCharacteristic[] = [];
      try {
        for (const ch of await svc.getCharacteristics()) {
          const key = charKey(svc.uuid, ch.uuid);
          this.handles.set(key, ch);
          chars.push({
            key,
            serviceUuid: svc.uuid,
            uuid: ch.uuid,
            properties: {
              read: !!ch.properties.read,
              write: !!ch.properties.write,
              writeWithoutResponse: !!ch.properties.writeWithoutResponse,
              notify: !!ch.properties.notify,
              indicate: !!ch.properties.indicate,
            },
            subscribed: false,
          });
        }
      } catch (e) {
        this.info(`Could not list characteristics of ${svc.uuid}: ${errorText(e)}`, 'error');
      }
      services.push({ uuid: svc.uuid, characteristics: chars });
    }
    this.set({ services });
    this.info(`Found ${services.length} service(s), ${services.reduce((n, s) => n + s.characteristics.length, 0)} characteristic(s)`);
  }

  private patchChar(key: string, patch: Partial<LabCharacteristic>): void {
    this.set({
      services: this.state.services.map((s) => ({
        ...s,
        characteristics: s.characteristics.map((c) => (c.key === key ? { ...c, ...patch } : c)),
      })),
    });
  }

  private findChar(key: string): LabCharacteristic | undefined {
    for (const s of this.state.services) {
      const c = s.characteristics.find((x) => x.key === key);
      if (c) {
        return c;
      }
    }
    return undefined;
  }

  async toggleNotifications(key: string): Promise<void> {
    const ch = this.handles.get(key);
    const meta = this.findChar(key);
    if (!ch || !meta) {
      return;
    }
    try {
      if (meta.subscribed) {
        const l = this.listeners.get(key);
        if (l) {
          ch.removeEventListener('characteristicvaluechanged', l);
        }
        this.listeners.delete(key);
        await ch.stopNotifications().catch(() => undefined);
        this.patchChar(key, { subscribed: false });
      } else {
        const l = (e: Event) => {
          const v = (e.target as BTCharacteristic).value;
          if (v) {
            this.log('notify', meta.serviceUuid, meta.uuid, toBytes(v));
          }
        };
        ch.addEventListener('characteristicvaluechanged', l);
        this.listeners.set(key, l);
        await ch.startNotifications();
        this.patchChar(key, { subscribed: true });
        this.info(`Subscribed to ${meta.uuid}`);
      }
    } catch (e) {
      this.info(`Subscribe failed on ${meta.uuid}: ${errorText(e)}`, 'error');
    }
  }

  async read(key: string): Promise<void> {
    const ch = this.handles.get(key);
    const meta = this.findChar(key);
    if (!ch || !meta) {
      return;
    }
    try {
      this.log('read', meta.serviceUuid, meta.uuid, toBytes(await ch.readValue()));
    } catch (e) {
      this.info(`Read failed on ${meta.uuid}: ${errorText(e)}`, 'error');
    }
  }

  async write(key: string, hex: string): Promise<void> {
    const ch = this.handles.get(key);
    const meta = this.findChar(key);
    if (!ch || !meta) {
      return;
    }
    try {
      const bytes = hexToBytes(hex);
      await writeCharacteristic(ch, bytes);
      this.log('write', meta.serviceUuid, meta.uuid, bytes);
    } catch (e) {
      this.info(`Write failed on ${meta.uuid}: ${errorText(e)}`, 'error');
    }
  }

  /** Attach the distance shown on the meter to a captured packet. */
  mark(entryId: number, text: string): { ok: boolean; reason?: string } {
    const r = parseHidInput(text, { defaultUnit: 'auto', minMm: 1, maxMm: 1_000_000 });
    if (!r.ok) {
      return { ok: false, reason: failureReason(r) ?? 'Invalid distance' };
    }
    const marks = this.state.marks.filter((m) => m.entryId !== entryId);
    marks.push({ entryId, text: text.trim(), targetMm: r.valueMm });
    this.set({ marks });
    return { ok: true };
  }

  unmark(entryId: number): void {
    this.set({ marks: this.state.marks.filter((m) => m.entryId !== entryId) });
  }

  clearLog(): void {
    this.set({ entries: [], marks: [] });
  }

  async disconnect(): Promise<void> {
    const device = this.device;
    for (const [key, l] of this.listeners) {
      this.handles.get(key)?.removeEventListener('characteristicvaluechanged', l);
    }
    this.listeners.clear();
    this.handles.clear();
    this.device = null;
    if (device) {
      device.removeEventListener('gattserverdisconnected', this.onDisconnected);
      try {
        device.gatt?.disconnect();
      } catch {
        // ignore
      }
      this.info('Disconnected');
    }
    this.set({
      status: device ? 'disconnected' : this.state.status === 'connecting' ? 'idle' : this.state.status,
      services: this.state.services.map((s) => ({
        ...s,
        characteristics: s.characteristics.map((c) => ({ ...c, subscribed: false })),
      })),
    });
  }

  private readonly onDisconnected = () => {
    this.listeners.clear();
    this.set({
      status: 'disconnected',
      services: this.state.services.map((s) => ({
        ...s,
        characteristics: s.characteristics.map((c) => ({ ...c, subscribed: false })),
      })),
    });
    this.info('Device disconnected', 'error');
  };

  /** Everything a developer needs to work out a protocol offline. */
  exportLog(extra: Record<string, unknown> = {}) {
    const s = this.state;
    return {
      format: 'laser-meter-device-lab/v1',
      exportedAt: new Date(this.now()).toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      device: { id: s.deviceId, name: s.deviceName },
      services: s.services.map((svc) => ({
        uuid: svc.uuid,
        characteristics: svc.characteristics.map((c) => ({ uuid: c.uuid, properties: c.properties })),
      })),
      entries: s.entries.map((e) => ({
        id: e.id,
        at: new Date(e.at).toISOString(),
        kind: e.kind,
        service: e.serviceUuid,
        characteristic: e.charUuid,
        hex: e.hex,
        ascii: e.ascii,
        ...(e.message ? { message: e.message } : {}),
      })),
      marks: s.marks,
      ...extra,
    };
  }
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));
