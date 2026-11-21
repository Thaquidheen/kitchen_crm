/**
 * DesignRequirementSheet — the customer's requirement sheet inside a design, read only: the
 * designer works from what staff marked at the client's site, but changing it stays on the
 * customer page. Folded by default so the design's own files and actions stay in reach.
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { usePermissions } from '@/features/permissions/usePermissions';
import { RequirementSheet } from '@/features/customers/components/RequirementSheet';
import { isSheetEmpty } from '@/features/customers/requirementSheetRules';
import { useGetDesignJobRequirementSheetQuery } from '../designAPI';

const sectionLabel = 'text-[10.5px] font-semibold tracking-[0.08em] uppercase text-text-500';

export const DesignRequirementSheet: React.FC<{ jobId: number }> = ({ jobId }) => {
  const { can, ready } = usePermissions();
  const [open, setOpen] = useState(false);
  // Asked only once the permissions are known: the server would refuse it without "See designs".
  const { data: sheet, isLoading: fetching, isError } = useGetDesignJobRequirementSheetQuery(jobId, {
    skip: !ready || !can('designs.view'),
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const isLoading = fetching || !ready;
  // A failed background refresh keeps showing the sheet that was loaded.
  const unavailable = isError && !sheet;
  const empty = !sheet || isSheetEmpty(sheet);
  const summary = isLoading
    ? 'Loading…'
    : unavailable
      ? 'Not available'
      : empty
        ? 'No requirement sheet yet'
        : `${sheet.counts.needed} needed · ${sheet.counts.notNeeded} not needed`;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        disabled={isLoading || unavailable || empty}
        className="w-full flex items-center gap-2 text-left disabled:cursor-default"
      >
        <span className={sectionLabel}>Requirement sheet</span>
        <span className="text-[12px] text-text-600">· {summary}</span>
        <span className="flex-1" />
        {!isLoading && !unavailable && !empty && (
          <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary-600">
            {open ? 'Hide' : 'Show'}
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
      </button>
      {/* Refused or missing is said quietly above: the design itself is still worked on. */}
      {open && sheet && !empty && (
        <div className="mt-2">
          <RequirementSheet sheet={sheet} readOnly />
        </div>
      )}
    </div>
  );
};

export default DesignRequirementSheet;
