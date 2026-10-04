/**
 * StatusChangeModal
 * Captures the mandatory note that accompanies every customer status change.
 * The note is stored as WorkflowHistory.changeReason and is what the customer's
 * Timeline tab renders, so a status change is never left without a reason.
 *
 * Serves both the single-customer change (detail page header) and the bulk
 * change from the customers list, where one note is written to every selected row.
 *
 * Two stages need more than a note:
 *  - Design Stage: the designer who gets the design (and, from an admin, plan documents).
 *  - Quotation Stage: the customer's design. When none is approved yet, the existing design PDF
 *    is uploaded here; while a designer still has it, the move waits for the admin's approval.
 */

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, Info, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '../../../components/ui/Modal';
import { STATUS_PILL } from './CustomerList';
import type { CustomerStatus } from '../types';
import type { StatusChangeExtras } from '../useCustomerStatusChange';
import { useIsSuperAdmin } from '../../auth/useIsSuperAdmin';
import { DesignerPicker, type DesignAssignment } from '../../design/components/DesignerPicker';
import { PlanDocumentsField } from '../../design/components/PlanDocumentsField';
import { useGetCustomerDesignJobQuery } from '../../design/designAPI';
import {
  DESIGN_STATUS,
  defaultDueDate,
  isApprovedDesign,
  isPdfFile,
  quotationGate,
  versionLabel,
} from '../../design/designUi';
import { fileUrl } from '../../../utils/fileUrl';

export interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Receives the trimmed, non-empty note and whatever the target stage needs: the chosen
   * designer (always set when moving to Design — the modal will not submit without one), plan
   * documents, or the design PDF for Quotation Stage.
   */
  onConfirm: (note: string, extras: StatusChangeExtras) => void;
  /** Status being moved to. Null keeps the modal closed. */
  targetStatus: CustomerStatus | null;
  /** Current status — omitted for bulk changes, where rows differ. */
  currentStatus?: CustomerStatus;
  /** Number of customers affected; > 1 switches to the bulk wording. */
  count?: number;
  isSubmitting?: boolean;
  /** Designer already assigned to this customer's design (preselected when moving to Design). */
  currentDesignerId?: number | null;
  /** The one customer being changed. Lets the modal look at their design; omitted for bulk. */
  customerId?: number;
}

/**
 * The backend takes the note as a `reason` query parameter, so it shares the request
 * line's size budget. 500 is far more than a status note needs and leaves the URL
 * comfortably inside Tomcat's limit even after encoding.
 */
const NOTE_MAX = 500;

const pill = (status: string) => {
  const meta = STATUS_PILL[status] ?? { st: 'lead', label: status };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: `var(--st-${meta.st}-bg)`, color: `var(--st-${meta.st}-fg)` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--st-${meta.st}-fg)` }} />
      {meta.label}
    </span>
  );
};

export function StatusChangeModal({
  isOpen,
  onClose,
  onConfirm,
  targetStatus,
  currentStatus,
  count = 1,
  isSubmitting = false,
  currentDesignerId = null,
  customerId,
}: StatusChangeModalProps) {
  const [note, setNote] = useState('');
  const [design, setDesign] = useState<DesignAssignment>({
    designerId: null,
    dueDate: defaultDueDate(),
    priority: 'MEDIUM',
  });
  const [planFiles, setPlanFiles] = useState<File[]>([]);
  const [designPdf, setDesignPdf] = useState<File | null>(null);
  const isAdmin = useIsSuperAdmin();
  const isBulk = count > 1;
  const toDesign = targetStatus === 'DESIGN_STAGE';
  const toQuotation = targetStatus === 'QUOTE_GIVEN';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);

  // The customer's design decides what Quotation Stage needs, and whether Design Stage is a redesign.
  const watchDesign = isOpen && !isBulk && !!customerId && (toDesign || toQuotation);
  const { data: designJob, isFetching: loadingDesign } = useGetCustomerDesignJobQuery(customerId ?? 0, {
    skip: !watchDesign,
    refetchOnMountOrArgChange: true,
  });
  const customerDesign = watchDesign ? designJob ?? null : null;
  const gate = quotationGate(customerDesign);

  // Start every change with an empty box, and focus it so the note is the
  // obvious next action rather than an afterthought.
  useEffect(() => {
    if (isOpen) {
      setNote('');
      setDesign({ designerId: currentDesignerId ?? null, dueDate: defaultDueDate(), priority: 'MEDIUM' });
      setPlanFiles([]);
      setDesignPdf(null);
      const t = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen, currentDesignerId]);

  const trimmed = note.trim();
  const needsDesigner = toDesign && !design.designerId;
  // A single move to Quotation Stage is settled here; a bulk one is checked per customer by the server.
  const quotationSingle = toQuotation && !isBulk && !!customerId;
  const designPending = quotationSingle && loadingDesign;
  const designBlocks = quotationSingle && !loadingDesign && gate === 'WITH_DESIGNER';
  const needsPdf = quotationSingle && !loadingDesign && gate === 'NEEDS_PDF' && !designPdf;
  const canSubmit =
    trimmed.length > 0 && !isSubmitting && !needsDesigner && !designPending && !designBlocks && !needsPdf;

  const pickPdf = (f?: File | null) => {
    if (!f) {return;}
    if (!isPdfFile(f.name)) {
      toast.error('The design must be a PDF file');
      if (pdfInput.current) {pdfInput.current.value = '';}
      return;
    }
    setDesignPdf(f);
  };

  const submit = () => {
    if (!canSubmit) {return;}
    onConfirm(trimmed, {
      design: toDesign ? design : undefined,
      planFiles: toDesign && !isBulk ? planFiles : undefined,
      designPdf: quotationSingle && gate === 'NEEDS_PDF' ? designPdf : undefined,
    });
  };

  const blockedReason =
    trimmed.length === 0
      ? 'Add a note to continue'
      : needsDesigner
        ? 'Choose a designer to continue'
        : needsPdf
          ? 'Upload the design PDF to continue'
          : designBlocks
            ? 'The design is still with the designer'
            : undefined;

  return (
    <Modal
      isOpen={isOpen && targetStatus !== null}
      onClose={onClose}
      title={isBulk ? `Change status · ${count} customers` : 'Change status'}
      size="md"
    >
      <ModalBody>
        {/* What is about to happen */}
        <div className="flex items-center gap-2.5 flex-wrap px-3.5 py-3 rounded-[10px] bg-background-900 border border-background-600 mb-4">
          {isBulk ? (
            <span className="text-[13px] text-text-800">
              <span className="font-semibold text-text-900 tabular-nums">{count}</span> customers move to
            </span>
          ) : (
            <>
              {currentStatus ? pill(currentStatus) : null}
              <ArrowRight size={14} className="text-text-500 shrink-0" />
            </>
          )}
          {targetStatus ? pill(targetStatus) : null}
        </div>

        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <label htmlFor="status-change-note" className="block text-[12.5px] font-medium text-text-800">
            Note <span className="text-error">*</span>
          </label>
          <span
            className={`text-[11px] tabular-nums ${
              note.length > NOTE_MAX - 50 ? 'text-text-800' : 'text-text-500'
            }`}
          >
            {note.length}/{NOTE_MAX}
          </span>
        </div>
        <textarea
          id="status-change-note"
          ref={textareaRef}
          rows={3}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            // Ctrl/Cmd+Enter submits, matching the quick-entry feel of the other modals.
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            isBulk
              ? 'Why are these customers moving stage? Saved to each timeline…'
              : 'Why is this customer moving stage? e.g. Quote sent after site visit'
          }
          className="w-full px-3 py-2.5 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500 resize-none"
        />
        <p className="text-[11.5px] text-text-600 mt-1.5">
          {isBulk
            ? 'This note is saved to the timeline of every selected customer.'
            : 'This note is saved to the customer’s timeline.'}
        </p>

        {/* Moving to Design assigns the design to a designer (required). */}
        {toDesign && (
          <div className="mt-4 pt-4 border-t border-background-600 space-y-3">
            {customerDesign && isApprovedDesign(customerDesign.status) && (
              <p className="m-0 flex items-start gap-2 px-3 py-2.5 rounded-[10px] bg-background-900 border border-background-600 text-[12.5px] text-text-800">
                <Info size={14} className="text-primary-600 shrink-0 mt-px" />
                <span>
                  This customer has an approved design ({versionLabel(customerDesign.version)}). Moving back to Design starts{' '}
                  <span className="font-semibold text-text-900">{versionLabel((customerDesign.version ?? 1) + 1)}</span> — write
                  what needs to change in the note.
                </span>
              </p>
            )}
            <div>
              <DesignerPicker value={design} onChange={setDesign} />
              <p className="text-[11.5px] text-text-600 mt-1.5">
                {isBulk
                  ? 'Each selected customer is added to this designer’s queue. The note becomes the design brief.'
                  : 'The design goes to the end of this designer’s queue. The note becomes the design brief.'}
              </p>
            </div>
            {isAdmin && !isBulk && <PlanDocumentsField files={planFiles} onChange={setPlanFiles} disabled={isSubmitting} />}
            {isAdmin && isBulk && (
              <p className="m-0 text-[11.5px] text-text-600">
                Plan documents are added per customer afterwards, from each design.
              </p>
            )}
          </div>
        )}

        {/* Moving to Quotation Stage needs the customer's design. */}
        {toQuotation && (
          <div className="mt-4 pt-4 border-t border-background-600">
            {isBulk || !customerId ? (
              <p className="m-0 flex items-start gap-2 text-[12.5px] text-text-700">
                <Info size={14} className="text-primary-600 shrink-0 mt-px" />
                <span>
                  Only customers that already have an approved design move. The rest stay selected, so each one can be
                  opened and its design PDF uploaded.
                </span>
              </p>
            ) : loadingDesign ? (
              <div className="h-10 rounded-[10px] bg-background-700 animate-pulse" />
            ) : gate === 'READY' && customerDesign ? (
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px]" style={{ background: 'var(--st-confirmed-bg)' }}>
                <CheckCircle2 size={15} className="shrink-0" style={{ color: 'var(--st-confirmed-fg)' }} />
                <span className="min-w-0 flex-1 text-[12.5px]" style={{ color: 'var(--st-confirmed-fg)' }}>
                  Design {versionLabel(customerDesign.version)} is approved
                  {customerDesign.origin === 'UPLOADED' ? ' (uploaded)' : customerDesign.designerName ? ` · ${customerDesign.designerName}` : ''}.
                </span>
                {customerDesign.currentDesignFile && (
                  <a
                    href={fileUrl(customerDesign.currentDesignFile.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[12.5px] font-semibold hover:underline"
                    style={{ color: 'var(--st-confirmed-fg)' }}
                  >
                    <FileText size={13} /> PDF
                  </a>
                )}
              </div>
            ) : gate === 'WITH_DESIGNER' && customerDesign ? (
              <p className="m-0 flex items-start gap-2 px-3 py-2.5 rounded-[10px] text-[12.5px]" style={{ background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }}>
                <Info size={14} className="shrink-0 mt-px" />
                <span>
                  The design is still with {customerDesign.designerName ?? 'the designer'} (
                  {DESIGN_STATUS[customerDesign.status]?.label ?? customerDesign.status}). The customer moves to Quotation Stage
                  automatically when the admin approves it in Designs.
                </span>
              </p>
            ) : (
              <div>
                <span className="block text-[12.5px] font-medium text-text-800 mb-1.5">
                  Design PDF <span className="text-error">*</span>
                </span>
                <input
                  ref={pdfInput}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => pickPdf(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => pdfInput.current?.click()}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] border border-dashed border-background-600 bg-background-900 text-left hover:bg-background-700 transition-colors"
                >
                  {designPdf ? (
                    <FileText size={16} className="text-primary-600 shrink-0" />
                  ) : (
                    <Upload size={16} className="text-text-500 shrink-0" />
                  )}
                  <span className={`min-w-0 flex-1 truncate text-[13px] ${designPdf ? 'text-text-900' : 'text-text-600'}`}>
                    {designPdf ? designPdf.name : 'Choose the design PDF…'}
                  </span>
                  {designPdf && <span className="text-[12px] font-medium text-primary-600">Change</span>}
                </button>
                <p className="text-[11.5px] text-text-600 mt-1.5">
                  Quotation Stage needs the customer’s design. It is saved to their design history and shown in Designs.
                </p>
              </div>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700 hover:text-text-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          title={blockedReason}
          className="btn-raised-accent inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving…' : 'Update status'}
        </button>
      </ModalFooter>
    </Modal>
  );
}

export default StatusChangeModal;
