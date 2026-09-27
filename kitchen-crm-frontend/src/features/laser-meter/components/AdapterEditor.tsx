/**
 * Create/edit form for a laser meter adapter (admin). Validates as you type with the same rules
 * as the server, and has a "Test parser" box to try the parser on a pasted packet.
 */

import { useMemo, useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { validateAdapterConfig } from '../core/adapterValidation';
import { BINARY_FORMATS, LENGTH_UNITS, failureReason, type BinaryFormat, type LaserAdapterConfig, type LengthUnit, type ParserConfig } from '../core/types';
import { DEFAULT_ASCII_REGEX, FORMAT_SIZE, parseReading } from '../core/parser';
import { asciiToBytes, hexToBytes } from '../core/hex';


export interface AdapterEditorProps {
  isOpen: boolean;
  /** Existing config (edit) or a prefilled draft (new, e.g. from the Device Lab). */
  initial: LaserAdapterConfig;
  isNew: boolean;
  saving?: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSave: (config: LaserAdapterConfig) => void;
}

const inputCls =
  'w-full px-3 py-2 bg-background-700 border border-background-600 rounded-lg text-[13.5px] text-text-900 placeholder:text-text-500 focus:outline-none focus:ring-2 focus:ring-primary-700 disabled:opacity-60';
const labelCls = 'flex flex-col gap-1 text-[12.5px] font-medium text-text-700';

const splitList = (s: string) =>
  s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);


/** Drop empty optional fields so the stored JSON stays tidy. */
const tidy = (c: LaserAdapterConfig): LaserAdapterConfig => {
  const out: LaserAdapterConfig = { ...c, id: c.id.trim(), displayName: c.displayName.trim() };
  if (!out.triggerCharUuid?.trim()) {
    delete out.triggerCharUuid;
  }
  if (!out.triggerPayloadHex?.trim()) {
    delete out.triggerPayloadHex;
  }
  if (!out.notes?.trim()) {
    delete out.notes;
  }
  if (!out.optionalServices?.length) {
    delete out.optionalServices;
  }
  return out;
};

export const AdapterEditor = ({ isOpen, initial, isNew, saving, serverError, onClose, onSave }: AdapterEditorProps) => {
  const [cfg, setCfg] = useState<LaserAdapterConfig>(initial);
  const [prefixes, setPrefixes] = useState(
    initial.bleFilters.map((f) => f.namePrefix).filter(Boolean).join(', ')
  );
  const [filterServices, setFilterServices] = useState(
    Array.from(new Set(initial.bleFilters.flatMap((f) => f.services ?? []))).join(', ')
  );
  const [optional, setOptional] = useState((initial.optionalServices ?? []).join(', '));
  const [testInput, setTestInput] = useState('');
  const [testAscii, setTestAscii] = useState(false);
  const [touched, setTouched] = useState(false);

  const built = useMemo<LaserAdapterConfig>(() => {
    const names = splitList(prefixes);
    const services = splitList(filterServices);
    const bleFilters = names.length
      ? names.map((namePrefix) => ({ namePrefix, ...(services.length ? { services } : {}) }))
      : services.length
        ? [{ services }]
        : [];
    return tidy({ ...cfg, bleFilters, optionalServices: splitList(optional) });
  }, [cfg, prefixes, filterServices, optional]);

  const errors = validateAdapterConfig(built);
  const set = (patch: Partial<LaserAdapterConfig>) => setCfg((c) => ({ ...c, ...patch }));
  const setParser = (patch: Partial<ParserConfig>) =>
    setCfg((c) => ({ ...c, parser: { ...c.parser, ...patch } as ParserConfig }));

  const testResult = useMemo(() => {
    if (!testInput.trim()) {
      return null;
    }
    try {
      const bytes = testAscii ? asciiToBytes(testInput.replace(/\\r/g, '\r').replace(/\\n/g, '\n')) : hexToBytes(testInput);
      const r = parseReading(bytes, built.parser, { minMm: built.minMm, maxMm: built.maxMm });
      return r.ok ? `✓ ${r.valueMm} mm` : `✗ ${failureReason(r)}`;
    } catch (e) {
      return `✗ ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [testInput, testAscii, built]);

  const p = cfg.parser;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isNew ? 'New laser meter adapter' : `Edit ${initial.displayName}`} size="xl">
      <div className="flex flex-col gap-5 text-[13px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className={labelCls}>
            ID (stored with every measurement; cannot change later)
            <input
              className={inputCls}
              value={cfg.id}
              disabled={!isNew}
              placeholder="e.g. brand-model-x1"
              onChange={(e) => set({ id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') })}
            />
          </label>
          <label className={labelCls}>
            Display name
            <input className={inputCls} value={cfg.displayName} placeholder="Shown to surveyors" onChange={(e) => set({ displayName: e.target.value })} />
          </label>
          <label className="inline-flex items-center gap-2 text-text-700">
            <input type="checkbox" checked={cfg.active} onChange={(e) => set({ active: e.target.checked })} />
            Active (offered to surveyors)
          </label>
        </div>

        <fieldset className="flex flex-col gap-3 border border-background-600 rounded-lg p-3">
          <legend className="px-1 font-semibold text-text-800">Bluetooth</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={labelCls}>
              Device name prefixes (comma separated)
              <input className={inputCls} value={prefixes} placeholder="e.g. LM-, METER" onChange={(e) => setPrefixes(e.target.value)} />
            </label>
            <label className={labelCls}>
              Filter by advertised services (optional)
              <input className={inputCls} value={filterServices} placeholder="e.g. fff0" onChange={(e) => setFilterServices(e.target.value)} />
            </label>
            <label className={labelCls}>
              Measurement service UUID
              <input className={inputCls} value={cfg.serviceUuid} placeholder="fff0 or full UUID" onChange={(e) => set({ serviceUuid: e.target.value.trim() })} />
            </label>
            <label className={labelCls}>
              Measurement characteristic UUID (notify)
              <input className={inputCls} value={cfg.measurementCharUuid} onChange={(e) => set({ measurementCharUuid: e.target.value.trim() })} />
            </label>
            <label className={labelCls}>
              Trigger characteristic UUID (optional)
              <input className={inputCls} value={cfg.triggerCharUuid ?? ''} onChange={(e) => set({ triggerCharUuid: e.target.value.trim() })} />
            </label>
            <label className={labelCls}>
              Trigger payload (hex, optional)
              <input className={inputCls} value={cfg.triggerPayloadHex ?? ''} placeholder="e.g. 01 or aa 55 01" onChange={(e) => set({ triggerPayloadHex: e.target.value })} />
            </label>
            <label className={`${labelCls} sm:col-span-2`}>
              Extra services to request access to (optional)
              <input className={inputCls} value={optional} placeholder="battery_service is always included" onChange={(e) => setOptional(e.target.value)} />
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3 border border-background-600 rounded-lg p-3">
          <legend className="px-1 font-semibold text-text-800">Reading format</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className={labelCls}>
              Type
              <select
                className={inputCls}
                value={p.type}
                onChange={(e) =>
                  setCfg((c) => ({
                    ...c,
                    parser:
                      e.target.value === 'ascii'
                        ? { type: 'ascii', regex: DEFAULT_ASCII_REGEX, sourceUnit: c.parser.sourceUnit, scale: c.parser.scale }
                        : { type: 'binary', offset: 0, length: 2, format: 'uint16', littleEndian: true, sourceUnit: c.parser.sourceUnit, scale: c.parser.scale },
                  }))
                }
              >
                <option value="binary">Binary</option>
                <option value="ascii">Text (ASCII)</option>
              </select>
            </label>
            <label className={labelCls}>
              Unit
              <select className={inputCls} value={p.sourceUnit} onChange={(e) => setParser({ sourceUnit: e.target.value as LengthUnit })}>
                {LENGTH_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              Scale
              <input type="number" step="any" className={inputCls} value={p.scale} onChange={(e) => setParser({ scale: Number(e.target.value) })} />
            </label>
            {p.type === 'binary' ? (
              <>
                <label className={labelCls}>
                  Byte offset
                  <input type="number" min={0} className={inputCls} value={p.offset} onChange={(e) => setParser({ offset: Math.max(0, Math.round(Number(e.target.value))) })} />
                </label>
                <label className={labelCls}>
                  Number format
                  <select
                    className={inputCls}
                    value={p.format}
                    onChange={(e) => setParser({ format: e.target.value as BinaryFormat, length: FORMAT_SIZE[e.target.value as BinaryFormat] })}
                  >
                    {BINARY_FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelCls}>
                  Byte order
                  <select className={inputCls} value={p.littleEndian ? 'le' : 'be'} onChange={(e) => setParser({ littleEndian: e.target.value === 'le' })}>
                    <option value="le">Little-endian</option>
                    <option value="be">Big-endian</option>
                  </select>
                </label>
              </>
            ) : (
              <label className={`${labelCls} col-span-2 sm:col-span-4`}>
                Pattern (group 1 = number, optional group 2 = unit)
                <input className={`${inputCls} font-mono`} value={p.regex} onChange={(e) => setParser({ regex: e.target.value })} />
              </label>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              Minimum accepted (mm)
              <input type="number" className={inputCls} value={cfg.minMm} onChange={(e) => set({ minMm: Math.round(Number(e.target.value)) })} />
            </label>
            <label className={labelCls}>
              Maximum accepted (mm)
              <input type="number" className={inputCls} value={cfg.maxMm} onChange={(e) => set({ maxMm: Math.round(Number(e.target.value)) })} />
            </label>
          </div>
          <div className="flex flex-col gap-1.5 rounded-lg bg-background-700 p-2.5">
            <div className="flex items-center gap-3">
              <span className="font-medium text-text-700">Test parser</span>
              <label className="inline-flex items-center gap-1.5 text-text-600">
                <input type="checkbox" checked={testAscii} onChange={(e) => setTestAscii(e.target.checked)} /> input is text
              </label>
            </div>
            <input
              className={`${inputCls} font-mono`}
              placeholder={testAscii ? 'e.g. D=2.345m\\r\\n' : 'packet hex, e.g. a5 29 09 00 00 85'}
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
            />
            {testResult && (
              <span className={testResult.startsWith('✓') ? 'text-success font-semibold' : 'text-error'}>{testResult}</span>
            )}
          </div>
        </fieldset>

        <label className={labelCls}>
          Notes
          <textarea className={inputCls} rows={2} value={cfg.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} />
        </label>

        {touched && errors.length > 0 && (
          <ul className="m-0 pl-5 text-[12.5px] text-error">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {serverError && <p className="m-0 text-[12.5px] text-error">{serverError}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            isLoading={saving}
            onClick={() => {
              setTouched(true);
              if (!errors.length) {
                onSave(built);
              }
            }}
          >
            {isNew ? 'Create adapter' : 'Save changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdapterEditor;
