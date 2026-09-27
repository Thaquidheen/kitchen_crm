/**
 * Plan geometry: drawing helpers (snapping, hit testing), room templates, area/perimeter, and the
 * "redraw to scale" solver.
 *
 * Solver model (how floor-plan survey apps behave): each wall keeps the *direction* it was sketched
 * with; a measured wall gets its measured length and is locked; unmeasured walls are resized as
 * little as possible so the room still closes. If every wall is measured and the room doesn't
 * close, nothing is fudged — the remaining gap is reported so the surveyor can re-check a wall.
 */

import type { SketchCorner, SketchPlan } from './types';

export interface Pt {
  x: number;
  y: number;
}

export const newSketchId = (prefix = ''): string =>
  `${prefix}${Math.random().toString(36).slice(2, 8)}`;

export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

export const wallCount = (plan: SketchPlan): number =>
  plan.closed ? plan.corners.length : Math.max(0, plan.corners.length - 1);

/** Corner indices of wall i. */
export const wallCornerIdx = (plan: SketchPlan, i: number): [number, number] => [
  i,
  (i + 1) % plan.corners.length,
];

// ------------------------------------------------------------------------------------------------
// Drawing helpers
// ------------------------------------------------------------------------------------------------

export interface SnapOptions {
  /** Snap the direction to multiples of this many degrees when within `angleToleranceDeg`. */
  angleStepDeg?: number;
  angleToleranceDeg?: number;
  /** Round the length to this many mm. */
  lengthStepMm?: number;
}

/** Snap the next corner relative to the previous one: straight / right angles and round lengths. */
export const snapFrom = (prev: Pt, p: Pt, opts: SnapOptions = {}): Pt => {
  const step = opts.angleStepDeg ?? 45;
  const tol = opts.angleToleranceDeg ?? 10;
  const lenStep = opts.lengthStepMm ?? 50;
  const dx = p.x - prev.x;
  const dy = p.y - prev.y;
  let len = Math.hypot(dx, dy);
  if (len < 1) {
    return { ...prev };
  }
  let ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const snapped = Math.round(ang / step) * step;
  if (Math.abs(snapped - ang) <= tol) {
    ang = snapped;
  }
  len = Math.max(lenStep, Math.round(len / lenStep) * lenStep);
  const r = (ang * Math.PI) / 180;
  return { x: round1(prev.x + Math.cos(r) * len), y: round1(prev.y + Math.sin(r) * len) };
};

const round1 = (v: number) => Math.round(v * 10) / 10;

export interface WallProjection {
  wallIndex: number;
  /** 0..1 along the wall. */
  t: number;
  /** Distance from the wall's start corner, in plan mm. */
  along: number;
  /** Perpendicular distance from the point to the wall. */
  distance: number;
}

export const projectOnSegment = (p: Pt, a: Pt, b: Pt) => {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2));
  const q = { x: a.x + vx * t, y: a.y + vy * t };
  return { t, along: t * Math.sqrt(len2), distance: dist(p, q), point: q };
};

/** Nearest wall to a point (using the given corner positions, e.g. the solved ones). */
export const nearestWall = (plan: SketchPlan, corners: Pt[], p: Pt): WallProjection | null => {
  let best: WallProjection | null = null;
  for (let i = 0; i < wallCount(plan); i++) {
    const [ia, ib] = wallCornerIdx(plan, i);
    const pr = projectOnSegment(p, corners[ia], corners[ib]);
    if (!best || pr.distance < best.distance) {
      best = { wallIndex: i, t: pr.t, along: pr.along, distance: pr.distance };
    }
  }
  return best;
};

/** Unit direction and inward normal of wall i (inward = towards the room's inside). */
export const wallFrame = (plan: SketchPlan, corners: Pt[], i: number) => {
  const [ia, ib] = wallCornerIdx(plan, i);
  const a = corners[ia];
  const b = corners[ib];
  const len = dist(a, b) || 1;
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  // For a closed room, "inside" depends on winding; signedArea > 0 means clockwise on screen (y down).
  const sign = plan.closed && signedArea(corners) < 0 ? -1 : 1;
  return { a, b, len, ux, uy, nx: -uy * sign, ny: ux * sign };
};

// ------------------------------------------------------------------------------------------------
// Measures
// ------------------------------------------------------------------------------------------------

/** Shoelace; positive when corners run clockwise on screen (y axis pointing down). */
export const signedArea = (pts: Pt[]): number => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
};

/** Floor area in m² (closed rooms only). */
export const areaM2 = (plan: SketchPlan, corners: Pt[]): number | null =>
  plan.closed && corners.length >= 3 ? Math.abs(signedArea(corners)) / 1e6 : null;

export const perimeterMm = (plan: SketchPlan, corners: Pt[]): number => {
  let s = 0;
  for (let i = 0; i < wallCount(plan); i++) {
    const [ia, ib] = wallCornerIdx(plan, i);
    s += dist(corners[ia], corners[ib]);
  }
  return s;
};

// ------------------------------------------------------------------------------------------------
// Redraw to scale
// ------------------------------------------------------------------------------------------------

export interface SolvedPlan {
  /** Corner positions to draw (plan mm). */
  corners: SketchCorner[];
  /** Length used for each wall (measured, or estimated). */
  lengths: number[];
  measured: boolean[];
  /** Distance by which a closed room fails to close with the given measurements (0 = closes). */
  gapMm: number;
}

/**
 * Lay the room out with measured lengths. `measuredLengths` maps wall id → measured mm.
 * Unmeasured walls start from their sketched length (rescaled by how far off the sketch was on the
 * measured walls) and are then adjusted by the minimum amount that closes the room.
 */
export const solvePlan = (plan: SketchPlan, measuredLengths: Record<string, number | undefined>): SolvedPlan => {
  const n = wallCount(plan);
  const cs = plan.corners;
  if (n === 0) {
    return { corners: cs.map((c) => ({ ...c })), lengths: [], measured: [], gapMm: 0 };
  }
  const dirs: Pt[] = [];
  const sketchLen: number[] = [];
  for (let i = 0; i < n; i++) {
    const [ia, ib] = wallCornerIdx(plan, i);
    const len = dist(cs[ia], cs[ib]);
    sketchLen.push(len);
    dirs.push(len > 0 ? { x: (cs[ib].x - cs[ia].x) / len, y: (cs[ib].y - cs[ia].y) / len } : { x: 1, y: 0 });
  }
  const measured = plan.walls.slice(0, n).map((w) => {
    const v = measuredLengths[w.id];
    return typeof v === 'number' && v > 0;
  });

  // Scale the sketch by how the measured walls compare to how they were drawn.
  let mSum = 0;
  let sSum = 0;
  measured.forEach((m, i) => {
    if (m) {
      mSum += measuredLengths[plan.walls[i].id] as number;
      sSum += sketchLen[i];
    }
  });
  const scale = mSum > 0 && sSum > 0 ? mSum / sSum : 1;
  const lengths = sketchLen.map((l, i) => (measured[i] ? (measuredLengths[plan.walls[i].id] as number) : l * scale));

  let gapMm = 0;
  if (plan.closed) {
    const free = lengths.map((_, i) => i).filter((i) => !measured[i]);
    // Residual r = Σ L_i d_i must become 0 by changing only free lengths: minimise Σ Δ² s.t. A Δ = -r.
    const residual = (ls: number[]) =>
      ls.reduce((acc, l, i) => ({ x: acc.x + l * dirs[i].x, y: acc.y + l * dirs[i].y }), { x: 0, y: 0 });
    if (free.length) {
      const r = residual(lengths);
      // A A^T (2x2) over free walls.
      let a = 0;
      let b = 0;
      let d = 0;
      for (const i of free) {
        a += dirs[i].x * dirs[i].x;
        b += dirs[i].x * dirs[i].y;
        d += dirs[i].y * dirs[i].y;
      }
      const det = a * d - b * b;
      let lx: number;
      let ly: number;
      if (Math.abs(det) > 1e-9) {
        lx = (d * -r.x - b * -r.y) / det;
        ly = (-b * -r.x + a * -r.y) / det;
      } else {
        // Free walls all parallel: can only fix the component along them.
        const u = dirs[free[0]];
        const k = (-r.x * u.x + -r.y * u.y) / (free.length || 1);
        lx = k * u.x;
        ly = k * u.y;
      }
      for (const i of free) {
        lengths[i] = Math.max(1, lengths[i] + dirs[i].x * lx + dirs[i].y * ly);
      }
    }
    const r2 = residual(lengths);
    gapMm = Math.round(Math.hypot(r2.x, r2.y));
  }

  // Walk the walls from the first corner.
  const out: SketchCorner[] = [{ ...cs[0] }];
  for (let i = 0; i < n && out.length < cs.length; i++) {
    const p = out[i];
    out.push({ id: cs[i + 1].id, x: p.x + dirs[i].x * lengths[i], y: p.y + dirs[i].y * lengths[i] });
  }
  return { corners: out, lengths, measured, gapMm };
};

// ------------------------------------------------------------------------------------------------
// Templates
// ------------------------------------------------------------------------------------------------

export type RoomTemplate = 'rectangle' | 'l-shape' | 'u-shape' | 'galley';

const TEMPLATE_POINTS: Record<RoomTemplate, [number, number][]> = {
  rectangle: [
    [0, 0],
    [4000, 0],
    [4000, 3000],
    [0, 3000],
  ],
  'l-shape': [
    [0, 0],
    [4000, 0],
    [4000, 1800],
    [2200, 1800],
    [2200, 3600],
    [0, 3600],
  ],
  'u-shape': [
    [0, 0],
    [1200, 0],
    [1200, 2000],
    [2800, 2000],
    [2800, 0],
    [4000, 0],
    [4000, 3200],
    [0, 3200],
  ],
  // Two parallel runs; drawn as an open line pair is awkward, so a narrow closed room.
  galley: [
    [0, 0],
    [4000, 0],
    [4000, 2400],
    [0, 2400],
  ],
};

/** A closed room from a template. Wall/corner ids are "1".."n" so list-mode keys (`wall.1.length`) carry over. */
export const planFromTemplate = (template: RoomTemplate, base: SketchPlan): SketchPlan => {
  const pts = TEMPLATE_POINTS[template];
  return {
    ...base,
    corners: pts.map(([x, y], i) => ({ id: `c${i + 1}`, x, y })),
    walls: pts.map((_, i) => ({ id: String(i + 1) })),
    closed: true,
    items: [],
  };
};

/** A regular-ish room with n walls (used when converting a list-mode layout with n walls). */
export const planWithWalls = (n: number, base: SketchPlan): SketchPlan => {
  if (n === 4) {
    return planFromTemplate('rectangle', base);
  }
  const r = 2000;
  const corners = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { id: `c${i + 1}`, x: Math.round(r + r * Math.cos(a)), y: Math.round(r + r * Math.sin(a)) };
  });
  return { ...base, corners, walls: corners.map((_, i) => ({ id: String(i + 1) })), closed: n >= 3, items: [] };
};

/** Next free numeric wall id ("5" after "1".."4"), so new walls get readable keys. */
export const nextWallId = (plan: SketchPlan): string => {
  const nums = plan.walls.map((w) => Number(w.id)).filter((x) => Number.isInteger(x));
  return String((nums.length ? Math.max(...nums) : 0) + 1);
};

/** Bounding box of points, padded. */
export const bounds = (pts: Pt[], pad = 600) => {
  if (!pts.length) {
    return { x: -pad, y: -pad, w: 5000 + 2 * pad, h: 4000 + 2 * pad };
  }
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: minX - pad,
    y: minY - pad,
    w: Math.max(...xs) - minX + 2 * pad,
    h: Math.max(...ys) - minY + 2 * pad,
  };
};
