/**
 * Where things are, once measurements are applied: wall lengths from the solver, and item
 * offsets/widths/heights from measured values (falling back to the sketch or typical sizes).
 */

import type { ValueMap } from '../measurementSession';
import { DEFAULT_SIZES, type SketchPlan, type SketchWallItem } from './types';
import { solvePlan, wallFrame, type SolvedPlan } from './geometry';

export const measuredWallLengths = (plan: SketchPlan, values: ValueMap): Record<string, number | undefined> =>
  Object.fromEntries(plan.walls.map((w) => [w.id, values[`wall.${w.id}.length`]?.valueMm]));

export const solveWithValues = (plan: SketchPlan, values: ValueMap): SolvedPlan =>
  solvePlan(plan, measuredWallLengths(plan, values));

const v = (values: ValueMap, key: string): number | undefined => values[key]?.valueMm;

export interface PlacedItem {
  item: SketchWallItem;
  wallIndex: number;
  /** Along the wall from its start corner (mm). */
  offset: number;
  /** Along-wall size (mm); 0 for point items. */
  width: number;
  /** Elevation: bottom and top above the floor (mm). */
  bottom: number;
  top: number;
  frame: ReturnType<typeof wallFrame>;
  measured: { offset: boolean; width: boolean };
}

export const ceilingMm = (values: ValueMap): number => v(values, 'ceiling.height') ?? DEFAULT_SIZES.ceiling;

export const placeItem = (
  plan: SketchPlan,
  solved: SolvedPlan,
  values: ValueMap,
  item: SketchWallItem
): PlacedItem | null => {
  const wallIndex = plan.walls.findIndex((w) => w.id === item.wallId);
  if (wallIndex < 0 || wallIndex >= solved.lengths.length) {
    return null;
  }
  const frame = wallFrame(plan, solved.corners, wallIndex);
  const p = item.type;
  const mOffset = v(values, `${p}.${item.id}.offset`);
  const mWidth = item.type === 'service' ? undefined : v(values, `${p}.${item.id}.width`);
  let width = item.type === 'service' ? 0 : (mWidth ?? item.widthMm);
  width = Math.min(width, frame.len);
  const offset = Math.max(0, Math.min(mOffset ?? item.offsetMm, frame.len - width));

  let bottom = 0;
  let top = 0;
  if (item.type === 'opening') {
    const sill = v(values, `opening.${item.id}.sill`) ?? (item.kind === 'window' ? DEFAULT_SIZES.windowSill : 0);
    const h =
      v(values, `opening.${item.id}.height`) ??
      (item.kind === 'window' ? DEFAULT_SIZES.windowHeight : DEFAULT_SIZES.doorHeight);
    bottom = sill;
    top = sill + h;
  } else if (item.type === 'service') {
    bottom = top = v(values, `service.${item.id}.height`) ?? (item.kind === 'drain' ? 400 : 1000);
  } else if (item.type === 'appliance') {
    const [, , b, h] = DEFAULT_SIZES.appliance[item.kind];
    bottom = b;
    top = b + h;
  } else {
    const h = DEFAULT_SIZES.cabinetHeight[item.kind];
    bottom = item.kind === 'wall' ? DEFAULT_SIZES.wallCabinetBottom : 0;
    top = bottom + h;
  }
  return {
    item,
    wallIndex,
    offset,
    width,
    bottom,
    top,
    frame,
    measured: { offset: mOffset !== undefined, width: mWidth !== undefined },
  };
};
