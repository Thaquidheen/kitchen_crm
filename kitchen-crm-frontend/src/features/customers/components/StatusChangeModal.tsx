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
 *  - Design Stage: the designer who gets the design — chosen by the admin only. Anyone else moves
 *    the customer without a designer; it then waits under "To assign" in Designs. Plan documents
 *    can be handed over by the admin and by Admin staff.
 *  - Quotation Stage: the customer's design. When none is approved yet, the finished design
 *    (PDFs, images, CAD drawings) is uploaded here. While a designer still has it, the admin and
 *    Admin staff can upload it here; for anyone else the move waits for the admin's approval.
 */

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '../../../components/ui/Modal';
import { STATUS_PILL } from './CustomerList';
import type { CustomerStatus } from '../types';
import type { StatusChangeExtras } from '../useCustomerStatusChange';
import { useIsSuperAdmin } from '../../auth/useIsSuperAdmin';
import { usePermissions } from '../../permissions/usePermissions';
import { DesignerPicker, type DesignAssignment } from '../../design/components/DesignerPicker';
import { DesignFilesBox } from '../../design/components/DesignFilesBox';
import { PlanDocumentsField } from '../../design/components/PlanDocumentsField';
import { useGetCustomerDesignJobQuery, useGetDesignMeQuery } from '../../design/designAPI';
import {
  DESIGN_ACCEPT,
  DESIGN_KINDS_TEXT,
  addPickedFiles,
  fileKindLabel,
  isDesignFileName,
  uploadSizeProblem,
} from '../../design/designFiles';
import {
  DESIGN_STATUS,
  canSettleOpenDesign,
  defaultDueDate,
  fileLinkProps,
  isApprovedDesign,
  quotationGate,
  versionLabel,
} from '../../design/designUi';

export interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Receives the trimmed, non-empty note and whatever the target stage needs: the chosen
   * designer (always set when the admin moves a customer to Design — the modal will not submit
   * without one), plan documents, or the design files for Quotation Stage.
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
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  // Choosing the designer is the admin's alone. Admin staff hand over plan documents too.
  const canAssign = useIsSuperAdmin();
  const { data: designMe } = useGetDesignMeQuery(undefined, { skip: !isOpen });
  const coordinates = canAssign || !!designMe?.canCoordinate;
  const { can } = usePermissions();
  const isBulk = count > 1;
  const toDesign = targetStatus === 'DESIGN_STAGE';
  const toQuotation = targetStatus === 'QUOTE_GIVEN';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const designInput = useRef<HTMLInputElement>(null);

  // The customer's design decides what Quotation Stage needs, and whether Design Stage is a redesign.
  const watchDesign = isOpen && !isBulk && !!customerId && (toDesign || toQuotation);
  const { currentData: designJob, isFetching } = useGetCustomerDesignJobQuery(customerId ?? 0, {
    skip: !watchDesign,
    refetchOnMountOrArgChange: true,
  });
  // Loading means no answer for THIS customer yet. A refresh in the background (the customer page
  // reloads the design whenever the window gets focus back — which is exactly what happens when
  // the file picker closes) must not swap the form out from under a file being chosen.
  const loadingDesign = designJob === undefined && isFetching;
  const customerDesign = watchDesign ? designJob ?? null : null;
  const gate = quotationGate(customerDesign);

  // Start every change with an empty box, and focus it so the note is the
  // obvious next action rather than an afterthought.
  useEffect(() => {
    if (isOpen) {
      setNote('');
      setDesign({ designerId: currentDesignerId ?? null, dueDate: defaultDueDate(), priority: 'MEDIUM' });
      setPlanFiles([]);
      setDesignFiles([]);
      const t = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen, currentDesignerId]);

  const trimmed = note.trim();
  const needsDesigner = toDesign && canAssign && !design.designerId;
  // A single move to Quotation Stage is settled here; a bulk one is checked per customer by the server.
  const quotationSingle = toQuotation && !isBulk && !!customerId;
  const designPending = quotationSingle && loadingDesign;
  // A design that is still open can be finished right here by whoever may do that.
  const settlesOpen =
    quotationSingle &&
    !loadingDesign &&
    gate === 'WITH_DESIGNER' &&
    can('customers.upload_design') &&
    canSettleOpenDesign(customerDesign, { admin: canAssign, coordinator: coordinates });
  const designBlocks = quotationSingle && !loadingDesign && gate === 'WITH_DESIGNER' && !settlesOpen;
  const uploadsDesign = quotationSingle && !loadingDesign && (gate === 'NEEDS_DESIGN' || settlesOpen);
  const needsDesign = uploadsDesign && designFiles.length === 0;
  const designTooLarge = uploadsDesign ? uploadSizeProblem(designFiles) : null;
  const handsOverPlans = toDesign && coordinates && !isBulk;
  const plansTooLarge = handsOverPlans ? uploadSizeProblem(planFiles) : null;
  const canSubmit =
    trimmed.length > 0 &&
    !isSubmitting &&
    !needsDesigner &&
    !designPending &&
    !designBlocks &&
    !needsDesign &&
    !designTooLarge &&
    !plansTooLarge;

  const pickDesign = (picked: FileList | null) => {
    if (!picked || picked.length === 0) {return;}
    const next = addPickedFiles(designFiles, Array.from(picked), isDesignFileName);
    if (next.refused.length > 0) {
      toast.error(`Not added: ${next.refused.join(', ')}. A design is ${DESIGN_KINDS_TEXT}.`);
    }
    setDesignFiles(next.files);
    if (designInput.current) {designInput.current.value = '';}
  };

  const submit = () => {
    if (!canSubmit) {return;}
    onConfirm(trimmed, {
      design: toDesign && canAssign ? design : undefined,
      planFiles: handsOverPlans ? planFiles : undefined,
      designFiles: uploadsDesign ? designFiles : undefined,
    });
  };

  const blockedReason =
    trimmed.length === 0
      ? 'Add a note to continue'
      : needsDesigner
        ? 'Choose a designer to continue'
        : needsDesign
          ? 'Choose the design files to continue'
          : designTooLarge || plansTooLarge
            ? designTooLarge || plansTooLarge || undefined
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

        {/* Moving to Design: the admin assigns the design to a designer (required). */}
        {toDesign && !canAssign && (
          <div className="mt-4 pt-4 border-t border-background-600 space-y-3">
            <p className="m-0 flex items-start gap-2 text-[12.5px] text-text-700">
              <Info size={14} className="text-primary-600 shrink-0 mt-px" />
              <span>
                The admin chooses the designer.{' '}
                {isBulk ? 'These customers wait' : 'This customer waits'} under “To assign” in Designs until then.
                {handsOverPlans ? ' Plan documents you add here are kept for the designer.' : ''}
              </span>
            </p>
            {handsOverPlans && <PlanDocumentsField files={planFiles} onChange={setPlanFiles} disabled={isSubmitting} />}
          </div>
        )}
        {toDesign && canAssign && (
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
            {!isBulk && <PlanDocumentsField files={planFiles} onChange={setPlanFiles} disabled={isSubmitting} />}
            {isBulk && (
              <p className="m-0 text-[11.5px] text-text-600">
                Plan documents are added per customer afterwards, from each design.
              </p>
            )}
          </div>
        )}

        {/* Moving to Quotation Stage needs the customer's design. */}
        {toQuotation && (
          <div className="mt-4 pt-4 border-t border-background-600">
            {/* Kept mounted whatever is shown below, so a chosen file is never lost to a re-render. */}
            {quotationSingle && (
              <input
                ref={designInput}
                type="file"
                multiple
                accept={DESIGN_ACCEPT}
                className="hidden"
                onChange={(e) => pickDesign(e.target.files)}
              />
            )}
            {isBulk || !customerId ? (
              <p className="m-0 flex items-start gap-2 text-[12.5px] text-text-700">
                <Info size={14} className="text-primary-600 shrink-0 mt-px" />
                <span>
                  Only customers that already have an approved design move. The rest stay selected, so each one can be
                  opened and its design uploaded.
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
                    {...fileLinkProps(customerDesign.currentDesignFile)}
                    title={customerDesign.currentDesignFile.originalFileName}
                    className="inline-flex items-center gap-1 text-[12.5px] font-semibold hover:underline"
                    style={{ color: 'var(--st-confirmed-fg)' }}
                  >
                    <FileText size={13} /> {fileKindLabel(customerDesign.currentDesignFile.originalFileName)}
                  </a>
                )}
              </div>
            ) : settlesOpen && customerDesign ? (
              <div>
                <p className="m-0 mb-2.5 flex items-start gap-2 px-3 py-2.5 rounded-[10px] bg-background-900 border border-background-600 text-[12.5px] text-text-800">
                  <Info size={14} className="text-primary-600 shrink-0 mt-px" />
                  <span>
                    {customerDesign.designerName
                      ? `The design is with ${customerDesign.designerName} (${DESIGN_STATUS[customerDesign.status]?.label ?? customerDesign.status}). `
                      : 'No designer has this design yet. '}
                    Upload the finished design to approve it and move the customer now
                    {customerDesign.designerName
                      ? ` — ${customerDesign.designerName} is told. Otherwise the customer moves by itself when the admin approves the design in Designs.`
                      : '.'}
                  </span>
                </p>
                <DesignFilesBox
                  files={designFiles}
                  onChoose={() => designInput.current?.click()}
                  onRemove={(i) => setDesignFiles(designFiles.filter((_, j) => j !== i))}
                  disabled={isSubmitting}
                />
                <p className="text-[11.5px] text-text-600 mt-1">
                  It is saved as {versionLabel(customerDesign.version)} of the customer’s design and shown in Designs.
                </p>
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
                <DesignFilesBox
                  files={designFiles}
                  onChoose={() => designInput.current?.click()}
                  onRemove={(i) => setDesignFiles(designFiles.filter((_, j) => j !== i))}
                  disabled={isSubmitting}
                />
                <p className="text-[11.5px] text-text-600 mt-1">
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
