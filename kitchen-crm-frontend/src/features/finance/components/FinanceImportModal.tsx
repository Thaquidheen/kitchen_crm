/**
 * FinanceImportModal — import payments received, expense lines and vendor releases for one
 * customer from an Excel (.xlsx/.xls) or CSV file. Choosing a file runs a check on the server (the
 * real save, rolled back), which lists every row with its problems and the totals before/after.
 * Import is offered only when every row is right, and then saves all rows together.
 */

import React, { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useDownloadFinanceImportTemplateMutation, useImportFinanceSheetMutation } from '../financeAPI';
import type { FinanceImportResult, FinanceImportRow, FinanceImportTotals } from '../types';
import { MODE_LABEL, MODE_ST, fmtDate, inr } from '../constants';
import { IMPORT_COLUMNS, importCsvTemplate, importTypeLabel } from '../financeImport';

interface FinanceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  financeId: number;
  customerName: string;
}

const TOTALS: [keyof FinanceImportTotals, string][] = [
  ['receivedTotal', 'Received'],
  ['expenseTotal', 'Total expenses'],
  ['releasedTotal', 'Payment released'],
  ['outstandingTotal', 'Outstanding expenses'],
  ['extraTotal', 'Extra expenses'],
  ['netMargin', 'Net margin'],
];

const errorText = (e: unknown) =>
  (e as { data?: { message?: string } })?.data?.message || 'The file could not be checked';

export const FinanceImportModal: React.FC<FinanceImportModalProps> = ({ isOpen, onClose, financeId, customerName }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<FinanceImportResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [runImport, { isLoading: busy }] = useImportFinanceSheetMutation();
  const [downloadTemplate, { isLoading: downloading }] = useDownloadFinanceImportTemplateMutation();
  const [saving, setSaving] = useState(false);
  // Which request is current: a check that finishes after another file was chosen, or after the
  // window was closed, must not show its result.
  const seq = useRef(0);

  const reset = () => {
    seq.current++;
    setFile(null);
    setResult(null);
    setFileError(null);
    setOnlyProblems(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const close = () => {
    reset();
    onClose();
  };

  const check = async (f: File) => {
    const id = ++seq.current;
    setFile(f);
    setResult(null);
    setFileError(null);
    try {
      const r = await runImport({ financeId, file: f, save: false }).unwrap();
      if (id !== seq.current) return;
      setResult(r.data ?? null);
      setOnlyProblems((r.data?.errorCount ?? 0) > 0);
    } catch (e) {
      if (id !== seq.current) return;
      setFileError(errorText(e));
    }
  };

  const save = async () => {
    if (!file || saving) return;
    setSaving(true);
    try {
      const r = await runImport({ financeId, file, save: true }).unwrap();
      if (r.data?.imported) {
        toast.success(r.message || 'Imported');
        close();
      } else {
        // The data changed since the check (or another row now clashes): show why.
        setResult(r.data ?? null);
        setOnlyProblems(true);
        toast.error(r.message || 'Nothing was imported');
      }
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const getTemplate = async () => {
    try {
      await downloadTemplate().unwrap();
    } catch {
      toast.error('The template could not be downloaded');
    }
  };

  const csvTemplate = () => {
    const blob = new Blob([importCsvTemplate()], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'income-expenses-import.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const pick = (list: FileList | null) => {
    const f = list?.[0];
    if (f) void check(f);
  };

  const rows = result ? (onlyProblems ? result.rows.filter((r) => r.errors.length || r.warnings.length) : result.rows) : [];
  const ready = result && result.errorCount === 0;

  return (
    <Modal isOpen={isOpen} onClose={close} title="Import from Excel or CSV" size="full">
      <ModalBody>
        <div className="space-y-4">
          <p className="m-0 text-[12.5px] text-text-700 leading-[1.6]">
            Add payments received, expense lines and vendor releases for <b className="text-text-900">{customerName}</b>{' '}
            from one sheet. The file is checked first; nothing is saved until every row is right, and then all
            rows are saved together.
          </p>

          {/* Templates + columns */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={getTemplate}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 h-[32px] px-3 rounded-[9px] border border-background-500 bg-background-800 text-[12.5px] font-medium text-text-900 hover:bg-background-700 transition-colors disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading ? 'Preparing…' : 'Excel template'}
            </button>
            <button
              type="button"
              onClick={csvTemplate}
              className="inline-flex items-center gap-1.5 h-[32px] px-3 rounded-[9px] border border-background-500 bg-background-800 text-[12.5px] font-medium text-text-900 hover:bg-background-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              CSV template
            </button>
            <span className="text-[11.5px] text-text-600">
              Columns: {IMPORT_COLUMNS.join(' · ')}. The Excel template has drop-downs, an example and instructions.
            </span>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer rounded-[12px] border-2 border-dashed px-4 py-5 flex items-center gap-3 transition-colors"
            style={{
              borderColor: dragging ? 'var(--color-primary-600)' : 'var(--color-background-500)',
              background: dragging ? 'color-mix(in oklab, var(--color-primary-600) 6%, transparent)' : 'transparent',
            }}
          >
            <FileSpreadsheet className="w-7 h-7 text-text-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[13px] font-[650] text-text-900 truncate">
                {file ? file.name : 'Choose an .xlsx, .xls or .csv file, or drop it here'}
              </div>
              <div className="text-[11.5px] text-text-600">
                {busy && !saving ? 'Checking…' : file ? 'Click to choose another file' : 'Up to 5 MB and 2,000 rows'}
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                pick(e.target.files);
                // Cleared so choosing the same (corrected) file again is noticed.
                e.target.value = '';
              }}
            />
          </div>

          {fileError && (
            <div
              className="flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[12.5px]"
              style={{ background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }}
            >
              <XCircle className="w-4 h-4 mt-[1px] shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {result && (
            <>
              {/* Verdict */}
              <div
                className="flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[12.5px]"
                style={
                  ready
                    ? { background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }
                    : { background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }
                }
              >
                {ready ? <CheckCircle2 className="w-4 h-4 mt-[1px] shrink-0" /> : <XCircle className="w-4 h-4 mt-[1px] shrink-0" />}
                <span>
                  {ready
                    ? `Ready: ${result.payments} payment${result.payments === 1 ? '' : 's'} received, ${result.expenses} expense line${result.expenses === 1 ? '' : 's'}, ${result.releases} vendor release${result.releases === 1 ? '' : 's'}.`
                    : `${result.errorCount} problem${result.errorCount === 1 ? '' : 's'} to fix. Correct the file and choose it again; nothing has been saved.`}
                  {result.warningCount > 0 &&
                    ` ${result.warningCount} row${result.warningCount === 1 ? '' : 's'} to look at (amber) before importing.`}
                </span>
              </div>

              {result.fileNotes.length > 0 && (
                <ul className="m-0 pl-5 text-[11.5px] text-text-600 space-y-0.5">
                  {result.fileNotes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}

              {/* Totals before -> after */}
              {result.after && (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-px rounded-[12px] overflow-hidden border border-background-600 bg-background-600">
                  {TOTALS.map(([k, label]) => {
                    const before = Number(result.before?.[k] ?? 0);
                    const after = Number(result.after?.[k] ?? 0);
                    return (
                      <div key={k} className="bg-background-800 px-3 py-2">
                        <div className="text-[10.5px] font-[650] uppercase tracking-[0.05em] text-text-500">{label}</div>
                        <div className="text-[13.5px] font-[650] tabular-nums text-text-900 mt-0.5">{inr(after)}</div>
                        <div className="text-[11px] tabular-nums text-text-600">
                          {after === before ? 'no change' : `was ${inr(before)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Rows */}
              <div className="flex items-center justify-between gap-2">
                <div className="text-[12px] font-[650] text-text-800">
                  {result.rows.length} row{result.rows.length === 1 ? '' : 's'} in the file
                </div>
                {(result.errorCount > 0 || result.warningCount > 0) && (
                  <label className="inline-flex items-center gap-1.5 text-[12px] text-text-700 cursor-pointer">
                    <input type="checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} />
                    Only rows with something to look at
                  </label>
                )}
              </div>
              <div className="overflow-x-auto rounded-[12px] border border-background-600 max-h-[46vh] overflow-y-auto">
                <table className="w-full border-collapse text-[12px] min-w-[860px]">
                  <thead className="sticky top-0 bg-background-700 z-10">
                    <tr>
                      {['Row', 'Type', 'Date', 'Details', 'Amount', 'Mode / split', 'Check'].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left text-[10.5px] font-[650] uppercase tracking-[0.05em] text-text-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-background-600">
                    {rows.map((r) => (
                      <ImportRowView key={r.rowNumber} row={r} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save} disabled={!ready || saving || busy}>
          <Upload className="w-4 h-4 mr-1.5" />
          {saving ? 'Importing…' : ready ? `Import ${result!.rows.length} row${result!.rows.length === 1 ? '' : 's'}` : 'Import'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const ImportRowView: React.FC<{ row: FinanceImportRow }> = ({ row: r }) => {
  const bad = r.errors.length > 0;
  const warn = !bad && r.warnings.length > 0;
  const details = [
    r.expenseName,
    r.vendorName ? `Vendor: ${r.vendorName}` : null,
    r.quotationNumber ? `Quotation ${r.quotationNumber}` : null,
    r.note,
  ].filter(Boolean);
  return (
    <tr
      style={
        bad
          ? { background: 'color-mix(in oklab, var(--st-lost-bg) 70%, transparent)' }
          : warn
            ? { background: 'color-mix(in oklab, var(--st-potential-bg) 60%, transparent)' }
            : undefined
      }
    >
      <td className="px-3 py-2 tabular-nums text-text-600 align-top">{r.rowNumber}</td>
      <td className="px-3 py-2 font-medium text-text-900 align-top whitespace-nowrap">{importTypeLabel(r.type)}</td>
      <td className="px-3 py-2 tabular-nums text-text-800 align-top whitespace-nowrap">{r.date ? fmtDate(r.date) : '—'}</td>
      <td className="px-3 py-2 text-text-800 align-top">{details.length ? details.join(' · ') : '—'}</td>
      <td className="px-3 py-2 tabular-nums font-[650] text-text-900 align-top whitespace-nowrap">
        {r.amount != null ? inr(r.amount) : '—'}
      </td>
      <td className="px-3 py-2 align-top whitespace-nowrap">
        {r.mode ? (
          <span
            className="inline-flex px-1.5 py-[1px] rounded-md text-[11px] font-semibold"
            style={{ background: `var(--st-${MODE_ST[r.mode]}-bg)`, color: `var(--st-${MODE_ST[r.mode]}-fg)` }}
          >
            {MODE_LABEL[r.mode]}
          </span>
        ) : r.type === 'EXPENSE' && r.cashInHandAmount != null ? (
          <span className="text-[11px] tabular-nums text-text-700">
            C/H {inr(r.cashInHandAmount)} · C/A {inr(r.cashInAccountAmount ?? 0)}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td className="px-3 py-2 align-top">
        {bad ? (
          <ul className="m-0 pl-0 list-none space-y-0.5" style={{ color: 'var(--st-lost-fg)' }}>
            {r.errors.map((e) => (
              <li key={e} className="flex gap-1">
                <XCircle className="w-3.5 h-3.5 mt-[1px] shrink-0" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1" style={{ color: 'var(--st-confirmed-fg)' }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> OK
            </span>
            {r.warnings.map((w) => (
              <div key={w} className="flex gap-1" style={{ color: 'var(--st-potential-fg)' }}>
                <AlertTriangle className="w-3.5 h-3.5 mt-[1px] shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
};
