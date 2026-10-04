/**
 * DesignLibrary — admin list of every customer at Quotation Stage or later with the design they
 * are being quoted on: which version, made here or uploaded, and the PDF. Customers whose design
 * was never saved show up as "Design not uploaded" so it can be added; an approved design can be
 * sent back for a redesign from here.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, FolderCheck, RotateCcw, Search, Upload } from 'lucide-react';
import { STATUS_PILL } from '@/features/customers/components/CustomerList';
import { fileUrl } from '@/utils/fileUrl';
import { useGetDesignLibraryQuery } from '../designAPI';
import { DesignStatusPill, ORIGIN_LABEL, isApprovedDesign, versionLabel } from '../designUi';
import { RedesignModal } from './RedesignModal';
import { UploadDesignModal, type UploadDesignTarget } from './UploadDesignModal';
import type { DesignJob, DesignLibraryRow } from '../types';

interface Props {
  onOpen: (jobId: number) => void;
}

type Filter = 'ALL' | 'MISSING';

const card = 'bg-background-800 border border-background-600 rounded-[14px]';
const PAGE = 25;

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const StagePill: React.FC<{ status: string }> = ({ status }) => {
  const meta = STATUS_PILL[status] ?? { st: 'draft', label: status };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: `var(--st-${meta.st}-bg)`, color: `var(--st-${meta.st}-fg)` }}
    >
      {meta.label}
    </span>
  );
};

export const DesignLibrary: React.FC<Props> = ({ onOpen }) => {
  const { data: rows = [], isLoading } = useGetDesignLibraryQuery(undefined, {
    pollingInterval: 60000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [uploadFor, setUploadFor] = useState<UploadDesignTarget | null>(null);
  const [redesign, setRedesign] = useState<DesignJob | null>(null);

  const missing = useMemo(() => rows.filter((r) => !r.design).length, [rows]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === 'ALL' || !r.design) &&
        (!q || r.customerName.toLowerCase().includes(q) || (r.customerPlace ?? '').toLowerCase().includes(q)),
    );
  }, [rows, filter, search]);
  const shown = showAll ? visible : visible.slice(0, PAGE);

  const uploadTarget = (r: DesignLibraryRow): UploadDesignTarget => ({
    customerId: r.customerId,
    customerName: r.customerName,
    customerStatus: r.customerStatus,
    design: r.design,
  });

  if (isLoading || rows.length === 0) {return null;}

  const chip = (key: Filter, label: string, count: number) => {
    const active = filter === key;
    return (
      <button
        type="button"
        onClick={() => setFilter(key)}
        aria-pressed={active}
        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] border text-[12.5px] transition-colors ${
          active ? 'font-semibold text-text-900' : 'font-medium text-text-700'
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
    <div className={`${card} p-3.5`}>
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        <FolderCheck size={15} className="text-primary-600" />
        <span className="text-[13px] font-semibold text-text-900">Quotation Stage and later</span>
        <span className="text-[12px] text-text-600">— the design each customer is quoted on</span>
        <span className="flex-1" />
        {chip('ALL', 'All', rows.length)}
        {chip('MISSING', 'Design not uploaded', missing)}
        <label className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer"
            aria-label="Search customer"
            className="h-8 w-[170px] pl-8 pr-2.5 rounded-[9px] border border-background-600 bg-background-900 text-[12.5px] text-text-900 outline-none focus:border-primary-600 placeholder:text-text-500"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="m-0 py-4 text-center text-[12.5px] text-text-500">
          {filter === 'MISSING' && !search ? 'Every customer here has a design saved.' : 'No customer matches.'}
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-background-600">
          {shown.map((r) => {
            const d = r.design;
            const approved = !!d && isApprovedDesign(d.status);
            return (
              <div key={r.customerId} className="flex items-center gap-3 py-2 flex-wrap">
                <div className="min-w-0 w-[220px] shrink-0">
                  <Link to={`/customers/${r.customerId}`} className="block text-[13px] font-semibold text-text-900 truncate hover:underline">
                    {r.customerName}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StagePill status={r.customerStatus} />
                    {r.customerPlace && <span className="text-[11.5px] text-text-500 truncate">{r.customerPlace}</span>}
                  </div>
                </div>

                <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                  {!d ? (
                    <span className="inline-flex px-2 py-[2px] rounded-full text-[11px] font-semibold bg-background-700 border border-background-600 text-text-600">
                      Design not uploaded
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center px-2 py-[2px] rounded-full border border-background-600 text-[11px] font-semibold text-text-800 tabular-nums">
                        {versionLabel(d.version)}
                      </span>
                      <DesignStatusPill status={d.status} />
                      <span className="text-[12px] text-text-600 truncate">
                        {d.origin === 'UPLOADED' ? ORIGIN_LABEL.UPLOADED : d.designerName ?? ORIGIN_LABEL.DESIGNER}
                        {d.approvedAt ? ` · ${fmtDate(d.approvedAt)}` : ''}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {d?.currentDesignFile && (
                    <a
                      href={fileUrl(d.currentDesignFile.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      title={d.currentDesignFile.originalFileName}
                      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[9px] border border-background-600 bg-background-900 text-[12.5px] font-medium text-text-900 hover:bg-background-700"
                    >
                      <FileText size={13} className="text-primary-600" /> PDF
                    </a>
                  )}
                  {!d && (
                    <button
                      type="button"
                      onClick={() => setUploadFor(uploadTarget(r))}
                      className="btn-raised-accent inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[12.5px] font-semibold"
                    >
                      <Upload size={13} /> Upload design
                    </button>
                  )}
                  {d && approved && (
                    <button
                      type="button"
                      onClick={() => setRedesign(d)}
                      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[9px] border border-background-600 bg-background-900 text-[12.5px] font-medium text-text-900 hover:bg-background-700"
                    >
                      <RotateCcw size={13} /> Request redesign
                    </button>
                  )}
                  {d && (
                    <button
                      type="button"
                      onClick={() => onOpen(d.id)}
                      className="h-8 px-2.5 rounded-[9px] text-[12.5px] font-medium text-primary-600 hover:bg-background-700"
                    >
                      Open
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {visible.length > PAGE && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-[12.5px] font-medium text-primary-600 hover:underline"
        >
          {showAll ? 'Show fewer' : `Show all ${visible.length}`}
        </button>
      )}

      <UploadDesignModal target={uploadFor} onClose={() => setUploadFor(null)} />
      <RedesignModal job={redesign} onClose={() => setRedesign(null)} />
    </div>
  );
};

export default DesignLibrary;
