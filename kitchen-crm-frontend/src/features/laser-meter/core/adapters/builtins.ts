/**
 * Adapters that ship with the app:
 *  - generic: "Generic / Unknown device" — connects to anything (acceptAllDevices) for the
 *    Device Lab. It cannot decode readings; that is what the lab is for.
 *  - mock: the simulated meter used in dev mode. Deliberately a *config* adapter so the dev
 *    flow exercises exactly the same parse path as a real admin-configured device.
 */

import type { LaserAdapterConfig, LaserMeterAdapter } from '../types';
import { createConfigAdapter, BATTERY_SERVICE } from './configAdapter';
import { normalizeUuid } from '../hex';

export const GENERIC_ADAPTER_ID = 'generic';
export const MOCK_ADAPTER_ID = 'mock';

/** Services the lab asks permission for by default when scanning unknown devices. */
export const DEFAULT_LAB_OPTIONAL_SERVICES = [
  BATTERY_SERVICE,
  'device_information',
  // Common vendor-specific / serial-over-BLE services seen on measuring tools.
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffb0-0000-1000-8000-00805f9b34fb',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
];

export const createGenericAdapter = (
  optionalServices: string[] = DEFAULT_LAB_OPTIONAL_SERVICES
): LaserMeterAdapter => ({
  id: GENERIC_ADAPTER_ID,
  displayName: 'Generic / Unknown device',
  kind: 'builtin',
  active: true,
  ble: {
    filters: [],
    acceptAllDevices: true,
    optionalServices: Array.from(new Set(optionalServices.map(normalizeUuid))),
    serviceUuid: '',
    measurementCharUuid: '',
  },
  minMm: 0,
  maxMm: Number.MAX_SAFE_INTEGER,
  parse: () => ({
    ok: false,
    reason: 'The generic adapter cannot decode readings. Use the Device Lab to create an adapter.',
  }),
});

/** Packet layout of the simulated meter: 0xA5 header, uint32 LE millimetres, xor checksum. */
export const MOCK_ADAPTER_CONFIG: LaserAdapterConfig = {
  id: MOCK_ADAPTER_ID,
  displayName: 'Simulated meter (dev)',
  active: true,
  bleFilters: [{ namePrefix: 'SIM-' }],
  serviceUuid: '0000fff0-0000-1000-8000-00805f9b34fb',
  measurementCharUuid: '0000fff1-0000-1000-8000-00805f9b34fb',
  triggerCharUuid: '0000fff2-0000-1000-8000-00805f9b34fb',
  triggerPayloadHex: '01',
  parser: {
    type: 'binary',
    offset: 1,
    length: 4,
    format: 'uint32',
    littleEndian: true,
    sourceUnit: 'mm',
    scale: 1,
  },
  minMm: 50,
  maxMm: 15000,
};

export const encodeMockPacket = (mm: number): Uint8Array => {
  const bytes = new Uint8Array(6);
  const view = new DataView(bytes.buffer);
  bytes[0] = 0xa5;
  view.setUint32(1, Math.max(0, Math.round(mm)), true);
  bytes[5] = bytes.slice(0, 5).reduce((a, b) => a ^ b, 0);
  return bytes;
};

export const createMockAdapter = (): LaserMeterAdapter => ({
  ...createConfigAdapter(MOCK_ADAPTER_CONFIG),
  kind: 'builtin',
});
