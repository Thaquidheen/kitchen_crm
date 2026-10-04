/**
 * PlanDocumentsField — pick the plan documents (PDFs, photos) an admin hands to the designer along
 * with an assignment. Only holds the chosen files; the caller uploads them once the design exists.
 */
import React, { useRef } from 'react';
import { FileText, Paperclip, X } from 'lucide-react';
import { isPdfFile } from '../designUi';

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

/** What the server accepts for design-phase files, minus the formats that make no sense as a plan. */
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.zip';

export const PlanDocumentsField: React.FC<Props> = ({ files, onChange, disabled = false }) => {
  const input = useRef<HTMLInputElement>(null);

  const add = (picked: FileList | null) => {
    if (!picked || picked.length === 0) {return;}
    // The same file picked twice is one document.
    const known = new Set(files.map((f) => `${f.name}:${f.size}`));
    const fresh = Array.from(picked).filter((f) => !known.has(`${f.name}:${f.size}`));
    onChange([...files, ...fresh]);
    if (input.current) {input.current.value = '';}
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[12.5px] font-medium text-text-800">Plan documents for the designer</span>
        <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => add(e.target.files)} />
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] border border-background-600 bg-background-800 text-[12px] font-medium text-text-900 hover:bg-background-700 disabled:opacity-60"
        >
          <Paperclip size={12} /> Add PDF
        </button>
      </div>
      {files.length === 0 ? (
        <p className="m-0 text-[12px] text-text-500">Optional. Site plan, measurements or references the designer should work from.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {files.map((f, i) => (
            <div
              key={`${f.name}:${f.size}`}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] border border-background-600 bg-background-900"
            >
              {isPdfFile(f.name) ? (
                <FileText size={14} className="text-primary-600 shrink-0" />
              ) : (
                <Paperclip size={14} className="text-text-500 shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-900">{f.name}</span>
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
        </div>
      )}
    </div>
  );
};

export default PlanDocumentsField;
