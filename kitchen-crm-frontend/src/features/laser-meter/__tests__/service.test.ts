import { beforeEach, describe, expect, it } from 'vitest';
import { LaserMeterService } from '../core/LaserMeterService';
import { ReconnectScheduler } from '../core/reconnect';
import type { LaserMeasurement, RejectedReading } from '../core/types';
import { FakeTimers, MemoryStorage, flush } from './fakeTimers';

describe('ReconnectScheduler', () => {
  it('backs off 1s, 2s, 5s, 10s then gives up', async () => {
    const timers = new FakeTimers();
    const scheduled: number[] = [];
    let gaveUp = false;
    const s = new ReconnectScheduler(
      {
        onScheduled: (_n, at) => scheduled.push(at),
        attempt: async () => false,
        onSucceeded: () => {},
        onGaveUp: () => {
          gaveUp = true;
        },
      },
      undefined,
      timers
    );
    s.start();
    await timers.advance(20000);
    expect(scheduled).toEqual([1000, 3000, 8000, 18000]);
    expect(gaveUp).toBe(true);
    expect(s.isRunning).toBe(false);
  });

  it('stops on success and on cancel', async () => {
    const timers = new FakeTimers();
    let attempts = 0;
    let ok = false;
    const s = new ReconnectScheduler(
      {
        onScheduled: () => {},
        attempt: async (n) => {
          attempts = n;
          return n === 2;
        },
        onSucceeded: () => {
          ok = true;
        },
        onGaveUp: () => {},
      },
      undefined,
      timers
    );
    s.start();
    await timers.advance(3000);
    expect(ok).toBe(true);
    expect(attempts).toBe(2);

    s.start();
    s.cancel();
    expect(timers.pending).toBe(0);
  });
});

describe('LaserMeterService with the mock device', () => {
  let timers: FakeTimers;
  let svc: LaserMeterService;
  let readings: LaserMeasurement[];
  let rejected: RejectedReading[];

  beforeEach(() => {
    timers = new FakeTimers();
    svc = new LaserMeterService({ timers, storage: new MemoryStorage() });
    readings = [];
    rejected = [];
    svc.on('measurement', (m) => readings.push(m));
    svc.on('rejected', (r) => rejected.push(r));
  });

  const connect = async () => {
    const p = svc.connectMock();
    await flush();
    expect(svc.getState().status).toBe('connecting');
    await timers.advance(500);
    return p;
  };

  it('connects and reports device state', async () => {
    await connect();
    const s = svc.getState();
    expect(s).toMatchObject({ mode: 'mock', status: 'connected', battery: 87, adapterId: 'mock', canTrigger: true });
  });

  it('emits parsed measurements with metadata', async () => {
    const mock = await connect();
    mock.emitReading(2345);
    expect(readings).toHaveLength(1);
    expect(readings[0]).toMatchObject({ valueMm: 2345, source: 'laser_ble', adapterId: 'mock' });
    expect(readings[0].raw).toBe('a5 29 09 00 00 85');
  });

  it('rejects out-of-range and garbled packets', async () => {
    const mock = await connect();
    mock.emitReading(20);
    mock.emitRaw(new Uint8Array([1]));
    expect(readings).toHaveLength(0);
    expect(rejected.map((r) => r.reason).join('|')).toMatch(/outside the accepted range.*\|.*too short/);
  });

  it('simulateReading goes through the mock parser when connected', async () => {
    await connect();
    svc.simulateReading(3000);
    expect(readings[0]).toMatchObject({ valueMm: 3000, source: 'laser_ble' });
  });

  it('reconnects with backoff after a drop', async () => {
    const mock = await connect();
    mock.available = false;
    svc.simulateDisconnect();
    expect(svc.getState()).toMatchObject({ status: 'reconnecting', reconnectAttempt: 1, nextRetryAt: timers.now() + 1000 });
    await timers.advance(1000);
    expect(svc.getState()).toMatchObject({ status: 'reconnecting', reconnectAttempt: 2 });
    mock.available = true;
    await timers.advance(2000);
    expect(svc.getState().status).toBe('connected');
  });

  it('goes to manual reconnect after the last backoff step', async () => {
    const mock = await connect();
    mock.available = false;
    svc.simulateDisconnect();
    await timers.advance(18000);
    expect(svc.getState().status).toBe('disconnected');
    expect(svc.getState().lastError).toMatch(/Reconnect/);
    expect(svc.getState().needsManualReconnect).toBe(true);
    mock.available = true;
    expect(await svc.retryNow()).toBe(true);
    expect(svc.getState().status).toBe('connected');
  });

  it('user disconnect does not auto-reconnect', async () => {
    await connect();
    await svc.disconnect();
    await timers.advance(20000);
    expect(svc.getState().status).toBe('disconnected');
    expect(timers.pending).toBe(0);
  });

  it('trigger produces a reading', async () => {
    await connect();
    await svc.trigger();
    await flush();
    expect(readings).toHaveLength(1);
  });
});
