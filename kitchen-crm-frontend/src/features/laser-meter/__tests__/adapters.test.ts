import { describe, expect, it } from 'vitest';
import { validateAdapterConfig } from '../core/adapterValidation';
import { AdapterRegistry } from '../core/adapters/registry';
import { createConfigAdapter } from '../core/adapters/configAdapter';
import { encodeMockPacket, MOCK_ADAPTER_CONFIG, GENERIC_ADAPTER_ID } from '../core/adapters/builtins';
import type { LaserAdapterConfig } from '../core/types';
import { MemoryStorage } from './fakeTimers';

const cfg = (over: Partial<LaserAdapterConfig> = {}): LaserAdapterConfig => ({
  ...MOCK_ADAPTER_CONFIG,
  id: 'test-meter',
  displayName: 'Test meter',
  ...over,
});

describe('validateAdapterConfig', () => {
  it('accepts a good config', () => {
    expect(validateAdapterConfig(cfg())).toEqual([]);
  });

  it('flags reserved ids, bad uuids, hex and ranges', () => {
    const errors = validateAdapterConfig(
      cfg({
        id: 'mock',
        serviceUuid: 'not a uuid!',
        triggerPayloadHex: 'xyz',
        minMm: 100,
        maxMm: 50,
      })
    );
    expect(errors.join('\n')).toMatch(/reserved/);
    expect(errors.join('\n')).toMatch(/Service UUID/);
    expect(errors.join('\n')).toMatch(/Trigger payload/);
    expect(errors.join('\n')).toMatch(/Range/);
  });

  it('checks parser details', () => {
    expect(
      validateAdapterConfig(
        cfg({ parser: { type: 'ascii', regex: '(', sourceUnit: 'm', scale: 1 } })
      ).join()
    ).toMatch(/regex/);
    expect(
      validateAdapterConfig(
        cfg({
          parser: { type: 'binary', offset: -1, format: 'uint16', littleEndian: true, sourceUnit: 'mm', scale: 1, length: 4 },
        })
      ).length
    ).toBe(2);
  });
});

describe('config adapter', () => {
  it('parses the mock packet and exposes BLE details', () => {
    const a = createConfigAdapter(cfg());
    expect(a.parse(encodeMockPacket(2345))).toEqual({ ok: true, valueMm: 2345 });
    expect(a.ble?.optionalServices).toContain('battery_service');
    expect(a.ble?.triggerPayload).toEqual(new Uint8Array([1]));
  });

  it('disables the trigger when the payload is invalid instead of failing', () => {
    const a = createConfigAdapter(cfg({ triggerPayloadHex: 'zz' }));
    expect(a.ble?.triggerCharUuid).toBeUndefined();
  });
});

describe('AdapterRegistry', () => {
  it('lists active adapters, caches configs, and lets code adapters win', () => {
    const storage = new MemoryStorage();
    const r = new AdapterRegistry(storage);
    r.setConfigs([cfg(), cfg({ id: 'off', displayName: 'Off', active: false })]);
    expect(r.listSelectable().map((a) => a.id)).toEqual(['test-meter']);
    expect(r.listSelectable({ includeMock: true }).map((a) => a.id)).toContain('mock');
    expect(r.get(GENERIC_ADAPTER_ID)?.ble?.acceptAllDevices).toBe(true);

    // A new registry on the same storage restores the offline cache.
    const r2 = new AdapterRegistry(storage);
    expect(r2.get('test-meter')?.displayName).toBe('Test meter');

    const base = r2.get('test-meter');
    if (!base) {
      throw new Error('cached adapter missing');
    }
    r2.registerCode({
      ...base,
      displayName: 'Code version',
      parse: () => ({ ok: true, valueMm: 1 }),
    });
    expect(r2.get('test-meter')?.kind).toBe('code');
  });

  it('never lets a stored config shadow a built-in', () => {
    const r = new AdapterRegistry(new MemoryStorage());
    r.setConfigs([cfg({ id: 'generic', displayName: 'Hijack' })]);
    expect(r.get('generic')?.displayName).toBe('Generic / Unknown device');
  });
});
