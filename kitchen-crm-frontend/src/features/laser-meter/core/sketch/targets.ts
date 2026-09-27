/**
 * Measurement targets derived from a sketch, in guided order: walls (in drawing order) → ceiling →
 * openings → service points → cabinets. Keys match the list view's, so both views share values.
 */

import { buildSequence, type MeasureTarget, type RoomLayout, type SequenceConfig, type TargetGroup } from '../guidedSequence';
import { DEFAULT_SIZES, emptySketch, type ApplianceKind, type CabinetKind, type OpeningKind, type ServiceKind, type SketchPlan, type SketchWallItem } from './types';
import { planWithWalls, wallCount } from './geometry';

const OPENING_LABEL: Record<OpeningKind, string> = { door: 'Door', window: 'Window', opening: 'Opening' };
export const SERVICE_LABEL: Record<ServiceKind, string> = {
  water: 'Water point',
  drain: 'Drain',
  gas: 'Gas point',
  electrical: 'Electrical point',
  other: 'Service point',
};
export const APPLIANCE_LABEL: Record<ApplianceKind, string> = {
  sink: 'Sink',
  hob: 'Hob',
  hood: 'Cooker hood',
  oven: 'Oven',
  fridge: 'Fridge',
  dishwasher: 'Dishwasher',
  washer: 'Washing machine',
};
export const CABINET_LABEL: Record<CabinetKind, string> = {
  base: 'Base cabinet',
  wall: 'Wall cabinet',
  tall: 'Tall unit',
};

const FIELD: Record<string, { label: string; hint: string }> = {
  'opening.offset': { label: 'Offset', hint: 'From the wall’s start corner to the opening’s near edge' },
  'opening.width': { label: 'Width', hint: 'Clear width of the opening' },
  'opening.height': { label: 'Height', hint: 'Clear height of the opening' },
  'opening.sill': { label: 'Sill height', hint: 'Floor to the bottom of the opening (0 for doors)' },
  'service.offset': { label: 'Offset', hint: 'From the wall’s start corner to the centre of the point' },
  'service.height': { label: 'Height', hint: 'Floor to the centre of the point' },
  'cabinet.offset': { label: 'Offset', hint: 'From the wall’s start corner to the cabinet run' },
  'cabinet.width': { label: 'Width', hint: 'Length of the cabinet run along the wall' },
  'appliance.offset': { label: 'Offset', hint: 'From the wall’s start corner to the appliance’s near side' },
  'appliance.width': { label: 'Width', hint: 'Width of the appliance (or its space)' },
};

const ALL_GROUPS: TargetGroup[] = ['walls', 'ceiling', 'openings', 'services', 'cabinets'];

/** Human names for wall items: "Window 2", "Drain 1", "Base cabinet 3" (or the custom label). */
export const itemNames = (plan: SketchPlan): Record<string, string> => {
  const counts: Record<string, number> = {};
  const out: Record<string, string> = {};
  for (const it of plan.items) {
    const k = `${it.type}:${it.kind}`;
    counts[k] = (counts[k] ?? 0) + 1;
    const base =
      it.type === 'opening'
        ? OPENING_LABEL[it.kind]
        : it.type === 'service'
          ? SERVICE_LABEL[it.kind]
          : it.type === 'appliance'
            ? APPLIANCE_LABEL[it.kind]
            : CABINET_LABEL[it.kind];
    out[it.id] = it.label?.trim() || `${base} ${counts[k]}`;
  }
  return out;
};

export const wallNumber = (plan: SketchPlan, wallId: string): number =>
  plan.walls.findIndex((w) => w.id === wallId) + 1;

/** Keys of the measurable fields of one item. */
export const itemFieldKeys = (it: SketchWallItem, cfg: SequenceConfig): string[] => {
  if (it.type === 'opening') {
    return cfg.openingFields.map((f) => `opening.${it.id}.${f}`);
  }
  if (it.type === 'service') {
    return cfg.serviceFields.map((f) => `service.${it.id}.${f}`);
  }
  return [`${it.type}.${it.id}.offset`, `${it.type}.${it.id}.width`];
};

export const sketchTargets = (plan: SketchPlan, cfg: SequenceConfig): MeasureTarget[] => {
  const out: MeasureTarget[] = [];
  const n = wallCount(plan);
  const names = itemNames(plan);
  const order = [...cfg.order, ...ALL_GROUPS.filter((g) => !cfg.order.includes(g))];
  const push = (t: Omit<MeasureTarget, 'label'>) => out.push({ ...t, label: `${t.itemLabel} · ${t.fieldLabel}` });

  // Items sorted by wall order, then position along the wall.
  const wallIdx = (id: string) => plan.walls.findIndex((w) => w.id === id);
  const items = [...plan.items].sort((a, b) => wallIdx(a.wallId) - wallIdx(b.wallId) || a.offsetMm - b.offsetMm);

  for (const group of order) {
    if (group === 'walls') {
      plan.walls.slice(0, n).forEach((w, i) =>
        push({
          key: `wall.${w.id}.length`,
          group,
          itemLabel: `Wall ${i + 1}`,
          fieldLabel: 'Length',
          hint: 'Corner to corner along the wall',
        })
      );
    } else if (group === 'ceiling') {
      push({ key: 'ceiling.height', group, itemLabel: 'Ceiling', fieldLabel: 'Height', hint: 'Finished floor to ceiling' });
    } else {
      const type = group === 'openings' ? 'opening' : group === 'services' ? 'service' : group === 'cabinets' ? 'cabinet' : null;
      if (!type) {
        continue;
      }
      // Appliances are measured together with the cabinets.
      for (const it of items.filter((x) => x.type === type || (type === 'cabinet' && x.type === 'appliance'))) {
        for (const key of itemFieldKeys(it, cfg)) {
          const f = FIELD[`${it.type}.${key.split('.').pop()}`];
          push({
            key,
            group,
            itemLabel: `${names[it.id]} (wall ${wallNumber(plan, it.wallId)})`,
            fieldLabel: f?.label ?? key,
            hint: f?.hint ?? '',
          });
        }
      }
    }
  }
  return out;
};

/**
 * What to measure for a layout: from the drawing when there is one, otherwise from the list-mode
 * room description (wall count, openings, service points).
 */
export const targetsForLayout = (layout: RoomLayout, cfg: SequenceConfig): MeasureTarget[] =>
  layout.sketch && layout.sketch.walls.length ? sketchTargets(layout.sketch, cfg) : buildSequence(layout, cfg);

/**
 * Turn a list-mode layout into a starting drawing, keeping ids so values already captured
 * (`wall.2.length`, `opening.<id>.width`…) stay attached.
 */
export const sketchFromListLayout = (layout: RoomLayout): SketchPlan => {
  const plan = planWithWalls(Math.max(1, layout.wallCount), emptySketch());
  const n = plan.walls.length;
  const perWall: Record<string, number> = {};
  const place = (wall: number) => {
    const wallId = String(Math.min(Math.max(1, wall), n));
    perWall[wallId] = (perWall[wallId] ?? 0) + 1;
    return { wallId, offsetMm: 300 + (perWall[wallId] - 1) * 1300 };
  };
  const items: SketchWallItem[] = [
    ...layout.openings.map((o) => ({
      id: o.id,
      type: 'opening' as const,
      kind: o.kind,
      label: o.label,
      widthMm: o.kind === 'door' ? DEFAULT_SIZES.door : DEFAULT_SIZES.window,
      ...place(o.wall),
    })),
    ...layout.servicePoints.map((p) => ({ id: p.id, type: 'service' as const, kind: p.kind, label: p.label, ...place(p.wall) })),
  ];
  return { ...plan, items };
};
