/** Edit what gets measured: wall count, ceiling, openings and service points. */

import { Minus, Plus, Trash2 } from 'lucide-react';
import {
  newItemId,
  SERVICE_KIND_LABEL,
  type OpeningKind,
  type RoomLayout,
  type ServiceKind,
} from '../core/guidedSequence';

export interface RoomLayoutEditorProps {
  layout: RoomLayout;
  onChange: (layout: RoomLayout) => void;
}

const selectCls =
  'px-2 py-1.5 bg-background-700 border border-background-600 rounded-md text-[13px] text-text-900 focus:outline-none focus:ring-2 focus:ring-primary-700';

const WallSelect = ({ value, count, onChange }: { value: number; count: number; onChange: (w: number) => void }) => (
  <select className={selectCls} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label="Wall">
    {Array.from({ length: count }, (_, i) => (
      <option key={i + 1} value={i + 1}>
        Wall {i + 1}
      </option>
    ))}
  </select>
);

export const RoomLayoutEditor = ({ layout, onChange }: RoomLayoutEditorProps) => {
  const set = (patch: Partial<RoomLayout>) => onChange({ ...layout, ...patch });
  const clampWall = (w: number) => Math.min(Math.max(1, w), layout.wallCount);

  return (
    <div className="flex flex-col gap-4 text-[13px]">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-text-700">Walls</span>
          <button
            type="button"
            className="p-1.5 rounded-md border border-background-500 hover:bg-background-700 disabled:opacity-40"
            onClick={() => set({ wallCount: layout.wallCount - 1 })}
            disabled={layout.wallCount <= 1}
            aria-label="Fewer walls"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center tabular-nums font-semibold text-text-900">{layout.wallCount}</span>
          <button
            type="button"
            className="p-1.5 rounded-md border border-background-500 hover:bg-background-700 disabled:opacity-40"
            onClick={() => set({ wallCount: layout.wallCount + 1 })}
            disabled={layout.wallCount >= 20}
            aria-label="More walls"
          >
            <Plus size={14} />
          </button>
        </div>
        <label className="inline-flex items-center gap-2 text-text-700">
          <input
            type="checkbox"
            checked={layout.includeCeiling}
            onChange={(e) => set({ includeCeiling: e.target.checked })}
          />
          Measure ceiling height
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-text-800">Openings</span>
          <div className="flex gap-1.5">
            {(['window', 'door', 'opening'] as OpeningKind[]).map((kind) => (
              <button
                key={kind}
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-background-500 text-text-700 hover:bg-background-700 capitalize"
                onClick={() =>
                  set({ openings: [...layout.openings, { id: newItemId(kind[0]), kind, wall: 1 }] })
                }
              >
                <Plus size={12} /> {kind}
              </button>
            ))}
          </div>
        </div>
        {layout.openings.length === 0 && <p className="m-0 text-text-500">No doors or windows added.</p>}
        <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
          {layout.openings.map((o, i) => (
            <li key={o.id} className="flex items-center gap-2">
              <span className="capitalize w-16 text-text-700">{o.kind}</span>
              <WallSelect
                value={clampWall(o.wall)}
                count={layout.wallCount}
                onChange={(w) =>
                  set({ openings: layout.openings.map((x, j) => (j === i ? { ...x, wall: w } : x)) })
                }
              />
              <input
                className={`${selectCls} flex-1 min-w-0`}
                placeholder="Label (optional)"
                value={o.label ?? ''}
                onChange={(e) =>
                  set({ openings: layout.openings.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })
                }
              />
              <button
                type="button"
                className="p-1.5 rounded-md text-text-600 hover:text-error hover:bg-background-700"
                onClick={() => set({ openings: layout.openings.filter((_, j) => j !== i) })}
                aria-label="Remove opening"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-text-800">Service points</span>
          <select
            className={selectCls}
            value=""
            onChange={(e) => {
              const kind = e.target.value as ServiceKind;
              if (kind) {
                set({ servicePoints: [...layout.servicePoints, { id: newItemId('s'), kind, wall: 1 }] });
              }
            }}
            aria-label="Add service point"
          >
            <option value="">+ Add point…</option>
            {(Object.keys(SERVICE_KIND_LABEL) as ServiceKind[]).map((k) => (
              <option key={k} value={k}>
                {SERVICE_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        {layout.servicePoints.length === 0 && <p className="m-0 text-text-500">No water, drain, gas or electrical points added.</p>}
        <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
          {layout.servicePoints.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="w-28 text-text-700 truncate">{SERVICE_KIND_LABEL[p.kind]}</span>
              <WallSelect
                value={clampWall(p.wall)}
                count={layout.wallCount}
                onChange={(w) =>
                  set({ servicePoints: layout.servicePoints.map((x, j) => (j === i ? { ...x, wall: w } : x)) })
                }
              />
              <input
                className={`${selectCls} flex-1 min-w-0`}
                placeholder="Label (optional)"
                value={p.label ?? ''}
                onChange={(e) =>
                  set({
                    servicePoints: layout.servicePoints.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                  })
                }
              />
              <button
                type="button"
                className="p-1.5 rounded-md text-text-600 hover:text-error hover:bg-background-700"
                onClick={() => set({ servicePoints: layout.servicePoints.filter((_, j) => j !== i) })}
                aria-label="Remove service point"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RoomLayoutEditor;
