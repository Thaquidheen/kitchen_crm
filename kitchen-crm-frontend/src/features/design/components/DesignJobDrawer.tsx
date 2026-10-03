/**
 * DesignJobDrawer — one design job: brief, files (upload), notes thread and the actions for whoever
 * is looking. Designer: Start → upload the design → Mark complete (admin is notified).
 * Admin: edit designer / due date / priority / brief / status, and Approve or Request changes.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileText, Paperclip, Pencil, Play, RotateCcw, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody } from '@/components/ui/Modal';
import { fileUrl } from '@/utils/fileUrl';
import { fmtReminderDateTime } from '@/utils/reminderFormat';
import {
  useCompleteDesignMutation,
  useGetDesignJobQuery,
  useGetDesignersQuery,
  useMarkDesignSeenMutation,
  useReviewDesignMutation,
  useStartDesignMutation,
  useUpdateDesignJobMutation,
  useUploadDesignFileMutation,
} from '../designAPI';
import { DESIGN_STATUS, DesignStatusPill, PRIORITY_LABEL, PriorityPill, dueText, isDesignerWork } from '../designUi';
import { DesignNotesThread } from './DesignNotesThread';
import type { DesignPriority, DesignStatus } from '../types';

interface Props {
  jobId: number | null;
  viewer: 'admin' | 'designer';
  onClose: () => void;
}

const fieldCls =
  'h-[36px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors';
const sectionLabel = 'text-[10.5px] font-semibold tracking-[0.08em] uppercase text-text-500 mb-1.5';
const errMsg = (e: any, fallback: string) => e?.message || e?.data?.message || fallback;

export const DesignJobDrawer: React.FC<Props> = ({ jobId, viewer, onClose }) => {
  const { data: job, isLoading } = useGetDesignJobQuery(jobId ?? 0, {
    skip: !jobId,
    pollingInterval: 15000,
    refetchOnFocus: true,
  });
  const { data: designers = [] } = useGetDesignersQuery(undefined, { skip: viewer !== 'admin' });
  const [markSeen] = useMarkDesignSeenMutation();
  const [startDesign, { isLoading: starting }] = useStartDesignMutation();
  const [completeDesign, { isLoading: completing }] = useCompleteDesignMutation();
  const [reviewDesign, { isLoading: reviewing }] = useReviewDesignMutation();
  const [updateJob, { isLoading: saving }] = useUpdateDesignJobMutation();
  const [uploadFile, { isLoading: uploading }] = useUploadDesignFileMutation();

  const [editing, setEditing] = useState(false);
  const [eDesigner, setEDesigner] = useState<number | ''>('');
  const [eDue, setEDue] = useState('');
  const [ePriority, setEPriority] = useState<DesignPriority>('MEDIUM');
  const [eBrief, setEBrief] = useState('');
  const [eStatus, setEStatus] = useState<DesignStatus>('PLANNING');
  const [completeNote, setCompleteNote] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  // Opening the job is seeing it: clears "new design" (designer) / "completed" (admin) from the bell.
  const seenFor = useRef<number | null>(null);
  useEffect(() => {
    if (!job || seenFor.current === job.id) {return;}
    const isNews = viewer === 'designer' ? job.newForDesigner : job.newForAdmin;
    if (isNews) {
      seenFor.current = job.id;
      markSeen(job.id);
    }
  }, [job, viewer, markSeen]);

  useEffect(() => {
    setEditing(false);
    setCompleteNote('');
    setReviewNote('');
    seenFor.current = null;
  }, [jobId]);

  const openEdit = () => {
    if (!job) {return;}
    setEDesigner(job.designerId ?? '');
    setEDue(job.dueDate ?? '');
    setEPriority(job.priority ?? 'MEDIUM');
    setEBrief(job.brief ?? '');
    setEStatus(job.status);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!job) {return;}
    try {
      await updateJob({
        id: job.id,
        designerId: eDesigner === '' ? undefined : Number(eDesigner),
        dueDate: eDue || undefined,
        clearDueDate: !eDue,
        priority: ePriority,
        brief: eBrief,
        status: eStatus !== job.status ? eStatus : undefined,
      }).unwrap();
      toast.success('Design updated');
      setEditing(false);
    } catch (e) {
      toast.error(errMsg(e, 'Failed to update design'));
    }
  };

  const doStart = async () => {
    if (!job) {return;}
    try {
      await startDesign(job.id).unwrap();
      toast.success('Design started');
    } catch (e) {
      toast.error(errMsg(e, 'Failed to start design'));
    }
  };

  const doComplete = async () => {
    if (!job) {return;}
    try {
      await completeDesign({ id: job.id, message: completeNote.trim() || undefined }).unwrap();
      toast.success('Sent to admin for review');
      setCompleteNote('');
    } catch (e) {
      toast.error(errMsg(e, 'Failed to complete design'));
    }
  };

  const doReview = async (decision: 'APPROVE' | 'CHANGES') => {
    if (!job) {return;}
    if (decision === 'CHANGES' && !reviewNote.trim()) {
      toast.error('Write what needs to change');
      return;
    }
    try {
      await reviewDesign({ id: job.id, decision, note: reviewNote.trim() || undefined }).unwrap();
      toast.success(decision === 'APPROVE' ? 'Design approved' : 'Changes requested');
      setReviewNote('');
    } catch (e) {
      toast.error(errMsg(e, 'Failed to review design'));
    }
  };

  const onPickFile = async (file?: File | null) => {
    if (!job || !file) {return;}
    try {
      await uploadFile({ id: job.id, file }).unwrap();
      toast.success('File uploaded');
    } catch (e) {
      toast.error(errMsg(e, 'Failed to upload file'));
    } finally {
      if (fileInput.current) {fileInput.current.value = '';}
    }
  };

  const due = job ? dueText(job) : null;
  const designerCanWork = viewer === 'designer' && job && isDesignerWork(job.status);

  return (
    <Modal isOpen={jobId !== null} onClose={onClose} title={job ? job.customerName : 'Design'} size="lg">
      <ModalBody>
        {isLoading || !job ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 w-1/2 bg-background-700 rounded" />
            <div className="h-24 bg-background-700 rounded" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-2 flex-wrap">
              <DesignStatusPill status={job.status} />
              <PriorityPill priority={job.priority} />
              {due && (
                <span
                  className="text-[12px] font-medium"
                  style={{ color: job.overdue ? 'var(--st-lost-fg)' : 'var(--color-text-700)' }}
                >
                  {due}
                </span>
              )}
              {job.revisionCount > 0 && (
                <span className="text-[12px] text-text-600">· Revision {job.revisionCount}</span>
              )}
              <span className="flex-1" />
              <Link to={`/customers/${job.customerId}`} className="text-[12.5px] font-medium text-primary-600 hover:underline">
                Open customer
              </Link>
            </div>
            <div className="text-[12.5px] text-text-600">
              Designer: <span className="font-semibold text-text-900">{job.designerName ?? 'Not assigned'}</span>
              {job.assignedAt ? ` · assigned ${fmtReminderDateTime(job.assignedAt)}` : ''}
              {job.completedAt ? ` · completed ${fmtReminderDateTime(job.completedAt)}` : ''}
              {job.customerPlace ? ` · ${job.customerPlace}` : ''}
            </div>

            {/* Brief */}
            <div>
              <div className={sectionLabel}>Brief</div>
              <p className="m-0 text-[13px] text-text-900 whitespace-pre-wrap">{job.brief || '—'}</p>
            </div>

            {/* Admin edit */}
            {viewer === 'admin' &&
              (editing ? (
                <div className="rounded-[12px] border border-background-600 p-3 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[12px] font-medium text-text-700 mb-1">Designer</label>
                      <select
                        value={eDesigner}
                        onChange={(e) => setEDesigner(e.target.value === '' ? '' : Number(e.target.value))}
                        className={`w-full ${fieldCls}`}
                      >
                        {!job.designerId && <option value="">Not assigned</option>}
                        {designers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.activeCount} in queue)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-text-700 mb-1">Status</label>
                      <select value={eStatus} onChange={(e) => setEStatus(e.target.value as DesignStatus)} className={`w-full ${fieldCls}`}>
                        {(Object.keys(DESIGN_STATUS) as DesignStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {DESIGN_STATUS[s].label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-text-700 mb-1">Due date</label>
                      <input type="date" value={eDue} onChange={(e) => setEDue(e.target.value)} className={`w-full ${fieldCls}`} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-text-700 mb-1">Priority</label>
                      <select value={ePriority} onChange={(e) => setEPriority(e.target.value as DesignPriority)} className={`w-full ${fieldCls}`}>
                        {(Object.keys(PRIORITY_LABEL) as DesignPriority[]).map((p) => (
                          <option key={p} value={p}>
                            {PRIORITY_LABEL[p]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-text-700 mb-1">Brief</label>
                    <textarea
                      value={eBrief}
                      onChange={(e) => setEBrief(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 resize-y"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditing(false)} className="px-3 py-2 rounded-[10px] text-[13px] text-text-700 hover:bg-background-700">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={saving}
                      className="btn-raised-accent px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={openEdit} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary-600 hover:underline">
                  <Pencil size={13} /> Edit designer, due date, priority, brief or status
                </button>
              ))}

            {/* Files */}
            <div>
              <div className="flex items-center gap-2">
                <div className={sectionLabel}>Design files ({job.files?.length ?? job.fileCount})</div>
                <span className="flex-1" />
                <input
                  ref={fileInput}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf,.skp,.zip,.rar,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => onPickFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] border border-background-600 bg-background-800 text-[12.5px] font-medium text-text-900 hover:bg-background-700 disabled:opacity-60"
                >
                  <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload design'}
                </button>
              </div>
              {(job.files ?? []).length === 0 ? (
                <p className="m-0 text-[12.5px] text-text-500">
                  {viewer === 'designer' ? 'Upload the design PDF (or images / CAD) here.' : 'No files uploaded yet.'}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {(job.files ?? []).map((f) => (
                    <a
                      key={f.id}
                      href={fileUrl(f.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] border border-background-600 hover:bg-background-700 transition-colors"
                    >
                      {f.fileType === 'application/pdf' ? (
                        <FileText size={15} className="text-primary-600 shrink-0" />
                      ) : (
                        <Paperclip size={15} className="text-text-500 shrink-0" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-[13px] text-text-900">{f.originalFileName}</span>
                      <span className="text-[11.5px] text-text-500 whitespace-nowrap">
                        {f.uploadedBy ? `${f.uploadedBy} · ` : ''}
                        {f.createdAt ? fmtReminderDateTime(f.createdAt) : ''}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Designer actions */}
            {viewer === 'designer' && (job.status === 'PLANNING' || job.status === 'REVISION_REQUIRED') && (
              <button
                type="button"
                onClick={doStart}
                disabled={starting}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] border border-background-600 bg-background-800 text-[13px] font-semibold text-text-900 hover:bg-background-700 disabled:opacity-60"
              >
                <Play size={14} /> {starting ? 'Starting…' : job.status === 'REVISION_REQUIRED' ? 'Start the changes' : 'Start design'}
              </button>
            )}
            {designerCanWork && (
              <div className="rounded-[12px] border border-background-600 p-3 space-y-2">
                <div className="text-[13px] font-semibold text-text-900">Finished? Send it to the admin</div>
                <textarea
                  value={completeNote}
                  onChange={(e) => setCompleteNote(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Optional note for the admin…"
                  className="w-full px-3 py-2 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 resize-y"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={doComplete}
                    disabled={completing || (job.files?.length ?? job.fileCount) === 0}
                    className="btn-raised-accent inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> {completing ? 'Sending…' : 'Mark complete'}
                  </button>
                  {(job.files?.length ?? job.fileCount) === 0 && (
                    <span className="text-[12px] text-text-500">Upload the design file first.</span>
                  )}
                </div>
              </div>
            )}

            {/* Admin review */}
            {viewer === 'admin' && job.status === 'PENDING_SUPERADMIN_APPROVAL' && (
              <div
                className="rounded-[12px] p-3 space-y-2"
                style={{ background: 'var(--st-potential-bg)' }}
              >
                <div className="text-[13px] font-semibold" style={{ color: 'var(--st-potential-fg)' }}>
                  {job.designerName ?? 'The designer'} completed this design — review it
                </div>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Note to the designer (required when asking for changes)…"
                  className="w-full px-3 py-2 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 resize-y"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => doReview('APPROVE')}
                    disabled={reviewing}
                    className="btn-raised-accent inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => doReview('CHANGES')}
                    disabled={reviewing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-background-600 bg-background-800 text-[13px] font-semibold text-text-900 hover:bg-background-700 disabled:opacity-60"
                  >
                    <RotateCcw size={14} /> Request changes
                  </button>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <div className={sectionLabel}>Notes</div>
              <DesignNotesThread job={job} viewer={viewer} />
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default DesignJobDrawer;
