/**
 * PlanDocumentsField — pick the plan documents (PDFs, photos, CAD drawings) handed to the
 * designer: by the admin along with an assignment, or by Admin staff when they move a customer
 * to Design Stage. Only holds the chosen files; the caller uploads them.
 */
import React, { useRef } from 'react';
import { Paperclip, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { PLAN_ACCEPT, addPickedFiles, formatFileSize, isPlanFileName, uploadSizeProblem } from '../designFiles';
import { FileKindIcon } from '../designUi';

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

export const PlanDocumentsField: React.FC<Props> = ({ files, onChange, disabled = false }) => {
  const input = useRef<HTMLInputElement>(null);

  const add = (picked: FileList | null) => {
    if (!picked || picked.length === 0) {return;}
    const next = addPickedFiles(files, Array.from(picked), isPlanFileName);
    if (next.refused.length > 0) {
      toast.error(`Not added: ${next.refused.join(', ')}. Use a PDF, an image, a CAD drawing (DWG, DXF) or an office file.`);
    }
    onChange(next.files);
    if (input.current) {input.current.value = '';}
  };
  const problem = uploadSizeProblem(files);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[12.5px] font-medium text-text-800">Plan documents for the designer</span>
        <input ref={input} type="file" multiple accept={PLAN_ACCEPT} className="hidden" onChange={(e) => add(e.target.files)} />
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] border border-background-600 bg-background-800 text-[12px] font-medium text-text-900 hover:bg-background-700 disabled:opacity-60"
        >
          <Paperclip size={12} /> Add files
        </button>
      </div>
      {files.length === 0 ? (
        <p className="m-0 text-[12px] text-text-500">
          Optional. Site plan, measurements or references the designer should work from — PDF, images or CAD drawings
          (DWG, DXF).
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {files.map((f, i) => (
            <div
              key={`${f.name}:${f.size}`}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] border border-background-600 bg-background-900"
            >
              <FileKindIcon name={f.name} />
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-900">{f.name}</span>
              <span className="text-[11.5px] text-text-500 whitespace-nowrap tabular-nums">{formatFileSize(f.size)}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                disabled={disabled}
                aria-label={`Remove ${f.name}`}
                className="w-6 h-6 rounded-md flex items-center justify-center text-text-500 hover:bg-background-700 hover:text-text-900 disabled:opacity-60"
              >
                <X size={13} />
              </button>
            </div>
          ))}
          {problem && <p className="m-0 text-[11.5px] text-error">{problem}</p>}
        </div>
      )}
    </div>
  );
};

export default PlanDocumentsField;
