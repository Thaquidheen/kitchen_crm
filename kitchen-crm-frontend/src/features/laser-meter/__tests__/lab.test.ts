import { describe, expect, it } from 'vitest';
import { LabSession } from '../core/connections/bleLab';
import { createSimulatedBluetooth } from '../core/connections/simulatedBluetooth';
import { rankAcrossMarks } from '../core/decodingProbe';
import { hexToBytes } from '../core/hex';
import { flush } from './fakeTimers';

const SVC = '0000fff0-0000-1000-8000-00805f9b34fb';

describe('LabSession', () => {
  it('connects to any device, lists GATT, logs notifications, marks and exports', async () => {
    const sim = createSimulatedBluetooth();
    let t = 1_700_000_000_000;
    const lab = new LabSession({ now: () => (t += 10) });
    expect(await lab.connect(sim.bluetooth, { optionalServices: ['fff0', 'battery_service'] })).toBe(true);

    const s = lab.getState();
    expect(s.status).toBe('connected');
    expect(s.deviceName).toBe('SIM-LAB-01');
    const meas = s.services.find((x) => x.uuid === SVC)?.characteristics.find((c) => c.properties.notify);
    expect(meas).toBeDefined();

    await lab.toggleNotifications(meas!.key);
    sim.emit(2345);
    sim.emit(1200);
    const notes = lab.getState().entries.filter((e) => e.kind === 'notify');
    expect(notes.map((e) => e.hex)).toEqual(['a5 29 09 00 00 85', 'a5 b0 04 00 00 11']);

    expect(lab.mark(notes[0].id, '2345 mm')).toEqual({ ok: true });
    expect(lab.mark(notes[1].id, '1.2 m')).toEqual({ ok: true });
    expect(lab.mark(notes[1].id, 'banana').ok).toBe(false);
    expect(lab.getState().marks.map((m) => m.targetMm)).toEqual([2345, 1200]);

    const ranked = rankAcrossMarks(
      lab.getState().marks.map((m) => ({
        bytes: Uint8Array.from(lab.getState().entries.find((e) => e.id === m.entryId)!.bytes),
        targetMm: m.targetMm,
      }))
    );
    expect(ranked[0]).toMatchObject({ key: 'bin:uint32:le:1:mm:1', matches: 2 });

    // Read + write paths.
    const battery = lab.getState().services.find((x) => x.uuid === 'battery_service')!.characteristics[0];
    await lab.read(battery.key);
    expect(lab.getState().entries.at(-1)).toMatchObject({ kind: 'read', hex: '5b' });
    const trigger = lab.getState().services.find((x) => x.uuid === SVC)!.characteristics.find((c) => c.properties.write)!;
    await lab.write(trigger.key, '01');
    expect(lab.getState().entries.at(-1)).toMatchObject({ kind: 'write', hex: '01' });

    const exported = lab.exportLog({ note: 'x' });
    expect(exported.format).toBe('laser-meter-device-lab/v1');
    expect(exported.entries.some((e) => e.hex === 'a5 29 09 00 00 85')).toBe(true);
    expect(exported.marks).toHaveLength(2);
    expect(JSON.parse(JSON.stringify(exported)).device.name).toBe('SIM-LAB-01');

    await lab.toggleNotifications(meas!.key);
    sim.emit(3000);
    expect(lab.getState().entries.filter((e) => e.kind === 'notify')).toHaveLength(2);
    await lab.disconnect();
    expect(lab.getState().status).toBe('disconnected');
    await flush();
  });

  it('reports a failed write without throwing', async () => {
    const sim = createSimulatedBluetooth();
    const lab = new LabSession();
    await lab.connect(sim.bluetooth, { optionalServices: [] });
    const c = lab.getState().services[0].characteristics[0];
    await lab.write(c.key, 'zz');
    expect(lab.getState().entries.at(-1)?.kind).toBe('error');
    expect(hexToBytes('01')).toEqual(new Uint8Array([1]));
  });
});
