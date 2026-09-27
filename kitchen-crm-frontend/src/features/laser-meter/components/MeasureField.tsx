/**
 * One measurement field that can receive laser readings.
 *
 * Inactive: shows the value (in the user's display unit), where it came from, and an edit button.
 * Active:   shows "Waiting for measurement…" and takes the next reading —
 *   - Bluetooth / simulated meter: from the service's `measurement` event;
 *   - keyboard meter: from a capture box with inputmode="none" (no on-screen keyboard) that
 *     collects the meter's keystroke burst and hands it to the service for timing + parsing;
 *   - manual (or "Type manually"): a normal numeric input, confirmed with Enter.
 *
 * Only one field should be `active` at a time; the guided panel guarantees that.
 */

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import clsx from 'clsx';
import { Check, Keyboard, Pencil, Radio, X, Zap } from 'lucide-react';
import { laserMeter } from '../instance';
import { KeystrokeBuffer } from '../core/keystrokeBuffer';
import { parseHidInput } from '../core/hidInputParser';
import { formatMm, mmToInputText } from '../core/units';
import type { MeasurementValue } from '../core/measurementSession';
import type {
  ConnectionMode,
  KeystrokeTimingConfig,
  LaserMeasurement,
  LengthUnit,
} from '../core/types';
import { failureReason } from '../core/types';

export interface MeasureFieldProps {
  label: string;
  hint?: string;
  value: MeasurementValue | null;
  active: boolean;
  /** Brief success highlight after a capture. */
  flash?: boolean;
  displayUnit: LengthUnit;
  mode: ConnectionMode;
  canTrigger?: boolean;
  minMm?: number;
  maxMm?: number;
  keyboard?: { idleTimeoutMs: number; timing: KeystrokeTimingConfig };
  onActivate?: () => void;
  onCapture: (m: LaserMeasurement) => void;
  onEdit: (valueMm: number | null) => void;
  onRejected?: (reason: string) => void;
}

const SOURCE_LABEL: Record<MeasurementValue['source'], string> = {
  laser_ble: 'Laser',
  laser_hid: 'Laser (keyboard)',
  manual: 'Manual',
};

export const SourceTag = ({ value }: { value: MeasurementValue }) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1 px-1.5 py-[1px] rounded text-[11px] font-medium border',
      value.source === 'manual'
        ? 'border-background-500 text-text-600'
        : 'border-primary-300 text-primary-700 bg-primary-100'
    )}
    title={value.raw ? `Raw: ${value.raw}` : undefined}
  >
    {value.source !== 'manual' && <Zap size={10} />}
    {SOURCE_LABEL[value.source]}
    {value.editedAfterCapture && ' · edited'}
  </span>
);

/** Is `el` somewhere the user types text (so keystrokes there are not the meter's)? */
const isTextEntry = (el: Element | null): boolean => {
  if (!el) {
    return false;
  }
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    return true;
  }
  if (el instanceof HTMLInputElement) {
    return !['button', 'checkbox', 'radio', 'submit', 'reset', 'range', 'color', 'file'].includes(el.type);
  }
  return (el as HTMLElement).isContentEditable === true;
};

const manualMeasurement = (valueMm: number, raw: string): LaserMeasurement => ({
  valueMm,
  source: 'manual',
  raw,
  at: Date.now(),
  adapterId: null,
});

export const MeasureField = ({
  label,
  hint,
  value,
  active,
  flash,
  displayUnit,
  mode,
  canTrigger,
  minMm = 50,
  maxMm = 15000,
  keyboard,
  onActivate,
  onCapture,
  onEdit,
  onRejected,
}: MeasureFieldProps) => {
  const [typingManually, setTypingManually] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef<KeystrokeBuffer | null>(null);

  const deviceMode = mode === 'ble' || mode === 'mock' || mode === 'keyboard';
  const capturing = active && deviceMode && !typingManually;
  const manualInput = (active && !capturing) || editing;

  // Reset per-activation state.
  useEffect(() => {
    if (!active) {
      setTypingManually(false);
      setPreview('');
    }
    setError(null);
    setText('');
  }, [active, deviceMode]);

  // Latest callbacks, so the event subscription below needn't resubscribe on every render.
  const onCaptureRef = useRef(onCapture);
  onCaptureRef.current = onCapture;
  const onRejectedRef = useRef(onRejected);
  onRejectedRef.current = onRejected;

  // Device readings (BLE, simulator, keyboard captures) arrive through the service.
  useEffect(() => {
    if (!capturing) {
      return;
    }
    const offM = laserMeter.on('measurement', (m) => {
      setError(null);
      onCaptureRef.current(m);
    });
    const offR = laserMeter.on('rejected', (r) => {
      setError(r.reason);
      onRejectedRef.current?.(r.reason);
    });
    return () => {
      offM();
      offR();
    };
  }, [capturing]);

  // Keyboard-mode capture buffer.
  useEffect(() => {
    if (!(capturing && mode === 'keyboard')) {
      return;
    }
    const buf = new KeystrokeBuffer({
      idleTimeoutMs: keyboard?.idleTimeoutMs,
      timing: keyboard?.timing,
      onChange: setPreview,
      onCapture: (capture) => {
        laserMeter.submitKeyboardCapture(capture);
      },
    });
    bufferRef.current = buf;

    // A surveyor taps around (layout, scrolling, buttons) and focus leaves the capture box, but
    // the meter keeps "typing". Route those keystrokes here unless the user is typing into some
    // other text field — otherwise the meter's Enter would click whatever button has focus.
    const onDocKey = (e: globalThis.KeyboardEvent) => {
      if (e.target === inputRef.current || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      if (isTextEntry(document.activeElement)) {
        return;
      }
      const idle = buf.text.length === 0;
      // With nothing buffered, leave Enter/Tab/Space to the page (keyboard navigation).
      if (idle && (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ')) {
        return;
      }
      if (buf.handleKey(e.key, e.timeStamp)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', onDocKey, true);
    return () => {
      document.removeEventListener('keydown', onDocKey, true);
      buf.dispose();
      bufferRef.current = null;
    };
  }, [capturing, mode, keyboard?.idleTimeoutMs, keyboard?.timing]);

  // Focus whichever input is live.
  useEffect(() => {
    if ((capturing && mode === 'keyboard') || manualInput) {
      const id = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: false }));
      return () => cancelAnimationFrame(id);
    }
  }, [capturing, manualInput, mode]);

  const onCaptureKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const buf = bufferRef.current;
    if (!buf) {
      return;
    }
    // IME/Android soft-keyboard paths report "Unidentified"; those arrive via onChange instead.
    if (e.key === 'Unidentified' || e.key === 'Process') {
      return;
    }
    if (buf.handleKey(e.key, e.timeStamp)) {
      e.preventDefault();
    }
  };

  const onCaptureChange = (e: ChangeEvent<HTMLInputElement>) => {
    const buf = bufferRef.current;
    const next = e.target.value;
    if (!buf) {
      return;
    }
    if (next.startsWith(preview)) {
      for (const c of next.slice(preview.length)) {
        buf.handleKey(c === '\n' ? 'Enter' : c, e.timeStamp);
      }
    }
  };

  const commitText = (raw: string, kind: 'capture' | 'edit') => {
    const t = raw.trim();
    if (!t) {
      if (kind === 'edit') {
        onEdit(null);
        setEditing(false);
      }
      return;
    }
    const r = parseHidInput(t, { defaultUnit: displayUnit, minMm, maxMm });
    if (!r.ok) {
      setError(failureReason(r));
      onRejectedRef.current?.(failureReason(r) ?? '');
      return;
    }
    setError(null);
    setText('');
    if (kind === 'capture') {
      onCaptureRef.current(manualMeasurement(r.valueMm, t));
    } else {
      onEdit(r.valueMm);
      setEditing(false);
    }
  };

  const startEdit = () => {
    setText(mmToInputText(value?.valueMm, displayUnit));
    setError(null);
    setEditing(true);
  };

  const unitHint = displayUnit === 'ft' ? `e.g. 7' 8"` : `in ${displayUnit}`;

  return (
    <div
      className={clsx(
        'rounded-[10px] border transition-colors',
        active ? 'border-primary-500 bg-background-800 shadow-sm' : 'border-background-600 bg-background-800',
        flash && 'ring-2 ring-success border-success'
      )}
    >
      {/* Summary row */}
      <div
        className={clsx('flex items-center gap-3 px-3 py-2.5', !active && onActivate && 'cursor-pointer')}
        onClick={!active && !editing ? onActivate : undefined}
      >
        <div className="min-w-0 flex-1">
          <div className={clsx('text-[13.5px] truncate', active ? 'font-semibold text-text-900' : 'text-text-800')}>
            {label}
          </div>
          {value && !editing && (
            <div className="mt-0.5">
              <SourceTag value={value} />
            </div>
          )}
        </div>
        {!editing && (
          <div
            className={clsx(
              'text-[15px] tabular-nums font-semibold text-right',
              value ? 'text-text-900' : 'text-text-500'
            )}
          >
            {value ? formatMm(value.valueMm, displayUnit) : '—'}
          </div>
        )}
        {flash && <Check size={18} className="text-success shrink-0" aria-label="Captured" />}
        {!active && !editing && (
          <button
            type="button"
            className="p-1.5 rounded-md text-text-600 hover:bg-background-700 hover:text-text-900"
            onClick={(e) => {
              e.stopPropagation();
              startEdit();
            }}
            aria-label={`Edit ${label}`}
          >
            <Pencil size={15} />
          </button>
        )}
      </div>

      {/* Active capture area */}
      {active && !editing && (
        <div className="px-3 pb-3">
          {hint && <p className="m-0 mb-2 text-[12px] text-text-600">{hint}</p>}

          {capturing ? (
            <div className="flex flex-col gap-2">
              <div
                className="flex items-center gap-2.5 px-3 py-3 rounded-lg border border-dashed border-primary-400 bg-primary-100"
                onClick={() => inputRef.current?.focus()}
              >
                <Radio size={18} className="text-primary-600 animate-pulse shrink-0" />
                {mode === 'keyboard' ? (
                  <input
                    ref={inputRef}
                    inputMode="none"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    aria-label={`${label} — waiting for the meter`}
                    placeholder="Waiting for measurement…"
                    value={preview}
                    onKeyDown={onCaptureKeyDown}
                    onChange={onCaptureChange}
                    className="flex-1 min-w-0 bg-transparent outline-none text-[15px] tabular-nums text-text-900 placeholder:text-text-600"
                  />
                ) : (
                  <span className="flex-1 text-[14px] text-text-700">
                    Waiting for measurement… press the meter’s measure button
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canTrigger && mode !== 'keyboard' && (
                  <button
                    type="button"
                    onClick={() =>
                      laserMeter.trigger().catch((e) => setError(e instanceof Error ? e.message : String(e)))
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium btn-raised-accent"
                  >
                    <Zap size={14} /> Measure
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTypingManually(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] border border-background-500 text-text-700 hover:bg-background-700"
                >
                  <Keyboard size={14} /> Type manually
                </button>
              </div>
            </div>
          ) : (
            <ManualInput
              inputRef={inputRef}
              text={text}
              setText={setText}
              placeholder={value ? mmToInputText(value.valueMm, displayUnit) : unitHint}
              onSubmit={() => commitText(text, 'capture')}
              onCancel={deviceMode ? () => setTypingManually(false) : undefined}
              submitLabel="Save"
            />
          )}
          {error && <p className="m-0 mt-2 text-[12.5px] text-error">{error}</p>}
        </div>
      )}

      {/* Inline edit of an existing value */}
      {editing && (
        <div className="px-3 pb-3">
          <ManualInput
            inputRef={inputRef}
            text={text}
            setText={setText}
            placeholder={unitHint}
            onSubmit={() => commitText(text, 'edit')}
            onCancel={() => {
              setEditing(false);
              setError(null);
            }}
            submitLabel="Update"
          />
          <p className="m-0 mt-1.5 text-[11.5px] text-text-600">Leave empty and press Update to clear the value.</p>
          {error && <p className="m-0 mt-1 text-[12.5px] text-error">{error}</p>}
        </div>
      )}
    </div>
  );
};

interface ManualInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  text: string;
  setText: (t: string) => void;
  placeholder: string;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
}

const ManualInput = ({ inputRef, text, setText, placeholder, onSubmit, onCancel, submitLabel }: ManualInputProps) => (
  <form
    className="flex items-center gap-2"
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
  >
    <input
      ref={inputRef}
      inputMode="decimal"
      enterKeyHint="done"
      autoComplete="off"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && onCancel) {
          e.preventDefault();
          onCancel();
        }
      }}
      placeholder={placeholder}
      className="flex-1 min-w-0 px-3 py-2 bg-background-700 border border-background-600 rounded-lg text-[15px] tabular-nums text-text-900 placeholder:text-text-500 focus:outline-none focus:ring-2 focus:ring-primary-700"
    />
    <button
      type="submit"
      className="px-3 py-2 rounded-lg text-[13px] font-semibold btn-raised-accent"
    >
      {submitLabel}
    </button>
    {onCancel && (
      <button
        type="button"
        onClick={onCancel}
        className="p-2 rounded-lg text-text-600 hover:bg-background-700"
        aria-label="Cancel"
      >
        <X size={16} />
      </button>
    )}
  </form>
);

export default MeasureField;
