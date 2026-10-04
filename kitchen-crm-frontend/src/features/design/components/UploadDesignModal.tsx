/**
 * UploadDesignModal — save an already existing design PDF as a customer's design. Used for
 * customers whose design was made outside the system, for a newer PDF replacing an approved one
 * (it becomes the next version), and by an admin to settle a design a designer still has open.
 */
import React, { useEffect, useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { useUploadCustomerDesignMutation } from '../designAPI';
import { isApprovedDesign, isOpenDesign, isPdfFile, versionLabel } from '../designUi';
import type { DesignJob } from '../types';

export interface UploadDesignTarget {
  customerId: number;
  customerName: string;
  /** The customer's pipeline stage, to say so when the upload moves them on. */
  customerStatus?: string | null;
  /** The customer's design as it is now, when they have one. */
  design?: Pick<DesignJob, 'status' | 'version' | 'designerName'> | null;
}

interface Props {
  target: UploadDesignTarget | null;
  onClose: () => void;
}

const errMsg = (e: any, fallback: string) => e?.message || e?.data?.message || fallback;

export const UploadDesignModal: React.FC<Props> = ({ target, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const [uploadDesign, { isLoading }] = useUploadCustomerDesignMutation();

  useEffect(() => {
    if (target) {
      setFile(null);
      setNote('');
    }
  }, [target]);

  const design = target?.design ?? null;
  const approved = !!design && isApprovedDesign(design.status);
  const open = !!design && isOpenDesign(design.status);
  // An approved design is never overwritten: a newer PDF is its next version.
  const savedAs = versionLabel(approved ? (design?.version ?? 1) + 1 : design?.version ?? 1);

  const pick = (f?: File | null) => {
    if (!f) {return;}
    if (!isPdfFile(f.name)) {
      toast.error('The design must be a PDF file');
      if (input.current) {input.current.value = '';}
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!target || !file) {return;}
    try {
      const saved = await uploadDesign({ customerId: target.customerId, file, note: note.trim() || undefined }).unwrap();
      // An approved design ends the Design stage for a customer who was in it.
      toast.success(
        target.customerStatus === 'DESIGN_STAGE' && saved.customerStatus === 'QUOTE_GIVEN'
          ? `Design ${savedAs} saved — customer moved to Quotation Stage`
          : `Design ${savedAs} saved`,
      );
      onClose();
    } catch (e) {
      toast.error(errMsg(e, 'Failed to save the design'));
    }
  };

  return (
    <Modal isOpen={target !== null} onClose={onClose} title={target ? `Upload design · ${target.customerName}` : 'Upload design'} size="md">
      <ModalBody>
        {target && (
          <div className="space-y-3.5">
            <p className="m-0 px-3.5 py-3 rounded-[10px] bg-background-900 border border-background-600 text-[12.5px] text-text-800">
              {approved && (
                <>
                  Saved as <span className="font-semibold text-text-900">{savedAs}</span>. {versionLabel(design?.version)} stays
                  in the history.
                </>
              )}
              {open && (
                <>
                  This settles <span className="font-semibold text-text-900">{savedAs}</span>
                  {design?.designerName ? `, which is with ${design.designerName},` : ''} as approved with this PDF.
                </>
              )}
              {!approved && !open && (
                <>
                  Saved as the customer&apos;s design (<span className="font-semibold text-text-900">{savedAs}</span>), approved as
                  it is. A redesign can be requested from it later.
                </>
              )}
            </p>

            <div>
              <span className="block text-[12.5px] font-medium text-text-800 mb-1.5">
                Design PDF <span className="text-error">*</span>
              </span>
              <input ref={input} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] border border-dashed border-background-600 bg-background-900 text-left hover:bg-background-700 transition-colors"
              >
                {file ? (
                  <FileText size={16} className="text-primary-600 shrink-0" />
                ) : (
                  <Upload size={16} className="text-text-500 shrink-0" />
                )}
                <span className={`min-w-0 flex-1 truncate text-[13px] ${file ? 'text-text-900' : 'text-text-600'}`}>
                  {file ? file.name : 'Choose the PDF…'}
                </span>
                {file && <span className="text-[12px] font-medium text-primary-600">Change</span>}
              </button>
            </div>

            <div>
              <label htmlFor="upload-design-note" className="block text-[12.5px] font-medium text-text-800 mb-1.5">
                Note
              </label>
              <textarea
                id="upload-design-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Optional. Where this design came from, or what changed."
                className="w-full px-3 py-2 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 resize-y placeholder:text-text-500"
              />
            </div>
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
          disabled={!file || isLoading}
          className="btn-raised-accent px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-50"
        >
          {isLoading ? 'Saving…' : `Save as ${savedAs}`}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default UploadDesignModal;
