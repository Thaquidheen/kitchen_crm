/**
 * DesignersPanel — sidebar block (admins): every designer with the status the admin set, how many
 * designs they have, and what they are on now. Click → their column on the Designs page.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useGetDesignersQuery } from '../designAPI';
import { DESIGNER_STATUS, DesignerStatusDot } from '../designUi';

export const DesignersPanel: React.FC<{ collapsed: boolean; onNavigate?: () => void }> = ({ collapsed, onNavigate }) => {
  const { data: designers = [] } = useGetDesignersQuery(undefined, { pollingInterval: 60000, refetchOnFocus: true });
  if (designers.length === 0) {return null;}

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-1">
        {designers.map((d) => (
          <Link
            key={d.id}
            to={`/designs?designer=${d.id}`}
            onClick={onNavigate}
            title={`${d.name} · ${d.designerStatus ? DESIGNER_STATUS[d.designerStatus].label : 'status not set'} · ${d.activeCount} assigned`}
            className="relative w-8 h-8 rounded-full bg-background-700 border border-background-600 flex items-center justify-center text-[11px] font-bold text-text-800"
          >
            {d.name.trim().charAt(0).toUpperCase()}
            <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-background-800 rounded-full">
              <DesignerStatusDot status={d.designerStatus} size={8} />
            </span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-text-500 px-2.5 mb-1">Designers</div>
      {designers.map((d) => (
        <Link
          key={d.id}
          to={`/designs?designer=${d.id}`}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-1.5 hover:bg-background-700 transition-colors"
        >
          <DesignerStatusDot status={d.designerStatus} />
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-medium text-text-900 truncate">{d.name}</span>
            <span className="block text-[11px] text-text-500 truncate">
              {d.designerStatus ? DESIGNER_STATUS[d.designerStatus].label : 'Status not set'}
              {d.currentCustomerName ? ` · ${d.currentCustomerName}` : ''}
            </span>
          </span>
          <span
            className="text-[11px] font-semibold px-1.5 py-px rounded-full tabular-nums"
            style={
              d.overdue > 0
                ? { background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }
                : { background: 'var(--color-background-600)', color: 'var(--color-text-700)' }
            }
            title={`${d.activeCount} assigned${d.overdue > 0 ? `, ${d.overdue} overdue` : ''}`}
          >
            {d.activeCount}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default DesignersPanel;
