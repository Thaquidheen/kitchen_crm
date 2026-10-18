/**
 * DeleteCancelledQuotations — "Delete cancelled…" in the Quotations list, for whoever may delete
 * quotations. The window lists every cancelled quotation with a tick box; the chosen ones or all
 * of them are deleted after a confirmation. The server deletes only cancelled quotations and keeps
 * one that something else still uses (the customer's finance, a signature), saying why.
 */
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { useGetQuotationsQuery } from '@/app/baseApi';
import type { QuotationSummary } from '../types';
import { useDeleteCancelledQuotationsMutation } from '../bulkDeleteAPI';
import {
  allSelected,
  bulkDeleteRequest,
  bulkDeleteSummary,
  deleteCount,
  quotationsWord,
  selectedIds,
  someSelected,
  toggleAll,
  toggleOne,
  type BulkDeleteMode,
} from '../bulkDeleteSelection';

/** Enough for every cancelled quotation in one go; "Delete all" does not depend on it. */
const PAGE_SIZE = 1000;
/** Skipped quotations named in the toast; the rest are counted. */
const SKIPPED_SHOWN = 8;

const errMsg = (e: unknown, fallback: string) => {
  const err = e as { message?: string; data?: { message?: string } } | undefined;
  return err?.message || err?.data?.message || fallback;
};

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const projectOf = (q: QuotationSummary) => q.projectName?.trim() || q.quotationNumber || '—';

export const DeleteCancelledQuotations: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  /** Set once a delete button is pressed: the window then asks to confirm. */
  const [confirming, setConfirming] = useState<BulkDeleteMode | null>(null);

  const { data, isFetching, isError } = useGetQuotationsQuery(
    { status: 'CANCELLED', page: 0, size: PAGE_SIZE, sortBy: 'createdAt', sortDir: 'desc' },
    { skip: !open },
  );
  const [deleteCancelled, { isLoading: deleting }] = useDeleteCancelledQuotationsMutation();

  const rows: QuotationSummary[] = useMemo(() => data?.content ?? [], [data]);
  const listed = useMemo(() => rows.map((q) => q.id), [rows]);
  const total: number = data?.totalElements ?? rows.length;
  const chosen = selectedIds(selected, listed).length;
  const every = allSelected(selected, listed);
  const some = someSelected(selected, listed);

  const close = () => {
    if (deleting) {return;}
    setOpen(false);
    setConfirming(null);
    setSelected(new Set());
  };

  const labelOf = (id: number) => {
    const q = rows.find((r) => r.id === id);
    return q ? `${q.customerName} · ${projectOf(q)}` : undefined;
  };

  const run = async () => {
    if (!confirming) {return;}
    const body = bulkDeleteRequest(confirming, selected, listed);
    if (!body) {return;}
    try {
      const result = await deleteCancelled(body).unwrap();
      const { message, skipped } = bulkDeleteSummary(result, labelOf);
      if (result.deleted > 0) {
        toast.success(message);
      } else {
        toast.error(message);
      }
      if (skipped.length > 0) {
        toast(
          <div className="text-[12.5px]">
            <div className="font-semibold mb-1">{quotationsWord(skipped.length)} kept</div>
            <ul className="m-0 pl-4 list-disc">
              {skipped.slice(0, SKIPPED_SHOWN).map((line, i) => (
                <li key={`${i}-${line}`}>{line}</li>
              ))}
            </ul>
            {skipped.length > SKIPPED_SHOWN && <div className="mt-1">and {skipped.length - SKIPPED_SHOWN} more</div>}
          </div>,
          { duration: 12000 },
        );
      }
      setOpen(false);
      setConfirming(null);
      setSelected(new Set());
    } catch (e) {
      toast.error(errMsg(e, 'Failed to delete the quotations'));
    }
  };

  const count = confirming ? deleteCount(confirming, selected, listed, total) : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Delete cancelled quotations, the chosen ones or all of them"
        className="inline-flex shrink-0 items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5 text-error" />
        <span className="hidden sm:inline">Delete cancelled…</span>
      </button>
      <Modal isOpen={open} onClose={close} title="Delete cancelled quotations" size="lg">
        {confirming ? (
          <ModalBody>
            <div className="flex gap-2.5 p-3 rounded-[10px] border border-error/50 bg-error/10 text-text-900">
              <AlertTriangle size={18} className="text-error shrink-0 mt-px" />
              <div className="text-[13px]">
                <p className="m-0 font-semibold">
                  This permanently deletes {quotationsWord(count)} and cannot be undone.
                </p>
                <p className="m-0 mt-1 text-text-700">
                  Their kitchens, items and unsigned signing requests go with them. A quotation that the customer&apos;s
                  finance or a signature still uses is kept, and you are told which.
                </p>
              </div>
            </div>
          </ModalBody>
        ) : (
          <ModalBody>
            <p className="m-0 mb-3 text-[12.5px] text-text-700">
              Tick the cancelled quotations to delete, or delete all of them. Only cancelled quotations are deleted.
            </p>
            {isFetching && rows.length === 0 ? (
              <p className="m-0 py-6 text-center text-[13px] text-text-600">Loading cancelled quotations…</p>
            ) : isError ? (
              <p className="m-0 py-6 text-center text-[13px] text-text-600">Failed to load the cancelled quotations</p>
            ) : rows.length === 0 ? (
              <p className="m-0 py-6 text-center text-[13px] text-text-600">There are no cancelled quotations</p>
            ) : (
              <div className="rounded-[10px] border border-background-600 overflow-hidden">
                <label className="flex items-center gap-2.5 px-3 py-2 bg-background-700 text-[12.5px] font-semibold text-text-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={every}
                    ref={(el) => {
                      if (el) {el.indeterminate = some;}
                    }}
                    onChange={() => setSelected((s) => toggleAll(s, listed))}
                    className="h-4 w-4 accent-[var(--color-primary-600)]"
                  />
                  Select all ({rows.length})
                </label>
                <ul className="m-0 p-0 list-none max-h-[50vh] overflow-y-auto divide-y divide-background-600">
                  {rows.map((q) => (
                    <li key={q.id}>
                      <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-background-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected.has(q.id)}
                          onChange={() => setSelected((s) => toggleOne(s, q.id))}
                          className="h-4 w-4 shrink-0 accent-[var(--color-primary-600)]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-text-900 truncate">{q.customerName}</span>
                          <span className="block text-[11.5px] text-text-600 truncate">
                            {projectOf(q)}
                            {q.projectName?.trim() && q.quotationNumber ? ` · ${q.quotationNumber}` : ''}
                          </span>
                        </span>
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-primary-600/15 text-primary-600">
                          V{q.versionNumber ?? 1}
                        </span>
                        <span className="shrink-0 w-[88px] text-right text-[11.5px] text-text-600 tabular-nums">
                          {formatDate(q.createdAt)}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {total > rows.length && (
              <p className="m-0 mt-2 text-[11.5px] text-text-600">
                Showing the newest {rows.length} of {total}. &quot;Delete all cancelled&quot; deletes every one of them.
              </p>
            )}
          </ModalBody>
        )}
        <ModalFooter className="flex-wrap">
          {confirming ? (
            <>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700 disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                onClick={run}
                disabled={deleting || count === 0}
                className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-error text-white hover:brightness-105 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : `Delete ${quotationsWord(count)}`}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setConfirming('selected')}
                disabled={chosen === 0}
                className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-error/60 text-error hover:bg-error/10 disabled:opacity-50"
              >
                Delete selected ({chosen})
              </button>
              <button
                type="button"
                onClick={() => setConfirming('all')}
                disabled={rows.length === 0}
                className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-error text-white hover:brightness-105 disabled:opacity-50"
              >
                Delete all cancelled ({total})
              </button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </>
  );
};

export default DeleteCancelledQuotations;
