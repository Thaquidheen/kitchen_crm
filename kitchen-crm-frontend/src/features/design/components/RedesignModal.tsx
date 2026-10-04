/**
 * RedesignModal — send an approved design back for another version: what has to change, which
 * designer does it, by when, and any new plan documents. The customer returns to Design Stage
 * (unless they are already Confirmed or Lost) and the design becomes the next version.
 */
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { useRequestRedesignMutation, useUploadPlanDocumentsMutation } from '../designAPI';
import { defaultDueDate, redesignKeepsStage, versionLabel } from '../designUi';
import { DesignerPicker, type DesignAssignment } from './DesignerPicker';
import { PlanDocumentsField } from './PlanDocumentsField';
import type { DesignJob } from '../types';

interface Props {
  /** The approved design to redo. Null keeps the modal closed. */
  job: DesignJob | null;
  onClose: () => void;
}

const NOTE_MAX = 2000;
const errMsg = (e: any, fallback: string) => e?.message || e?.data?.message || fallback;

export const RedesignModal: React.FC<Props> = ({ job, onClose }) => {
  const [value, setValue] = useState<DesignAssignment>({ designerId: null, dueDate: defaultDueDate(), priority: 'MEDIUM' });
  const [note, setNote] = useState('');
  const [planFiles, setPlanFiles] = useState<File[]>([]);
  const [requestRedesign, { isLoading: requesting }] = useRequestRedesignMutation();
  const [uploadPlanDocuments, { isLoading: uploading }] = useUploadPlanDocumentsMutation();
  const busy = requesting || uploading;

  useEffect(() => {
    if (job) {
      // The designer who made the last version is the natural first choice.
      setValue({ designerId: job.designerId ?? null, dueDate: defaultDueDate(), priority: job.priority ?? 'MEDIUM' });
      setNote('');
      setPlanFiles([]);
    }
  }, [job]);

  const next = versionLabel((job?.version ?? 1) + 1);
  const canSubmit = !!job && !!value.designerId && note.trim().length > 0 && !busy;

  const submit = async () => {
    if (!job || !value.designerId || !note.trim()) {return;}
    let updated: DesignJob;
    try {
      updated = await requestRedesign({
        id: job.id,
        designerId: value.designerId,
        note: note.trim(),
        dueDate: value.dueDate || undefined,
        priority: value.priority,
      }).unwrap();
    } catch (e) {
      toast.error(errMsg(e, 'Failed to request the redesign'));
      return;
    }
    if (planFiles.length > 0) {
      try {
        await uploadPlanDocuments({ id: updated.id, files: planFiles }).unwrap();
      } catch (e) {
        // The redesign itself is saved; only the attachments are missing.
        toast.error(`${next} is with the designer, but the plan documents were not added: ${errMsg(e, 'upload failed')}`);
        onClose();
        return;
      }
    }
    toast.success(
      updated.customerStatus === 'DESIGN_STAGE' && !redesignKeepsStage(job.customerStatus)
        ? `Redesign requested (${next}) — customer moved back to Design Stage`
        : `Redesign requested (${next})`,
    );
    onClose();
  };

  return (
    <Modal isOpen={job !== null} onClose={onClose} title={job ? `Request redesign · ${job.customerName}` : 'Request redesign'} size="md">
      <ModalBody>
        {job && (
          <div className="space-y-3.5">
            <p className="m-0 px-3.5 py-3 rounded-[10px] bg-background-900 border border-background-600 text-[12.5px] text-text-800">
              This starts <span className="font-semibold text-text-900">{next}</span> of the design.{' '}
              {versionLabel(job.version)} stays saved.{' '}
              {redesignKeepsStage(job.customerStatus)
                ? 'The customer keeps their current stage.'
                : 'The customer moves back to Design Stage and returns to Quotation Stage when the new version is approved.'}
            </p>
            <div>
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <label htmlFor="redesign-note" className="block text-[12.5px] font-medium text-text-800">
                  What needs to change <span className="text-error">*</span>
                </label>
                <span className="text-[11px] tabular-nums text-text-500">
                  {note.length}/{NOTE_MAX}
                </span>
              </div>
              <textarea
                id="redesign-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={NOTE_MAX}
                placeholder="e.g. Client wants the hob on the island and a taller pantry unit"
                className="w-full px-3 py-2 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 resize-y placeholder:text-text-500"
              />
            </div>
            <DesignerPicker value={value} onChange={setValue} />
            <PlanDocumentsField files={planFiles} onChange={setPlanFiles} disabled={busy} />
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-[10px] text-[13px] text-text-700 hover:bg-background-700">
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="btn-raised-accent px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-50"
        >
          {busy ? 'Sending…' : `Request ${next}`}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default RedesignModal;
