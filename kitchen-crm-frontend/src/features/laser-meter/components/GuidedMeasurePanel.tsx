/**
 * Guided measuring UI: status + mode controls, the current target ("Now measuring: Wall 2 ·
 * Length"), and every target grouped as walls / ceiling / openings / service points. The active
 * target's MeasureField takes the next reading; after a capture it flashes and auto-advances.
 * Works identically with a Bluetooth meter, a keyboard meter or manual entry.
 */

import { Fragment, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, CircleCheckBig, Undo2 } from 'lucide-react';
import { MeasureField } from './MeasureField';
import { LaserStatusChip } from './LaserStatusChip';
import { LaserModeBar } from './LaserModeBar';
import { useLaserMeter } from '../hooks/useLaserMeter';
import { GROUP_LABELS } from '../core/guidedSequence';
import type { GuidedMeasure } from '../hooks/useGuidedMeasure';
import type { LaserSettings } from '../core/settings';

export interface GuidedMeasurePanelProps {
  guided: GuidedMeasure;
  settings: LaserSettings;
  bleSupported?: boolean;
  /** The Bluetooth Connect control (kept outside so screens can reuse it elsewhere). */
  bluetoothControls?: ReactNode;
  onStatusClick?: () => void;
}

export const GuidedMeasurePanel = ({
  guided,
  settings,
  bleSupported,
  bluetoothControls,
  onStatusClick,
}: GuidedMeasurePanelProps) => {
  const { state } = useLaserMeter();
  const { targets, values, current, currentKey, progress } = guided;
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  let lastGroup: string | null = null;

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <LaserStatusChip onClick={onStatusClick} />
        <LaserModeBar bleSupported={bleSupported} bluetoothControls={bluetoothControls} />
      </div>

      {/* Current target + progress, sticky so it stays visible while scrolling on a phone */}
      <div className="sticky top-0 z-10 py-1">
        <div className="flex items-center gap-2 rounded-[10px] border border-background-600 bg-background-800 px-3 py-2">
          <button
            type="button"
            onClick={guided.prev}
            className="p-1.5 rounded-md text-text-600 hover:bg-background-700 disabled:opacity-40"
            aria-label="Previous measurement"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            {current ? (
              <>
                <div className="text-[11px] uppercase tracking-wide text-text-500">Now measuring</div>
                <div className="text-[15px] font-semibold text-text-900 truncate">{current.label}</div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-[14px] font-semibold text-success">
                <CircleCheckBig size={18} /> All measurements captured
              </div>
            )}
            <div className="mt-1.5 h-1.5 rounded-full bg-background-600 overflow-hidden">
              <div className="h-full bg-success transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <span className="text-[12.5px] tabular-nums text-text-600 whitespace-nowrap">
            {progress.done}/{progress.total}
          </span>
          <button
            type="button"
            onClick={guided.undo}
            disabled={!guided.canUndo}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[13px] text-text-700 hover:bg-background-700 disabled:opacity-40"
            aria-label="Undo last reading"
          >
            <Undo2 size={16} /> <span className="hidden sm:inline">Undo</span>
          </button>
          <button
            type="button"
            onClick={guided.next}
            className="p-1.5 rounded-md text-text-600 hover:bg-background-700"
            aria-label="Next measurement"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Targets */}
      <div className="flex flex-col gap-2">
        {targets.length === 0 && (
          <p className="text-[13px] text-text-600">Add walls to the room layout to start measuring.</p>
        )}
        {targets.map((t) => {
          const header = t.group !== lastGroup ? GROUP_LABELS[t.group] : null;
          lastGroup = t.group;
          return (
            <Fragment key={t.key}>
              {header && (
                <h3 className="m-0 mt-2 text-[12px] font-semibold uppercase tracking-wide text-text-500">{header}</h3>
              )}
              <MeasureField
                label={t.label}
                hint={t.hint}
                value={values[t.key] ?? null}
                active={t.key === currentKey}
                flash={guided.flashKey === t.key}
                displayUnit={settings.displayUnit}
                mode={state.mode}
                canTrigger={state.canTrigger && state.status === 'connected'}
                minMm={settings.hid.minMm}
                maxMm={settings.hid.maxMm}
                keyboard={{ idleTimeoutMs: settings.hid.idleTimeoutMs, timing: settings.hid.timing }}
                onActivate={() => guided.setCurrent(t.key)}
                onCapture={(m) => guided.capture(t.key, m)}
                onEdit={(mm) => guided.edit(t.key, mm)}
                onRejected={guided.rejected}
              />
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default GuidedMeasurePanel;
