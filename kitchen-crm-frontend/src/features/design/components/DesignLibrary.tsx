/**
 * DesignLibrary — admin table of every customer at Quotation Stage or later with the design they
 * are being quoted on: which version, made here or uploaded, and the PDF. Customers whose design
 * was never saved show as "Not uploaded" so it can be added; an approved design can be sent back
 * for a redesign from here. Finished designs that belong to no such customer (cancelled, or the
 * customer is in another stage) sit under their own filter, so no design is unreachable.
 *
 * The table scrolls inside its card with the header pinned: the page itself stays one screen tall.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, RotateCcw, Search, Upload } from 'lucide-react';
import { STATUS_PILL } from '@/features/customers/components/CustomerList';
import { fileUrl } from '@/utils/fileUrl';
import { useGetDesignLibraryQuery } from '../designAPI';
import { DesignStatusPill, ORIGIN_LABEL, isApprovedDesign, versionLabel } from '../designUi';
import { RedesignModal } from './RedesignModal';
import { UploadDesignModal, type UploadDesignTarget } from './UploadDesignModal';
import type { DesignJob } from '../types';

interface Props {
  onOpen: (jobId: number) => void;
  /** Closed designs whose customer is not in the library (cancelled, or back in an earlier stage). */
  otherFinished: DesignJob[];
}

type Filter = 'ALL' | 'MISSING' | 'OTHER';

/** One table line: a library customer (design may be missing) or a finished design from elsewhere. */
interface Row {
  key: string;
  customerId: number;
  customerName: string;
  customerPlace?: string | null;
  customerStatus?: string | null;
  design: DesignJob | null;
}

const th = 'sticky top-0 z-10 bg-background-700 px-3 py-2 text-left text-[10.5px] font-semibold tracking-[0.07em] uppercase text-text-500 whitespace-nowrap';
const td = 'px-3 py-2 align-middle';
const ghostBtn =
  'inline-flex items-center gap-1.5 h-7 px-2 rounded-[8px] border border-background-600 bg-background-900 text-[12px] font-medium text-text-900 hover:bg-background-700 whitespace-nowrap';

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const StagePill: React.FC<{ status?: string | null }> = ({ status }) => {
  if (!status) {return <span className="text-[12px] text-text-500">—</span>;}
  const meta = STATUS_PILL[status] ?? { st: 'draft', label: status };
  return (
    <span
      className="inline-flex items-center px-2 py-[2px] rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: `var(--st-${meta.st}-bg)`, color: `var(--st-${meta.st}-fg)` }}
    >
      {meta.label}
    </span>
  );
};

export const DesignLibrary: React.FC<Props> = ({ onOpen, otherFinished }) => {
  const { data: library = [], isLoading } = useGetDesignLibraryQuery(undefined, {
    pollingInterval: 60000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const [uploadFor, setUploadFor] = useState<UploadDesignTarget | null>(null);
  const [redesign, setRedesign] = useState<DesignJob | null>(null);

  const libraryRows: Row[] = useMemo(
    () =>
      library.map((r) => ({
        key: `c${r.customerId}`,
        customerId: r.customerId,
        customerName: r.customerName,
        customerPlace: r.customerPlace,
        customerStatus: r.customerStatus,
        design: r.design,
      })),
    [library],
  );
  const otherRows: Row[] = useMemo(
    () =>
      otherFinished.map((j) => ({
        key: `j${j.id}`,
        customerId: j.customerId,
        customerName: j.customerName,
        customerPlace: j.customerPlace,
        customerStatus: j.customerStatus,
        design: j,
      })),
    [otherFinished],
  );
  const missing = useMemo(() => libraryRows.filter((r) => !r.design).length, [libraryRows]);

  const rows = useMemo(() => {
    const base = filter === 'OTHER' ? otherRows : filter === 'MISSING' ? libraryRows.filter((r) => !r.design) : libraryRows;
    const q = search.trim().toLowerCase();
    if (!q) {return base;}
    return base.filter(
      (r) => r.customerName.toLowerCase().includes(q) || (r.customerPlace ?? '').toLowerCase().includes(q),
    );
  }, [filter, search, libraryRows, otherRows]);

  const chip = (key: Filter, label: string, count: number) => {
    const active = filter === key;
    return (
      <button
        type="button"
        onClick={() => setFilter(key)}
        aria-pressed={active}
        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] border text-[12.5px] whitespace-nowrap transition-colors ${
          active ? 'font-semibold text-text-900' : 'font-medium text-text-700 hover:text-text-900'
        }`}
        style={
          active
            ? {
                borderColor: 'var(--color-primary-600)',
                background: 'color-mix(in oklab, var(--color-primary-600) 14%, transparent)',
              }
            : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-900)' }
        }
      >
        {label}
        <span className="tabular-nums text-text-600">{count}</span>
      </button>
    );
  };

  return (
    <div className="bg-background-800 border border-background-600 rounded-[14px] flex flex-col min-h-0 lg:max-h-[calc(100dvh-196px)]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap px-3.5 py-2.5 border-b border-background-600">
        {chip('ALL', 'Quotation Stage and later', libraryRows.length)}
        {chip('MISSING', 'Design not uploaded', missing)}
        {otherRows.length > 0 && chip('OTHER', 'Other finished', otherRows.length)}
        <span className="flex-1" />
        <label className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer"
            aria-label="Search customer"
            className="h-8 w-[190px] pl-8 pr-2.5 rounded-[9px] border border-background-600 bg-background-900 text-[12.5px] text-text-900 outline-none focus:border-primary-600 placeholder:text-text-500"
          />
        </label>
      </div>

      {/* Table: scrolls in place, header pinned */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <div className="p-6 animate-pulse">
            <div className="h-5 w-1/3 bg-background-700 rounded mb-3" />
            <div className="h-24 bg-background-700 rounded" />
          </div>
        ) : rows.length === 0 ? (
          <p className="m-0 py-10 text-center text-[12.5px] text-text-500">
            {search
              ? 'No customer matches.'
              : filter === 'MISSING'
                ? 'Every customer here has a design saved.'
                : 'No customers here yet.'}
          </p>
        ) : (
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr>
                <th className={`${th} pl-3.5`}>Customer</th>
                <th className={th}>Stage</th>
                <th className={th}>Design</th>
                <th className={th}>Made by</th>
                <th className={th}>Approved</th>
                <th className={`${th} pr-3.5 text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-600">
              {rows.map((r) => {
                const d = r.design;
                const approved = !!d && isApprovedDesign(d.status);
                return (
                  <tr key={r.key} className="hover:bg-background-700 transition-colors">
                    <td className={`${td} pl-3.5 max-w-[280px]`}>
                      <Link
                        to={`/customers/${r.customerId}`}
                        className="block text-[13px] font-semibold text-text-900 truncate hover:underline"
                        title={r.customerName}
                      >
                        {r.customerName}
                      </Link>
                      {r.customerPlace && <div className="text-[11.5px] text-text-500 truncate">{r.customerPlace}</div>}
                    </td>
                    <td className={td}>
                      <StagePill status={r.customerStatus} />
                    </td>
                    <td className={td}>
                      {!d ? (
                        <span className="inline-flex px-2 py-[2px] rounded-full text-[11px] font-semibold bg-background-700 border border-background-600 text-text-600 whitespace-nowrap">
                          Not uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center px-1.5 py-[1px] rounded-full border border-background-600 text-[11px] font-semibold text-text-800 tabular-nums">
                            {versionLabel(d.version)}
                          </span>
                          <DesignStatusPill status={d.status} />
                        </span>
                      )}
                    </td>
                    <td className={`${td} text-[12.5px] text-text-700 whitespace-nowrap`}>
                      {!d ? '—' : d.origin === 'UPLOADED' ? ORIGIN_LABEL.UPLOADED : d.designerName ?? '—'}
                    </td>
                    <td className={`${td} text-[12.5px] text-text-700 tabular-nums whitespace-nowrap`}>
                      {d?.approvedAt ? fmtDate(d.approvedAt) : '—'}
                    </td>
                    <td className={`${td} pr-3.5`}>
                      <div className="flex items-center justify-end gap-1.5">
                        {d?.currentDesignFile && (
                          <a
                            href={fileUrl(d.currentDesignFile.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            title={d.currentDesignFile.originalFileName}
                            className={ghostBtn}
                          >
                            <FileText size={13} className="text-primary-600" /> PDF
                          </a>
                        )}
                        {!d && (
                          <button
                            type="button"
                            onClick={() =>
                              setUploadFor({
                                customerId: r.customerId,
                                customerName: r.customerName,
                                customerStatus: r.customerStatus,
                                design: null,
                              })
                            }
                            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] border border-primary-600 text-[12px] font-semibold text-primary-600 hover:bg-background-600 whitespace-nowrap"
                          >
                            <Upload size={12} /> Upload design
                          </button>
                        )}
                        {d && approved && (
                          <button type="button" onClick={() => setRedesign(d)} className={ghostBtn}>
                            <RotateCcw size={12} /> Redesign
                          </button>
                        )}
                        {d && (
                          <button
                            type="button"
                            onClick={() => onOpen(d.id)}
                            className="h-7 px-2 rounded-[8px] text-[12px] font-semibold text-primary-600 hover:bg-background-600"
                          >
                            Open
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <UploadDesignModal target={uploadFor} onClose={() => setUploadFor(null)} />
      <RedesignModal job={redesign} onClose={() => setRedesign(null)} />
    </div>
  );
};

export default DesignLibrary;
