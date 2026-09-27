import { beforeEach, describe, expect, it } from 'vitest';
import { LaserMeterService } from '../core/LaserMeterService';
import { AdapterRegistry } from '../core/adapters/registry';
import { buildRequestOptions } from '../core/connections/BleConnection';
import { MOCK_ADAPTER_CONFIG, encodeMockPacket } from '../core/adapters/builtins';
import { createConfigAdapter } from '../core/adapters/configAdapter';
import type { LaserAdapterConfig, LaserMeasurement } from '../core/types';
import { FakeTimers, MemoryStorage, flush } from './fakeTimers';
import { FakeBluetooth, FakeCharacteristic, FakeDevice, FakeService } from './fakeBluetooth';

const SVC = '0000fff0-0000-1000-8000-00805f9b34fb';
const MEAS = '0000fff1-0000-1000-8000-00805f9b34fb';
const TRIG = '0000fff2-0000-1000-8000-00805f9b34fb';

const config: LaserAdapterConfig = {
  ...MOCK_ADAPTER_CONFIG,
  id: 'acme-x1',
  displayName: 'Acme X1',
  bleFilters: [{ namePrefix: 'ACME' }],
  serviceUuid: 'fff0',
  measurementCharUuid: 'fff1',
  triggerCharUuid: 'fff2',
  triggerPayloadHex: 'aa 01',
};

describe('buildRequestOptions', () => {
  const a = createConfigAdapter(config);
  it('filters by the adapter and asks for its service + battery', () => {
    expect(buildRequestOptions(a)).toEqual({
      filters: [{ namePrefix: 'ACME' }],
      optionalServices: [SVC, 'battery_service'],
    });
  });
  it('can list every device for unknown names', () => {
    expect(buildRequestOptions(a, true)).toMatchObject({ acceptAllDevices: true });
    expect(buildRequestOptions(a, true)).not.toHaveProperty('filters');
  });
});

describe('LaserMeterService over Web Bluetooth', () => {
  let timers: FakeTimers;
  let meas: FakeCharacteristic;
  let trig: FakeCharacteristic;
  let battery: FakeCharacteristic;
  let device: FakeDevice;
  let bt: FakeBluetooth;
  let svc: LaserMeterService;
  let readings: LaserMeasurement[];
  let storage: MemoryStorage;

  beforeEach(() => {
    timers = new FakeTimers();
    meas = new FakeCharacteristic(MEAS, { notify: true });
    trig = new FakeCharacteristic(TRIG, { write: true });
    battery = new FakeCharacteristic('battery_level', { read: true, notify: true }, new Uint8Array([64]));
    device = new FakeDevice('dev-1', 'ACME-1234', [
      new FakeService(SVC, [meas, trig]),
      new FakeService('battery_service', [battery]),
    ]);
    bt = new FakeBluetooth(device);
    storage = new MemoryStorage();
    const registry = new AdapterRegistry(storage);
    registry.setConfigs([config]);
    svc = new LaserMeterService({ timers, storage, registry, bluetooth: () => bt });
    readings = [];
    svc.on('measurement', (m) => readings.push(m));
  });

  it('connects, reads battery, subscribes and parses notifications', async () => {
    expect(await svc.connectBle({ adapterId: 'acme-x1' })).toBe(true);
    expect(svc.getState()).toMatchObject({
      mode: 'ble',
      status: 'connected',
      deviceName: 'ACME-1234',
      battery: 64,
      canTrigger: true,
      adapterId: 'acme-x1',
    });
    meas.notify(encodeMockPacket(2345));
    expect(readings[0]).toMatchObject({ valueMm: 2345, source: 'laser_ble', adapterId: 'acme-x1' });
    battery.notify(new Uint8Array([63]));
    expect(svc.getState().battery).toBe(63);
  });

  it('writes the trigger payload', async () => {
    await svc.connectBle({ adapterId: 'acme-x1' });
    await svc.trigger();
    expect(Array.from(trig.writes[0])).toEqual([0xaa, 0x01]);
  });

  it('treats a closed chooser as a quiet no-op', async () => {
    bt.cancel = true;
    expect(await svc.connectBle({ adapterId: 'acme-x1' })).toBe(false);
    expect(svc.getState()).toMatchObject({ mode: 'ble', status: 'disconnected', lastError: null });
  });

  it('requires a model with a measurement characteristic', async () => {
    await expect(svc.connectBle({ adapterId: 'generic' })).rejects.toThrow(/model/);
    await expect(svc.connectBle({ adapterId: null })).rejects.toThrow(/model/);
  });

  it('fails clearly when the device lacks the service', async () => {
    device.services = [];
    await expect(svc.connectBle({ adapterId: 'acme-x1' })).rejects.toThrow(/expected service/);
    expect(svc.getState().status).toBe('disconnected');
  });

  it('auto-reconnects with backoff and resubscribes', async () => {
    await svc.connectBle({ adapterId: 'acme-x1' });
    device.inRange = false;
    device.drop();
    expect(svc.getState()).toMatchObject({ status: 'reconnecting', reconnectAttempt: 1 });
    await timers.advance(1000); // attempt 1 fails
    expect(svc.getState().reconnectAttempt).toBe(2);
    device.inRange = true;
    await timers.advance(2000); // attempt 2 succeeds
    expect(svc.getState().status).toBe('connected');
    meas.notify(encodeMockPacket(1500));
    expect(readings.map((r) => r.valueMm)).toEqual([1500]);
  });

  it('stops after 1s, 2s, 5s, 10s and waits for a manual retry', async () => {
    await svc.connectBle({ adapterId: 'acme-x1' });
    device.inRange = false;
    device.drop();
    await timers.advance(18000);
    expect(device.connectCalls).toBe(5); // initial + 4 attempts
    expect(svc.getState()).toMatchObject({ status: 'disconnected', needsManualReconnect: true });
    device.inRange = true;
    expect(await svc.retryNow()).toBe(true);
    expect(svc.getState().status).toBe('connected');
  });

  it('does not reconnect after a user disconnect', async () => {
    await svc.connectBle({ adapterId: 'acme-x1' });
    await svc.disconnect();
    device.drop();
    await timers.advance(20000);
    expect(device.connectCalls).toBe(1);
    expect(svc.getState().status).toBe('disconnected');
  });

  it('remembers the device and reconnects it without the chooser', async () => {
    await svc.connectBle({ adapterId: 'acme-x1' });
    await svc.disconnect();
    // A fresh service (page reload) on the same storage.
    const registry = new AdapterRegistry(storage);
    const svc2 = new LaserMeterService({ timers, storage, registry, bluetooth: () => bt });
    expect(svc2.getState().rememberedDevice).toEqual({ id: 'dev-1', name: 'ACME-1234', adapterId: 'acme-x1' });
    bt.lastOptions = null;
    expect(await svc2.reconnectRemembered()).toBe(true);
    expect(bt.lastOptions).toBeNull();
    expect(svc2.getState().status).toBe('connected');
    await flush();
  });
});
