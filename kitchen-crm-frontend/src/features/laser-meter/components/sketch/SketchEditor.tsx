/**
 * Plan drawing + measuring, the way floor-plan survey apps work:
 *   draw the room (template, or tap corners) → tap a wall or item → take the reading (laser,
 *   keyboard meter or keypad) → the plan redraws to scale. Doors, windows, service points and
 *   cabinets sit on walls; the wall elevation shows heights and sills.
 *
 * Measured values go into the same guided session as the list view, so both stay in sync.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  AppWindow,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Download,
  Expand,
  Layers,
  MousePointer2,
  PenLine,
  Redo2,
  Rows3,
  Spline,
  StickyNote,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
  Plug,
  Square,
  CircleCheckBig,
  Refrigerator,
  FileImage,
} from 'lucide-react';
import { SketchCanvas, type SketchCanvasHandle, type SketchSelection, type SketchTool } from './SketchCanvas';
import { ElevationView } from './ElevationView';
import { MeasureField } from '../MeasureField';
import { LaserStatusChip } from '../LaserStatusChip';
import { LaserModeBar } from '../LaserModeBar';
import { useLaserMeter } from '../../hooks/useLaserMeter';
import type { GuidedMeasure } from '../../hooks/useGuidedMeasure';
import type { LaserSettings } from '../../core/settings';
import type { RoomLayout } from '../../core/guidedSequence';
import { DEFAULT_SIZES, emptySketch, type ApplianceKind, type CabinetKind, type ServiceKind, type SketchPlan, type SketchWallItem } from '../../core/sketch/types';
import { areaM2, newSketchId, nextWallId, perimeterMm, planFromTemplate, wallCount, type RoomTemplate } from '../../core/sketch/geometry';
import { solveWithValues } from '../../core/sketch/placement';
import { APPLIANCE_LABEL, CABINET_LABEL, SERVICE_LABEL, itemFieldKeys, itemNames, sketchFromListLayout, wallNumber } from '../../core/sketch/targets';
import { formatMm } from '../../core/units';

export interface SketchEditorProps {
  layout: RoomLayout;
  onLayoutChange: (layout: RoomLayout) => void;
  guided: GuidedMeasure;
  settings: LaserSettings;
  bleSupported?: boolean;
  bluetoothControls?: React.ReactNode;
}

const keyToRef = (key: string | null): SketchSelection | null => {
  if (!key) {
    return null;
  }
  const [type, id] = key.split('.');
  if (type === 'wall') {
    return { kind: 'wall', id };
  }
  if (type === 'opening' || type === 'service' || type === 'cabinet' || type === 'appliance') {
    return { kind: 'item', id };
  }
  return null;
};

const TEMPLATES: { id: RoomTemplate; label: string; shape: string }[] = [
  { id: 'rectangle', label: 'Rectangle', shape: 'M4,4 H36 V28 H4 Z' },
  { id: 'l-shape', label: 'L-shape', shape: 'M4,4 H36 V16 H20 V32 H4 Z' },
  { id: 'u-shape', label: 'U-shape', shape: 'M4,4 H14 V18 H26 V4 H36 V30 H4 Z' },
];

const toolBtn = (active: boolean) =>
  clsx(
    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium border transition-colors whitespace-nowrap',
    active ? 'bg-primary-100 border-primary-400 text-primary-800' : 'border-background-500 text-text-700 hover:bg-background-700'
  );

export const SketchEditor = ({ layout, onLayoutChange, guided, settings, bleSupported, bluetoothControls }: SketchEditorProps) => {
  const { state } = useLaserMeter();
  const plan = layout.sketch ?? emptySketch();
  const hasRoom = wallCount(plan) > 0;
  const canvasRef = useRef<SketchCanvasHandle>(null);
  const [tool, setTool] = useState<SketchTool>('select');
  const [selection, setSelection] = useState<SketchSelection | null>(null);
  const [menu, setMenu] = useState<'service' | 'cabinet' | 'appliance' | 'template' | null>(null);
  const [elevationWall, setElevationWall] = useState<string | null>(null);

  // ------------------------------------------------------------ drawing history (separate from readings)
  const past = useRef<SketchPlan[]>([]);
  const future = useRef<SketchPlan[]>([]);
  const committed = useRef<SketchPlan>(plan);
  const [, force] = useState(0);

  const setPlan = (next: SketchPlan, commit: boolean) => {
    if (commit) {
      past.current = [...past.current.slice(-49), committed.current];
      future.current = [];
      committed.current = next;
      force((x) => x + 1);
    }
    onLayoutChange({ ...layout, sketch: next });
  };
  const undoDrawing = () => {
    const prev = past.current.pop();
    if (prev) {
      future.current.push(committed.current);
      committed.current = prev;
      onLayoutChange({ ...layout, sketch: prev });
      force((x) => x + 1);
    }
  };
  const redoDrawing = () => {
    const next = future.current.pop();
    if (next) {
      past.current.push(committed.current);
      committed.current = next;
      onLayoutChange({ ...layout, sketch: next });
      force((x) => x + 1);
    }
  };

  const solved = useMemo(() => solveWithValues(plan, guided.values), [plan, guided.values]);
  const names = useMemo(() => itemNames(plan), [plan]);
  const targetByKey = useMemo(() => new Map(guided.targets.map((t) => [t.key, t])), [guided.targets]);

  // Follow the guided flow: whatever is being measured is selected on the drawing.
  const activeRef = keyToRef(guided.currentKey);
  useEffect(() => {
    const ref = keyToRef(guided.currentKey);
    if (ref) {
      setSelection(ref);
    } else if (guided.currentKey === 'ceiling.height') {
      setSelection(null);
    }
  }, [guided.currentKey]);

  const onSelect = (sel: SketchSelection | null, created?: SketchWallItem) => {
    setSelection(sel);
    setMenu(null);
    if (sel?.kind === 'wall') {
      guided.setCurrent(`wall.${sel.id}.length`);
      if (elevationWall) {
        setElevationWall(sel.id);
      }
    } else if (sel?.kind === 'item') {
      const it = created ?? plan.items.find((i) => i.id === sel.id);
      if (it) {
        const keys = itemFieldKeys(it, settings.sequence);
        guided.setCurrent(keys.find((k) => !guided.values[k]) ?? keys[0]);
      }
    }
  };

  const selectedItem = selection?.kind === 'item' ? plan.items.find((i) => i.id === selection.id) : undefined;
  const selectedWallIdx = selection?.kind === 'wall' ? plan.walls.findIndex((w) => w.id === selection.id) : -1;
  const selectedNote = selection?.kind === 'annotation' ? plan.annotations.find((a) => a.id === selection.id) : undefined;

  // ------------------------------------------------------------ edits

  const updateItem = (id: string, patch: Partial<SketchWallItem>) =>
    setPlan({ ...plan, items: plan.items.map((it) => (it.id === id ? ({ ...it, ...patch } as SketchWallItem) : it)) }, true);

  const deleteSelection = () => {
    if (!selection) {
      return;
    }
    if (selection.kind === 'item') {
      setPlan({ ...plan, items: plan.items.filter((i) => i.id !== selection.id) }, true);
    } else if (selection.kind === 'annotation') {
      setPlan({ ...plan, annotations: plan.annotations.filter((a) => a.id !== selection.id) }, true);
    } else if (selection.kind === 'corner') {
      deleteCorner(selection.id);
    }
    setSelection(null);
  };

  /** Remove a corner, merging its two walls (the earlier wall keeps its id and measurement key). */
  const deleteCorner = (cornerId: string) => {
    const i = plan.corners.findIndex((c) => c.id === cornerId);
    const min = plan.closed ? 4 : 3;
    if (i < 0 || plan.corners.length < min) {
      return;
    }
    const nC = plan.corners.length;
    const base = { ...plan, corners: solved.corners.map((c) => ({ ...c })) };
    const prevWall = plan.closed ? (i - 1 + nC) % nC : i - 1;
    const removedWall = i < plan.walls.length ? i : -1;
    const walls = [...plan.walls];
    let items = plan.items;
    if (prevWall >= 0 && removedWall >= 0) {
      const keepId = walls[prevWall].id;
      const shift = solved.lengths[prevWall] ?? 0;
      const removedId = walls[removedWall].id;
      items = items.map((it) => (it.wallId === removedId ? { ...it, wallId: keepId, offsetMm: it.offsetMm + shift } : it));
    }
    if (removedWall >= 0) {
      walls.splice(removedWall, 1);
    } else {
      walls.pop();
    }
    const corners = base.corners.filter((c) => c.id !== cornerId);
    setPlan({ ...base, corners, walls, items }, true);
  };

  /** Add a corner in the middle of a wall (e.g. to model a chimney breast). */
  const splitWall = (wallIndex: number) => {
    const base = solved.corners.map((c) => ({ ...c }));
    const a = base[wallIndex];
    const b = base[(wallIndex + 1) % base.length];
    const mid = { id: newSketchId('c'), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const corners = [...base.slice(0, wallIndex + 1), mid, ...base.slice(wallIndex + 1)];
    const walls = [...plan.walls];
    walls.splice(wallIndex + 1, 0, { id: nextWallId(plan) });
    setPlan({ ...plan, corners, walls }, true);
  };

  const startTemplate = (t: RoomTemplate) => {
    setPlan({ ...planFromTemplate(t, plan), annotations: plan.annotations }, true);
    setMenu(null);
    setTool('select');
    requestAnimationFrame(() => canvasRef.current?.fit());
  };

  const startDrawing = () => {
    if (hasRoom && !window.confirm('Start a new room? The current drawing will be replaced (measurements are kept).')) {
      return;
    }
    setPlan({ ...emptySketch(), annotations: plan.annotations }, true);
    setTool('draw');
    setSelection(null);
  };

  const finishOpenRun = () => {
    setTool('select');
    requestAnimationFrame(() => canvasRef.current?.fit());
  };

  const exportPng = () => {
    const svg = canvasRef.current?.svg();
    if (!svg) {
      return;
    }
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const w = svg.clientWidth;
    const h = svg.clientHeight;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w * 2;
      canvas.height = h * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob) {
          return;
        }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'site-plan.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  };

  const exportSvg = () => {
    const svg = canvasRef.current?.svg();
    if (!svg) {
      return;
    }
    const xml = new XMLSerializer().serializeToString(svg);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
    a.download = 'site-plan.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  // Escape returns to the select tool (when not typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) {
        return;
      }
      if (e.key === 'Escape') {
        setTool('select');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ------------------------------------------------------------ measure fields

  const field = (key: string, labelOverride?: string) => {
    const t = targetByKey.get(key);
    if (!t) {
      return null;
    }
    return (
      <MeasureField
        key={key}
        label={labelOverride ?? t.fieldLabel}
        hint={t.hint}
        value={guided.values[key] ?? null}
        active={guided.currentKey === key}
        flash={guided.flashKey === key}
        displayUnit={settings.displayUnit}
        mode={state.mode}
        canTrigger={state.canTrigger && state.status === 'connected'}
        minMm={key.endsWith('.offset') || key.endsWith('.sill') ? 0 : settings.hid.minMm}
        maxMm={settings.hid.maxMm}
        keyboard={{ idleTimeoutMs: settings.hid.idleTimeoutMs, timing: settings.hid.timing }}
        onActivate={() => guided.setCurrent(key)}
        onCapture={(m) => guided.capture(key, m)}
        onEdit={(mm) => guided.edit(key, mm)}
        onRejected={guided.rejected}
      />
    );
  };

  const fmt = (mm: number) => formatMm(Math.round(mm), settings.displayUnit);
  const area = areaM2(plan, solved.corners);
  const pct = guided.progress.total ? Math.round((guided.progress.done / guided.progress.total) * 100) : 0;

  // ------------------------------------------------------------ start screen

  if (!hasRoom && tool !== 'draw') {
    const listWalls = layout.wallCount;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <LaserStatusChip />
          <LaserModeBar bleSupported={bleSupported} bluetoothControls={bluetoothControls} />
        </div>
        <div className="rounded-[10px] border border-background-600 bg-background-800 p-4">
          <h3 className="m-0 text-[15px] font-semibold text-text-900">Draw the room</h3>
          <p className="m-0 mt-1 text-[13px] text-text-600">
            Start from a shape and adjust it, or tap each corner of the room. Then tap a wall and take the reading — the
            plan redraws to scale.
          </p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => startTemplate(t.id)}
                className="flex flex-col items-center gap-2 p-3 rounded-[10px] border border-background-500 hover:border-primary-500 hover:bg-background-700"
              >
                <svg viewBox="0 0 40 36" className="w-14 h-12">
                  <path d={t.shape} fill="#f1effe" stroke="#6d4aff" strokeWidth={2} />
                </svg>
                <span className="text-[13px] font-medium text-text-800">{t.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={startDrawing}
              className="flex flex-col items-center gap-2 p-3 rounded-[10px] border border-background-500 hover:border-primary-500 hover:bg-background-700"
            >
              <Spline size={36} className="text-primary-600" />
              <span className="text-[13px] font-medium text-text-800">Tap corners</span>
            </button>
          </div>
          {listWalls > 0 && (layout.openings.length > 0 || layout.servicePoints.length > 0 || Object.keys(guided.values).length > 0) && (
            <button
              type="button"
              onClick={() => setPlan(sketchFromListLayout(layout), true)}
              className="mt-3 text-[13px] text-primary-700 underline underline-offset-2"
            >
              Start from the list ({listWalls} walls, {layout.openings.length} openings, {layout.servicePoints.length} service points)
            </button>
          )}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------ editor

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <LaserStatusChip />
        <LaserModeBar bleSupported={bleSupported} bluetoothControls={bluetoothControls} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 relative">
        <button type="button" className={toolBtn(tool === 'select')} onClick={() => setTool('select')}>
          <MousePointer2 size={14} /> Select
        </button>
        <button type="button" className={toolBtn(tool === 'draw')} onClick={startDrawing}>
          <PenLine size={14} /> Draw room
        </button>
        <button type="button" className={toolBtn(tool === 'opening:door')} onClick={() => setTool('opening:door')}>
          <DoorOpen size={14} /> Door
        </button>
        <button type="button" className={toolBtn(tool === 'opening:window')} onClick={() => setTool('opening:window')}>
          <AppWindow size={14} /> Window
        </button>
        <button type="button" className={toolBtn(tool === 'opening:opening')} onClick={() => setTool('opening:opening')}>
          <Square size={14} /> Opening
        </button>
        <div className="relative">
          <button type="button" className={toolBtn(tool.startsWith('service:'))} onClick={() => setMenu(menu === 'service' ? null : 'service')}>
            <Plug size={14} /> Service point ▾
          </button>
          {menu === 'service' && (
            <div className="absolute z-20 mt-1 w-44 rounded-lg border border-background-500 bg-background-800 shadow-lg py-1">
              {(Object.keys(SERVICE_LABEL) as ServiceKind[]).map((k) => (
                <button key={k} type="button" className="block w-full text-left px-3 py-1.5 text-[13px] hover:bg-background-700" onClick={() => { setTool(`service:${k}`); setMenu(null); }}>
                  {SERVICE_LABEL[k]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button type="button" className={toolBtn(tool.startsWith('cabinet:'))} onClick={() => setMenu(menu === 'cabinet' ? null : 'cabinet')}>
            <Rows3 size={14} /> Cabinet ▾
          </button>
          {menu === 'cabinet' && (
            <div className="absolute z-20 mt-1 w-40 rounded-lg border border-background-500 bg-background-800 shadow-lg py-1">
              {(Object.keys(CABINET_LABEL) as CabinetKind[]).map((k) => (
                <button key={k} type="button" className="block w-full text-left px-3 py-1.5 text-[13px] hover:bg-background-700" onClick={() => { setTool(`cabinet:${k}`); setMenu(null); }}>
                  {CABINET_LABEL[k]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button type="button" className={toolBtn(tool.startsWith('appliance:'))} onClick={() => setMenu(menu === 'appliance' ? null : 'appliance')}>
            <Refrigerator size={14} /> Appliance ▾
          </button>
          {menu === 'appliance' && (
            <div className="absolute z-20 mt-1 w-44 rounded-lg border border-background-500 bg-background-800 shadow-lg py-1">
              {(Object.keys(APPLIANCE_LABEL) as ApplianceKind[]).map((k) => (
                <button key={k} type="button" className="block w-full text-left px-3 py-1.5 text-[13px] hover:bg-background-700" onClick={() => { setTool(`appliance:${k}`); setMenu(null); }}>
                  {APPLIANCE_LABEL[k]}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className={toolBtn(tool === 'note')} onClick={() => setTool('note')}>
          <StickyNote size={14} /> Note
        </button>
        <button type="button" className={toolBtn(tool === 'arrow')} onClick={() => setTool('arrow')}>
          <ArrowUpRight size={14} /> Arrow
        </button>

        <span className="flex-1" />
        <button type="button" className={toolBtn(false)} onClick={undoDrawing} disabled={!past.current.length} title="Undo drawing">
          <Undo2 size={14} />
        </button>
        <button type="button" className={toolBtn(false)} onClick={redoDrawing} disabled={!future.current.length} title="Redo drawing">
          <Redo2 size={14} />
        </button>
        <button type="button" className={toolBtn(false)} onClick={() => canvasRef.current?.zoom(1 / 1.25)} title="Zoom out">
          <ZoomOut size={14} />
        </button>
        <button type="button" className={toolBtn(false)} onClick={() => canvasRef.current?.zoom(1.25)} title="Zoom in">
          <ZoomIn size={14} />
        </button>
        <button type="button" className={toolBtn(false)} onClick={() => canvasRef.current?.fit()} title="Fit to screen">
          <Expand size={14} />
        </button>
        <button type="button" className={toolBtn(false)} onClick={exportPng} title="Download the plan as a PNG image">
          <FileImage size={14} /> PNG
        </button>
        <button type="button" className={toolBtn(false)} onClick={exportSvg} title="Download the plan as SVG (opens in CAD/vector tools)">
          <Download size={14} /> SVG
        </button>
      </div>

      {/* Tool hint */}
      {tool !== 'select' && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-primary-100 px-3 py-2 text-[13px] text-primary-800">
          {tool === 'draw' &&
            (plan.corners.length === 0
              ? 'Tap the first corner of the room.'
              : 'Tap the next corner. Walls snap straight and square. Tap the first corner to close the room.')}
          {tool.startsWith('opening:') && 'Tap on a wall to place it. Drag it along the wall afterwards.'}
          {tool.startsWith('service:') && 'Tap on a wall where the point is.'}
          {tool.startsWith('cabinet:') && 'Tap on a wall to place a cabinet run.'}
          {tool.startsWith('appliance:') && 'Tap on a wall to place the appliance.'}
          {tool === 'note' && 'Tap where the note should go.'}
          {tool === 'arrow' && 'Drag from where the arrow starts to where it points.'}
          <span className="flex-1" />
          {tool === 'draw' && plan.corners.length >= 2 && !plan.closed && (
            <button type="button" className="underline" onClick={finishOpenRun}>
              Finish without closing
            </button>
          )}
          <button type="button" className="underline" onClick={() => setTool('select')}>
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-3">
        {/* Drawing */}
        <div className="flex flex-col gap-3 min-w-0">
          <div className="rounded-[10px] border border-background-600 overflow-hidden">
            <SketchCanvas
              ref={canvasRef}
              plan={plan}
              solved={solved}
              values={guided.values}
              tool={tool}
              onToolDone={() => setTool('select')}
              selection={selection}
              onSelect={onSelect}
              activeRef={activeRef}
              onChange={setPlan}
              displayUnit={settings.displayUnit}
              className="h-[52vh] min-h-[320px] lg:h-[62vh]"
            />
          </div>
          {elevationWall && (
            <div className="rounded-[10px] border border-background-600 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-background-600 bg-background-800">
                <span className="text-[13px] font-semibold text-text-900">
                  Elevation · Wall {wallNumber(plan, elevationWall)}
                </span>
                <button type="button" className="text-[12.5px] text-text-600 underline" onClick={() => setElevationWall(null)}>
                  Close
                </button>
              </div>
              <div className="h-[32vh] min-h-[220px]">
                <ElevationView
                  plan={plan}
                  solved={solved}
                  values={guided.values}
                  wallId={elevationWall}
                  selectedItemId={selectedItem?.id ?? null}
                  onSelectItem={(id) => onSelect({ kind: 'item', id })}
                  displayUnit={settings.displayUnit}
                />
              </div>
            </div>
          )}
        </div>

        {/* Inspector */}
        <div className="flex flex-col gap-3">
          {/* Guided progress */}
          <div className="rounded-[10px] border border-background-600 bg-background-800 px-3 py-2">
            <div className="flex items-center gap-2">
              <button type="button" onClick={guided.prev} className="p-1 rounded-md text-text-600 hover:bg-background-700" aria-label="Previous measurement">
                <ChevronLeft size={18} />
              </button>
              <div className="min-w-0 flex-1">
                {guided.current ? (
                  <>
                    <div className="text-[11px] uppercase tracking-wide text-text-500">Now measuring</div>
                    <div className="text-[14px] font-semibold text-text-900 truncate">{guided.current.label}</div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-[13.5px] font-semibold text-success">
                    <CircleCheckBig size={16} /> Everything measured
                  </div>
                )}
              </div>
              <span className="text-[12px] tabular-nums text-text-600">
                {guided.progress.done}/{guided.progress.total}
              </span>
              <button type="button" onClick={guided.undo} disabled={!guided.canUndo} className="p-1 rounded-md text-text-600 hover:bg-background-700 disabled:opacity-40" aria-label="Undo last reading" title="Undo last reading">
                <Undo2 size={16} />
              </button>
              <button type="button" onClick={guided.next} className="p-1 rounded-md text-text-600 hover:bg-background-700" aria-label="Next measurement">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-background-600 overflow-hidden">
              <div className="h-full bg-success transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="rounded-[10px] border border-background-600 bg-background-800 p-3 flex flex-col gap-2.5">
            {selectedWallIdx >= 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="m-0 text-[14px] font-semibold text-text-900">Wall {selectedWallIdx + 1}</h3>
                  <span className="text-[12px] text-text-600">{solved.measured[selectedWallIdx] ? 'Measured' : `≈ ${fmt(solved.lengths[selectedWallIdx] ?? 0)}`}</span>
                </div>
                {field(`wall.${plan.walls[selectedWallIdx].id}.length`, 'Length')}
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className={toolBtn(elevationWall === plan.walls[selectedWallIdx].id)} onClick={() => setElevationWall(elevationWall === plan.walls[selectedWallIdx].id ? null : plan.walls[selectedWallIdx].id)}>
                    <Layers size={14} /> Elevation
                  </button>
                  <button type="button" className={toolBtn(false)} onClick={() => splitWall(selectedWallIdx)}>
                    <Spline size={14} /> Add corner
                  </button>
                </div>
                <ItemList plan={plan} wallId={plan.walls[selectedWallIdx].id} names={names} onPick={(id) => onSelect({ kind: 'item', id })} />
              </>
            )}

            {selectedItem && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="m-0 text-[14px] font-semibold text-text-900 truncate">
                    {names[selectedItem.id]} <span className="font-normal text-text-600">· wall {wallNumber(plan, selectedItem.wallId)}</span>
                  </h3>
                  <button type="button" className="p-1.5 rounded-md text-text-600 hover:text-error hover:bg-background-700" onClick={deleteSelection} aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1 text-[12px] text-text-600">
                    Type
                    <select
                      className="px-2 py-1.5 bg-background-700 border border-background-600 rounded-md text-[13px] text-text-900"
                      value={selectedItem.kind}
                      onChange={(e) => {
                        const kind = e.target.value;
                        if (selectedItem.type === 'cabinet') {
                          const k = kind as CabinetKind;
                          updateItem(selectedItem.id, { kind: k, depthMm: DEFAULT_SIZES.cabinetDepth[k] } as Partial<SketchWallItem>);
                        } else if (selectedItem.type === 'appliance') {
                          const k = kind as ApplianceKind;
                          const [w, d] = DEFAULT_SIZES.appliance[k];
                          updateItem(selectedItem.id, { kind: k, widthMm: w, depthMm: d } as Partial<SketchWallItem>);
                        } else {
                          updateItem(selectedItem.id, { kind } as Partial<SketchWallItem>);
                        }
                      }}
                    >
                      {selectedItem.type === 'opening' &&
                        ['door', 'window', 'opening'].map((k) => (
                          <option key={k} value={k}>
                            {k[0].toUpperCase() + k.slice(1)}
                          </option>
                        ))}
                      {selectedItem.type === 'service' &&
                        (Object.keys(SERVICE_LABEL) as ServiceKind[]).map((k) => (
                          <option key={k} value={k}>
                            {SERVICE_LABEL[k]}
                          </option>
                        ))}
                      {selectedItem.type === 'appliance' &&
                        (Object.keys(APPLIANCE_LABEL) as ApplianceKind[]).map((k) => (
                          <option key={k} value={k}>
                            {APPLIANCE_LABEL[k]}
                          </option>
                        ))}
                      {selectedItem.type === 'cabinet' &&
                        (Object.keys(CABINET_LABEL) as CabinetKind[]).map((k) => (
                          <option key={k} value={k}>
                            {CABINET_LABEL[k]}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-[12px] text-text-600">
                    Label
                    <input
                      className="px-2 py-1.5 bg-background-700 border border-background-600 rounded-md text-[13px] text-text-900"
                      value={selectedItem.label ?? ''}
                      placeholder={names[selectedItem.id]}
                      onChange={(e) => updateItem(selectedItem.id, { label: e.target.value })}
                    />
                  </label>
                  {(selectedItem.type === 'cabinet' || selectedItem.type === 'appliance') && (
                    <label className="flex flex-col gap-1 text-[12px] text-text-600">
                      Depth (mm)
                      <input
                        type="number"
                        min={100}
                        className="px-2 py-1.5 bg-background-700 border border-background-600 rounded-md text-[13px] text-text-900"
                        value={selectedItem.depthMm}
                        onChange={(e) => updateItem(selectedItem.id, { depthMm: Math.max(100, Number(e.target.value) || 600) } as Partial<SketchWallItem>)}
                      />
                    </label>
                  )}
                </div>
                {itemFieldKeys(selectedItem, settings.sequence).map((k) => field(k))}
                <button type="button" className={toolBtn(elevationWall === selectedItem.wallId)} onClick={() => setElevationWall(elevationWall === selectedItem.wallId ? null : selectedItem.wallId)}>
                  <Layers size={14} /> Elevation of this wall
                </button>
              </>
            )}

            {selection?.kind === 'corner' && (
              <>
                <h3 className="m-0 text-[14px] font-semibold text-text-900">Corner</h3>
                <p className="m-0 text-[12.5px] text-text-600">Drag the corner to reshape the room. Measured walls keep their length.</p>
                <button type="button" className={toolBtn(false)} onClick={deleteSelection}>
                  <Trash2 size={14} /> Remove corner
                </button>
              </>
            )}

            {selectedNote && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="m-0 text-[14px] font-semibold text-text-900">{selectedNote.type === 'note' ? 'Note' : 'Arrow'}</h3>
                  <button type="button" className="p-1.5 rounded-md text-text-600 hover:text-error hover:bg-background-700" onClick={deleteSelection} aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
                <input
                  autoFocus
                  className="px-3 py-2 bg-background-700 border border-background-600 rounded-lg text-[13.5px] text-text-900"
                  value={selectedNote.text ?? ''}
                  placeholder={selectedNote.type === 'arrow' ? 'Label (optional)' : 'Note text'}
                  onChange={(e) =>
                    setPlan(
                      { ...plan, annotations: plan.annotations.map((a) => (a.id === selectedNote.id ? { ...a, text: e.target.value } : a)) },
                      false
                    )
                  }
                  onBlur={() => setPlan(plan, true)}
                />
              </>
            )}

            {!selection && (
              <>
                <h3 className="m-0 text-[14px] font-semibold text-text-900">Room</h3>
                <div className="grid grid-cols-2 gap-2 text-[12.5px]">
                  <div className="rounded-lg bg-background-700 px-2.5 py-2">
                    <div className="text-text-500">Floor area</div>
                    <div className="text-[14px] font-semibold text-text-900 tabular-nums">{area !== null ? `${area.toFixed(2)} m²` : '—'}</div>
                  </div>
                  <div className="rounded-lg bg-background-700 px-2.5 py-2">
                    <div className="text-text-500">Perimeter</div>
                    <div className="text-[14px] font-semibold text-text-900 tabular-nums">{fmt(perimeterMm(plan, solved.corners))}</div>
                  </div>
                </div>
                {plan.closed && solved.gapMm > 5 && (
                  <p className="m-0 text-[12.5px] text-error">
                    All walls are measured but the room doesn’t close by {fmt(solved.gapMm)}. Re-check a wall, or add a corner
                    where the walls aren’t square.
                  </p>
                )}
                {field('ceiling.height', 'Ceiling height')}
                <p className="m-0 text-[12.5px] text-text-600">
                  Tap a wall on the drawing to measure it. Dashed walls are estimates; they firm up as you measure.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map((t) => (
                    <button key={t.id} type="button" className={toolBtn(false)} onClick={() => window.confirm(`Replace the drawing with a ${t.label.toLowerCase()} room? Measurements are kept.`) && startTemplate(t.id)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ItemList = ({ plan, wallId, names, onPick }: { plan: SketchPlan; wallId: string; names: Record<string, string>; onPick: (id: string) => void }) => {
  const items = plan.items.filter((i) => i.wallId === wallId).sort((a, b) => a.offsetMm - b.offsetMm);
  if (!items.length) {
    return <p className="m-0 text-[12.5px] text-text-500">No doors, windows, points or cabinets on this wall yet — use the toolbar to add them.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <button key={i.id} type="button" onClick={() => onPick(i.id)} className="px-2 py-1 rounded-md border border-background-500 text-[12.5px] text-text-700 hover:bg-background-700">
          {names[i.id]}
        </button>
      ))}
    </div>
  );
};

export default SketchEditor;
