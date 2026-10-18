/**
 * QuotationDetailPage
 * HOCH ERP design: compact header (quote no + Rev + status, meta, actions),
 * tabs Overview / Line Items / Revisions / Activity. All existing functionality
 * preserved: Edit, Download PDF, Duplicate, approval details, signature management.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetQuotationByIdQuery,
  useDuplicateQuotationMutation,
  useDownloadQuotationPDFMutation,
  useGetFolderVersionsQuery,
} from '@/app/baseApi';
import SignatureManagement from '@/components/quotations/SignatureManagement';
import { quotationLabel } from '@/features/quotations/components/QuotationList';
import { ArrowLeft, Copy, Download, Edit, FileText, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuotationAccess } from '@/features/quotations/useQuotationAccess';
import { QuotationBreakdown } from '@/features/quotations/components/QuotationBreakdown';
import { usePendingEditRequests } from '@/features/quotations/usePendingEditRequests';
import { EditRequestControl, EditRequestNotes } from '@/features/quotations/components/EditRequestControl';
import { pendingFor } from '@/features/quotations/editRequestRules';

const TABS = ['Overview', 'Line Items', 'Revisions', 'Activity'];

const QSTATUS: Record<string, { st: string; label: string }> = {
  DRAFT: { st: 'draft', label: 'Draft' },
  ON_HOLD: { st: 'nego', label: 'On Hold' },
  COMPLETE: { st: 'confirmed', label: 'Completed' },
  APPROVED: { st: 'lead', label: 'Approved' },
  CANCELLED: { st: 'lost', label: 'Cancelled' },
  PENDING: { st: 'potential', label: 'Pending' },
};

const statusPill = (status?: string) => {
  const m = (status && QSTATUS[status]) || { st: '', label: status ?? '—' };
  const fg = m.st ? `var(--st-${m.st}-fg)` : 'var(--color-text-700)';
  const bg = m.st ? `var(--st-${m.st}-bg)` : 'var(--color-background-700)';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: bg, color: fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: fg }} />
      {m.label}
    </span>
  );
};

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtMoney = (n?: number) => (n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—');

const isOverdue = (d?: string) => !!d && new Date(d) < new Date(new Date().toDateString());

const ghostBtn =
  'inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';

const cardCls = 'bg-background-800 border border-background-600 rounded-[14px]';
const sectionLabelCls = 'text-[10.5px] font-semibold tracking-[0.09em] uppercase text-text-500';
const thClass = 'px-3 py-[8px] text-left text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500';

export function QuotationDetailPage() {
  const access = useQuotationAccess();
  const { id } = useParams();
  const navigate = useNavigate();
  const quotationId = Number(id);
  const { data, isLoading, error } = useGetQuotationByIdQuery(quotationId, { skip: isNaN(quotationId) });
  const [duplicateQuotation, { isLoading: isDuplicating }] = useDuplicateQuotationMutation();
  const [downloadQuotationPDF, { isLoading: isDownloading }] = useDownloadQuotationPDFMutation();
  const [activeTab, setActiveTab] = useState('Overview');

  const folderId: number | undefined = (data as any)?.folderId ?? undefined;
  const { data: versions = [] } = useGetFolderVersionsQuery(folderId!, { skip: !folderId });

  const handleDuplicate = async () => {
    try {
      const result = await duplicateQuotation(quotationId).unwrap();
      toast.success('Quotation duplicated successfully');
      navigate(`/quotations/${result.id}/edit`);
    } catch (error: any) {
      console.error('Error duplicating quotation:', error);
      toast.error(error?.data?.message || 'Failed to duplicate quotation');
    }
  };

  const handleEdit = () => navigate(`/quotations/${quotationId}/edit`);
  // A completed quotation is reopened by the admin; staff who may not change its status ask here.
  const pendingEdits = usePendingEditRequests(!access.view);

  const handleDownloadPDF = async () => {
    try {
      const blob = await downloadQuotationPDF(quotationId).unwrap();
      if (!(blob instanceof Blob)) throw blob;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation_${(data as any)?.quotationNumber || quotationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Quotation PDF download started');
    } catch (error: any) {
      console.error('PDF download error:', error);
      toast.error(error?.data?.message || 'Failed to download PDF');
    }
  };

  if (error) {
    return (
      <div className={`${cardCls} p-6 text-text-700`}>Failed to load quotation</div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-background-700 rounded-[12px] w-1/2" />
        <div className="h-64 bg-background-700 rounded-[14px]" />
      </div>
    );
  }

  if (!data.id) {
    return <div className={`${cardCls} p-6 text-error`}>Error: Quotation ID is missing</div>;
  }

  const canEdit = data.status === 'DRAFT' || data.status === 'PENDING';
  const quoteNo = data.refNo || data.quotationNumber || `#${data.id}`;
  const versionNumber: number | undefined = (data as any)?.versionNumber;
  const kitchens: any[] = (data as any)?.kitchens ?? [];
  const hasKitchens = kitchens.length > 0;

  const categoryTotals = [
    { label: 'Cabinets', offer: (data as any).cabinetsFinalTotal, mrp: (data as any).cabinetsMrpTotal },
    { label: 'Doors', offer: (data as any).doorsFinalTotal, mrp: (data as any).doorsMrpTotal },
    { label: 'Accessories', offer: (data as any).accessoriesFinalTotal, mrp: (data as any).accessoriesMrpTotal },
    { label: 'Lighting', offer: (data as any).lightingFinalTotal, mrp: (data as any).lightingMrpTotal },
  ].filter((c) => Number(c.offer) > 0 || Number(c.mrp) > 0);

  // Revisions sorted oldest -> newest for diffing, rendered newest first
  const sortedVersions = [...(versions as any[])].sort((a, b) => (a.versionNumber ?? 0) - (b.versionNumber ?? 0));
  const revisionRows = sortedVersions
    .map((v, i) => ({
      ...v,
      change: i > 0 ? Number(v.totalAmount ?? 0) - Number(sortedVersions[i - 1].totalAmount ?? 0) : null,
    }))
    .reverse();

  // Activity timeline from real fields
  const activity: Array<{ when?: string; title: string; detail?: string }> = [];
  if (data.createdAt) activity.push({ when: data.createdAt, title: 'Quotation created', detail: (data as any).createdBy ? `by ${(data as any).createdBy}` : undefined });
  if (data.updatedAt && data.updatedAt !== data.createdAt) activity.push({ when: data.updatedAt, title: 'Last updated' });
  if ((data as any).approvedAt) activity.push({ when: (data as any).approvedAt, title: 'Approved', detail: (data as any).approvedBy ? `by ${(data as any).approvedBy}` : undefined });
  if (data.signatureStatus === 'SIGNED' && data.quotationSignedAt)
    activity.push({ when: data.quotationSignedAt, title: 'Signed by customer', detail: (data as any).signerName || data.customerName });
  activity.sort((a, b) => new Date(b.when ?? 0).getTime() - new Date(a.when ?? 0).getTime());

  return (
    <div className="w-full">
      {/* Compact header */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <button
          onClick={() => navigate('/quotations')}
          className="w-[34px] h-[34px] rounded-[10px] border border-background-500 bg-background-800 text-text-700 hover:bg-background-700 hover:text-text-900 flex items-center justify-center transition-colors shrink-0"
          title="Back to quotations"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="m-0 text-[19px] font-[650] tracking-[-0.01em] text-text-900 tabular-nums whitespace-nowrap">
              {quoteNo}
            </h1>
            {(versionNumber ?? 1) > 1 && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'color-mix(in oklab, var(--color-primary-600) 14%, transparent)', color: 'var(--color-primary-600)' }}
              >
                Rev {versionNumber}
              </span>
            )}
            {statusPill(data.status)}
            <EditRequestControl
              quotationId={data.id}
              status={data.status}
              pending={pendingFor(pendingEdits, data.id)}
              canAsk={access.edit && !access.changeStatus}
              canFinish={access.edit}
              label={quotationLabel(data).primary}
            />
          </div>
          <p className="m-0 mt-0.5 text-[12.5px] text-text-600">
            {data.customerName}
            {data.projectName ? ` · ${data.projectName}` : ''} · Created {fmtDate(data.createdAt)}
            {data.validUntil && (
              <>
                {' · '}
                <span style={isOverdue(data.validUntil) ? { color: 'var(--st-lost-fg)', fontWeight: 600 } : undefined}>
                  Valid till {fmtDate(data.validUntil)}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleEdit}
            disabled={!canEdit || !access.edit}
            title={
              canEdit
                ? 'Edit quotation'
                : data.status === 'COMPLETE'
                  ? 'A completed quotation is edited after the admin puts it back to Draft'
                  : 'Cannot edit approved/rejected quotations'
            }
            className={ghostBtn}
          >
            <Edit size={13} className="text-text-700" />
            Edit
          </button>
          <button onClick={handleDuplicate} disabled={isDuplicating || !access.create} className={ghostBtn}>
            <Copy size={13} className="text-text-700" />
            {isDuplicating ? 'Duplicating…' : 'Duplicate'}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading || !access.pdf}
            className="btn-raised-accent inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] text-[12.5px] font-semibold whitespace-nowrap disabled:opacity-60"
          >
            <Download size={13} />
            {isDownloading ? 'Downloading…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* A reopened quotation: what the admin asked to change */}
      <EditRequestNotes request={pendingFor(pendingEdits, data.id)} className="mb-4" />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-background-600 mb-4 overflow-x-auto">
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2.5 text-[13px] whitespace-nowrap border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-primary-600 text-primary-600 font-semibold'
                  : 'border-transparent text-text-700 hover:text-text-900 font-medium'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ===== Overview ===== */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-4 items-start">
          {/* Details card */}
          <div className="space-y-4">
            <div className={`${cardCls} p-4`}>
              <div className={`${sectionLabelCls} mb-3`}>Details</div>
              <div className="space-y-3 text-[13px]">
                <div>
                  <div className={sectionLabelCls}>Customer</div>
                  <div className="text-text-900 mt-0.5">{data.customerName || '—'}</div>
                </div>
                {data.projectName && (
                  <div>
                    <div className={sectionLabelCls}>Project</div>
                    <div className="text-text-900 mt-0.5">{data.projectName}</div>
                  </div>
                )}
                {(data as any).folderName && (
                  <div>
                    <div className={sectionLabelCls}>Folder</div>
                    <div className="text-text-900 mt-0.5">{(data as any).folderName}</div>
                  </div>
                )}
                <div>
                  <div className={sectionLabelCls}>Valid till</div>
                  <div className="mt-0.5" style={isOverdue(data.validUntil) ? { color: 'var(--st-lost-fg)', fontWeight: 600 } : { color: 'var(--color-text-900)' }}>
                    {fmtDate(data.validUntil)}
                  </div>
                </div>
                <div>
                  <div className={sectionLabelCls}>Created</div>
                  <div className="text-text-900 mt-0.5">{fmtDate(data.createdAt)}</div>
                </div>
                <div>
                  <div className={sectionLabelCls}>Last updated</div>
                  <div className="text-text-900 mt-0.5">{fmtDate(data.updatedAt || data.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Approval details (when signed) */}
            {data.signatureStatus === 'SIGNED' && data.quotationSignedAt && (
              <div className={`${cardCls} p-4`}>
                <div className={`${sectionLabelCls} mb-3`}>Approval Details</div>
                <div className="space-y-3 text-[13px]">
                  <div>
                    <div className={sectionLabelCls}>Approved by</div>
                    <div className="text-text-900 mt-0.5">{(data as any).signerName || data.customerName || '—'}</div>
                  </div>
                  <div>
                    <div className={sectionLabelCls}>Email</div>
                    <div className="text-text-900 mt-0.5">{(data as any).signerEmail || data.customerEmail || '—'}</div>
                  </div>
                  <div>
                    <div className={sectionLabelCls}>Phone</div>
                    <div className="text-text-900 mt-0.5">{(data as any).signerPhone || '—'}</div>
                  </div>
                  <div>
                    <div className={sectionLabelCls}>Approved at</div>
                    <div className="text-text-900 mt-0.5">{fmtDate(data.quotationSignedAt)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column: totals + signature management */}
          <div className="space-y-4 min-w-0">
            <div className={`${cardCls} p-4`}>
              <div className={`${sectionLabelCls} mb-3`}>Summary</div>
              {categoryTotals.length > 0 && (
                <div className="divide-y divide-background-600 mb-3">
                  {categoryTotals.map((c) => (
                    <div key={c.label} className="flex items-center py-2 text-[13px]">
                      <span className="text-text-700">{c.label}</span>
                      <span className="flex-1" />
                      <span className="font-semibold text-text-900 tabular-nums">{fmtMoney(Number(c.mrp) > 0 ? c.mrp : c.offer)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-[10px] border border-background-600 bg-background-700/60 px-4 py-3 space-y-1.5">
                {(data.mrpFinal ?? 0) > 0 && (
                  <div className="flex items-center text-[13px]">
                    <span className="text-text-700">MRP</span>
                    <span className="flex-1" />
                    <span
                      className={`tabular-nums ${(data.mrpFinal ?? 0) > (data.totalAmount ?? 0) ? 'line-through text-text-500' : 'text-text-700'}`}
                    >
                      {fmtMoney(data.mrpFinal)}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="text-[13px] font-semibold text-text-900">Offer Price</span>
                  <span className="flex-1" />
                  <span className="text-[19px] font-[700] text-primary-600 tabular-nums">{fmtMoney(data.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Signature Management (functionality preserved) */}
            <SignatureManagement
              quotationId={data.id}
              quotationNumber={data.refNo || data.quotationNumber || ''}
              quotationStatus={data.status}
              signedDocumentId={data.signedDocumentId}
              signatureStatus={data.signatureStatus}
              quotationSignedAt={data.quotationSignedAt}
            />
          </div>
        </div>
      )}

      {/* ===== Line Items ===== */}
      {activeTab === 'Line Items' && <QuotationBreakdown quotation={data} access={access} />}

      {/* ===== Revisions ===== */}
      {activeTab === 'Revisions' && (
        <div className={`${cardCls} overflow-hidden`}>
          {revisionRows.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="text-[14.5px] font-semibold text-text-900">No revisions</div>
              <div className="text-[12.5px] text-text-700 mt-1">
                Use "Save as New" while editing to create the next revision of this quotation.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-background-600">
              {revisionRows.map((v: any) => {
                const current = v.id === data.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => !current && navigate(`/quotations/${v.id}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      current ? '' : 'hover:bg-background-700 cursor-pointer'
                    }`}
                    style={current ? { background: 'color-mix(in oklab, var(--color-primary-600) 8%, transparent)' } : undefined}
                  >
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0"
                      style={{ background: 'color-mix(in oklab, var(--color-primary-600) 14%, transparent)', color: 'var(--color-primary-600)' }}
                    >
                      V{v.versionNumber ?? '?'}
                    </span>
                    {(() => {
                      const { primary, secondary } = quotationLabel(v);
                      return (
                        <span className="min-w-0 max-w-[45%]">
                          <span className="block text-[13px] text-text-900 truncate" title={primary}>
                            {primary}
                          </span>
                          {secondary && (
                            <span className="block text-[11px] text-text-500 tabular-nums truncate">{secondary}</span>
                          )}
                        </span>
                      );
                    })()}
                    <span className="text-[12.5px] text-text-600 tabular-nums hidden sm:inline">{fmtDate(v.createdAt)}</span>
                    {current && <span className="text-[11px] font-semibold text-primary-600">current</span>}
                    <span className="flex-1" />
                    {access.seesRates && v.change != null && v.change !== 0 && (
                      <span
                        className="text-[12.5px] font-semibold tabular-nums"
                        style={{ color: v.change > 0 ? 'var(--st-confirmed-fg)' : 'var(--st-lost-fg)' }}
                      >
                        {v.change > 0 ? '+' : '−'}₹{Math.abs(v.change).toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-[13px] font-semibold text-text-900 tabular-nums whitespace-nowrap">
                      {fmtMoney(v.totalAmount)}
                    </span>
                    {statusPill(v.status)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== Activity ===== */}
      {activeTab === 'Activity' && (
        <div className={`${cardCls} p-5`}>
          {activity.length === 0 ? (
            <p className="text-[13px] text-text-700 text-center py-8">No activity recorded yet.</p>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-background-600" />
              <div className="space-y-5">
                {activity.map((a, i) => (
                  <div key={i} className="relative">
                    <span
                      className="absolute -left-[24px] top-0.5 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: 'var(--color-primary-600)',
                        background: i === 0 ? 'var(--color-primary-600)' : 'var(--color-background-800)',
                      }}
                    />
                    <div className="text-[13.5px] font-semibold text-text-900">{a.title}</div>
                    <div className="text-[12.5px] text-text-600 mt-0.5 flex items-center gap-1.5">
                      <Clock size={12} />
                      {a.when
                        ? new Date(a.when).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                      {a.detail ? ` · ${a.detail}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuotationDetailPage;
