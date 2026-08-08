/**
 * ReceiptsCell — file chips + upload for one payment/expense/release row.
 * Expense rows can also attach the "quote" the expense is based on (kind=QUOTE).
 */

import React, { useRef, useState } from 'react';
import { Paperclip, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUploadFinanceReceiptsMutation, useDeleteFinanceReceiptMutation } from '../financeAPI';
import type { FinanceReceipt } from '../types';
import { fileUrl } from '@/utils/fileUrl';

interface ReceiptsCellProps {
  owner: 'payments' | 'expenses' | 'releases';
  ownerId: number;
  receipts: FinanceReceipt[];
  allowQuote?: boolean;
}

export const ReceiptsCell: React.FC<ReceiptsCellProps> = ({ owner, ownerId, receipts, allowQuote }) => {
  const [upload, { isLoading: isUploading }] = useUploadFinanceReceiptsMutation();
  const [deleteReceipt] = useDeleteFinanceReceiptMutation();
  const receiptInput = useRef<HTMLInputElement>(null);
  const quoteInput = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleFiles = async (files: FileList | null, kind: 'RECEIPT' | 'QUOTE') => {
    if (!files || files.length === 0) return;
    try {
      const res = await upload({ owner, ownerId, files: Array.from(files), kind }).unwrap();
      if (res?.success === false) {
        toast.error(res?.message || 'Upload failed');
      } else {
        toast.success(files.length === 1 ? 'File uploaded' : `${files.length} files uploaded`);
      }
    } catch (e: any) {
      toast.error(e?.data?.message || 'Upload failed');
    }
    if (receiptInput.current) receiptInput.current.value = '';
    if (quoteInput.current) quoteInput.current.value = '';
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await deleteReceipt(id).unwrap();
      toast.success('File removed');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to remove file');
    }
    setDeleting(null);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {(receipts ?? []).map((r) => (
        <span
          key={r.id}
          className="inline-flex items-center gap-1 pl-2 pr-1 py-[3px] rounded-lg border border-background-500 bg-background-700 text-[11px] font-medium text-text-800 max-w-[140px]"
          title={r.fileName}
        >
          <FileText className="w-3 h-3 shrink-0 text-text-500" />
          <a
            href={fileUrl(r.fileUrl)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="truncate hover:underline"
          >
            {r.kind === 'QUOTE' ? `Quote · ${r.fileName}` : r.fileName}
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(r.id);
            }}
            disabled={deleting === r.id}
            className="w-4 h-4 rounded flex items-center justify-center text-text-500 hover:text-text-900 hover:bg-background-500 transition-colors shrink-0"
            title="Remove file"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <input
        ref={receiptInput}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files, 'RECEIPT')}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          receiptInput.current?.click();
        }}
        disabled={isUploading}
        className="inline-flex items-center gap-1 px-2 py-[3px] rounded-lg border border-dashed border-background-500 text-[11px] font-medium text-text-600 hover:text-text-900 hover:border-text-500 transition-colors"
        title="Upload receipt (PDF or image)"
      >
        <Paperclip className="w-3 h-3" />
        {isUploading ? '…' : 'Receipt'}
      </button>

      {allowQuote && (
        <>
          <input
            ref={quoteInput}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files, 'QUOTE')}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              quoteInput.current?.click();
            }}
            disabled={isUploading}
            className="inline-flex items-center gap-1 px-2 py-[3px] rounded-lg border border-dashed border-background-500 text-[11px] font-medium text-text-600 hover:text-text-900 hover:border-text-500 transition-colors"
            title="Upload the quote this expense is based on"
          >
            <Paperclip className="w-3 h-3" />
            Quote
          </button>
        </>
      )}
    </div>
  );
};
