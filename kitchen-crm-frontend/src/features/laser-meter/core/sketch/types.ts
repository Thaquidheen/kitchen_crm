/**
 * Room sketch (plan drawing) model. Stored inside the site measurement layout JSON as
 * `layout.sketch`. Coordinates are millimetres in plan space (x → right, y → down).
 *
 * The sketch holds *shape* only. Measured values (wall lengths, offsets, heights…) live in the
 * measurement session under the same keys the list view uses, so the drawing and the list are two
 * views of one set of values. The geometry solver combines the two to redraw the plan to scale.
 */

export type OpeningKind = 'door' | 'window' | 'opening';
export type ServiceKind = 'water' | 'drain' | 'gas' | 'electrical' | 'other';
export type CabinetKind = 'base' | 'wall' | 'tall';
export type ApplianceKind = 'sink' | 'hob' | 'hood' | 'oven' | 'fridge' | 'dishwasher' | 'washer';

export interface SketchCorner {
  id: string;
  x: number;
  y: number;
}

/** Wall `i` runs from corners[i] to corners[i + 1] (wrapping when the room is closed). */
export interface SketchWall {
  /** Stable id; the measurement key is `wall.<id>.length`. */
  id: string;
}

interface WallItemBase {
  id: string;
  wallId: string;
  /** Sketch position along the wall, from its start corner (used until the offset is measured). */
  offsetMm: number;
  label?: string;
}

export interface SketchOpening extends WallItemBase {
  type: 'opening';
  kind: OpeningKind;
  /** Sketch width until measured. */
  widthMm: number;
}

export interface SketchServicePoint extends WallItemBase {
  type: 'service';
  kind: ServiceKind;
}

export interface SketchCabinet extends WallItemBase {
  type: 'cabinet';
  kind: CabinetKind;
  widthMm: number;
  depthMm: number;
}

export interface SketchAppliance extends WallItemBase {
  type: 'appliance';
  kind: ApplianceKind;
  widthMm: number;
  depthMm: number;
}

export type SketchWallItem = SketchOpening | SketchServicePoint | SketchCabinet | SketchAppliance;

export interface SketchNote {
  id: string;
  type: 'note';
  x: number;
  y: number;
  text: string;
}

export interface SketchArrow {
  id: string;
  type: 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  text?: string;
}

export type SketchAnnotation = SketchNote | SketchArrow;

export interface SketchPlan {
  version: 1;
  corners: SketchCorner[];
  walls: SketchWall[];
  closed: boolean;
  items: SketchWallItem[];
  annotations: SketchAnnotation[];
}

export const emptySketch = (): SketchPlan => ({
  version: 1,
  corners: [],
  walls: [],
  closed: false,
  items: [],
  annotations: [],
});

/** Typical sizes used when an item is first dropped on a wall (all editable / measurable). */
export const DEFAULT_SIZES = {
  door: 900,
  window: 1200,
  opening: 1000,
  cabinetWidth: 600,
  cabinetDepth: { base: 600, wall: 350, tall: 600 } as Record<CabinetKind, number>,
  cabinetHeight: { base: 870, wall: 720, tall: 2100 } as Record<CabinetKind, number>,
  /** Bottom of wall cabinets above the floor, for the elevation view. */
  wallCabinetBottom: 1450,
  ceiling: 2700,
  /** width, depth, bottom (above floor), height — typical sizes for the appliance library. */
  appliance: {
    sink: [800, 500, 850, 50],
    hob: [600, 520, 880, 20],
    hood: [600, 450, 1650, 450],
    oven: [600, 560, 0, 600],
    fridge: [700, 650, 0, 1850],
    dishwasher: [600, 570, 0, 820],
    washer: [600, 600, 0, 850],
  } as Record<ApplianceKind, [number, number, number, number]>,
  doorHeight: 2100,
  windowHeight: 1200,
  windowSill: 900,
};
