/**
 * DesignerPicker — choose which designer gets a design, with each designer's workload and the
 * admin-set status visible, plus due date and priority. Only Designer-type staff are listed.
 */
import React from 'react';
import { Check, Palette } from 'lucide-react';
import { useGetDesignersQuery } from '../designAPI';
import { DESIGNER_STATUS, DesignerStatusDot, PRIORITY_LABEL } from '../designUi';
import type { DesignPriority } from '../types';

export interface DesignAssignment {
  designerId: number | null;
  dueDate: string;
  priority: DesignPriority;
}

interface Props {
  value: DesignAssignment;
  onChange: (next: DesignAssignment) => void;
}

const fieldCls =
  'h-[36px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors';

export const DesignerPicker: React.FC<Props> = ({ value, onChange }) => {
  const { data: designers = [], isLoading } = useGetDesignersQuery();

  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text-800 mb-1.5">
        <Palette size={13} className="text-primary-600" />
        Designer <span className="text-error">*</span>
      </label>
      {isLoading ? (
        <div className="h-10 rounded-[10px] bg-background-700 animate-pulse" />
      ) : designers.length === 0 ? (
        <p className="m-0 px-3 py-2.5 rounded-[10px] border border-background-600 bg-background-900 text-[12.5px] text-text-600">
          No designers yet. In <span className="font-semibold">Staff</span>, set a staff member&apos;s type to{' '}
          <span className="font-semibold">Designer</span>.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-0.5">
          {designers.map((d) => {
            const on = value.designerId === d.id;
            const away = d.designerStatus === 'ON_LEAVE';
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onChange({ ...value, designerId: d.id })}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] border text-left transition-colors"
                style={
                  on
                    ? {
                        borderColor: 'var(--color-primary-600)',
                        background: 'color-mix(in oklab, var(--color-primary-600) 12%, transparent)',
                      }
                    : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-900)' }
                }
              >
                <DesignerStatusDot status={d.designerStatus} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-[13px] truncate ${on ? 'font-semibold text-text-900' : 'text-text-900'}`}>
                    {d.name}
                  </span>
                  <span className="block text-[11.5px] text-text-600 truncate">
                    {d.designerStatus ? DESIGNER_STATUS[d.designerStatus].label : 'Status not set'} · {d.activeCount} in queue
                    {d.overdue > 0 ? ` · ${d.overdue} overdue` : ''}
                    {away ? ' — on leave' : ''}
                  </span>
                </span>
                {on && <Check size={15} className="text-primary-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 mt-2.5">
        <div>
          <label className="block text-[12px] font-medium text-text-700 mb-1">Due date</label>
          <input
            type="date"
            value={value.dueDate}
            onChange={(e) => onChange({ ...value, dueDate: e.target.value })}
            className={`w-full ${fieldCls}`}
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-text-700 mb-1">Priority</label>
          <select
            value={value.priority}
            onChange={(e) => onChange({ ...value, priority: e.target.value as DesignPriority })}
            className={`w-full ${fieldCls}`}
          >
            {(Object.keys(PRIORITY_LABEL) as DesignPriority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DesignerPicker;
