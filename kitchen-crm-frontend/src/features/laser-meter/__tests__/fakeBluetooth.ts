/** In-memory Web Bluetooth fakes: enough GATT to drive BleConnection and the Device Lab. */

import type {
  BluetoothLike,
  BTCharacteristic,
  BTCharacteristicProperties,
  BTDevice,
  BTRequestDeviceOptions,
  BTServer,
  BTService,
} from '../core/connections/webBluetooth';

const props = (p: Partial<BTCharacteristicProperties>): BTCharacteristicProperties => ({
  broadcast: false,
  read: false,
  writeWithoutResponse: false,
  write: false,
  notify: false,
  indicate: false,
  authenticatedSignedWrites: false,
  ...p,
});

export class FakeCharacteristic extends EventTarget implements BTCharacteristic {
  value: DataView | null = null;
  notifying = false;
  writes: Uint8Array[] = [];
  service!: BTService;
  properties: BTCharacteristicProperties;
  uuid: string;
  readData: Uint8Array;

  constructor(uuid: string, p: Partial<BTCharacteristicProperties>, readData = new Uint8Array()) {
    super();
    this.uuid = uuid;
    this.properties = props(p);
    this.readData = readData;
  }

  async readValue() {
    return new DataView(this.readData.buffer.slice(0));
  }
  async writeValueWithResponse(v: BufferSource) {
    this.writes.push(new Uint8Array(v as ArrayBuffer));
  }
  async startNotifications() {
    this.notifying = true;
    return this;
  }
  async stopNotifications() {
    this.notifying = false;
    return this;
  }
  /** Device pushes a notification. */
  notify(bytes: Uint8Array) {
    if (!this.notifying) {
      return;
    }
    this.value = new DataView(bytes.buffer.slice(0));
    this.dispatchEvent(new Event('characteristicvaluechanged'));
  }
}

export class FakeService implements BTService {
  uuid: string;
  isPrimary = true;
  chars: FakeCharacteristic[];
  constructor(uuid: string, chars: FakeCharacteristic[]) {
    this.uuid = uuid;
    this.chars = chars;
    chars.forEach((c) => (c.service = this));
  }
  async getCharacteristic(uuid: string) {
    const c = this.chars.find((x) => x.uuid === uuid);
    if (!c) {
      throw new Error(`No characteristic ${uuid}`);
    }
    return c;
  }
  async getCharacteristics() {
    return this.chars;
  }
}

export class FakeDevice extends EventTarget implements BTDevice {
  id: string;
  name: string;
  gatt: BTServer;
  inRange = true;
  connectCalls = 0;
  services: FakeService[];

  constructor(id: string, name: string, services: FakeService[]) {
    super();
    this.id = id;
    this.name = name;
    this.services = services;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const device = this;
    this.gatt = {
      connected: false,
      device,
      async connect() {
        device.connectCalls += 1;
        if (!device.inRange) {
          throw new Error('NetworkError: device out of range');
        }
        this.connected = true;
        return this;
      },
      disconnect() {
        this.connected = false;
      },
      async getPrimaryService(uuid: string) {
        const s = device.services.find((x) => x.uuid === uuid);
        if (!s) {
          throw new Error(`No service ${uuid}`);
        }
        return s;
      },
      async getPrimaryServices() {
        return device.services;
      },
    };
  }

  /** Simulate the link dropping. */
  drop() {
    this.gatt.connected = false;
    this.dispatchEvent(new Event('gattserverdisconnected'));
  }
}

export class FakeBluetooth implements BluetoothLike {
  lastOptions: BTRequestDeviceOptions | null = null;
  cancel = false;
  known: FakeDevice[] = [];
  device: FakeDevice;
  constructor(device: FakeDevice) {
    this.device = device;
  }
  async requestDevice(options: BTRequestDeviceOptions) {
    this.lastOptions = options;
    if (this.cancel) {
      const e = new Error('User cancelled the requestDevice() chooser.');
      e.name = 'NotFoundError';
      throw e;
    }
    this.known = [this.device];
    return this.device;
  }
  async getDevices() {
    return this.known;
  }
}
