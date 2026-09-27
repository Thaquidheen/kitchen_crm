/**
 * The measuring workspace used by the site measurement page and the practice area:
 * Drawing (plan sketch, measure on the drawing) or List (guided list of fields). Both views work
 * on the same values; the drawing, when there is one, decides what gets measured.
 */

import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronUp, List, PencilRuler } from 'lucide-react';
import { SketchEditor } from './sketch/SketchEditor';
import { GuidedMeasurePanel } from './GuidedMeasurePanel';
import { RoomLayoutEditor } from './RoomLayoutEditor';
import type { GuidedMeasure } from '../hooks/useGuidedMeasure';
import type { RoomLayout } from '../core/guidedSequence';
import type { LaserSettings } from '../core/settings';

export type WorkspaceView = 'drawing' | 'list';

export interface MeasureWorkspaceProps {
  layout: RoomLayout;
  onLayoutChange: (layout: RoomLayout) => void;
  guided: GuidedMeasure;
  settings: LaserSettings;
  bleSupported?: boolean;
  bluetoothControls?: ReactNode;
  onStatusClick?: () => void;
  initialView?: WorkspaceView;
}

const VIEW_KEY = 'laserMeter.workspaceView';

const readView = (fallback: WorkspaceView): WorkspaceView => {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === 'list' || v === 'drawing' ? v : fallback;
  } catch {
    return fallback;
  }
};

export const MeasureWorkspace = ({
  layout,
  onLayoutChange,
  guided,
  settings,
  bleSupported,
  bluetoothControls,
  onStatusClick,
  initialView = 'drawing',
}: MeasureWorkspaceProps) => {
  const [view, setViewState] = useState<WorkspaceView>(() => readView(initialView));
  const [layoutOpen, setLayoutOpen] = useState(false);
  const setView = (v: WorkspaceView) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // ignore
    }
  };
  const hasSketch = !!layout.sketch?.walls.length;

  const tab = (v: WorkspaceView, icon: ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setView(v)}
      aria-pressed={view === v}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-medium',
        view === v ? 'bg-background-600 text-text-900 shadow-sm' : 'text-text-600 hover:text-text-900'
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex self-start p-1 rounded-[10px] bg-background-700 border border-background-600">
        {tab('drawing', <PencilRuler size={14} />, 'Drawing')}
        {tab('list', <List size={14} />, 'List')}
      </div>

      {view === 'drawing' ? (
        <SketchEditor
          layout={layout}
          onLayoutChange={onLayoutChange}
          guided={guided}
          settings={settings}
          bleSupported={bleSupported}
          bluetoothControls={bluetoothControls}
        />
      ) : (
        <div className="max-w-3xl flex flex-col gap-3">
          {hasSketch ? (
            <p className="m-0 text-[12.5px] text-text-600">
              The list follows the drawing. Add walls, doors, windows, service points and cabinets on the Drawing tab.
            </p>
          ) : (
            <div className="rounded-[10px] border border-background-600 bg-background-800">
              <button
                type="button"
                onClick={() => setLayoutOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-[14px] font-semibold text-text-900"
                aria-expanded={layoutOpen}
              >
                <span>
                  Room layout
                  <span className="ml-2 font-normal text-[12.5px] text-text-600">
                    {layout.wallCount} walls · {layout.openings.length} openings · {layout.servicePoints.length} service points
                  </span>
                </span>
                {layoutOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {layoutOpen && (
                <div className="px-3 pb-3">
                  <RoomLayoutEditor layout={layout} onChange={onLayoutChange} />
                </div>
              )}
            </div>
          )}
          <GuidedMeasurePanel
            guided={guided}
            settings={settings}
            bleSupported={bleSupported}
            bluetoothControls={bluetoothControls}
            onStatusClick={onStatusClick}
          />
        </div>
      )}
    </div>
  );
};

export default MeasureWorkspace;
