/**
 * CompletedDesignCard — a design approved lately, in the work board's Completed column: who made
 * it and when it was approved, the approved version, and its files. The files are the approved
 * version's design files, loaded from the design itself when the list is opened, and they open
 * the way every design screen opens them. Clicking the card opens the design, as on any card.
 */
import React, { useState } from 'react';
import { ChevronDown, Paperclip } from 'lucide-react';
import { fmtReminderDateTime } from '@/utils/reminderFormat';
import { useGetDesignJobQuery } from '../designAPI';
import { completedByText, finishedAt } from '../designFilters';
import { DesignFileLink, DesignStatusPill, versionLabel } from '../designUi';
import type { DesignJob } from '../types';

const filesWord = (n: number) => (n === 1 ? '1 file' : `${n} files`);

export const CompletedDesignCard: React.FC<{ job: DesignJob; onOpen: (id: number) => void }> = ({ job, onOpen }) => {
  const [showFiles, setShowFiles] = useState(false);
  // The same request the design window makes; only sent once the list is opened.
  const { data: detail, isFetching, isError } = useGetDesignJobQuery(job.id, { skip: !showFiles });
  const files = detail?.files ?? [];
  const at = finishedAt(job);
  return (
    <div className="rounded-[11px] border border-background-600 bg-background-900 hover:border-primary-600 transition-colors">
      <button type="button" onClick={() => onOpen(job.id)} className="w-full min-w-0 text-left px-2.5 pt-2 pb-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 text-[13px] font-semibold text-text-900 truncate">{job.customerName}</span>
          <span
            className="shrink-0 inline-flex items-center px-1.5 py-[1px] rounded-full border border-background-600 text-[10.5px] font-semibold text-text-800 tabular-nums"
            title="Approved version"
          >
            {versionLabel(job.version)}
          </span>
        </span>
        <span className="flex items-center gap-1.5 flex-wrap mt-1">
          <span className="text-[11.5px] text-text-600 min-w-0">
            {completedByText(job)}
            {at ? ` · ${fmtReminderDateTime(at)}` : ''}
          </span>
          {/* Plain "Approved" goes without saying here; later steps (sent to client, final) are shown. */}
          {job.status !== 'APPROVED_BY_ADMIN' && <DesignStatusPill status={job.status} />}
        </span>
      </button>
      <div className="px-2.5 pb-2">
        {job.fileCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowFiles((v) => !v)}
            aria-expanded={showFiles}
            className="inline-flex items-center gap-1 h-6 -ml-1 px-1 rounded-md text-[11.5px] font-medium text-text-600 hover:text-text-900 hover:bg-background-700"
          >
            <Paperclip size={11} /> {filesWord(job.fileCount)}
            <ChevronDown size={12} className={`transition-transform ${showFiles ? 'rotate-180' : ''}`} />
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 h-6 text-[11.5px] text-text-500">
            <Paperclip size={11} /> No files
          </span>
        )}
        {showFiles && (
          <div className="flex flex-col gap-1 mt-1">
            {isFetching && files.length === 0 ? (
              <span className="text-[11.5px] text-text-500 py-1">Loading files…</span>
            ) : isError ? (
              <span className="text-[11.5px] text-error py-1">The files could not be loaded.</span>
            ) : files.length === 0 ? (
              <span className="text-[11.5px] text-text-500 py-1">No files in this version.</span>
            ) : (
              files.map((f) => <DesignFileLink key={f.id} file={f} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedDesignCard;
