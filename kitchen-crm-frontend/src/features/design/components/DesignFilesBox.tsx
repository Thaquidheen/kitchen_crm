/**
 * DesignFilesBox — the files chosen as a customer's design: PDFs, images and CAD drawings, one or
 * several. It only draws them. The caller owns the list and the hidden file input, so the input
 * stays mounted whatever this box is showing — a picker that loses its input loses the file.
 */
import React from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { DESIGN_KINDS_TEXT, formatFileSize, uploadSizeProblem } from '../designFiles';
import { FileKindIcon } from '../designUi';

interface Props {
  files: File[];
  /** Opens the file picker. */
  onChoose: () => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export const DesignFilesBox: React.FC<Props> = ({ files, onChoose, onRemove, disabled = false }) => {
  const problem = uploadSizeProblem(files);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[12.5px] font-medium text-text-800">
          Design files <span className="text-error">*</span>
        </span>
        {files.length > 0 && (
          <button
            type="button"
            onClick={onChoose}
            disabled={disabled}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[8px] border border-background-600 bg-background-800 text-[12px] font-medium text-text-900 hover:bg-background-700 disabled:opacity-60"
          >
            <Plus size={12} /> Add more
          </button>
        )}
      </div>
      {files.length === 0 ? (
        <button
          type="button"
          onClick={onChoose}
          disabled={disabled}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] border border-dashed border-background-600 bg-background-900 text-left hover:bg-background-700 transition-colors disabled:opacity-60"
        >
          <Upload size={16} className="text-text-500 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-[13px] text-text-600">Choose the design files…</span>
        </button>
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
                onClick={() => onRemove(i)}
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
      {problem ? (
        <p className="text-[11.5px] text-error mt-1.5">{problem}</p>
      ) : (
        <p className="text-[11.5px] text-text-600 mt-1.5">{DESIGN_KINDS_TEXT}. More than one file can be chosen.</p>
      )}
    </div>
  );
};

export default DesignFilesBox;
