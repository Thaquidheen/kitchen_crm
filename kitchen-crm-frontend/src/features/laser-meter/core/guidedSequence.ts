/**
 * The guided measuring order: walls in order → ceiling height → openings (offset, width,
 * height, sill) → service points (offset, height). Group order and per-item fields are
 * configurable. Pure functions only.
 */

import type { SketchPlan } from './sketch/types';

export type TargetGroup = 'walls' | 'ceiling' | 'openings' | 'services' | 'cabinets';
export type OpeningField = 'offset' | 'width' | 'height' | 'sill';
export type ServiceField = 'offset' | 'height';
export type OpeningKind = 'door' | 'window' | 'opening';
export type ServiceKind = 'water' | 'drain' | 'gas' | 'electrical' | 'other';

export interface OpeningSpec {
  id: string;
  kind: OpeningKind;
  /** 1-based wall the opening is on. */
  wall: number;
  label?: string;
}

export interface ServicePointSpec {
  id: string;
  kind: ServiceKind;
  wall: number;
  label?: string;
}

export interface RoomLayout {
  wallCount: number;
  includeCeiling: boolean;
  openings: OpeningSpec[];
  servicePoints: ServicePointSpec[];
  /** Plan drawing. When present (with walls), it defines what gets measured. */
  sketch?: SketchPlan | null;
}

export interface SequenceConfig {
  order: TargetGroup[];
  openingFields: OpeningField[];
  serviceFields: ServiceField[];
}

export interface MeasureTarget {
  /** Stable storage key, e.g. "wall.1.length", "opening.w1.sill". */
  key: string;
  group: TargetGroup;
  /** Heading of the item this belongs to, e.g. "Wall 2", "Window 1". */
  itemLabel: string;
  /** Field name within the item, e.g. "Length", "Sill height". */
  fieldLabel: string;
  /** Full label, e.g. "Window 1 · Sill height". */
  label: string;
  hint: string;
}

export const DEFAULT_SEQUENCE_CONFIG: SequenceConfig = {
  order: ['walls', 'ceiling', 'openings', 'services', 'cabinets'],
  openingFields: ['offset', 'width', 'height', 'sill'],
  serviceFields: ['offset', 'height'],
};

export const DEFAULT_LAYOUT: RoomLayout = {
  wallCount: 4,
  includeCeiling: true,
  openings: [],
  servicePoints: [],
};

export const GROUP_LABELS: Record<TargetGroup, string> = {
  walls: 'Walls',
  ceiling: 'Ceiling',
  openings: 'Openings',
  services: 'Service points',
  cabinets: 'Cabinets & appliances',
};

const OPENING_KIND_LABEL: Record<OpeningKind, string> = {
  door: 'Door',
  window: 'Window',
  opening: 'Opening',
};

export const SERVICE_KIND_LABEL: Record<ServiceKind, string> = {
  water: 'Water point',
  drain: 'Drain',
  gas: 'Gas point',
  electrical: 'Electrical point',
  other: 'Service point',
};

const OPENING_FIELD: Record<OpeningField, { label: string; hint: string }> = {
  offset: { label: 'Offset', hint: 'From the wall’s left corner to the opening’s near edge' },
  width: { label: 'Width', hint: 'Clear width of the opening' },
  height: { label: 'Height', hint: 'Clear height of the opening' },
  sill: { label: 'Sill height', hint: 'Floor to the bottom of the opening (0 for doors)' },
};

const SERVICE_FIELD: Record<ServiceField, { label: string; hint: string }> = {
  offset: { label: 'Offset', hint: 'From the wall’s left corner to the centre of the point' },
  height: { label: 'Height', hint: 'Floor to the centre of the point' },
};

/** Numbering per kind: "Window 1", "Window 2", "Door 1"… in list order. */
const numberItems = <T extends { kind: string; label?: string }>(
  items: T[],
  kindLabel: (k: T['kind']) => string
): string[] => {
  const counts: Record<string, number> = {};
  return items.map((it) => {
    counts[it.kind] = (counts[it.kind] ?? 0) + 1;
    return it.label?.trim() || `${kindLabel(it.kind)} ${counts[it.kind]}`;
  });
};

export const buildSequence = (
  layout: RoomLayout,
  cfg: SequenceConfig = DEFAULT_SEQUENCE_CONFIG
): MeasureTarget[] => {
  const out: MeasureTarget[] = [];
  const push = (t: Omit<MeasureTarget, 'label'>) =>
    out.push({ ...t, label: `${t.itemLabel} · ${t.fieldLabel}` });

  for (const group of cfg.order) {
    switch (group) {
      case 'walls':
        for (let w = 1; w <= layout.wallCount; w++) {
          push({
            key: `wall.${w}.length`,
            group,
            itemLabel: `Wall ${w}`,
            fieldLabel: 'Length',
            hint: w === 1 ? 'Corner to corner, starting from the entrance side' : 'Corner to corner, continuing clockwise',
          });
        }
        break;
      case 'ceiling':
        if (layout.includeCeiling) {
          push({
            key: 'ceiling.height',
            group,
            itemLabel: 'Ceiling',
            fieldLabel: 'Height',
            hint: 'Finished floor to ceiling',
          });
        }
        break;
      case 'openings': {
        const names = numberItems(layout.openings, (k) => OPENING_KIND_LABEL[k]);
        layout.openings.forEach((o, i) => {
          for (const f of cfg.openingFields) {
            push({
              key: `opening.${o.id}.${f}`,
              group,
              itemLabel: `${names[i]} (wall ${o.wall})`,
              fieldLabel: OPENING_FIELD[f].label,
              hint: OPENING_FIELD[f].hint,
            });
          }
        });
        break;
      }
      case 'services': {
        const names = numberItems(layout.servicePoints, (k) => SERVICE_KIND_LABEL[k]);
        layout.servicePoints.forEach((p, i) => {
          for (const f of cfg.serviceFields) {
            push({
              key: `service.${p.id}.${f}`,
              group,
              itemLabel: `${names[i]} (wall ${p.wall})`,
              fieldLabel: SERVICE_FIELD[f].label,
              hint: SERVICE_FIELD[f].hint,
            });
          }
        });
        break;
      }
    }
  }
  return out;
};

type Filled = (key: string) => boolean;

/**
 * The next target after `currentKey` that still needs a value; wraps to earlier gaps; null when
 * everything is measured. With `skipFilled: false` it is simply the next target in order.
 */
export const nextTargetKey = (
  targets: MeasureTarget[],
  currentKey: string | null,
  isFilled: Filled,
  opts: { skipFilled?: boolean } = {}
): string | null => {
  if (!targets.length) {
    return null;
  }
  const skipFilled = opts.skipFilled ?? true;
  const start = currentKey ? targets.findIndex((t) => t.key === currentKey) : -1;
  if (!skipFilled) {
    return start + 1 < targets.length ? targets[start + 1].key : null;
  }
  for (let i = 1; i <= targets.length; i++) {
    const t = targets[(start + i + targets.length) % targets.length];
    if (!isFilled(t.key)) {
      return t.key;
    }
  }
  return null;
};

export const prevTargetKey = (targets: MeasureTarget[], currentKey: string | null): string | null => {
  const i = currentKey ? targets.findIndex((t) => t.key === currentKey) : -1;
  return i > 0 ? targets[i - 1].key : null;
};

export const firstOpenTargetKey = (targets: MeasureTarget[], isFilled: Filled): string | null =>
  targets.find((t) => !isFilled(t.key))?.key ?? null;

export const progressOf = (targets: MeasureTarget[], isFilled: Filled) => ({
  done: targets.filter((t) => isFilled(t.key)).length,
  total: targets.length,
});

/** Short random id for new openings/service points (stable once stored). */
export const newItemId = (prefix: string): string =>
  `${prefix}${Math.random().toString(36).slice(2, 7)}`;

/** Clamp a layout coming from storage/server into something buildSequence can trust. */
export const sanitizeLayout = (raw: Partial<RoomLayout> | null | undefined): RoomLayout => {
  const walls = Number(raw?.wallCount);
  return {
    wallCount: Number.isInteger(walls) && walls >= 1 && walls <= 20 ? walls : DEFAULT_LAYOUT.wallCount,
    includeCeiling: raw?.includeCeiling ?? true,
    openings: Array.isArray(raw?.openings) ? raw.openings.filter((o) => o && o.id) : [],
    servicePoints: Array.isArray(raw?.servicePoints) ? raw.servicePoints.filter((p) => p && p.id) : [],
    sketch: raw?.sketch && Array.isArray(raw.sketch.corners) ? sanitizeSketch(raw.sketch) : null,
  };
};

const sanitizeSketch = (sk: SketchPlan): SketchPlan => ({
  version: 1,
  corners: sk.corners.filter((c) => c && Number.isFinite(c.x) && Number.isFinite(c.y)),
  walls: Array.isArray(sk.walls) ? sk.walls.filter((w) => w && w.id) : [],
  closed: !!sk.closed,
  items: Array.isArray(sk.items) ? sk.items.filter((i) => i && i.id && i.wallId) : [],
  annotations: Array.isArray(sk.annotations) ? sk.annotations.filter((a) => a && a.id) : [],
});
