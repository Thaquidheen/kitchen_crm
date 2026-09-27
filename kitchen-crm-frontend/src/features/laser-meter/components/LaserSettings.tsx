/**
 * Per-user, per-device laser meter settings: preferred mode, adapter, display unit, feedback,
 * auto-advance, keyboard-meter parsing, and developer tools.
 */

import { Info } from 'lucide-react';
import { Select, Switch } from '@/components/ui';
import { useLaserSettings } from '../hooks/useLaserSettings';
import { useSelectableAdapters } from '../hooks/useAdapters';
import { getBleSupport } from '../core/connections/webBluetooth';
import { LENGTH_UNITS, type LengthUnit, type PreferredMode } from '../core/types';
import { UNIT_LABELS } from '../core/units';
import type { HidDefaultUnit } from '../core/hidInputParser';

const numberInputCls =
  'w-24 px-2 py-1.5 bg-background-700 border border-background-600 rounded-md text-[13px] tabular-nums text-text-900 focus:outline-none focus:ring-2 focus:ring-primary-700';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-3">
    <h3 className="m-0 text-[13px] font-semibold uppercase tracking-wide text-text-500">{title}</h3>
    {children}
  </section>
);

export const LaserSettings = () => {
  const [settings, update] = useLaserSettings();
  const ble = getBleSupport();
  const devBuild = import.meta.env.DEV;
  const adapters = useSelectableAdapters(devBuild || settings.devTools);

  const modeOptions: { value: PreferredMode; label: string; disabled?: boolean }[] = [
    { value: 'auto', label: 'Auto (Bluetooth if available, otherwise keyboard meter)' },
    { value: 'ble', label: 'Bluetooth (direct connection)', disabled: !ble.supported },
    { value: 'keyboard', label: 'Keyboard meter (paired as a Bluetooth keyboard)' },
    { value: 'manual', label: 'Manual entry only' },
  ];

  const setHid = (patch: Partial<typeof settings.hid>) => update({ hid: { ...settings.hid, ...patch } });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Section title="Connection">
        <Select
          label="Preferred mode"
          value={settings.preferredMode}
          onChange={(e) => update({ preferredMode: e.target.value as PreferredMode })}
          options={modeOptions}
        />
        {!ble.supported && (
          <p className="m-0 flex gap-2 text-[12.5px] text-text-600">
            <Info size={15} className="shrink-0 mt-0.5" />
            {ble.message}
          </p>
        )}
        {ble.supported && (
          <Select
            label="Laser meter model (Bluetooth)"
            value={settings.adapterId ?? ''}
            onChange={(e) => update({ adapterId: e.target.value || null })}
            options={[
              { value: '', label: adapters.length ? '— Select a model —' : 'No models configured yet' },
              ...adapters.map((a) => ({ value: a.id, label: a.displayName })),
            ]}
            helperText="Models are set up by an administrator in the Device Lab."
          />
        )}
      </Section>

      <Section title="Measuring">
        <Select
          label="Display unit"
          value={settings.displayUnit}
          onChange={(e) => update({ displayUnit: e.target.value as LengthUnit })}
          options={LENGTH_UNITS.map((u) => ({ value: u, label: UNIT_LABELS[u] }))}
          helperText="Values are always stored in millimetres."
        />
        <Switch
          label="Beep on capture"
          checked={settings.beep}
          onChange={(e) => update({ beep: e.target.checked })}
        />
        <Switch
          label="Vibrate on capture (where supported)"
          checked={settings.vibrate}
          onChange={(e) => update({ vibrate: e.target.checked })}
        />
        <Switch
          label="Move to the next measurement automatically"
          checked={settings.autoAdvance}
          onChange={(e) => update({ autoAdvance: e.target.checked })}
        />
      </Section>

      <Section title="Keyboard meter">
        <Select
          label="Unit when the meter sends a bare number"
          value={settings.hid.defaultUnit}
          onChange={(e) => setHid({ defaultUnit: e.target.value as HidDefaultUnit })}
          options={[
            { value: 'auto', label: 'Auto (below 50 = metres, otherwise millimetres)' },
            ...LENGTH_UNITS.map((u) => ({ value: u, label: UNIT_LABELS[u] })),
          ]}
        />
        <Switch
          label="Accept values typed by hand into the waiting field (saved as manual)"
          checked={settings.hid.acceptHumanTyping}
          onChange={(e) => setHid({ acceptHumanTyping: e.target.checked })}
        />
        <details className="text-[13px] text-text-700">
          <summary className="cursor-pointer select-none">Advanced: device detection timing</summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between gap-3">
              Max typical gap between keys (ms)
              <input
                type="number"
                min={1}
                className={numberInputCls}
                value={settings.hid.timing.maxMedianIntervalMs}
                onChange={(e) =>
                  setHid({ timing: { ...settings.hid.timing, maxMedianIntervalMs: Number(e.target.value) || 1 } })
                }
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              Max single pause (ms)
              <input
                type="number"
                min={1}
                className={numberInputCls}
                value={settings.hid.timing.maxGapMs}
                onChange={(e) => setHid({ timing: { ...settings.hid.timing, maxGapMs: Number(e.target.value) || 1 } })}
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              Min characters
              <input
                type="number"
                min={2}
                className={numberInputCls}
                value={settings.hid.timing.minChars}
                onChange={(e) => setHid({ timing: { ...settings.hid.timing, minChars: Number(e.target.value) || 2 } })}
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              End reading after idle (ms)
              <input
                type="number"
                min={50}
                className={numberInputCls}
                value={settings.hid.idleTimeoutMs}
                onChange={(e) => setHid({ idleTimeoutMs: Number(e.target.value) || 300 })}
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              Minimum distance (mm)
              <input
                type="number"
                min={0}
                className={numberInputCls}
                value={settings.hid.minMm}
                onChange={(e) => setHid({ minMm: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              Maximum distance (mm)
              <input
                type="number"
                min={1}
                className={numberInputCls}
                value={settings.hid.maxMm}
                onChange={(e) => setHid({ maxMm: Math.max(1, Math.round(Number(e.target.value) || 15000)) })}
              />
            </label>
          </div>
        </details>
      </Section>

      <Section title="Developer">
        <Switch
          label="Show developer tools (simulated meter, “Simulate reading”)"
          checked={settings.devTools || devBuild}
          disabled={devBuild}
          onChange={(e) => update({ devTools: e.target.checked })}
          helperText={devBuild ? 'Always on in development builds.' : undefined}
        />
      </Section>
    </div>
  );
};

export default LaserSettings;
