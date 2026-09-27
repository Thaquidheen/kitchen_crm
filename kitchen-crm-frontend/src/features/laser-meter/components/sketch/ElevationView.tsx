/**
 * Wall elevation: the selected wall seen straight on (length × ceiling height), with its openings,
 * service points and cabinets at their measured (or typical) positions and heights. Tap an item to
 * select it for measuring.
 */

import type { SketchPlan } from '../../core/sketch/types';
import type { SolvedPlan } from '../../core/sketch/geometry';
import { ceilingMm, placeItem, type PlacedItem } from '../../core/sketch/placement';
import { itemNames } from '../../core/sketch/targets';
import type { ValueMap } from '../../core/measurementSession';
import type { LengthUnit } from '../../core/types';
import { formatMm } from '../../core/units';

export interface ElevationViewProps {
  plan: SketchPlan;
  solved: SolvedPlan;
  values: ValueMap;
  wallId: string;
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  displayUnit: LengthUnit;
}

const SERVICE_COLOR: Record<string, string> = {
  water: '#2563eb',
  drain: '#475569',
  gas: '#ea580c',
  electrical: '#ca8a04',
  other: '#7c3aed',
};

export const ElevationView = ({ plan, solved, values, wallId, selectedItemId, onSelectItem, displayUnit }: ElevationViewProps) => {
  const wi = plan.walls.findIndex((w) => w.id === wallId);
  if (wi < 0 || wi >= solved.lengths.length) {
    return null;
  }
  const L = solved.lengths[wi];
  const H = ceilingMm(values);
  const pad = Math.max(L, H) * 0.12;
  const fs = Math.max(L, H) / 40;
  const fmt = (mm: number) => formatMm(Math.round(mm), displayUnit);
  const names = itemNames(plan);
  const items = plan.items
    .filter((it) => it.wallId === wallId)
    .map((it) => placeItem(plan, solved, values, it))
    .filter((p): p is PlacedItem => !!p);
  // Elevation y axis: floor at H, ceiling at 0.
  const Y = (h: number) => H - h;

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${L + 2 * pad} ${H + 2 * pad}`}
      className="w-full h-full"
      style={{ background: '#ffffff' }}
      fontFamily="Inter, system-ui, sans-serif"
    >
      <rect x={0} y={0} width={L} height={H} fill="#f6f7fb" stroke="#1f2430" strokeWidth={3} vectorEffect="non-scaling-stroke" />
      <line x1={-pad * 0.4} y1={H} x2={L + pad * 0.4} y2={H} stroke="#1f2430" strokeWidth={4} vectorEffect="non-scaling-stroke" />
      <text x={L / 2} y={H + fs * 1.6} fontSize={fs} textAnchor="middle" fill="#1f2430" fontWeight={600}>
        {`Wall ${wi + 1} · ${solved.measured[wi] ? '' : '≈'}${fmt(L)}`}
      </text>
      <text
        x={-fs * 0.8}
        y={H / 2}
        fontSize={fs}
        textAnchor="middle"
        fill={values['ceiling.height'] ? '#1f2430' : '#6b7280'}
        transform={`rotate(-90 ${-fs * 0.8} ${H / 2})`}
      >
        {`Ceiling ${values['ceiling.height'] ? '' : '≈'}${fmt(H)}`}
      </text>

      {items.map((p) => {
        const it = p.item;
        const sel = it.id === selectedItemId;
        const stroke = sel ? '#6d4aff' : '#1f2430';
        if (it.type === 'service') {
          return (
            <g key={it.id} onClick={() => onSelectItem(it.id)} style={{ cursor: 'pointer' }}>
              <circle cx={p.offset} cy={Y(p.bottom)} r={fs * (sel ? 0.9 : 0.7)} fill={SERVICE_COLOR[it.kind]} stroke={sel ? '#6d4aff' : '#fff'} strokeWidth={2} vectorEffect="non-scaling-stroke" />
              <line x1={p.offset} y1={Y(p.bottom) + fs} x2={p.offset} y2={H} stroke={SERVICE_COLOR[it.kind]} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
              <text x={p.offset + fs} y={Y(p.bottom) + fs * 0.35} fontSize={fs * 0.8} fill="#1f2430">
                {`${names[it.id]} · h ${fmt(p.bottom)}`}
              </text>
            </g>
          );
        }
        const fill = it.type === 'cabinet' ? '#fde7c7' : it.type === 'appliance' ? '#e0f2fe' : '#ffffff';
        return (
          <g key={it.id} onClick={() => onSelectItem(it.id)} style={{ cursor: 'pointer' }}>
            <rect
              x={p.offset}
              y={Y(p.top)}
              width={p.width}
              height={p.top - p.bottom}
              fill={fill}
              stroke={it.type === 'cabinet' ? (sel ? '#6d4aff' : '#b7791f') : it.type === 'appliance' ? (sel ? '#6d4aff' : '#0369a1') : stroke}
              strokeWidth={sel ? 3 : 1.5}
              vectorEffect="non-scaling-stroke"
            />
            <text x={p.offset + p.width / 2} y={Y(p.top) + fs * 1.2} fontSize={fs * 0.8} textAnchor="middle" fill="#1f2430">
              {names[it.id]}
            </text>
            <text x={p.offset + p.width / 2} y={Y((p.top + p.bottom) / 2) + fs * 0.3} fontSize={fs * 0.7} textAnchor="middle" fill="#6b7280">
              {`${fmt(p.width)} × ${fmt(p.top - p.bottom)}`}
            </text>
            {it.type === 'opening' && p.bottom > 0 && (
              <text x={p.offset + p.width / 2} y={Y(p.bottom) + fs * 1.1} fontSize={fs * 0.7} textAnchor="middle" fill="#6b7280">
                {`sill ${fmt(p.bottom)}`}
              </text>
            )}
            <text x={p.offset} y={-fs * 0.4} fontSize={fs * 0.65} textAnchor="middle" fill="#6b7280">
              {fmt(p.offset)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default ElevationView;
