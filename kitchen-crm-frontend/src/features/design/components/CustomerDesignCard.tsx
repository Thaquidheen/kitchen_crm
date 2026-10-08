/**
 * CustomerDesignCard — the customer's design on their own page: current version, who made it (or
 * that it was uploaded), the files a quotation is made from, plan documents and earlier versions.
 * Staff can add an existing design (while a designer has it: the admin and Admin staff); an admin
 * can send an approved design back for a redesign.
 */
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Palette, Paperclip, RotateCcw, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetCustomerDesignJobQuery, useGetDesignMeQuery, useUploadCustomerPlanDocumentsMutation } from '../designAPI';
import { PLAN_ACCEPT, addPickedFiles, isPlanFileName, uploadSizeProblem } from '../designFiles';
import {
  DesignStatusPill,
  FileKindIcon,
  ORIGIN_LABEL,
  canSettleOpenDesign,
  fileLinkProps,
  isApprovedDesign,
  isOpenDesign,
  versionLabel,
} from '../designUi';
import { RedesignModal } from './RedesignModal';
import { UploadDesignModal } from './UploadDesignModal';
import type { DesignFile } from '../types';

interface Props {
  customerId: number;
  customerName: string;
  /** CustomerStatus value. */
  customerStatus: string;
  isAdmin: boolean;
  /** The administrator may refuse uploading a design for a staff type. */
  canUploadDesign?: boolean;
}

const sectionLabel = 'text-[10.5px] font-semibold tracking-[0.09em] uppercase text-text-500';
const smallBtn =
  'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[9px] border border-background-600 bg-background-900 text-[12.5px] font-medium text-text-900 hover:bg-background-700';

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const FileLink: React.FC<{ file: DesignFile }> = ({ file }) => (
  <a
    {...fileLinkProps(file)}
    className="flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] border border-background-600 hover:bg-background-700 transition-colors"
  >
    <FileKindIcon name={file.originalFileName} />
    <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-900">{file.originalFileName}</span>
  </a>
);

/** Stages where a customer is expected to have a design to be quoted on. */
const PAST_DESIGN = new Set(['QUOTE_GIVEN', 'FOLLOW_UP', 'NEGOTIATIONS', 'CONFIRMED']);

export const CustomerDesignCard: React.FC<Props> = ({
  customerId,
  customerName,
  customerStatus,
  isAdmin,
  canUploadDesign = true,
}) => {
  const { data: design, isLoading } = useGetCustomerDesignJobQuery(customerId, {
    pollingInterval: 60000,
    refetchOnFocus: true,
  });
  const { data: designMe } = useGetDesignMeQuery();
  // Admins and Admin staff work in the Designs page; everyone else only sees the design here.
  const opensDesigns = isAdmin || !!designMe?.canCoordinate;
  const [uploadOpen, setUploadOpen] = useState(false);
  const [redesignOpen, setRedesignOpen] = useState(false);
  const [showEarlier, setShowEarlier] = useState(false);
  const planInput = useRef<HTMLInputElement>(null);
  const [uploadPlans, { isLoading: addingPlans }] = useUploadCustomerPlanDocumentsMutation();

  const approved = !!design && isApprovedDesign(design.status);
  const open = !!design && isOpenDesign(design.status);
  const version = design?.version ?? 1;
  const files = design?.files ?? [];
  const planDocuments = design?.planDocuments ?? [];
  const earlier = (design?.versions ?? []).filter((v) => v.versionNo < version).sort((a, b) => b.versionNo - a.versionNo);
  // Staff may add an existing design. One a designer is working on is for the admin or Admin staff to settle.
  const canUpload =
    canUploadDesign && (!open || canSettleOpenDesign(design, { admin: isAdmin, coordinator: !!designMe?.canCoordinate }));

  // Plan documents can be handed over from here while the customer is in Design Stage — also
  // before a designer is chosen, when there is no design to open in Designs yet.
  const canAddPlans = opensDesigns && customerStatus === 'DESIGN_STAGE' && (!design || open);
  const onPickPlans = async (picked: FileList | null) => {
    if (!picked || picked.length === 0) {return;}
    const next = addPickedFiles([], Array.from(picked), isPlanFileName);
    if (planInput.current) {planInput.current.value = '';}
    if (next.refused.length > 0) {
      toast.error(`Not added: ${next.refused.join(', ')}. Use a PDF, an image, a CAD drawing (DWG, DXF) or an office file.`);
    }
    if (next.files.length === 0) {return;}
    const tooLarge = uploadSizeProblem(next.files);
    if (tooLarge) {
      toast.error(tooLarge);
      return;
    }
    try {
      await uploadPlans({ customerId, files: next.files }).unwrap();
      toast.success(next.files.length === 1 ? 'Plan document added' : `${next.files.length} plan documents added`);
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to add the plan documents');
    }
  };
  const addPlansButton = canAddPlans && (
    <button type="button" onClick={() => planInput.current?.click()} disabled={addingPlans} className={smallBtn}>
      <Paperclip size={13} /> {addingPlans ? 'Adding…' : 'Add plan documents'}
    </button>
  );

  return (
    <div className="bg-background-800 border border-background-600 rounded-[14px] p-4">
      {/* Outside the branches below, so it stays mounted while a file is being picked. */}
      <input ref={planInput} type="file" multiple accept={PLAN_ACCEPT} className="hidden" onChange={(e) => onPickPlans(e.target.files)} />
      <div className="flex items-center gap-2 mb-3">
        <Palette size={13} className="text-text-500" />
        <span className={sectionLabel}>Design</span>
        <span className="flex-1" />
        {design && opensDesigns && (
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
          {(canUploadDesign || canAddPlans) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {canUploadDesign && (
                <button type="button" onClick={() => setUploadOpen(true)} className={smallBtn}>
                  <Upload size={13} /> Upload existing design
                </button>
              )}
              {addPlansButton}
            </div>
          )}
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

          {(canUpload || canAddPlans || (isAdmin && approved)) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {addPlansButton}
              {isAdmin && approved && (
                <button type="button" onClick={() => setRedesignOpen(true)} className={smallBtn}>
                  <RotateCcw size={13} /> Request redesign
                </button>
              )}
              {canUpload && (
                <button type="button" onClick={() => setUploadOpen(true)} className={smallBtn}>
                  <Upload size={13} /> {approved ? 'Upload newer design' : 'Upload design'}
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
