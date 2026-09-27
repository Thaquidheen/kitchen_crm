/**
 * The plan drawing (SVG, plan millimetres). Handles pan/zoom (drag, wheel, pinch), drawing a room
 * by tapping corners (snapped to straight lines / right angles), selecting and dragging corners and
 * items, and placing doors, windows, service points, cabinets, notes and arrows.
 *
 * The drawing is "paper": always light, so it reads the same in both themes and exports cleanly.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { SketchPlan, SketchWallItem, ApplianceKind, CabinetKind, OpeningKind, ServiceKind } from '../../core/sketch/types';
import { DEFAULT_SIZES } from '../../core/sketch/types';
import {
  bounds,
  dist,
  nearestWall,
  newSketchId,
  nextWallId,
  snapFrom,
  wallCornerIdx,
  wallCount,
  type Pt,
  type SolvedPlan,
} from '../../core/sketch/geometry';
import { placeItem, type PlacedItem } from '../../core/sketch/placement';
import { itemNames } from '../../core/sketch/targets';
import type { ValueMap } from '../../core/measurementSession';
import type { LengthUnit } from '../../core/types';
import { formatMm } from '../../core/units';

export type SketchTool =
  | 'select'
  | 'draw'
  | `opening:${OpeningKind}`
  | `service:${ServiceKind}`
  | `cabinet:${CabinetKind}`
  | `appliance:${ApplianceKind}`
  | 'note'
  | 'arrow';

export type SketchSelection =
  | { kind: 'wall'; id: string }
  | { kind: 'corner'; id: string }
  | { kind: 'item'; id: string }
  | { kind: 'annotation'; id: string };

export interface SketchCanvasHandle {
  fit: () => void;
  zoom: (factor: number) => void;
  svg: () => SVGSVGElement | null;
  /** A clean rendering for export: cropped to the drawing, no selection highlights or handles. */
  exportMarkup: () => Promise<{ xml: string; width: number; height: number }>;
}

const EXPORT_WIDTH = 1600;

export interface SketchCanvasProps {
  plan: SketchPlan;
  solved: SolvedPlan;
  values: ValueMap;
  tool: SketchTool;
  onToolDone: () => void;
  selection: SketchSelection | null;
  /** `item` is passed when the selection is an item that was just created. */
  onSelect: (sel: SketchSelection | null, item?: SketchWallItem) => void;
  /** Element of the field being measured right now (highlighted). */
  activeRef: SketchSelection | null;
  /** `commit` = one undo step (false while dragging). */
  onChange: (plan: SketchPlan, commit: boolean) => void;
  displayUnit: LengthUnit;
  className?: string;
}

const C = {
  paper: '#ffffff',
  grid: '#eef0f4',
  gridMajor: '#dfe3ea',
  room: '#f6f7fb',
  wall: '#1f2430',
  wallEst: '#9aa1ad',
  active: '#6d4aff',
  selected: '#0ea5e9',
  gap: '#e5484d',
  text: '#1f2430',
  textMuted: '#6b7280',
  opening: '#ffffff',
  cabinet: '#fde7c7',
  cabinetStroke: '#b7791f',
  appliance: '#e0f2fe',
  applianceStroke: '#0369a1',
  service: { water: '#2563eb', drain: '#475569', gas: '#ea580c', electrical: '#ca8a04', other: '#7c3aed' } as Record<
    ServiceKind,
    string
  >,
};

const SERVICE_LETTER: Record<ServiceKind, string> = { water: 'W', drain: 'D', gas: 'G', electrical: 'E', other: 'S' };

interface View {
  x: number;
  y: number;
  /** Pixels per millimetre. */
  k: number;
}

type Drag =
  | { type: 'pan'; startX: number; startY: number; view: View; moved: boolean }
  | { type: 'corner'; id: string; base: SketchPlan; moved: boolean }
  | { type: 'item'; id: string; base: SketchPlan; moved: boolean }
  | { type: 'note'; id: string; base: SketchPlan; dx: number; dy: number; moved: boolean }
  | { type: 'arrow'; from: Pt; to: Pt }
  | { type: 'pinch'; d0: number; view: View; mid: Pt };

export const SketchCanvas = forwardRef<SketchCanvasHandle, SketchCanvasProps>(function SketchCanvas(
  { plan, solved, values, tool, onToolDone, selection, onSelect, activeRef, onChange, displayUnit, className },
  ref
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ x: -600, y: -600, k: 0.12 });
  const [hover, setHover] = useState<Pt | null>(null);
  const drag = useRef<Drag | null>(null);
  const pointers = useRef(new Map<number, Pt>());
  const fitted = useRef(false);
  const [clean, setClean] = useState(false);
  const pendingExport = useRef<((r: { xml: string; width: number; height: number }) => void) | null>(null);

  const corners = solved.corners;
  const n = wallCount(plan);
  const names = useMemo(() => itemNames(plan), [plan]);
  const placed = useMemo(
    () => plan.items.map((it) => placeItem(plan, solved, values, it)).filter((p): p is PlacedItem => !!p),
    [plan, solved, values]
  );

  // ---------------------------------------------------------------- view

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const fit = useCallback(() => {
    const b = bounds(corners.length ? corners : [], 900);
    const k = Math.min(size.w / b.w, size.h / b.h);
    setView({ k, x: b.x - (size.w / k - b.w) / 2, y: b.y - (size.h / k - b.h) / 2 });
  }, [corners, size]);

  useEffect(() => {
    if (!fitted.current && size.w > 50 && size.h > 50) {
      fitted.current = true;
      fit();
    }
  }, [fit, size.w, size.h]);

  const zoomAt = useCallback((factor: number, at?: Pt) => {
    setView((v) => {
      const k = Math.min(3, Math.max(0.01, v.k * factor));
      const p = at ?? { x: v.x + size.w / v.k / 2, y: v.y + size.h / v.k / 2 };
      return { k, x: p.x - ((p.x - v.x) * v.k) / k, y: p.y - ((p.y - v.y) * v.k) / k };
    });
  }, [size]);

  useImperativeHandle(
    ref,
    () => ({
      fit,
      zoom: (f) => zoomAt(f),
      svg: () => svgRef.current,
      exportMarkup: () =>
        new Promise((resolve) => {
          pendingExport.current = resolve;
          setClean(true);
        }),
    }),
    [fit, zoomAt]
  );

  // Frame being rendered: the interactive view, or (while exporting) the whole drawing.
  const frame = useMemo(() => {
    if (clean) {
      const pts: Pt[] = [...corners];
      for (const a of plan.annotations) {
        if (a.type === 'note') {
          pts.push({ x: a.x, y: a.y });
        } else {
          pts.push({ x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 });
        }
      }
      const b = bounds(pts, 700);
      const k = EXPORT_WIDTH / b.w;
      return { x: b.x, y: b.y, w: b.w, h: b.h, k, W: EXPORT_WIDTH, H: Math.round(b.h * k) };
    }
    const W = size.w || 1;
    const H = size.h || 1;
    return { x: view.x, y: view.y, w: W / view.k, h: H / view.k, k: view.k, W, H };
  }, [clean, corners, plan.annotations, size, view]);

  useEffect(() => {
    if (clean && pendingExport.current && svgRef.current) {
      const xml = new XMLSerializer().serializeToString(svgRef.current);
      pendingExport.current({ xml, width: frame.W, height: frame.H });
      pendingExport.current = null;
      setClean(false);
    }
  }, [clean, frame]);

  const toWorld = (clientX: number, clientY: number): Pt => {
    const r = svgRef.current?.getBoundingClientRect();
    return { x: view.x + (clientX - (r?.left ?? 0)) / view.k, y: view.y + (clientY - (r?.top ?? 0)) / view.k };
  };
  const px = (p: number) => p / frame.k; // screen pixels → world mm

  // ---------------------------------------------------------------- hit testing

  const hitCorner = (p: Pt) => corners.find((c) => dist(c, p) < px(16));
  const hitItem = (p: Pt) => {
    for (const pl of [...placed].reverse()) {
      const { a, ux, uy, nx, ny } = pl.frame;
      const rel = { x: p.x - a.x, y: p.y - a.y };
      const along = rel.x * ux + rel.y * uy;
      const across = rel.x * nx + rel.y * ny;
      if (pl.item.type === 'cabinet' || pl.item.type === 'appliance') {
        if (along >= pl.offset && along <= pl.offset + pl.width && across >= 0 && across <= pl.item.depthMm) {
          return pl;
        }
      } else if (pl.item.type === 'service') {
        if (Math.hypot(along - pl.offset, across - px(14)) < px(14)) {
          return pl;
        }
      } else if (along >= pl.offset - px(6) && along <= pl.offset + pl.width + px(6) && Math.abs(across) < px(14)) {
        return pl;
      }
    }
    return null;
  };
  const hitAnnotation = (p: Pt) =>
    [...plan.annotations].reverse().find((a) =>
      a.type === 'note'
        ? Math.abs(p.x - a.x) < px(70) && Math.abs(p.y - a.y) < px(14)
        : distToSeg(p, { x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 }) < px(10)
    );

  // ---------------------------------------------------------------- editing helpers

  /** Bake the solved corner positions into the sketch so direct edits start from what is shown. */
  const baked = (): SketchPlan => ({ ...plan, corners: corners.map((c) => ({ ...c })) });

  const addItemAt = (p: Pt) => {
    const hit = nearestWall(plan, corners, p);
    if (!hit || hit.distance > px(60)) {
      return false;
    }
    const wallId = plan.walls[hit.wallIndex].id;
    const [type, kind] = tool.split(':') as [string, string];
    let item: SketchWallItem;
    if (type === 'opening') {
      const w = kind === 'door' ? DEFAULT_SIZES.door : kind === 'window' ? DEFAULT_SIZES.window : DEFAULT_SIZES.opening;
      item = { id: newSketchId('o'), type: 'opening', kind: kind as OpeningKind, wallId, widthMm: w, offsetMm: Math.max(0, Math.round(hit.along - w / 2)) };
    } else if (type === 'service') {
      item = { id: newSketchId('s'), type: 'service', kind: kind as ServiceKind, wallId, offsetMm: Math.round(hit.along) };
    } else if (type === 'appliance') {
      const k = kind as ApplianceKind;
      const [w, d] = DEFAULT_SIZES.appliance[k];
      item = { id: newSketchId('p'), type: 'appliance', kind: k, wallId, widthMm: w, depthMm: d, offsetMm: Math.max(0, Math.round(hit.along - w / 2)) };
    } else {
      const k = kind as CabinetKind;
      item = {
        id: newSketchId('k'),
        type: 'cabinet',
        kind: k,
        wallId,
        widthMm: DEFAULT_SIZES.cabinetWidth,
        depthMm: DEFAULT_SIZES.cabinetDepth[k],
        offsetMm: Math.max(0, Math.round(hit.along - DEFAULT_SIZES.cabinetWidth / 2)),
      };
    }
    onChange({ ...plan, items: [...plan.items, item] }, true);
    onSelect({ kind: 'item', id: item.id }, item);
    onToolDone();
    return true;
  };

  const drawTap = (p: Pt) => {
    const first = plan.corners[0];
    const last = plan.corners[plan.corners.length - 1];
    if (plan.closed || !last) {
      // Start a new room.
      const c = { id: newSketchId('c'), x: Math.round(p.x / 50) * 50, y: Math.round(p.y / 50) * 50 };
      onChange({ ...plan, corners: [c], walls: [], closed: false, items: [] }, true);
      return;
    }
    if (plan.corners.length >= 3 && dist(p, first) < px(24)) {
      onChange({ ...baked(), walls: [...plan.walls, { id: nextWallId(plan) }], closed: true }, true);
      onToolDone();
      return;
    }
    const q = snapFrom(last, p);
    if (dist(q, last) < 50) {
      return;
    }
    const c = { id: newSketchId('c'), ...q };
    onChange({ ...baked(), corners: [...corners, c], walls: [...plan.walls, { id: nextWallId(plan) }] }, true);
  };

  // ---------------------------------------------------------------- pointer handling

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    svgRef.current?.setPointerCapture(e.pointerId);
    const p = toWorld(e.clientX, e.clientY);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      drag.current = {
        type: 'pinch',
        d0: Math.hypot(a.x - b.x, a.y - b.y),
        view,
        mid: toWorld((a.x + b.x) / 2, (a.y + b.y) / 2),
      };
      return;
    }
    if (tool === 'draw') {
      drawTap(p);
      return;
    }
    if (tool.startsWith('opening:') || tool.startsWith('service:') || tool.startsWith('cabinet:') || tool.startsWith('appliance:')) {
      if (!addItemAt(p)) {
        drag.current = { type: 'pan', startX: e.clientX, startY: e.clientY, view, moved: false };
      }
      return;
    }
    if (tool === 'note') {
      const note = { id: newSketchId('n'), type: 'note' as const, x: p.x, y: p.y, text: 'Note' };
      onChange({ ...plan, annotations: [...plan.annotations, note] }, true);
      onSelect({ kind: 'annotation', id: note.id });
      onToolDone();
      return;
    }
    if (tool === 'arrow') {
      drag.current = { type: 'arrow', from: p, to: p };
      return;
    }
    // Select tool.
    const c = hitCorner(p);
    if (c) {
      onSelect({ kind: 'corner', id: c.id });
      drag.current = { type: 'corner', id: c.id, base: baked(), moved: false };
      return;
    }
    const it = hitItem(p);
    if (it) {
      onSelect({ kind: 'item', id: it.item.id });
      drag.current = { type: 'item', id: it.item.id, base: plan, moved: false };
      return;
    }
    const an = hitAnnotation(p);
    if (an) {
      onSelect({ kind: 'annotation', id: an.id });
      if (an.type === 'note') {
        drag.current = { type: 'note', id: an.id, base: plan, dx: p.x - an.x, dy: p.y - an.y, moved: false };
      }
      return;
    }
    const w = nearestWall(plan, corners, p);
    if (w && w.distance < px(14)) {
      onSelect({ kind: 'wall', id: plan.walls[w.wallIndex].id });
      return;
    }
    drag.current = { type: 'pan', startX: e.clientX, startY: e.clientY, view, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = toWorld(e.clientX, e.clientY);
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    setHover(p);
    const d = drag.current;
    if (!d) {
      return;
    }
    if (d.type === 'pinch') {
      const pts = Array.from(pointers.current.values());
      if (pts.length < 2) {
        return;
      }
      const dd = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const k = Math.min(3, Math.max(0.01, (d.view.k * dd) / (d.d0 || 1)));
      setView({ k, x: d.mid.x - ((d.mid.x - d.view.x) * d.view.k) / k, y: d.mid.y - ((d.mid.y - d.view.y) * d.view.k) / k });
      return;
    }
    if (d.type === 'pan') {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) {
        d.moved = true;
      }
      setView({ ...d.view, x: d.view.x - dx / d.view.k, y: d.view.y - dy / d.view.k });
      return;
    }
    if (d.type === 'corner') {
      d.moved = true;
      const i = d.base.corners.findIndex((c) => c.id === d.id);
      const neighbours = [d.base.corners[i - 1], d.base.corners[i + 1] ?? (d.base.closed ? d.base.corners[0] : undefined)].filter(Boolean) as Pt[];
      // Snap to line up with a neighbour horizontally/vertically.
      let q = { x: Math.round(p.x / 10) * 10, y: Math.round(p.y / 10) * 10 };
      for (const nb of neighbours) {
        if (Math.abs(q.x - nb.x) < px(10)) {
          q = { ...q, x: nb.x };
        }
        if (Math.abs(q.y - nb.y) < px(10)) {
          q = { ...q, y: nb.y };
        }
      }
      onChange({ ...d.base, corners: d.base.corners.map((c) => (c.id === d.id ? { ...c, ...q } : c)) }, false);
      return;
    }
    if (d.type === 'item') {
      const pl = placed.find((x) => x.item.id === d.id);
      if (!pl) {
        return;
      }
      d.moved = true;
      const along = (p.x - pl.frame.a.x) * pl.frame.ux + (p.y - pl.frame.a.y) * pl.frame.uy;
      const offset = Math.round(Math.max(0, Math.min(pl.frame.len - pl.width, along - pl.width / 2)) / 10) * 10;
      onChange({ ...d.base, items: d.base.items.map((it) => (it.id === d.id ? { ...it, offsetMm: offset } : it)) }, false);
      return;
    }
    if (d.type === 'note') {
      d.moved = true;
      onChange(
        { ...d.base, annotations: d.base.annotations.map((a) => (a.id === d.id && a.type === 'note' ? { ...a, x: p.x - d.dx, y: p.y - d.dy } : a)) },
        false
      );
      return;
    }
    if (d.type === 'arrow') {
      d.to = p;
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    const d = drag.current;
    drag.current = null;
    if (!d) {
      return;
    }
    if (d.type === 'pan' && !d.moved && tool === 'select') {
      onSelect(null);
    }
    if ((d.type === 'corner' || d.type === 'item' || d.type === 'note') && d.moved) {
      onChange(planRef.current, true);
    }
    if (d.type === 'arrow' && dist(d.from, d.to) > px(20)) {
      const a = { id: newSketchId('a'), type: 'arrow' as const, x1: d.from.x, y1: d.from.y, x2: d.to.x, y2: d.to.y };
      onChange({ ...plan, annotations: [...plan.annotations, a] }, true);
      onSelect({ kind: 'annotation', id: a.id });
      onToolDone();
    }
  };

  // Latest plan for committing a drag.
  const planRef = useRef(plan);
  planRef.current = plan;

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, toWorld(e.clientX, e.clientY));
  };

  // ---------------------------------------------------------------- rendering helpers

  const fs = px(clean ? 20 : 12.5); // label font size in world units (bigger in exported images)
  const isSel = (kind: SketchSelection['kind'], id: string) => !clean && selection?.kind === kind && selection.id === id;
  const isActive = (kind: SketchSelection['kind'], id: string) => !clean && activeRef?.kind === kind && activeRef.id === id;
  const fmt = (mm: number) => formatMm(Math.round(mm), displayUnit);

  const grid = useMemo(() => {
    const { x: fx, y: fy, w, h, k } = frame;
    const step = k > 0.08 ? 100 : 500;
    const lines: React.ReactElement[] = [];
    const x0 = Math.floor(fx / step) * step;
    const y0 = Math.floor(fy / step) * step;
    for (let x = x0; x < fx + w; x += step) {
      lines.push(<line key={`x${x}`} x1={x} y1={fy} x2={x} y2={fy + h} stroke={x % 1000 === 0 ? C.gridMajor : C.grid} vectorEffect="non-scaling-stroke" />);
    }
    for (let y = y0; y < fy + h; y += step) {
      lines.push(<line key={`y${y}`} x1={fx} y1={y} x2={fx + w} y2={y} stroke={y % 1000 === 0 ? C.gridMajor : C.grid} vectorEffect="non-scaling-stroke" />);
    }
    return lines;
  }, [frame]);

  const preview = (() => {
    if (clean || tool !== 'draw' || !hover || plan.closed || !plan.corners.length) {
      return null;
    }
    const last = corners[corners.length - 1];
    const first = corners[0];
    const closing = plan.corners.length >= 3 && dist(hover, first) < px(24);
    const q = closing ? first : snapFrom(last, hover);
    return (
      <g pointerEvents="none">
        <line x1={last.x} y1={last.y} x2={q.x} y2={q.y} stroke={C.active} strokeWidth={3} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
        <circle cx={q.x} cy={q.y} r={px(closing ? 10 : 5)} fill={closing ? C.active : C.paper} stroke={C.active} vectorEffect="non-scaling-stroke" />
        <text x={(last.x + q.x) / 2} y={(last.y + q.y) / 2 - px(8)} fontSize={fs} fill={C.active} textAnchor="middle" fontWeight={600}>
          {closing ? 'Close room' : fmt(dist(last, q))}
        </text>
      </g>
    );
  })();

  return (
    <div ref={wrapRef} className={className} style={{ touchAction: 'none', position: 'relative', overflow: 'hidden' }}>
      <svg
        ref={svgRef}
        width={frame.W}
        height={frame.H}
        viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', background: C.paper, cursor: tool === 'select' ? 'default' : 'crosshair', userSelect: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => setHover(null)}
        onWheel={onWheel}
        fontFamily="Inter, system-ui, sans-serif"
      >
        <defs>
          <marker id="lm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.text} />
          </marker>
        </defs>
        <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill={C.paper} />
        {grid}

        {plan.closed && corners.length >= 3 && (
          <polygon points={corners.map((c) => `${c.x},${c.y}`).join(' ')} fill={C.room} />
        )}

        {/* Cabinets and appliances (under walls) */}
        {placed
          .filter((p) => p.item.type === 'cabinet' || p.item.type === 'appliance')
          .map((p) => {
            const it = p.item as Extract<SketchWallItem, { type: 'cabinet' | 'appliance' }>;
            const { a, ux, uy, nx, ny } = p.frame;
            const s = { x: a.x + ux * p.offset, y: a.y + uy * p.offset };
            const pts = [
              s,
              { x: s.x + ux * p.width, y: s.y + uy * p.width },
              { x: s.x + ux * p.width + nx * it.depthMm, y: s.y + uy * p.width + ny * it.depthMm },
              { x: s.x + nx * it.depthMm, y: s.y + ny * it.depthMm },
            ];
            const cx = (pts[0].x + pts[2].x) / 2;
            const cy = (pts[0].y + pts[2].y) / 2;
            const hl = isSel('item', it.id) || isActive('item', it.id);
            return (
              <g key={it.id}>
                <polygon
                  points={pts.map((q) => `${q.x},${q.y}`).join(' ')}
                  fill={it.type === 'appliance' ? C.appliance : C.cabinet}
                  fillOpacity={it.kind === 'wall' || it.kind === 'hood' ? 0.55 : 1}
                  stroke={hl ? C.active : it.type === 'appliance' ? C.applianceStroke : C.cabinetStroke}
                  strokeWidth={hl ? 2.5 : 1.2}
                  strokeDasharray={it.kind === 'wall' || it.kind === 'hood' ? '5 4' : undefined}
                  vectorEffect="non-scaling-stroke"
                />
                {it.type === 'appliance' && <ApplianceSymbol kind={it.kind} pts={pts} />}
                <text
                  x={cx}
                  y={cy + fs / 3}
                  fontSize={Math.min(fs * 0.85, (Math.min(p.width, it.depthMm) * 0.92) / (names[it.id].length * 0.56))}
                  textAnchor="middle"
                  fill={it.type === 'appliance' ? C.applianceStroke : C.cabinetStroke}
                  pointerEvents="none"
                >
                  {names[it.id]}
                </text>
              </g>
            );
          })}

        {/* Walls */}
        {Array.from({ length: n }, (_, i) => {
          const [ia, ib] = wallCornerIdx(plan, i);
          const a = corners[ia];
          const b = corners[ib];
          if (!a || !b) {
            return null;
          }
          const w = plan.walls[i];
          const measured = solved.measured[i];
          const hl = isSel('wall', w.id) || isActive('wall', w.id);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          // Label outside the room.
          const len = dist(a, b) || 1;
          let nx = -(b.y - a.y) / len;
          let ny = (b.x - a.x) / len;
          if (plan.closed) {
            const cxr = corners.reduce((s, c) => s + c.x, 0) / corners.length;
            const cyr = corners.reduce((s, c) => s + c.y, 0) / corners.length;
            if ((mx - cxr) * nx + (my - cyr) * ny < 0) {
              nx = -nx;
              ny = -ny;
            }
          }
          const lx = mx + nx * px(22);
          const ly = my + ny * px(22);
          const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
          const upright = angle > 90 || angle < -90 ? angle + 180 : angle;
          return (
            <g key={w.id}>
              {hl && (
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isActive('wall', w.id) ? C.active : C.selected} strokeOpacity={0.25} strokeWidth={18} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              )}
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={hl ? (isActive('wall', w.id) ? C.active : C.selected) : measured ? C.wall : C.wallEst}
                strokeWidth={measured ? 6 : 4}
                strokeDasharray={measured ? undefined : '10 6'}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={lx}
                y={ly}
                fontSize={fs}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${upright} ${lx} ${ly})`}
                fill={measured ? C.text : C.textMuted}
                fontWeight={measured ? 600 : 400}
                pointerEvents="none"
              >
                {`W${i + 1} · ${measured ? '' : '≈'}${fmt(solved.lengths[i])}`}
              </text>
            </g>
          );
        })}

        {/* Gap when all walls are measured but the room doesn't close */}
        {plan.closed && solved.gapMm > 5 && corners.length >= 3 && (
          <g pointerEvents="none">
            <circle cx={corners[0].x} cy={corners[0].y} r={px(14)} fill="none" stroke={C.gap} strokeWidth={2} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
            <text x={corners[0].x} y={corners[0].y - px(22)} fontSize={fs} fill={C.gap} textAnchor="middle" fontWeight={600}>
              {`Doesn't close by ${fmt(solved.gapMm)}`}
            </text>
          </g>
        )}

        {/* Openings and service points */}
        {placed
          .filter((p) => p.item.type === 'opening' || p.item.type === 'service')
          .map((p) => {
            const { a, ux, uy, nx, ny } = p.frame;
            const it = p.item;
            const s = { x: a.x + ux * p.offset, y: a.y + uy * p.offset };
            const hl = isSel('item', it.id) || isActive('item', it.id);
            const stroke = hl ? C.active : C.wall;
            if (it.type === 'service') {
              const c = { x: s.x + nx * px(14), y: s.y + ny * px(14) };
              return (
                <g key={it.id}>
                  <line x1={s.x} y1={s.y} x2={c.x} y2={c.y} stroke={C.service[it.kind]} vectorEffect="non-scaling-stroke" />
                  <circle cx={c.x} cy={c.y} r={px(hl ? 11 : 9)} fill={C.service[it.kind]} stroke={hl ? C.active : '#fff'} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                  <text x={c.x} y={c.y} fontSize={fs * 0.9} fill="#fff" textAnchor="middle" dominantBaseline="central" fontWeight={700} pointerEvents="none">
                    {SERVICE_LETTER[it.kind]}
                  </text>
                </g>
              );
            }
            const e = { x: s.x + ux * p.width, y: s.y + uy * p.width };
            return (
              <g key={it.id}>
                <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={C.opening} strokeWidth={8} vectorEffect="non-scaling-stroke" />
                {it.type === 'opening' && it.kind === 'window' && (
                  <>
                    <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={stroke} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                    <line x1={s.x + nx * px(4)} y1={s.y + ny * px(4)} x2={e.x + nx * px(4)} y2={e.y + ny * px(4)} stroke={stroke} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
                    <line x1={s.x - nx * px(4)} y1={s.y - ny * px(4)} x2={e.x - nx * px(4)} y2={e.y - ny * px(4)} stroke={stroke} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
                  </>
                )}
                {it.type === 'opening' && it.kind === 'door' && (
                  <path
                    d={`M ${s.x} ${s.y} L ${s.x + nx * p.width} ${s.y + ny * p.width} A ${p.width} ${p.width} 0 0 ${swingSweep(ux, uy, nx, ny)} ${e.x} ${e.y}`}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={1.3}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                {[s, e].map((q, j) => (
                  <line key={j} x1={q.x - nx * px(7)} y1={q.y - ny * px(7)} x2={q.x + nx * px(7)} y2={q.y + ny * px(7)} stroke={stroke} strokeWidth={hl ? 2.5 : 1.5} vectorEffect="non-scaling-stroke" />
                ))}
                {hl && (
                  <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={C.active} strokeOpacity={0.3} strokeWidth={16} vectorEffect="non-scaling-stroke" />
                )}
              </g>
            );
          })}

        {/* Corners */}
        {!clean && (tool === 'select' || tool === 'draw')
          ? corners.map((c, i) => (
              <circle
                key={c.id}
                cx={c.x}
                cy={c.y}
                r={px(isSel('corner', c.id) ? 8 : tool === 'draw' && i === 0 && !plan.closed ? 9 : 5)}
                fill={isSel('corner', c.id) ? C.selected : C.paper}
                stroke={tool === 'draw' && i === 0 && !plan.closed ? C.active : C.wall}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ))
          : null}

        {/* Notes and arrows */}
        {plan.annotations.map((a) =>
          a.type === 'note' ? (
            <text
              key={a.id}
              x={a.x}
              y={a.y}
              fontSize={fs * 1.05}
              fill={isSel('annotation', a.id) ? C.selected : C.text}
              textAnchor="middle"
              dominantBaseline="middle"
              fontWeight={500}
              style={{ paintOrder: 'stroke' }}
              stroke={C.paper}
              strokeWidth={px(4)}
            >
              {a.text}
            </text>
          ) : (
            <g key={a.id}>
              <line
                x1={a.x1}
                y1={a.y1}
                x2={a.x2}
                y2={a.y2}
                stroke={isSel('annotation', a.id) ? C.selected : C.text}
                strokeWidth={1.6}
                markerEnd="url(#lm-arrow)"
                vectorEffect="non-scaling-stroke"
              />
              {a.text && (
                <text x={a.x1} y={a.y1 - px(8)} fontSize={fs} fill={C.text} textAnchor="middle">
                  {a.text}
                </text>
              )}
            </g>
          )
        )}

        {drag.current?.type === 'arrow' && (
          <line x1={drag.current.from.x} y1={drag.current.from.y} x2={hover?.x ?? drag.current.to.x} y2={hover?.y ?? drag.current.to.y} stroke={C.active} strokeDasharray="5 4" markerEnd="url(#lm-arrow)" vectorEffect="non-scaling-stroke" />
        )}
        {preview}
      </svg>
    </div>
  );
});

/** Plan symbols for appliances, drawn inside their footprint (pts: wall-start, wall-end, far-end, far-start). */
const ApplianceSymbol = ({ kind, pts }: { kind: ApplianceKind; pts: Pt[] }) => {
  const lerp = (u: number, v: number): Pt => {
    // u along the wall (0..1), v away from the wall (0..1)
    const a = { x: pts[0].x + (pts[1].x - pts[0].x) * u, y: pts[0].y + (pts[1].y - pts[0].y) * u };
    return { x: a.x + (pts[3].x - pts[0].x) * v, y: a.y + (pts[3].y - pts[0].y) * v };
  };
  const quad = (u0: number, v0: number, u1: number, v1: number) =>
    [lerp(u0, v0), lerp(u1, v0), lerp(u1, v1), lerp(u0, v1)].map((q) => `${q.x},${q.y}`).join(' ');
  const w = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
  const s = { stroke: '#0369a1', fill: 'none', strokeWidth: 1.2, vectorEffect: 'non-scaling-stroke' as const, pointerEvents: 'none' as const };
  if (kind === 'sink') {
    return <polygon points={quad(0.12, 0.15, 0.88, 0.8)} {...s} />;
  }
  if (kind === 'hob') {
    const r = w * 0.13;
    return (
      <>
        {[
          [0.28, 0.3],
          [0.72, 0.3],
          [0.28, 0.72],
          [0.72, 0.72],
        ].map(([u, v], i) => {
          const c = lerp(u, v);
          return <circle key={i} cx={c.x} cy={c.y} r={r} {...s} />;
        })}
      </>
    );
  }
  // Other appliances: a cross (conventional "appliance space" mark).
  const a = lerp(0.1, 0.1);
  const b = lerp(0.9, 0.9);
  const c = lerp(0.9, 0.1);
  const d = lerp(0.1, 0.9);
  return (
    <>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} {...s} />
      <line x1={c.x} y1={c.y} x2={d.x} y2={d.y} {...s} />
    </>
  );
};

const distToSeg = (p: Pt, a: Pt, b: Pt) => {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const l2 = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / l2));
  return Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t));
};

/** SVG arc sweep flag so a door swing opens into the room. */
const swingSweep = (ux: number, uy: number, nx: number, ny: number) => (ux * ny - uy * nx > 0 ? 0 : 1);

export default SketchCanvas;
