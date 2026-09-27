import { describe, expect, it } from 'vitest';
import {
  areaM2,
  nearestWall,
  perimeterMm,
  planFromTemplate,
  snapFrom,
  solvePlan,
  wallFrame,
} from '../core/sketch/geometry';
import { emptySketch } from '../core/sketch/types';
import { sketchFromListLayout, sketchTargets, targetsForLayout } from '../core/sketch/targets';
import { DEFAULT_SEQUENCE_CONFIG } from '../core/guidedSequence';

const rect = () => planFromTemplate('rectangle', emptySketch()); // 4000 x 3000, walls "1".."4"
const len = (s: ReturnType<typeof solvePlan>, i: number) => Math.round(s.lengths[i]);

describe('solvePlan (redraw to scale)', () => {
  it('uses the sketch as-is when nothing is measured', () => {
    const s = solvePlan(rect(), {});
    expect([0, 1, 2, 3].map((i) => len(s, i))).toEqual([4000, 3000, 4000, 3000]);
    expect(s.gapMm).toBe(0);
  });

  it('locks measured walls and resizes the others so the room still closes', () => {
    const s = solvePlan(rect(), { '1': 3200, '2': 2450 });
    expect([0, 1, 2, 3].map((i) => len(s, i))).toEqual([3200, 2450, 3200, 2450]);
    expect(s.measured).toEqual([true, true, false, false]);
    expect(s.gapMm).toBe(0);
    // Corners follow: third corner at (3200, 2450) from the origin.
    expect(s.corners[2]).toMatchObject({ x: 3200, y: 2450 });
  });

  it('rescales unmeasured walls by how far off the sketch was', () => {
    const s = solvePlan(rect(), { '1': 2000 });
    expect(len(s, 1)).toBe(1500); // 3000 * 0.5
    expect(len(s, 2)).toBe(2000); // closes against wall 1
  });

  it('reports the gap when every wall is measured and they disagree', () => {
    const s = solvePlan(rect(), { '1': 3200, '2': 2450, '3': 3180, '4': 2450 });
    expect(s.gapMm).toBe(20);
    expect(len(s, 2)).toBe(3180); // measured values are never fudged
  });

  it('handles an L-shaped room', () => {
    const l = planFromTemplate('l-shape', emptySketch());
    const s = solvePlan(l, { '1': 4200 });
    expect(s.gapMm).toBe(0);
    expect(len(s, 0)).toBe(4200);
  });

  it('works for an open run of walls', () => {
    const p = { ...rect(), closed: false };
    const s = solvePlan(p, { '1': 3000 });
    expect(s.lengths).toHaveLength(3);
    expect(s.gapMm).toBe(0);
  });
});

describe('drawing helpers', () => {
  it('snaps to right angles and round lengths', () => {
    expect(snapFrom({ x: 0, y: 0 }, { x: 60, y: 2012 })).toEqual({ x: 0, y: 2000 });
    expect(snapFrom({ x: 0, y: 0 }, { x: 3024, y: -40 })).toEqual({ x: 3000, y: 0 });
    // Far from a snap angle: kept as drawn (length still rounded).
    const p = snapFrom({ x: 0, y: 0 }, { x: 1000, y: 400 });
    expect(Math.round(Math.hypot(p.x, p.y))).toBe(1100);
  });

  it('finds the nearest wall and position along it', () => {
    const p = rect();
    const w = nearestWall(p, p.corners, { x: 1500, y: 80 });
    expect(w).toMatchObject({ wallIndex: 0, along: 1500, distance: 80 });
  });

  it('computes area, perimeter and an inward normal', () => {
    const p = rect();
    expect(areaM2(p, p.corners)).toBe(12);
    expect(perimeterMm(p, p.corners)).toBe(14000);
    const f = wallFrame(p, p.corners, 0); // top wall, room below it
    expect(f.ny).toBe(1);
  });
});

describe('sketch targets', () => {
  it('orders walls, ceiling, openings, services, cabinets with list-compatible keys', () => {
    const p = rect();
    p.items = [
      { id: 'c1', type: 'cabinet', kind: 'base', wallId: '1', offsetMm: 0, widthMm: 600, depthMm: 600 },
      { id: 's1', type: 'service', kind: 'water', wallId: '1', offsetMm: 800 },
      { id: 'w1', type: 'opening', kind: 'window', wallId: '2', offsetMm: 500, widthMm: 1200 },
    ];
    const keys = sketchTargets(p, DEFAULT_SEQUENCE_CONFIG).map((t) => t.key);
    expect(keys).toEqual([
      'wall.1.length',
      'wall.2.length',
      'wall.3.length',
      'wall.4.length',
      'ceiling.height',
      'opening.w1.offset',
      'opening.w1.width',
      'opening.w1.height',
      'opening.w1.sill',
      'service.s1.offset',
      'service.s1.height',
      'cabinet.c1.offset',
      'cabinet.c1.width',
    ]);
    p.items.push({ id: 'a1', type: 'appliance', kind: 'sink', wallId: '1', offsetMm: 900, widthMm: 800, depthMm: 500 });
    const withSink = sketchTargets(p, DEFAULT_SEQUENCE_CONFIG).map((t) => t.key);
    expect(withSink.slice(-4)).toEqual(['cabinet.c1.offset', 'cabinet.c1.width', 'appliance.a1.offset', 'appliance.a1.width']);
    p.items.pop();
    const labels = sketchTargets(p, DEFAULT_SEQUENCE_CONFIG).map((t) => t.label);
    expect(labels).toContain('Window 1 (wall 2) · Sill height');
    expect(labels).toContain('Base cabinet 1 (wall 1) · Width');
  });

  it('converts a list-mode layout keeping ids, and picks the right target source', () => {
    const layout = {
      wallCount: 4,
      includeCeiling: true,
      openings: [{ id: 'd9', kind: 'door' as const, wall: 3 }],
      servicePoints: [{ id: 'g1', kind: 'gas' as const, wall: 2 }],
    };
    const sk = sketchFromListLayout(layout);
    expect(sk.walls.map((w) => w.id)).toEqual(['1', '2', '3', '4']);
    expect(sk.items.find((i) => i.id === 'd9')).toMatchObject({ wallId: '3', type: 'opening' });
    expect(targetsForLayout(layout, DEFAULT_SEQUENCE_CONFIG)[0].key).toBe('wall.1.length');
    expect(targetsForLayout({ ...layout, sketch: sk }, DEFAULT_SEQUENCE_CONFIG).map((t) => t.key)).toContain(
      'opening.d9.sill'
    );
  });
});
