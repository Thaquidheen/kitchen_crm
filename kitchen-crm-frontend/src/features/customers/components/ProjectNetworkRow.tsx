/**
 * ProjectNetworkRow
 * One person in the customer form's project network: a type selector, then either an
 * Architects-module picker (for Architect/Builder) or free-text details (for Referral).
 */

import { X } from 'lucide-react';
import { ArchitectPicker } from '../../architects/components/ArchitectPicker';
import { PROJECT_NETWORK_MEMBER_TYPES, isLinkedMember, partnerTypeForMember } from '../leadSource';
import type { ProjectNetworkMember, ProjectNetworkMemberType } from '../types';

const inputCls =
  'w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500';
const labelCls = 'block text-[12.5px] font-medium text-text-800 mb-1.5';

export interface ProjectNetworkRowDraft extends ProjectNetworkMember {
  /** Stable across removals and re-orders, so React keys don't reuse the wrong row. */
  key: string;
}

export interface ProjectNetworkRowProps {
  row: ProjectNetworkRowDraft;
  index: number;
  disabled?: boolean;
  error?: string;
  takenArchitectIds: number[];
  onChangeType: (type: ProjectNetworkMemberType) => void;
  onChange: (patch: Partial<ProjectNetworkMember>) => void;
  onRemove: () => void;
}

export function ProjectNetworkRow({
  row,
  index,
  disabled = false,
  error,
  takenArchitectIds,
  onChangeType,
  onChange,
  onRemove,
}: ProjectNetworkRowProps) {
  const linked = isLinkedMember(row.memberType);

  return (
    <div
      className={`rounded-[12px] border bg-background-700 p-3 space-y-3 ${
        error ? 'border-error' : 'border-background-600'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="w-[22px] h-[22px] shrink-0 rounded-[7px] bg-background-600 border border-background-500 flex items-center justify-center text-[11px] font-[650] text-text-700 tabular-nums">
          {index + 1}
        </span>
        <select
          className={`${inputCls} h-[34px] flex-1`}
          value={row.memberType}
          onChange={(e) => onChangeType(e.target.value as ProjectNetworkMemberType)}
          disabled={disabled}
          aria-label={`Project network entry ${index + 1} type`}
        >
          {PROJECT_NETWORK_MEMBER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          title="Remove from project network"
          className="shrink-0 w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-text-500 hover:text-error hover:bg-error/10 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {linked ? (
        <ArchitectPicker
          type={partnerTypeForMember(row.memberType)}
          valueId={row.architectId}
          valueName={row.architectName}
          valueFirm={row.architectFirm}
          valueContact={row.architectContact}
          takenIds={takenArchitectIds}
          disabled={disabled}
          onSelect={(a) =>
            onChange({
              architectId: a.id,
              architectName: a.architectureName,
              architectFirm: a.firm,
              architectContact: a.contactNumber,
            })
          }
          onClear={() =>
            onChange({
              architectId: undefined,
              architectName: undefined,
              architectFirm: undefined,
              architectContact: undefined,
            })
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Name <span className="text-error">*</span>
              </label>
              <input
                className={inputCls}
                placeholder="Name"
                disabled={disabled}
                value={row.referralName ?? ''}
                onChange={(e) => onChange({ referralName: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Firm name</label>
              <input
                className={inputCls}
                placeholder="Firm / company"
                disabled={disabled}
                value={row.referralFirm ?? ''}
                onChange={(e) => onChange({ referralFirm: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                className={inputCls}
                placeholder="Phone number"
                disabled={disabled}
                value={row.referralContact ?? ''}
                onChange={(e) => onChange({ referralContact: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                className={inputCls}
                placeholder="name@example.com"
                disabled={disabled}
                value={row.referralEmail ?? ''}
                onChange={(e) => onChange({ referralEmail: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <input
              className={inputCls}
              placeholder="Location"
              disabled={disabled}
              value={row.referralLocation ?? ''}
              onChange={(e) => onChange({ referralLocation: e.target.value })}
            />
          </div>
        </div>
      )}

      {error && <p className="text-error text-xs">{error}</p>}
    </div>
  );
}

export default ProjectNetworkRow;
