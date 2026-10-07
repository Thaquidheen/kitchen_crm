/**
 * DesignJobDrawer — one customer's design: brief, plan documents from the admin, the design files
 * of the current version, earlier versions, the notes thread and the actions for whoever is looking.
 * Designer: Start → upload the design (PDF, images, CAD drawings) → Mark complete (admin is notified).
 * Admin: edit designer / due date / priority / brief, attach plan documents, Approve or Request
 * changes — and, once a version is approved, Request redesign to open the next one.
 * Admin staff (coordinator): see the design and its files, and add or remove plan documents.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Paperclip, Pencil, Play, RotateCcw, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody } from '@/components/ui/Modal';
import { STATUS_PILL } from '@/features/customers/components/CustomerList';
import { fmtReminderDateTime } from '@/utils/reminderFormat';
import {
  useCompleteDesignMutation,
  useDeleteDesignFileMutation,
  useGetDesignJobQuery,
  useGetDesignersQuery,
  useMarkDesignSeenMutation,
  useReviewDesignMutation,
  useStartDesignMutation,
  useUpdateDesignJobMutation,
  useUploadDesignFileMutation,
  useUploadPlanDocumentsMutation,
} from '../designAPI';
import { DESIGN_ACCEPT, PLAN_ACCEPT, isDesignFileName } from '../designFiles';
import {
  DESIGN_STATUS,
  DesignStatusPill,
  FileKindIcon,
  ORIGIN_LABEL,
  PRIORITY_LABEL,
  PriorityPill,
  dueText,
  fileLinkProps,
  isApprovedDesign,
  isDesignerWork,
  isOpenDesign,
  versionLabel,
} from '../designUi';
import { DesignNotesThread } from './DesignNotesThread';
import { RedesignModal } from './RedesignModal';
import { UploadDesignModal } from './UploadDesignModal';
import type { DesignFile, DesignPriority, DesignStatus } from '../types';

interface Props {
  jobId: number | null;
  viewer: 'admin' | 'coordinator' | 'designer';
  onClose: () => void;
}

const fieldCls =
  'h-[36px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors';
const sectionLabel = 'text-[10.5px] font-semibold tracking-[0.08em] uppercase text-text-500 mb-1.5';
const smallBtn =
  'inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] border border-background-600 bg-background-800 text-[12.5px] font-medium text-text-900 hover:bg-background-700 disabled:opacity-60';
const errMsg = (e: any, fallback: string) => e?.message || e?.data?.message || fallback;

/** What an admin may set by hand; approving and redesigning have their own buttons. */
const HAND_SET: DesignStatus[] = ['PLANNING', 'IN_PROGRESS', 'CANCELLED'];

const FileRow: React.FC<{ file: DesignFile; tag?: string; onRemove?: () => void; removing?: boolean }> = ({
  file,
  tag,
  onRemove,
  removing,
}) => (
  <div className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-[10px] border border-background-600 hover:bg-background-700 transition-colors">
    <a {...fileLinkProps(file)} className="flex items-center gap-2.5 min-w-0 flex-1 py-0.5">
      <FileKindIcon name={file.originalFileName} size={15} />
      <span className="min-w-0 flex-1 truncate text-[13px] text-text-900">{file.originalFileName}</span>
      <span className="text-[11.5px] text-text-500 whitespace-nowrap">
        {tag ? `${tag} · ` : ''}
        {file.uploadedBy ? `${file.uploadedBy} · ` : ''}
        {file.createdAt ? fmtReminderDateTime(file.createdAt) : ''}
      </span>
    </a>
    {onRemove ? (
      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        aria-label={`Remove ${file.originalFileName}`}
        title="Remove"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 disabled:opacity-50"
      >
        <X size={14} />
      </button>
    ) : (
      <span className="w-1.5" />
    )}
  </div>
);

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
  const [uploadPlanDocuments, { isLoading: addingPlans }] = useUploadPlanDocumentsMutation();
  const [deleteFile, { isLoading: removing }] = useDeleteDesignFileMutation();

  const [editing, setEditing] = useState(false);
  const [eDesigner, setEDesigner] = useState<number | ''>('');
  const [eDue, setEDue] = useState('');
  const [ePriority, setEPriority] = useState<DesignPriority>('MEDIUM');
  const [eBrief, setEBrief] = useState('');
  const [eStatus, setEStatus] = useState<DesignStatus>('PLANNING');
  const [completeNote, setCompleteNote] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [redesignOpen, setRedesignOpen] = useState(false);
  const [uploadFinalOpen, setUploadFinalOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const planInput = useRef<HTMLInputElement>(null);

  // Opening the job is seeing it: clears "new design" (designer) / "completed" (admin) from the bell.
  const seenFor = useRef<number | null>(null);
  useEffect(() => {
    // Admin staff looking at a design is not the admin or the designer having seen it.
    if (!job || viewer === 'coordinator' || seenFor.current === job.id) {return;}
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
    setRedesignOpen(false);
    setUploadFinalOpen(false);
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
      const updated = await reviewDesign({ id: job.id, decision, note: reviewNote.trim() || undefined }).unwrap();
      if (decision === 'CHANGES') {
        toast.success('Changes requested');
      } else {
        // Approving ends the Design stage for a customer who is in it.
        toast.success(
          job.customerStatus === 'DESIGN_STAGE' && updated.customerStatus === 'QUOTE_GIVEN'
            ? 'Design approved — customer moved to Quotation Stage'
            : 'Design approved',
        );
      }
      setReviewNote('');
    } catch (e) {
      toast.error(errMsg(e, 'Failed to review design'));
    }
  };

  // A design is often several files (a PDF, renders, the drawing): each goes up on its own, so
  // one that is refused does not hold back the ones before it.
  const onPickFiles = async (picked: FileList | null) => {
    if (!job || !picked || picked.length === 0) {return;}
    const chosen = Array.from(picked);
    let done = 0;
    try {
      for (const file of chosen) {
        await uploadFile({ id: job.id, file }).unwrap();
        done += 1;
      }
      toast.success(done === 1 ? 'File uploaded' : `${done} files uploaded`);
    } catch (e) {
      const failed = chosen[done]?.name;
      toast.error(`${failed ? `${failed}: ` : ''}${errMsg(e, 'Failed to upload file')}${done > 0 ? ` (${done} uploaded before it)` : ''}`);
    } finally {
      if (fileInput.current) {fileInput.current.value = '';}
    }
  };

  const onPickPlans = async (picked: FileList | null) => {
    if (!job || !picked || picked.length === 0) {return;}
    try {
      await uploadPlanDocuments({ id: job.id, files: Array.from(picked) }).unwrap();
      toast.success(picked.length === 1 ? 'Plan document added' : `${picked.length} plan documents added`);
    } catch (e) {
      toast.error(errMsg(e, 'Failed to add the plan documents'));
    } finally {
      if (planInput.current) {planInput.current.value = '';}
    }
  };

  const removeFile = async (file: DesignFile) => {
    if (!job) {return;}
    try {
      await deleteFile({ id: job.id, fileId: file.id }).unwrap();
      toast.success('File removed');
    } catch (e) {
      toast.error(errMsg(e, 'Failed to remove the file'));
    }
  };

  const due = job ? dueText(job) : null;
  const open = !!job && isOpenDesign(job.status);
  const approved = !!job && isApprovedDesign(job.status);
  const designerCanWork = viewer === 'designer' && !!job && isDesignerWork(job.status);
  const canUploadDesign = open && (viewer === 'admin' || designerCanWork);
  const managesPlans = viewer === 'admin' || viewer === 'coordinator';
  const files = job?.files ?? [];
  const planDocuments = job?.planDocuments ?? [];
  const hasDesign = files.some((f) => isDesignFileName(f.originalFileName));
  const version = job?.version ?? 1;
  const earlier = (job?.versions ?? []).filter((v) => v.versionNo < version).sort((a, b) => b.versionNo - a.versionNo);
  const stage = job?.customerStatus ? STATUS_PILL[job.customerStatus]?.label ?? job.customerStatus : null;
  const statusChoices = job ? Array.from(new Set<DesignStatus>([job.status, ...HAND_SET])) : HAND_SET;

  return (
    <>
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
                <span className="inline-flex items-center px-2 py-[2px] rounded-full border border-background-600 text-[11px] font-semibold text-text-800 tabular-nums">
                  {versionLabel(version)}
                </span>
                {job.origin === 'UPLOADED' && (
                  <span className="text-[12px] text-text-600">{ORIGIN_LABEL.UPLOADED}</span>
                )}
                {open && <PriorityPill priority={job.priority} />}
                {open && due && (
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: job.overdue ? 'var(--st-lost-fg)' : 'var(--color-text-700)' }}
                  >
                    {due}
                  </span>
                )}
                {open && job.revisionCount > 0 && (
                  <span className="text-[12px] text-text-600">· Changes asked {job.revisionCount}×</span>
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
                {job.approvedAt
                  ? ` · approved ${fmtReminderDateTime(job.approvedAt)}${job.approvedByName ? ` by ${job.approvedByName}` : ''}`
                  : ''}
                {job.customerPlace ? ` · ${job.customerPlace}` : ''}
                {stage ? ` · customer in ${stage}` : ''}
              </div>

              {/* Brief */}
              <div>
                <div className={sectionLabel}>{version > 1 ? `What to change (${versionLabel(version)})` : 'Brief'}</div>
                <p className="m-0 text-[13px] text-text-900 whitespace-pre-wrap">{job.brief || '—'}</p>
              </div>

              {/* Admin edit — an approved version is changed by a redesign, not by editing */}
              {viewer === 'admin' &&
                !approved &&
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
                          {statusChoices.map((s) => (
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

              {/* Plan documents: what the admin hands to the designer */}
              {(managesPlans || planDocuments.length > 0) && (
                <div>
                  <div className="flex items-center gap-2">
                    <div className={sectionLabel}>Plan documents from admin ({planDocuments.length})</div>
                    <span className="flex-1" />
                    {managesPlans && (
                      <>
                        <input
                          ref={planInput}
                          type="file"
                          multiple
                          className="hidden"
                          accept={PLAN_ACCEPT}
                          onChange={(e) => onPickPlans(e.target.files)}
                        />
                        <button type="button" onClick={() => planInput.current?.click()} disabled={addingPlans} className={smallBtn}>
                          <Paperclip size={13} /> {addingPlans ? 'Adding…' : 'Add plan documents'}
                        </button>
                      </>
                    )}
                  </div>
                  {planDocuments.length === 0 ? (
                    <p className="m-0 text-[12.5px] text-text-500">
                      None yet. Site plan, measurements or references for the designer go here.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {planDocuments.map((f) => (
                        <FileRow
                          key={f.id}
                          file={f}
                          tag={version > 1 ? versionLabel(f.versionNo) : undefined}
                          onRemove={managesPlans ? () => removeFile(f) : undefined}
                          removing={removing}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Design files of the current version */}
              <div>
                <div className="flex items-center gap-2">
                  <div className={sectionLabel}>
                    Design files · {versionLabel(version)} ({files.length})
                  </div>
                  <span className="flex-1" />
                  {canUploadDesign && (
                    <>
                      <input
                        ref={fileInput}
                        type="file"
                        multiple
                        className="hidden"
                        accept={`${DESIGN_ACCEPT},.skp,.zip,.rar,.doc,.docx,.xls,.xlsx`}
                        onChange={(e) => onPickFiles(e.target.files)}
                      />
                      <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className={smallBtn}>
                        <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload design'}
                      </button>
                    </>
                  )}
                </div>
                {files.length === 0 ? (
                  <p className="m-0 text-[12.5px] text-text-500">
                    {viewer === 'designer'
                      ? 'Upload the design here: PDF, images or CAD drawings (DWG, DXF). Several files can be chosen.'
                      : 'No design uploaded yet.'}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {files.map((f) => (
                      <FileRow
                        key={f.id}
                        file={f}
                        onRemove={canUploadDesign ? () => removeFile(f) : undefined}
                        removing={removing}
                      />
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
                      disabled={completing || !hasDesign}
                      className="btn-raised-accent inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} /> {completing ? 'Sending…' : 'Mark complete'}
                    </button>
                    {!hasDesign && <span className="text-[12px] text-text-500">Upload the design first.</span>}
                  </div>
                </div>
              )}

              {/* Admin review */}
              {viewer === 'admin' && job.status === 'PENDING_SUPERADMIN_APPROVAL' && (
                <div className="rounded-[12px] p-3 space-y-2" style={{ background: 'var(--st-potential-bg)' }}>
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--st-potential-fg)' }}>
                    {job.designerName ?? 'The designer'} completed {versionLabel(version)} — review it
                  </div>
                  {job.customerStatus === 'DESIGN_STAGE' && (
                    <div className="text-[12px]" style={{ color: 'var(--st-potential-fg)' }}>
                      Approving moves the customer to Quotation Stage.
                    </div>
                  )}
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

              {/* Admin: an approved version is changed by opening the next one */}
              {viewer === 'admin' && approved && (
                <div className="rounded-[12px] border border-background-600 p-3 flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] text-text-800 min-w-0 flex-1">
                    <span className="font-semibold text-text-900">{versionLabel(version)} is approved.</span> Needs changes?
                    Send it back as {versionLabel(version + 1)}.
                  </span>
                  <button type="button" onClick={() => setUploadFinalOpen(true)} className={smallBtn}>
                    <Upload size={13} /> Upload newer design
                  </button>
                  <button
                    type="button"
                    onClick={() => setRedesignOpen(true)}
                    className="btn-raised-accent inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[12.5px] font-semibold"
                  >
                    <RotateCcw size={13} /> Request redesign
                  </button>
                </div>
              )}
              {viewer === 'admin' && open && (
                <button
                  type="button"
                  onClick={() => setUploadFinalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary-600 hover:underline"
                >
                  <Upload size={13} /> Already have the final design? Upload it and approve
                </button>
              )}

              {/* Earlier versions */}
              {earlier.length > 0 && (
                <div>
                  <div className={sectionLabel}>Earlier versions</div>
                  <div className="flex flex-col gap-2">
                    {earlier.map((v) => (
                      <div key={v.versionNo} className="rounded-[12px] border border-background-600 p-2.5 space-y-1.5">
                        <div className="text-[12.5px] text-text-700">
                          <span className="font-semibold text-text-900">{versionLabel(v.versionNo)}</span>
                          {' · '}
                          {v.origin === 'UPLOADED' ? ORIGIN_LABEL.UPLOADED : v.designerName ?? ORIGIN_LABEL.DESIGNER}
                          {v.approvedAt
                            ? ` · approved ${fmtReminderDateTime(v.approvedAt)}${v.approvedByName ? ` by ${v.approvedByName}` : ''}`
                            : ' · not approved'}
                        </div>
                        {v.requestNote && <p className="m-0 text-[12.5px] text-text-600 whitespace-pre-wrap">{v.requestNote}</p>}
                        {v.files.length === 0 ? (
                          <p className="m-0 text-[12px] text-text-500">No files.</p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {v.files.map((f) => (
                              <FileRow key={f.id} file={f} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes: the conversation is between the admin and the designer */}
              {viewer !== 'coordinator' && (
                <div>
                  <div className={sectionLabel}>Notes</div>
                  <DesignNotesThread job={job} viewer={viewer} />
                </div>
              )}
            </div>
          )}
        </ModalBody>
      </Modal>

      <RedesignModal job={redesignOpen && job ? job : null} onClose={() => setRedesignOpen(false)} />
      <UploadDesignModal
        target={
          uploadFinalOpen && job
            ? { customerId: job.customerId, customerName: job.customerName, customerStatus: job.customerStatus, design: job }
            : null
        }
        onClose={() => setUploadFinalOpen(false)}
      />
    </>
  );
};

export default DesignJobDrawer;
