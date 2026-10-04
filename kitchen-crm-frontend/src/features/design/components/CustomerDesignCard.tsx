/**
 * CustomerDesignCard — the customer's design on their own page: current version, who made it (or
 * that it was uploaded), the PDF a quotation is made from, plan documents and earlier versions.
 * Staff can add an existing design PDF; an admin can send an approved design back for a redesign.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, FileText, Palette, Paperclip, RotateCcw, Upload } from 'lucide-react';
import { fileUrl } from '@/utils/fileUrl';
import { useGetCustomerDesignJobQuery } from '../designAPI';
import { DesignStatusPill, ORIGIN_LABEL, isApprovedDesign, isOpenDesign, isPdfFile, versionLabel } from '../designUi';
import { RedesignModal } from './RedesignModal';
import { UploadDesignModal } from './UploadDesignModal';
import type { DesignFile } from '../types';

interface Props {
  customerId: number;
  customerName: string;
  /** CustomerStatus value. */
  customerStatus: string;
  isAdmin: boolean;
}

const sectionLabel = 'text-[10.5px] font-semibold tracking-[0.09em] uppercase text-text-500';
const smallBtn =
  'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[9px] border border-background-600 bg-background-900 text-[12.5px] font-medium text-text-900 hover:bg-background-700';

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const FileLink: React.FC<{ file: DesignFile }> = ({ file }) => (
  <a
    href={fileUrl(file.fileUrl)}
    target="_blank"
    rel="noreferrer"
    className="flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] border border-background-600 hover:bg-background-700 transition-colors"
  >
    {isPdfFile(file.originalFileName) ? (
      <FileText size={14} className="text-primary-600 shrink-0" />
    ) : (
      <Paperclip size={14} className="text-text-500 shrink-0" />
    )}
    <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-900">{file.originalFileName}</span>
  </a>
);

/** Stages where a customer is expected to have a design to be quoted on. */
const PAST_DESIGN = new Set(['QUOTE_GIVEN', 'FOLLOW_UP', 'NEGOTIATIONS', 'CONFIRMED']);

export const CustomerDesignCard: React.FC<Props> = ({ customerId, customerName, customerStatus, isAdmin }) => {
  const { data: design, isLoading } = useGetCustomerDesignJobQuery(customerId, {
    pollingInterval: 60000,
    refetchOnFocus: true,
  });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [redesignOpen, setRedesignOpen] = useState(false);
  const [showEarlier, setShowEarlier] = useState(false);

  const approved = !!design && isApprovedDesign(design.status);
  const open = !!design && isOpenDesign(design.status);
  const version = design?.version ?? 1;
  const files = design?.files ?? [];
  const planDocuments = design?.planDocuments ?? [];
  const earlier = (design?.versions ?? []).filter((v) => v.versionNo < version).sort((a, b) => b.versionNo - a.versionNo);
  // Staff may add an existing design unless a designer is working on it (that one is the admin's to settle).
  const canUpload = !open || isAdmin;

  return (
    <div className="bg-background-800 border border-background-600 rounded-[14px] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Palette size={13} className="text-text-500" />
        <span className={sectionLabel}>Design</span>
        <span className="flex-1" />
        {design && isAdmin && (
          <Link to={`/designs?job=${design.id}`} className="text-[12px] font-medium text-primary-600 hover:underline">
            Open in Designs
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="h-12 rounded-[10px] bg-background-700 animate-pulse" />
      ) : !design ? (
        <div className="space-y-2.5">
          <p className="m-0 text-[12.5px] text-text-600">
            {PAST_DESIGN.has(customerStatus)
              ? 'No design is saved for this customer yet.'
              : 'No design yet. Moving the customer to Design Stage assigns a designer.'}
          </p>
          <button type="button" onClick={() => setUploadOpen(true)} className={smallBtn}>
            <Upload size={13} /> Upload existing design
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2 py-[2px] rounded-full border border-background-600 text-[11px] font-semibold text-text-800 tabular-nums">
              {versionLabel(version)}
            </span>
            <DesignStatusPill status={design.status} />
          </div>
          <div className="text-[12.5px] text-text-700">
            {design.origin === 'UPLOADED' ? (
              ORIGIN_LABEL.UPLOADED
            ) : (
              <>
                Designer: <span className="font-semibold text-text-900">{design.designerName ?? 'Not assigned'}</span>
              </>
            )}
            {design.approvedAt
              ? ` · approved ${fmtDate(design.approvedAt)}${design.approvedByName ? ` by ${design.approvedByName}` : ''}`
              : ''}
          </div>

          {files.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {files.map((f) => (
                <FileLink key={f.id} file={f} />
              ))}
            </div>
          ) : (
            <p className="m-0 text-[12px] text-text-500">
              {open ? 'The designer has not uploaded the design yet.' : 'No design file.'}
            </p>
          )}

          {planDocuments.length > 0 && (
            <div>
              <div className="text-[11.5px] font-medium text-text-600 mb-1">Plan documents ({planDocuments.length})</div>
              <div className="flex flex-col gap-1.5">
                {planDocuments.map((f) => (
                  <FileLink key={f.id} file={f} />
                ))}
              </div>
            </div>
          )}

          {(canUpload || (isAdmin && approved)) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {isAdmin && approved && (
                <button type="button" onClick={() => setRedesignOpen(true)} className={smallBtn}>
                  <RotateCcw size={13} /> Request redesign
                </button>
              )}
              {canUpload && (
                <button type="button" onClick={() => setUploadOpen(true)} className={smallBtn}>
                  <Upload size={13} /> {approved ? 'Upload newer PDF' : 'Upload design PDF'}
                </button>
              )}
            </div>
          )}

          {earlier.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowEarlier((v) => !v)}
                aria-expanded={showEarlier}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-primary-600 hover:underline"
              >
                <ChevronDown size={13} className={`transition-transform ${showEarlier ? 'rotate-180' : ''}`} />
                Earlier versions ({earlier.length})
              </button>
              {showEarlier && (
                <div className="mt-2 flex flex-col gap-2">
                  {earlier.map((v) => (
                    <div key={v.versionNo} className="space-y-1.5">
                      <div className="text-[12px] text-text-700">
                        <span className="font-semibold text-text-900">{versionLabel(v.versionNo)}</span>
                        {' · '}
                        {v.origin === 'UPLOADED' ? ORIGIN_LABEL.UPLOADED : v.designerName ?? ORIGIN_LABEL.DESIGNER}
                        {v.approvedAt ? ` · ${fmtDate(v.approvedAt)}` : ' · not approved'}
                      </div>
                      {v.files.map((f) => (
                        <FileLink key={f.id} file={f} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <UploadDesignModal
        target={uploadOpen ? { customerId, customerName, customerStatus, design: design ?? null } : null}
        onClose={() => setUploadOpen(false)}
      />
      <RedesignModal job={redesignOpen && design ? design : null} onClose={() => setRedesignOpen(false)} />
    </div>
  );
};

export default CustomerDesignCard;
