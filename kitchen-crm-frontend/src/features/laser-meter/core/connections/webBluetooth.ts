/**
 * The slice of the Web Bluetooth API this module uses, typed locally (the DOM lib doesn't ship
 * it) so it can also be faked in tests, plus feature detection.
 */

export interface BTCharacteristicProperties {
  broadcast: boolean;
  read: boolean;
  writeWithoutResponse: boolean;
  write: boolean;
  notify: boolean;
  indicate: boolean;
  authenticatedSignedWrites: boolean;
  reliableWrite?: boolean;
  writableAuxiliaries?: boolean;
}

export interface BTCharacteristic extends EventTarget {
  uuid: string;
  service: BTService;
  properties: BTCharacteristicProperties;
  value?: DataView | null;
  readValue(): Promise<DataView>;
  writeValue?(value: BufferSource): Promise<void>;
  writeValueWithResponse?(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BTCharacteristic>;
  stopNotifications(): Promise<BTCharacteristic>;
}

export interface BTService {
  uuid: string;
  isPrimary?: boolean;
  getCharacteristic(uuid: string): Promise<BTCharacteristic>;
  getCharacteristics(uuid?: string): Promise<BTCharacteristic[]>;
}

export interface BTServer {
  connected: boolean;
  device: BTDevice;
  connect(): Promise<BTServer>;
  disconnect(): void;
  getPrimaryService(uuid: string): Promise<BTService>;
  getPrimaryServices(uuid?: string): Promise<BTService[]>;
}

export interface BTDevice extends EventTarget {
  id: string;
  name?: string | null;
  gatt?: BTServer;
  watchAdvertisements?(options?: { signal?: AbortSignal }): Promise<void>;
  forget?(): Promise<void>;
}

export interface BTRequestDeviceOptions {
  filters?: { name?: string; namePrefix?: string; services?: string[] }[];
  acceptAllDevices?: boolean;
  optionalServices?: string[];
}

export interface BluetoothLike {
  requestDevice(options: BTRequestDeviceOptions): Promise<BTDevice>;
  getDevices?(): Promise<BTDevice[]>;
  getAvailability?(): Promise<boolean>;
}

/** Characteristic value events carry the characteristic as target. */
export type CharacteristicValueChangedEvent = Event & { target: BTCharacteristic };

export const getBluetooth = (): BluetoothLike | null => {
  if (typeof navigator === 'undefined') {
    return null;
  }
  return (navigator as Navigator & { bluetooth?: BluetoothLike }).bluetooth ?? null;
};

export type BleSupportReason = 'ok' | 'insecure' | 'no-api';

export interface BleSupport {
  supported: boolean;
  reason: BleSupportReason;
  /** Short, user-facing explanation when unsupported. */
  message: string;
}

const isAppleMobile = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export const getBleSupport = (): BleSupport => {
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return {
      supported: false,
      reason: 'insecure',
      message:
        'Bluetooth connection needs a secure (https) page. Keyboard-meter mode and manual entry still work.',
    };
  }
  if (!getBluetooth()) {
    return {
      supported: false,
      reason: 'no-api',
      message: isAppleMobile()
        ? 'This browser can’t connect to Bluetooth devices directly (iPad and iPhone browsers don’t support it). Pair the meter as a Bluetooth keyboard and use Keyboard-meter mode, or enter values manually.'
        : 'This browser can’t connect to Bluetooth devices directly. Use Chrome or Edge, pair the meter as a keyboard and use Keyboard-meter mode, or enter values manually.',
    };
  }
  return { supported: true, reason: 'ok', message: '' };
};

/** Write using whichever write method the characteristic and browser support. */
export const writeCharacteristic = async (ch: BTCharacteristic, bytes: Uint8Array): Promise<void> => {
  const data = bytes as unknown as BufferSource;
  if (ch.properties.write && ch.writeValueWithResponse) {
    return ch.writeValueWithResponse(data);
  }
  if (ch.properties.writeWithoutResponse && ch.writeValueWithoutResponse) {
    return ch.writeValueWithoutResponse(data);
  }
  if (ch.writeValue) {
    return ch.writeValue(data);
  }
  throw new Error('Characteristic is not writable');
};
