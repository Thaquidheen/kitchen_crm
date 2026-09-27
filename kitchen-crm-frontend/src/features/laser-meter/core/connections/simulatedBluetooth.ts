/**
 * A simulated Bluetooth stack with one meter, for demoing and developing the Device Lab without
 * hardware (dev tools only). Its measurement packets use the simulated adapter's format, so the
 * lab's decoding probe can be exercised end to end: take a reading, mark it, save an adapter.
 */

import { encodeMockPacket } from '../adapters/builtins';
import { asciiToBytes } from '../hex';
import type {
  BluetoothLike,
  BTCharacteristic,
  BTCharacteristicProperties,
  BTDevice,
  BTServer,
  BTService,
} from './webBluetooth';

const SIG = (short: string) => `0000${short}-0000-1000-8000-00805f9b34fb`;

class SimChar extends EventTarget implements BTCharacteristic {
  value: DataView | null = null;
  service!: BTService;
  private notifying = false;
  readonly uuid: string;
  readonly properties: BTCharacteristicProperties;
  private readonly readData: () => Uint8Array;
  private readonly onWrite?: (bytes: Uint8Array) => void;

  constructor(
    uuid: string,
    props: Partial<BTCharacteristicProperties>,
    readData: () => Uint8Array = () => new Uint8Array(),
    onWrite?: (bytes: Uint8Array) => void
  ) {
    super();
    this.uuid = uuid;
    this.properties = {
      broadcast: false,
      read: false,
      write: false,
      writeWithoutResponse: false,
      notify: false,
      indicate: false,
      authenticatedSignedWrites: false,
      ...props,
    };
    this.readData = readData;
    this.onWrite = onWrite;
  }

  async readValue() {
    const b = this.readData();
    this.value = new DataView(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer);
    return this.value;
  }
  async writeValueWithResponse(v: BufferSource) {
    const bytes = v instanceof ArrayBuffer ? new Uint8Array(v) : new Uint8Array((v as ArrayBufferView).buffer);
    this.onWrite?.(bytes);
  }
  async startNotifications() {
    this.notifying = true;
    return this;
  }
  async stopNotifications() {
    this.notifying = false;
    return this;
  }
  push(bytes: Uint8Array) {
    if (!this.notifying) {
      return;
    }
    this.value = new DataView(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
    this.dispatchEvent(new Event('characteristicvaluechanged'));
  }
}

class SimService implements BTService {
  isPrimary = true;
  readonly uuid: string;
  private readonly chars: SimChar[];
  constructor(uuid: string, chars: SimChar[]) {
    this.uuid = uuid;
    this.chars = chars;
    chars.forEach((c) => (c.service = this));
  }
  async getCharacteristic(uuid: string) {
    const c = this.chars.find((x) => x.uuid === uuid);
    if (!c) {
      throw new Error(`Characteristic ${uuid} not found`);
    }
    return c;
  }
  async getCharacteristics() {
    return this.chars;
  }
}

export interface SimulatedMeter {
  bluetooth: BluetoothLike;
  /** Send a reading as the meter would (as if its measure button was pressed). */
  emit(mm: number): void;
}

export const createSimulatedBluetooth = (): SimulatedMeter => {
  const measurement = new SimChar(SIG('fff1'), { notify: true });
  const emit = (mm: number) => measurement.push(encodeMockPacket(mm));
  const trigger = new SimChar(SIG('fff2'), { write: true }, undefined, () =>
    setTimeout(() => emit(900 + Math.round(Math.random() * 3000)), 120)
  );
  const services = [
    new SimService(SIG('fff0'), [measurement, trigger]),
    new SimService('battery_service', [new SimChar('battery_level', { read: true }, () => new Uint8Array([91]))]),
    new SimService('device_information', [
      new SimChar(SIG('2a24'), { read: true }, () => asciiToBytes('SIM-LAB')),
    ]),
  ];
  const device = new EventTarget() as BTDevice;
  Object.assign(device, { id: 'simulated-lab-meter', name: 'SIM-LAB-01' });
  const gatt: BTServer = {
    connected: false,
    device,
    async connect() {
      gatt.connected = true;
      return gatt;
    },
    disconnect() {
      gatt.connected = false;
    },
    async getPrimaryService(uuid: string) {
      const s = services.find((x) => x.uuid === uuid);
      if (!s) {
        throw new Error(`Service ${uuid} not found`);
      }
      return s;
    },
    async getPrimaryServices() {
      return services;
    },
  };
  device.gatt = gatt;
  return {
    emit,
    bluetooth: {
      requestDevice: async () => device,
      getDevices: async () => [device],
    },
  };
};
