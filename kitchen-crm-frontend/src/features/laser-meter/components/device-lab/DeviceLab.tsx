/**
 * Device Lab (admin): work out an unknown meter's data format.
 *
 *  1. Scan & connect to any BLE device (acceptAllDevices + the services to request).
 *  2. See every service/characteristic and its properties; subscribe, read, write.
 *  3. Take readings on the meter; each packet is logged with a timestamp in hex + ASCII.
 *  4. "Mark reading": type the distance shown on the meter next to a packet. Decodings that
 *     reproduce it are listed; decodings consistent with every mark rise to the top.
 *  5. "Save as Adapter" turns the chosen decoding into an adapter; "Export log" shares the
 *     session with developers (as a JSON file, or saved on the server).
 */

import { useMemo, useState, useSyncExternalStore } from 'react';
import clsx from 'clsx';
import {
  Bluetooth,
  BookmarkCheck,
  Download,
  FlaskConical,
  RefreshCw,
  Save,
  Trash2,
  Unplug,
  Wand2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui';
import type { LabCharacteristic, LabEntry } from '../../core/connections/bleLab';
import { deviceLab as lab } from '../../instance';
import { createSimulatedBluetooth, type SimulatedMeter } from '../../core/connections/simulatedBluetooth';
import { getBleSupport, getBluetooth } from '../../core/connections/webBluetooth';
import { rankAcrossMarks, type MarkedPacket, type RankedCandidate } from '../../core/decodingProbe';
import { shortUuid, normalizeUuid } from '../../core/hex';
import type { LaserAdapterConfig } from '../../core/types';
import { useLaserDevTools, useLaserSettings } from '../../hooks/useLaserSettings';
import {
  useGetDeviceLabLogsQuery,
  useLazyGetDeviceLabLogQuery,
  useSaveDeviceLabLogMutation,
} from '../../api/laserMeterAPI';
import { apiErrorMessage } from '../../api/apiError';

export interface DeviceLabProps {
  /** "Save as Adapter": hand a prefilled config to the adapter editor. */
  onSaveAsAdapter: (config: LaserAdapterConfig) => void;
}

const time = (ms: number) => {
  const d = new Date(ms);
  return `${d.toLocaleTimeString([], { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`;
};

const downloadJson = (name: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'meter';

const Prop = ({ on, children }: { on: boolean; children: string }) =>
  on ? (
    <span className="px-1.5 py-[1px] rounded border border-background-500 text-[10.5px] uppercase tracking-wide text-text-700">
      {children}
    </span>
  ) : null;

export const DeviceLab = ({ onSaveAsAdapter }: DeviceLabProps) => {
  const state = useSyncExternalStore(
    (cb) => lab.subscribe(cb),
    () => lab.getState()
  );
  const [settings, updateSettings] = useLaserSettings();
  const devTools = useLaserDevTools();
  const support = getBleSupport();

  const [namePrefix, setNamePrefix] = useState('');
  const [servicesText, setServicesText] = useState(settings.labOptionalServices.join('\n'));
  const [writeHex, setWriteHex] = useState<Record<string, string>>({});
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [markText, setMarkText] = useState('');
  const [notifyOnly, setNotifyOnly] = useState(false);
  const [sim, setSim] = useState<SimulatedMeter | null>(null);
  const [simShown, setSimShown] = useState<number | null>(null);

  const { data: savedLogs = [] } = useGetDeviceLabLogsQuery();
  const [fetchLog] = useLazyGetDeviceLabLogQuery();
  const [saveLog, saveLogState] = useSaveDeviceLabLogMutation();

  const services = () =>
    servicesText
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const connectReal = () => {
    const bt = getBluetooth();
    if (!bt) {
      toast.error(support.message);
      return;
    }
    const list = services();
    updateSettings({ labOptionalServices: list });
    setSim(null);
    // Called straight from the click so requestDevice keeps the user activation.
    lab.connect(bt, { optionalServices: list, namePrefix });
  };

  const connectSim = () => {
    const s = createSimulatedBluetooth();
    setSim(s);
    lab.connect(s.bluetooth, { optionalServices: services() });
  };

  const entries = useMemo(
    () => [...state.entries].reverse().filter((e) => !notifyOnly || e.kind === 'notify'),
    [state.entries, notifyOnly]
  );

  const marksByEntry = useMemo(() => new Map(state.marks.map((m) => [m.entryId, m])), [state.marks]);

  const ranked: RankedCandidate[] = useMemo(() => {
    const marks: MarkedPacket[] = [];
    for (const m of state.marks) {
      const e = state.entries.find((x) => x.id === m.entryId);
      if (e) {
        marks.push({ bytes: Uint8Array.from(e.bytes), targetMm: m.targetMm });
      }
    }
    return marks.length ? rankAcrossMarks(marks).slice(0, 20) : [];
  }, [state.marks, state.entries]);

  const markedEntry: LabEntry | undefined = state.marks.length
    ? state.entries.find((e) => e.id === state.marks[0].entryId)
    : undefined;

  const saveAsAdapter = (c: RankedCandidate) => {
    if (!markedEntry?.serviceUuid || !markedEntry.charUuid) {
      toast.error('Mark a notification packet first');
      return;
    }
    const name = state.deviceName ?? 'New meter';
    const prefix = (name.match(/^[^\d]*/)?.[0] ?? '').trim() || name;
    onSaveAsAdapter({
      id: slug(name),
      displayName: name,
      active: true,
      bleFilters: [{ namePrefix: prefix }],
      serviceUuid: normalizeUuid(markedEntry.serviceUuid),
      measurementCharUuid: normalizeUuid(markedEntry.charUuid),
      optionalServices: [],
      parser: c.parser,
      minMm: 50,
      maxMm: 15000,
      notes: `Created in the Device Lab from ${state.marks.length} marked reading(s) on ${new Date().toLocaleDateString()}.`,
    });
  };

  const exportData = () =>
    lab.exportLog({
      candidates: ranked.slice(0, 5).map((c) => ({ parser: c.parser, matches: c.matches, total: c.total })),
    });

  const submitMark = (entryId: number) => {
    const r = lab.mark(entryId, markText);
    if (!r.ok) {
      toast.error(r.reason ?? 'Invalid distance');
      return;
    }
    setMarkingId(null);
    setMarkText('');
  };

  const connected = state.status === 'connected';

  return (
    <div className="flex flex-col gap-4 text-[13px]">
      {/* Connect */}
      <section className="rounded-[10px] border border-background-600 bg-background-800 p-3 flex flex-col gap-3">
        {!support.supported && <p className="m-0 text-text-600">{support.message}</p>}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-3">
          <label className="flex flex-col gap-1 font-medium text-text-700">
            Name starts with (optional — empty lists every device)
            <input
              className="px-3 py-2 bg-background-700 border border-background-600 rounded-lg text-text-900"
              value={namePrefix}
              onChange={(e) => setNamePrefix(e.target.value)}
              placeholder="e.g. LM"
            />
          </label>
          <label className="flex flex-col gap-1 font-medium text-text-700">
            Services to request (the browser only shows services listed here)
            <textarea
              className="px-3 py-2 bg-background-700 border border-background-600 rounded-lg text-text-900 font-mono text-[12px]"
              rows={3}
              value={servicesText}
              onChange={(e) => setServicesText(e.target.value)}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" leftIcon={<Bluetooth size={14} />} onClick={connectReal} disabled={!support.supported || state.status === 'connecting'}>
            Scan &amp; connect
          </Button>
          {devTools && (
            <Button size="sm" variant="outline" leftIcon={<FlaskConical size={14} />} onClick={connectSim}>
              Simulated device
            </Button>
          )}
          {connected && (
            <>
              <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={() => lab.discover()}>
                Rediscover
              </Button>
              <Button size="sm" variant="ghost" leftIcon={<Unplug size={14} />} onClick={() => lab.disconnect()}>
                Disconnect
              </Button>
            </>
          )}
          {sim && connected && (
            <span className="inline-flex items-center gap-2 pl-2 border-l border-background-600">
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Wand2 size={14} />}
                onClick={() => {
                  const mm = 800 + Math.round(Math.random() * 4000);
                  setSimShown(mm);
                  sim.emit(mm);
                }}
              >
                Simulate reading
              </Button>
              {simShown !== null && <span className="text-text-600">Meter screen shows: <b className="text-text-900">{simShown} mm</b></span>}
            </span>
          )}
          <span className="ml-auto text-text-600">
            {state.status === 'connecting' && 'Connecting…'}
            {connected && `Connected · ${state.deviceName ?? state.deviceId}`}
            {state.status === 'disconnected' && 'Disconnected'}
          </span>
        </div>
        {state.error && <p className="m-0 text-error">{state.error}</p>}
      </section>

      {/* Services */}
      {state.services.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="m-0 text-[12px] font-semibold uppercase tracking-wide text-text-500">Services &amp; characteristics</h3>
          {state.services.map((s) => (
            <div key={s.uuid} className="rounded-[10px] border border-background-600 bg-background-800">
              <div className="px-3 py-2 border-b border-background-600 font-mono text-[12px] text-text-800">
                Service {shortUuid(s.uuid)}
              </div>
              {s.characteristics.length === 0 && <p className="m-0 px-3 py-2 text-text-500">No characteristics visible.</p>}
              {s.characteristics.map((c: LabCharacteristic) => (
                <div key={c.key} className="px-3 py-2 flex flex-wrap items-center gap-2 border-t border-background-700 first:border-t-0">
                  <span className="font-mono text-[12px] text-text-900 min-w-[7rem]" title={c.uuid}>
                    {shortUuid(c.uuid)}
                  </span>
                  <Prop on={c.properties.read}>read</Prop>
                  <Prop on={c.properties.write}>write</Prop>
                  <Prop on={c.properties.writeWithoutResponse}>write-no-resp</Prop>
                  <Prop on={c.properties.notify}>notify</Prop>
                  <Prop on={c.properties.indicate}>indicate</Prop>
                  <span className="flex-1" />
                  {(c.properties.notify || c.properties.indicate) && (
                    <button
                      type="button"
                      onClick={() => lab.toggleNotifications(c.key)}
                      className={clsx(
                        'px-2 py-1 rounded-md text-[12px] border',
                        c.subscribed ? 'border-success text-success' : 'border-background-500 text-text-700 hover:bg-background-700'
                      )}
                    >
                      {c.subscribed ? 'Subscribed ✓' : 'Subscribe'}
                    </button>
                  )}
                  {c.properties.read && (
                    <button type="button" onClick={() => lab.read(c.key)} className="px-2 py-1 rounded-md text-[12px] border border-background-500 text-text-700 hover:bg-background-700">
                      Read
                    </button>
                  )}
                  {(c.properties.write || c.properties.writeWithoutResponse) && (
                    <span className="inline-flex items-center gap-1">
                      <input
                        className="w-28 px-2 py-1 bg-background-700 border border-background-600 rounded-md font-mono text-[12px]"
                        placeholder="hex"
                        value={writeHex[c.key] ?? ''}
                        onChange={(e) => setWriteHex((w) => ({ ...w, [c.key]: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => lab.write(c.key, writeHex[c.key] ?? '')}
                        className="px-2 py-1 rounded-md text-[12px] border border-background-500 text-text-700 hover:bg-background-700"
                      >
                        Write
                      </button>
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {/* Decodings */}
      {ranked.length > 0 || state.marks.length > 0 ? (
        <section className="rounded-[10px] border border-background-600 bg-background-800 p-3 flex flex-col gap-2">
          <h3 className="m-0 text-[12px] font-semibold uppercase tracking-wide text-text-500">
            Candidate decodings · {state.marks.length} marked reading{state.marks.length === 1 ? '' : 's'}
          </h3>
          {ranked.length === 0 ? (
            <p className="m-0 text-text-600">
              No common decoding reproduces the marked distance. Check the packet came from the right characteristic, or
              export the log for a developer.
            </p>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
              {ranked.map((c) => {
                const all = c.matches === c.total;
                return (
                  <li
                    key={c.key}
                    className={clsx(
                      'flex flex-wrap items-center gap-2 px-2.5 py-2 rounded-lg border',
                      all ? 'border-success bg-background-700' : 'border-background-600 opacity-75'
                    )}
                  >
                    <span className={clsx('font-semibold tabular-nums', all ? 'text-success' : 'text-text-600')}>
                      {c.matches}/{c.total}
                    </span>
                    <span className="flex-1 min-w-[14rem] text-text-800">{c.description}</span>
                    <Button size="sm" variant={all ? 'primary' : 'outline'} leftIcon={<Save size={13} />} onClick={() => saveAsAdapter(c)}>
                      Save as Adapter
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          {state.marks.length > 1 && ranked.filter((c) => c.matches === c.total).length > 1 && (
            <p className="m-0 text-text-600">
              Several decodings fit every mark — they only differ for readings you haven’t tried (e.g. very long
              distances). The first one is the safest choice.
            </p>
          )}
          {state.marks.length === 1 && ranked.length > 1 && (
            <p className="m-0 text-text-600">Mark one or two more readings at different distances to narrow it down.</p>
          )}
        </section>
      ) : null}

      {/* Log */}
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="m-0 text-[12px] font-semibold uppercase tracking-wide text-text-500 mr-auto">
            Live log ({state.entries.length})
          </h3>
          <label className="inline-flex items-center gap-1.5 text-text-600">
            <input type="checkbox" checked={notifyOnly} onChange={(e) => setNotifyOnly(e.target.checked)} /> Packets only
          </label>
          <Button size="sm" variant="outline" leftIcon={<Download size={13} />} onClick={() => downloadJson(`device-lab-${slug(state.deviceName ?? 'session')}-${Date.now()}.json`, exportData())} disabled={!state.entries.length}>
            Export log
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Save size={13} />}
            isLoading={saveLogState.isLoading}
            disabled={!state.entries.length}
            onClick={async () => {
              const title = window.prompt('Title for this lab session', `${state.deviceName ?? 'Unknown device'} — ${new Date().toLocaleString()}`);
              if (!title) {
                return;
              }
              try {
                await saveLog({ title, deviceName: state.deviceName, log: exportData() as unknown as Record<string, unknown> }).unwrap();
                toast.success('Lab session saved for developers');
              } catch (e) {
                toast.error(apiErrorMessage(e, 'Could not save the session'));
              }
            }}
          >
            Save to server
          </Button>
          <Button size="sm" variant="ghost" leftIcon={<Trash2 size={13} />} onClick={() => lab.clearLog()} disabled={!state.entries.length}>
            Clear
          </Button>
        </div>
        <div className="rounded-[10px] border border-background-600 overflow-x-auto max-h-[28rem] overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-background-700 text-left text-text-600 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 font-medium">Time</th>
                <th className="px-2 py-1.5 font-medium">Type</th>
                <th className="px-2 py-1.5 font-medium">Char.</th>
                <th className="px-2 py-1.5 font-medium">Hex</th>
                <th className="px-2 py-1.5 font-medium">ASCII</th>
                <th className="px-2 py-1.5 font-medium">Meter shows</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-text-500">
                    Connect, subscribe to a “notify” characteristic, then take a reading on the meter.
                  </td>
                </tr>
              )}
              {entries.map((e) => {
                const mark = marksByEntry.get(e.id);
                return (
                  <tr key={e.id} className={clsx('border-t border-background-700 align-top', mark && 'bg-background-700')}>
                    <td className="px-2 py-1 whitespace-nowrap tabular-nums text-text-600">{time(e.at)}</td>
                    <td className={clsx('px-2 py-1', e.kind === 'error' ? 'text-error' : 'text-text-700')}>{e.kind}</td>
                    <td className="px-2 py-1 font-mono text-text-600">{e.charUuid ? shortUuid(e.charUuid) : ''}</td>
                    <td className="px-2 py-1 font-mono text-text-900 break-all">{e.message ?? e.hex}</td>
                    <td className="px-2 py-1 font-mono text-text-700 break-all">{e.message ? '' : e.ascii}</td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      {e.kind === 'notify' || e.kind === 'read' ? (
                        mark ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-success">
                            <BookmarkCheck size={13} /> {mark.targetMm} mm
                            <button className="p-0.5 text-text-500 hover:text-error" onClick={() => lab.unmark(e.id)} aria-label="Remove mark">
                              <X size={12} />
                            </button>
                          </span>
                        ) : markingId === e.id ? (
                          <form
                            className="inline-flex items-center gap-1"
                            onSubmit={(ev) => {
                              ev.preventDefault();
                              submitMark(e.id);
                            }}
                          >
                            <input
                              autoFocus
                              inputMode="decimal"
                              className="w-24 px-1.5 py-0.5 bg-background-700 border border-background-600 rounded"
                              placeholder="2345 mm"
                              value={markText}
                              onChange={(ev) => setMarkText(ev.target.value)}
                            />
                            <button type="submit" className="px-1.5 py-0.5 rounded btn-raised-accent text-[11.5px]">
                              OK
                            </button>
                            <button type="button" onClick={() => setMarkingId(null)} className="p-0.5 text-text-500">
                              <X size={12} />
                            </button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setMarkingId(e.id);
                              setMarkText('');
                            }}
                            className="px-1.5 py-0.5 rounded border border-background-500 text-text-700 hover:bg-background-700"
                          >
                            Mark reading
                          </button>
                        )
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Saved sessions */}
      {savedLogs.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h3 className="m-0 text-[12px] font-semibold uppercase tracking-wide text-text-500">Saved lab sessions</h3>
          <ul className="m-0 p-0 list-none flex flex-col gap-1">
            {savedLogs.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2 text-text-700">
                <span className="font-medium text-text-900">{l.title}</span>
                <span className="text-text-500">
                  {l.entryCount} entries · {l.createdBy ?? '—'} · {l.createdAt ? new Date(l.createdAt).toLocaleString() : ''}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                  onClick={async () => {
                    try {
                      const full = await fetchLog(l.id).unwrap();
                      downloadJson(`device-lab-${l.id}.json`, full.log);
                    } catch (e) {
                      toast.error(apiErrorMessage(e, 'Could not download the session'));
                    }
                  }}
                >
                  <Download size={12} /> Download
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default DeviceLab;
