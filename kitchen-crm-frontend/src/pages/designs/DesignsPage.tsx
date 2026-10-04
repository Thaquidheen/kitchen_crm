/**
 * DesignsPage — customer designs assigned to designers.
 *
 * Admin: two views that each fit one screen.
 *  - Work board: columns side by side — designs to review, customers to assign, then one column
 *    per designer (admin-set status, workload, drag to set which design is done first). Each
 *    column scrolls on its own, so the page does not.
 *  - Customer designs: the design every customer at Quotation Stage or later is quoted on, as a
 *    table that scrolls in place.
 * Designer: only their own designs, in the order the admin set.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, GripVertical, MessageCircle, Paperclip, Palette, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { useIsSuperAdmin } from '@/features/auth/useIsSuperAdmin';
import {
  useAssignDesignMutation,
  useGetDesignJobsQuery,
  useGetDesignLibraryQuery,
  useGetDesignMeQuery,
  useGetDesignersQuery,
  useGetUnassignedDesignsQuery,
  useReorderDesignJobsMutation,
  useSetDesignerStatusMutation,
  useUploadPlanDocumentsMutation,
} from '@/features/design/designAPI';
import { defaultDueDate, DESIGNER_STATUS, DesignerStatusDot, DesignStatusPill, dueText, isDesignerWork, PriorityPill, versionLabel } from '@/features/design/designUi';
import { DesignJobDrawer } from '@/features/design/components/DesignJobDrawer';
import { DesignerPicker, type DesignAssignment } from '@/features/design/components/DesignerPicker';
import { DesignLibrary } from '@/features/design/components/DesignLibrary';
import { PlanDocumentsField } from '@/features/design/components/PlanDocumentsField';
import type { DesignJob, DesignerStatus, UnassignedDesignCustomer } from '@/features/design/types';

const card = 'bg-background-800 border border-background-600 rounded-[14px]';
const sectionTitle = 'text-[13px] font-semibold text-text-900';
const countBadge = 'text-[11px] font-[650] px-1.5 py-px rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums';
/**
 * A board column is as tall as its content, up to the space left under the page header; past
 * that its list scrolls. 196px = app header + page padding + this page's own title row.
 */
const columnShell = `${card} flex flex-col min-w-0 min-h-0 lg:max-h-[calc(100dvh-196px)]`;
const columnBody = 'flex-1 min-h-0 overflow-y-auto px-3 pb-3 flex flex-col gap-1.5';

type AdminView = 'work' | 'designs';

interface RowProps {
  job: DesignJob;
  position?: number;
  viewer: 'admin' | 'designer';
  onOpen: (id: number) => void;
}

/** One design in a list. `handle` + `outer` are only passed by the sortable wrapper below. */
const JobRowView: React.FC<
  RowProps & {
    handle?: React.ReactNode;
    outerRef?: (el: HTMLElement | null) => void;
    outerStyle?: React.CSSProperties;
  }
> = ({ job, position, viewer, onOpen, handle, outerRef, outerStyle }) => {
  const unread = viewer === 'admin' ? job.unreadForAdmin : job.unreadForDesigner;
  const isNew = viewer === 'admin' ? job.newForAdmin : job.newForDesigner;
  const due = dueText(job);
  return (
    <div
      ref={outerRef}
      style={outerStyle}
      className="flex items-stretch gap-1 rounded-[11px] border border-background-600 bg-background-900 hover:border-primary-600 transition-colors"
    >
      {handle}
      <button type="button" onClick={() => onOpen(job.id)} className="flex-1 min-w-0 text-left px-2.5 py-2">
        <div className="flex items-center gap-2">
          {position !== undefined && (
            <span className="text-[11px] font-bold text-text-500 tabular-nums w-5 shrink-0">#{position}</span>
          )}
          <span className="text-[13px] font-semibold text-text-900 truncate">{job.customerName}</span>
          {isNew && (
            <span
              className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-[1px] rounded-full"
              style={{ background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }}
            >
              New
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          <DesignStatusPill status={job.status} />
          {(job.version ?? 1) > 1 && (
            <span className="inline-flex items-center px-1.5 py-[1px] rounded-full border border-background-600 text-[10.5px] font-semibold text-text-800 tabular-nums">
              {versionLabel(job.version)}
            </span>
          )}
          <PriorityPill priority={job.priority} />
          {due && (
            <span className="text-[11.5px]" style={{ color: job.overdue ? 'var(--st-lost-fg)' : 'var(--color-text-600)' }}>
              {due}
            </span>
          )}
          {viewer === 'admin' && job.designerName && position === undefined && (
            <span className="text-[11.5px] text-text-600">· {job.designerName}</span>
          )}
          <span className="flex-1" />
          {job.fileCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-text-500">
              <Paperclip size={11} /> {job.fileCount}
            </span>
          )}
          {job.noteCount > 0 && (
            <span
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
              style={{ color: unread > 0 ? 'var(--st-potential-fg)' : 'var(--color-text-500)' }}
            >
              <MessageCircle size={11} /> {unread > 0 ? `${unread} new` : job.noteCount}
            </span>
          )}
        </div>
      </button>
    </div>
  );
};

const JobRow: React.FC<RowProps> = (props) => <JobRowView {...props} />;

/** Draggable row inside a designer's queue (admin) — must render inside DndContext/SortableContext. */
const SortableJobRow: React.FC<RowProps> = (props) => {
  const sortable = useSortable({ id: props.job.id });
  return (
    <JobRowView
      {...props}
      outerRef={sortable.setNodeRef}
      outerStyle={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.6 : 1,
      }}
      handle={
        <button
          type="button"
          {...sortable.attributes}
          {...sortable.listeners}
          className="px-1.5 flex items-center text-text-500 hover:text-text-900 cursor-grab touch-none"
          aria-label="Drag to change the order"
          title="Drag to change which design is done first"
        >
          <GripVertical size={15} />
        </button>
      }
    />
  );
};

/** A designer's column: status (admin sets it), workload, and the queue to drag into order. */
const DesignerColumn: React.FC<{
  designerId: number;
  name: string;
  status?: DesignerStatus | null;
  activeCount: number;
  overdue: number;
  jobs: DesignJob[];
  onOpen: (id: number) => void;
}> = ({ designerId, name, status, activeCount, overdue, jobs, onOpen }) => {
  const [order, setOrder] = useState<DesignJob[]>(jobs);
  const [reorder] = useReorderDesignJobsMutation();
  const [setStatus] = useSetDesignerStatusMutation();
  useEffect(() => setOrder(jobs), [jobs]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) {return;}
    const from = order.findIndex((j) => j.id === e.active.id);
    const to = order.findIndex((j) => j.id === e.over!.id);
    if (from < 0 || to < 0) {return;}
    const next = arrayMove(order, from, to);
    setOrder(next);
    try {
      await reorder({ designerId, jobIds: next.map((j) => j.id) }).unwrap();
    } catch (err: any) {
      setOrder(jobs);
      toast.error(err?.message || 'Failed to save the order');
    }
  };

  const changeStatus = async (value: string) => {
    try {
      await setStatus({ userId: designerId, status: value as DesignerStatus | '' }).unwrap();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    }
  };

  return (
    <section id={`designer-${designerId}`} className={columnShell} aria-label={`${name}'s designs`}>
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <DesignerStatusDot status={status} size={10} />
          <span className="text-[13.5px] font-semibold text-text-900 truncate">{name}</span>
          <span className={countBadge}>{activeCount}</span>
          <span className="flex-1" />
          <select
            value={status ?? ''}
            onChange={(e) => changeStatus(e.target.value)}
            className="h-[28px] px-1.5 rounded-[8px] border border-background-600 bg-background-900 text-text-900 text-[12px] outline-none focus:border-primary-600"
            aria-label={`Status of ${name}`}
            title="Set this designer's status"
          >
            <option value="">Status…</option>
            {(Object.keys(DESIGNER_STATUS) as DesignerStatus[]).map((s) => (
              <option key={s} value={s}>
                {DESIGNER_STATUS[s].label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-1 text-[11.5px] text-text-600">
          {overdue > 0 && <span style={{ color: 'var(--st-lost-fg)' }}>{overdue} overdue · </span>}
          {order.length > 1 ? 'Drag to set which comes first' : 'Designs in the order to do them'}
        </div>
      </div>
      <div className={columnBody}>
        {order.length === 0 ? (
          <p className="m-0 py-4 text-center text-[12px] text-text-500">No designs in the queue.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={order.map((j) => j.id)} strategy={verticalListSortingStrategy}>
              {order.map((j, i) => (
                <SortableJobRow key={j.id} job={j} position={i + 1} viewer="admin" onOpen={onOpen} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </section>
  );
};

const AssignModal: React.FC<{ customer: UnassignedDesignCustomer | null; onClose: () => void }> = ({ customer, onClose }) => {
  const [value, setValue] = useState<DesignAssignment>({ designerId: null, dueDate: defaultDueDate(), priority: 'MEDIUM' });
  const [brief, setBrief] = useState('');
  const [planFiles, setPlanFiles] = useState<File[]>([]);
  const [assign, { isLoading: assigning }] = useAssignDesignMutation();
  const [uploadPlanDocuments, { isLoading: uploading }] = useUploadPlanDocumentsMutation();
  const isLoading = assigning || uploading;
  useEffect(() => {
    if (customer) {
      setValue({ designerId: null, dueDate: defaultDueDate(), priority: 'MEDIUM' });
      setBrief('');
      setPlanFiles([]);
    }
  }, [customer]);
  const submit = async () => {
    if (!customer || !value.designerId) {return;}
    let job: DesignJob;
    try {
      job = await assign({
        customerId: customer.customerId,
        designerId: value.designerId,
        dueDate: value.dueDate || undefined,
        priority: value.priority,
        brief: brief.trim() || undefined,
      }).unwrap();
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to assign designer');
      return;
    }
    if (planFiles.length > 0) {
      try {
        await uploadPlanDocuments({ id: job.id, files: planFiles }).unwrap();
      } catch (e: any) {
        // The assignment itself is saved; only the attachments are missing.
        toast.error(`Designer assigned, but the plan documents were not added: ${e?.message || e?.data?.message || 'upload failed'}`);
        onClose();
        return;
      }
    }
    toast.success('Designer assigned');
    onClose();
  };
  return (
    <Modal isOpen={customer !== null} onClose={onClose} title={customer ? `Assign designer · ${customer.customerName}` : ''} size="md">
      <ModalBody>
        <div className="space-y-3">
          <DesignerPicker value={value} onChange={setValue} />
          <div>
            <label className="block text-[12px] font-medium text-text-700 mb-1">Brief</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
              placeholder="What should be designed? Layout, materials, client wishes…"
              className="w-full px-3 py-2 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 resize-y placeholder:text-text-500"
            />
          </div>
          <PlanDocumentsField files={planFiles} onChange={setPlanFiles} disabled={isLoading} />
        </div>
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700">
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!value.designerId || isLoading}
          className="btn-raised-accent px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60"
        >
          {isLoading ? 'Assigning…' : 'Assign'}
        </button>
      </ModalFooter>
    </Modal>
  );
};

const DesignsPage: React.FC = () => {
  const isAdmin = useIsSuperAdmin();
  const { data: me } = useGetDesignMeQuery();
  const viewer: 'admin' | 'designer' = isAdmin ? 'admin' : 'designer';
  const [searchParams, setSearchParams] = useSearchParams();
  const [showClosed, setShowClosed] = useState(false);
  const [assignFor, setAssignFor] = useState<UnassignedDesignCustomer | null>(null);

  const poll = { pollingInterval: 20000, refetchOnFocus: true, refetchOnMountOrArgChange: true } as const;
  // The admin's second view needs the finished designs too, so they are always loaded for admins.
  const { data: jobs = [], isLoading } = useGetDesignJobsQuery({ includeClosed: isAdmin || showClosed }, poll);
  const { data: designers = [] } = useGetDesignersQuery(undefined, { ...poll, skip: !isAdmin });
  const { data: unassigned = [] } = useGetUnassignedDesignsQuery(undefined, { ...poll, skip: !isAdmin });
  const { data: library = [] } = useGetDesignLibraryQuery(undefined, { pollingInterval: 60000, skip: !isAdmin });

  const openJobId = Number(searchParams.get('job') ?? 0) || null;
  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };
  const openJob = (id: number) => setParam('job', String(id));
  const closeJob = () => setParam('job', null);

  // ?designer=ID (from the sidebar panel) always lands on the work board, at that designer's column.
  const focusDesigner = searchParams.get('designer');
  const view: AdminView = !focusDesigner && searchParams.get('view') === 'designs' ? 'designs' : 'work';
  useEffect(() => {
    if (!focusDesigner) {return;}
    requestAnimationFrame(() =>
      document.getElementById(`designer-${focusDesigner}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    );
  }, [focusDesigner, designers.length]);

  const review = useMemo(() => jobs.filter((j) => j.status === 'PENDING_SUPERADMIN_APPROVAL'), [jobs]);
  const work = useMemo(() => jobs.filter((j) => isDesignerWork(j.status)), [jobs]);
  const closed = useMemo(() => jobs.filter((j) => !isDesignerWork(j.status) && j.status !== 'PENDING_SUPERADMIN_APPROVAL'), [jobs]);
  const byDesigner = useMemo(() => {
    const m = new Map<number, DesignJob[]>();
    for (const j of work) {
      if (!j.designerId) {continue;}
      const list = m.get(j.designerId) ?? [];
      list.push(j);
      m.set(j.designerId, list);
    }
    return m;
  }, [work]);
  // Finished designs the customer table does not already show (cancelled, or the customer is in another stage).
  const otherFinished = useMemo(() => {
    const listed = new Set(library.map((r) => r.customerId));
    return closed.filter((j) => !listed.has(j.customerId));
  }, [closed, library]);
  const missing = useMemo(() => library.filter((r) => !r.design).length, [library]);
  const needsAdmin = review.length + unassigned.length;

  if (!isAdmin && me && !me.designer) {
    return (
      <div className={`${card} px-6 py-14 text-center`}>
        <Palette size={28} className="mx-auto text-text-500" />
        <div className="text-[14.5px] font-semibold text-text-900 mt-3">Designs are for designers</div>
        <div className="text-[12.5px] text-text-700 mt-1">Ask an admin to set your staff type to Designer.</div>
      </div>
    );
  }

  const tab = (key: AdminView, label: string, badge: React.ReactNode) => {
    const active = view === key;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => {
          const next = new URLSearchParams(searchParams);
          next.delete('designer');
          if (key === 'work') {
            next.delete('view');
          } else {
            next.set('view', key);
          }
          setSearchParams(next, { replace: true });
        }}
        className={`inline-flex items-center gap-2 h-8 px-3 rounded-[8px] text-[12.5px] whitespace-nowrap transition-colors ${
          active ? 'font-semibold text-text-900' : 'font-medium text-text-600 hover:text-text-900'
        }`}
        style={active ? { background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)' } : undefined}
      >
        {label}
        {badge}
      </button>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div className="min-w-0">
          <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">{isAdmin ? 'Designs' : 'My designs'}</h1>
          <p className="m-0 mt-1 text-[13px] text-text-600">
            {isAdmin
              ? 'Who is designing what, in which order — and what is waiting for your review.'
              : 'Your designs in the order the admin set. Start, upload the design, then mark it complete.'}
          </p>
        </div>
        <span className="flex-1" />
        {isAdmin ? (
          <div role="tablist" aria-label="Designs views" className="inline-flex p-[3px] gap-[3px] rounded-[11px] border border-background-600 bg-background-800">
            {tab(
              'work',
              'Work board',
              needsAdmin > 0 ? (
                <span
                  className="text-[11px] font-[650] px-1.5 py-px rounded-full tabular-nums"
                  style={{ background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }}
                  title={`${needsAdmin} waiting for you`}
                >
                  {needsAdmin}
                </span>
              ) : (
                <span className={countBadge}>{work.length}</span>
              ),
            )}
            {tab(
              'designs',
              'Customer designs',
              <span className={countBadge} title={missing > 0 ? `${missing} without a design saved` : undefined}>
                {missing > 0 ? `${missing} missing` : library.length}
              </span>,
            )}
          </div>
        ) : (
          <label className="inline-flex items-center gap-2 text-[12.5px] text-text-700 cursor-pointer select-none">
            <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
            Show finished
          </label>
        )}
      </div>

      {isLoading ? (
        <div className={`${card} p-6 animate-pulse h-40`} />
      ) : isAdmin ? (
        view === 'designs' ? (
          <DesignLibrary onOpen={openJob} otherFinished={otherFinished} />
        ) : designers.length === 0 && unassigned.length === 0 && review.length === 0 ? (
          <div className={`${card} px-6 py-12 text-center`}>
            <Palette size={26} className="mx-auto text-text-500" />
            <div className="text-[14px] font-semibold text-text-900 mt-3">No designers yet</div>
            <div className="text-[12.5px] text-text-700 mt-1">In Staff, set a staff member&apos;s type to Designer.</div>
          </div>
        ) : (
          // The board: what needs the admin first, then one column per designer. On a wide
          // screen the columns sit in one row and each scrolls on its own.
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-none lg:grid-flow-col lg:auto-cols-[minmax(248px,440px)] gap-3 items-start lg:overflow-x-auto pb-1">
            {review.length > 0 && (
              <section className={columnShell} style={{ borderColor: 'var(--st-potential-fg)' }} aria-label="Designs to review">
                <div className="px-3 pt-3 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} style={{ color: 'var(--st-potential-fg)' }} />
                    <span className={sectionTitle}>To review</span>
                    <span className={countBadge}>{review.length}</span>
                  </div>
                  <div className="mt-1 text-[11.5px] text-text-600">Completed by the designer. Approve or ask for changes.</div>
                </div>
                <div className={columnBody}>
                  {review.map((j) => (
                    <JobRow key={j.id} job={j} viewer="admin" onOpen={openJob} />
                  ))}
                </div>
              </section>
            )}

            {unassigned.length > 0 && (
              <section className={columnShell} aria-label="Customers to assign">
                <div className="px-3 pt-3 pb-2">
                  <div className="flex items-center gap-2">
                    <UserPlus size={15} className="text-primary-600" />
                    <span className={sectionTitle}>To assign</span>
                    <span className={countBadge}>{unassigned.length}</span>
                  </div>
                  <div className="mt-1 text-[11.5px] text-text-600">In Design Stage without a designer.</div>
                </div>
                <div className={columnBody}>
                  {unassigned.map((c) => (
                    <div
                      key={c.customerId}
                      className="flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-[11px] border border-background-600 bg-background-900"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-text-900 truncate">{c.customerName}</div>
                        {c.customerPlace && <div className="text-[11.5px] text-text-500 truncate">{c.customerPlace}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => setAssignFor(c)}
                        className="btn-raised-accent shrink-0 h-7 px-2.5 rounded-[8px] text-[12px] font-semibold"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {designers.map((d) => (
              <DesignerColumn
                key={d.id}
                designerId={d.id}
                name={d.name}
                status={d.designerStatus}
                activeCount={d.activeCount}
                overdue={d.overdue}
                jobs={byDesigner.get(d.id) ?? []}
                onOpen={openJob}
              />
            ))}

            {designers.length === 0 && (
              <section className={`${columnShell} px-4 py-8 text-center`}>
                <Palette size={24} className="mx-auto text-text-500" />
                <div className="text-[13.5px] font-semibold text-text-900 mt-2.5">No designers yet</div>
                <div className="text-[12px] text-text-700 mt-1">In Staff, set a staff member&apos;s type to Designer.</div>
              </section>
            )}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          <section className={columnShell} aria-label="Designs to do">
            <div className="px-3 pt-3 pb-2 flex items-center gap-2">
              <Palette size={15} className="text-primary-600" />
              <span className={sectionTitle}>To do — in order</span>
              <span className={countBadge}>{work.length}</span>
            </div>
            <div className={columnBody}>
              {work.length === 0 ? (
                <p className="m-0 py-4 text-center text-[12.5px] text-text-500">Nothing assigned to you right now.</p>
              ) : (
                work.map((j, i) => <JobRow key={j.id} job={j} position={i + 1} viewer="designer" onOpen={openJob} />)
              )}
            </div>
          </section>

          {(review.length > 0 || (showClosed && closed.length > 0)) && (
            <div className="flex flex-col gap-3 min-w-0">
              {review.length > 0 && (
                <section className={columnShell} style={{ borderColor: 'var(--st-potential-fg)' }} aria-label="Sent for review">
                  <div className="px-3 pt-3 pb-2 flex items-center gap-2">
                    <CheckCircle2 size={15} style={{ color: 'var(--st-potential-fg)' }} />
                    <span className={sectionTitle}>Sent for review</span>
                    <span className={countBadge}>{review.length}</span>
                  </div>
                  <div className={columnBody}>
                    {review.map((j) => (
                      <JobRow key={j.id} job={j} viewer="designer" onOpen={openJob} />
                    ))}
                  </div>
                </section>
              )}
              {showClosed && closed.length > 0 && (
                <section className={columnShell} aria-label="Finished designs">
                  <div className="px-3 pt-3 pb-2 flex items-center gap-2">
                    <span className={sectionTitle}>Finished</span>
                    <span className={countBadge}>{closed.length}</span>
                  </div>
                  <div className={columnBody}>
                    {closed.map((j) => (
                      <JobRow key={j.id} job={j} viewer="designer" onOpen={openJob} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      <DesignJobDrawer jobId={openJobId} viewer={viewer} onClose={closeJob} />
      <AssignModal customer={assignFor} onClose={() => setAssignFor(null)} />
    </div>
  );
};

export default DesignsPage;
