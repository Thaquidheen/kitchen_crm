/**
 * QuotationWorkBoard — who prepares which customer's quotation, and in which order.
 *
 * Admin and Admin staff: customers waiting for someone to be assigned, one column per person
 * with their list (drag to set which quotation is done first), and what was completed lately.
 * Everybody else: only their own list, in the order that was set.
 * There is no approval step: the person marks the work completed and the admin is notified.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, FileText, GripVertical, Plus, UserPlus } from 'lucide-react';
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
import { dueText, PriorityPill } from '@/features/design/designUi';
import { quotationStatusLabel } from '@/features/quotations/components/QuotationStatusPill';
import {
  useGetQuotationJobsQuery,
  useGetUnassignedQuotationCustomersQuery,
  useMarkQuotationWorkSeenMutation,
  useReorderQuotationJobsMutation,
} from '../quotationWorkAPI';
import { heldByText, queuesByAssignee, quotationStageWork, quotedText, splitToAssign } from '../quotationWorkRules';
import { fmtDayTime, JOB_STATUS, JobStatusPill } from '../quotationWorkUi';
import type { QuotationJob, QuotationWorkMe, UnassignedQuotationCustomer } from '../types';
import { AssignQuotationModal, type AssignQuotationTarget } from './AssignQuotationModal';
import { QuotationJobModal } from './QuotationJobModal';

const card = 'bg-background-800 border border-background-600 rounded-[14px]';
const sectionTitle = 'text-[13px] font-semibold text-text-900';
const countBadge = 'text-[11px] font-[650] px-1.5 py-px rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums';
/** As tall as its content, up to the space under the page header; past that the list scrolls. */
const columnShell = `${card} flex flex-col min-w-0 min-h-0 lg:max-h-[calc(100dvh-196px)]`;
const columnBody = 'flex-1 min-h-0 overflow-y-auto px-3 pb-3 flex flex-col gap-1.5';
const groupLabel = 'px-0.5 text-[10.5px] font-semibold tracking-[0.07em] uppercase text-text-500';

interface RowProps {
  job: QuotationJob;
  position?: number;
  /** What was news about it when it arrived ('' = just new); undefined = nothing new. */
  news?: string;
  /** Show who has it (lists that mix people). */
  showAssignee?: boolean;
  onOpen: (id: number) => void;
}

/** One quotation in a list. `handle` + `outer` are only passed by the sortable wrapper below. */
const JobRowView: React.FC<
  RowProps & { handle?: React.ReactNode; outerRef?: (el: HTMLElement | null) => void; outerStyle?: React.CSSProperties }
> = ({ job, position, news, showAssignee, onOpen, handle, outerRef, outerStyle }) => {
  const fresh = news !== undefined;
  const due = dueText(job);
  const done = job.status === 'COMPLETED';
  return (
    <div
      ref={outerRef}
      style={outerStyle}
      className="flex items-stretch gap-1 rounded-[11px] border border-background-600 bg-background-900 hover:border-primary-600 transition-colors"
    >
      {handle}
      <button type="button" onClick={() => onOpen(job.id)} className="flex-1 min-w-0 text-left px-2.5 py-2">
        <div className="flex items-center gap-2">
          {position !== undefined && <span className="text-[11px] font-bold text-text-500 tabular-nums w-5 shrink-0">#{position}</span>}
          <span className="text-[13px] font-semibold text-text-900 truncate">{job.customerName}</span>
          {fresh && (
            <span
              className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-[1px] rounded-full"
              style={{ background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }}
            >
              New
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          {done ? (
            <span className="text-[11.5px] text-text-600">
              {job.completedByName ? `By ${job.completedByName}` : 'Completed'}
              {job.completedAt ? ` · ${fmtDayTime(job.completedAt)}` : ''}
            </span>
          ) : (
            <>
              <JobStatusPill status={job.status} />
              <PriorityPill priority={job.priority} />
              {due && (
                <span className="text-[11.5px]" style={{ color: job.overdue ? 'var(--st-lost-fg)' : 'var(--color-text-600)' }}>
                  {due}
                </span>
              )}
              {showAssignee && job.assigneeName && <span className="text-[11.5px] text-text-600">· {job.assigneeName}</span>}
            </>
          )}
          <span className="flex-1" />
          {!done && (job.customerQuotations?.length ?? 0) > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-text-500" title="Quotations this customer has">
              <FileText size={11} /> {job.customerQuotations!.length}
            </span>
          )}
        </div>
        {news && <div className="mt-1 text-[11.5px] text-text-700 truncate">{news}</div>}
      </button>
    </div>
  );
};

/** A Quotation Stage customer nobody is preparing; the second line says what they already have. */
const ToAssignRow: React.FC<{ customer: UnassignedQuotationCustomer; onAssign: (c: UnassignedQuotationCustomer) => void }> = ({
  customer: c,
  onAssign,
}) => {
  const has = c.quotationCount ?? 0;
  // What they have comes first: in a narrow column it is the place that gets cut short.
  const detail = [
    has > 0 ? quotedText(has, c.latestQuotationStatus ? quotationStatusLabel(c.latestQuotationStatus) : null) : null,
    c.customerPlace,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className="flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-[11px] border border-background-600 bg-background-900">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-text-900 truncate">{c.customerName}</div>
        {detail && (
          <div className="text-[11.5px] text-text-500 truncate" title={detail}>
            {detail}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onAssign(c)}
        className="btn-raised-accent shrink-0 h-7 px-2.5 rounded-[8px] text-[12px] font-semibold"
      >
        Assign
      </button>
    </div>
  );
};

/** A Quotation Stage customer somebody already has: who, how far, and a way to that work. */
const WithSomeoneRow: React.FC<{ job: QuotationJob; onOpen: (id: number) => void }> = ({ job, onOpen }) => {
  const detail = [heldByText(job, JOB_STATUS[job.status]?.label ?? job.status), job.customerPlace].filter(Boolean).join(' · ');
  return (
    <div className="flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-[11px] border border-background-600 bg-background-900">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-text-900 truncate">{job.customerName}</div>
        <div className="text-[11.5px] text-text-500 truncate" title={detail}>
          {detail}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onOpen(job.id)}
        title="Open this work: see it, change who has it, the priority or the due date"
        className="shrink-0 h-7 px-2.5 rounded-[8px] border border-background-600 bg-background-800 text-[12px] font-medium text-text-900 hover:border-primary-600 transition-colors"
      >
        Open
      </button>
    </div>
  );
};

/** Draggable row inside a person's list — must render inside DndContext/SortableContext. */
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
          title="Drag to change which quotation is done first"
        >
          <GripVertical size={15} />
        </button>
      }
    />
  );
};

/** One person's list: drag to set which quotation they do first. */
const PersonColumn: React.FC<{
  assigneeId: number;
  name: string;
  jobs: QuotationJob[];
  fresh: Map<number, string>;
  onOpen: (id: number) => void;
}> = ({ assigneeId, name, jobs, fresh, onOpen }) => {
  const [order, setOrder] = useState<QuotationJob[]>(jobs);
  const [reorder] = useReorderQuotationJobsMutation();
  useEffect(() => setOrder(jobs), [jobs]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const overdue = order.filter((j) => j.overdue).length;

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) {return;}
    const from = order.findIndex((j) => j.id === e.active.id);
    const to = order.findIndex((j) => j.id === e.over!.id);
    if (from < 0 || to < 0) {return;}
    const next = arrayMove(order, from, to);
    setOrder(next);
    try {
      await reorder({ assigneeId, jobIds: next.map((j) => j.id) }).unwrap();
    } catch (err: any) {
      setOrder(jobs);
      toast.error(err?.message || err?.data?.message || 'Failed to save the order');
    }
  };

  return (
    <section className={columnShell} aria-label={`${name}'s quotations`}>
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-semibold text-text-900 truncate">{name}</span>
          <span className={countBadge}>{order.length}</span>
        </div>
        <div className="mt-1 text-[11.5px] text-text-600">
          {overdue > 0 && <span style={{ color: 'var(--st-lost-fg)' }}>{overdue} overdue · </span>}
          {order.length > 1 ? 'Drag to set which comes first' : 'Quotations in the order to do them'}
        </div>
      </div>
      <div className={columnBody}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order.map((j) => j.id)} strategy={verticalListSortingStrategy}>
            {order.map((j, i) => (
              <SortableJobRow key={j.id} job={j} position={i + 1} news={fresh.get(j.id)} onOpen={onOpen} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
};

export const QuotationWorkBoard: React.FC<{ me?: QuotationWorkMe }> = ({ me }) => {
  const manages = !!me?.canManage;
  const [searchParams, setSearchParams] = useSearchParams();
  const [assignTarget, setAssignTarget] = useState<AssignQuotationTarget | null>(null);

  const poll = { pollingInterval: 20000, refetchOnFocus: true, refetchOnMountOrArgChange: true } as const;
  const { data: jobs = [], isLoading } = useGetQuotationJobsQuery(undefined, poll);
  const { data: unassigned = [] } = useGetUnassignedQuotationCustomersQuery(undefined, { ...poll, skip: !manages });
  const [markSeen] = useMarkQuotationWorkSeenMutation();

  const queues = useMemo(() => queuesByAssignee(jobs), [jobs]);
  const mine = useMemo(() => queues.find((q) => q.assigneeId === me?.userId)?.jobs ?? [], [queues, me?.userId]);
  const completed = useMemo(() => jobs.filter((j) => j.status === 'COMPLETED'), [jobs]);
  const toAssign = useMemo(() => splitToAssign(unassigned), [unassigned]);
  // The same column also lists the Quotation Stage customers somebody already has, so that it
  // shows the whole stage and nobody has to be looked up by name.
  const withSomeone = useMemo(() => quotationStageWork(jobs), [jobs]);
  const assignTo = (customer: UnassignedQuotationCustomer) => setAssignTarget({ mode: 'assign', customer });

  // Looking at the board is what clears the bell. What was news when it arrived keeps its "New"
  // mark, and what changed, for the rest of this visit.
  const [fresh, setFresh] = useState<Map<number, string>>(new Map());
  const marking = useRef(false);
  useEffect(() => {
    const news = jobs.filter((j) => j.newForAssignee || j.newlyCompleted);
    if (news.length === 0) {return;}
    setFresh((prev) => {
      if (news.every((j) => prev.has(j.id))) {return prev;}
      const next = new Map(prev);
      news.forEach((j) => next.set(j.id, j.assigneeNews ?? ''));
      return next;
    });
    if (!marking.current) {
      marking.current = true;
      markSeen()
        .unwrap()
        .catch(() => undefined)
        .finally(() => {
          marking.current = false;
        });
    }
  }, [jobs, markSeen]);

  const openJobId = Number(searchParams.get('job') ?? 0) || null;
  const openJob = jobs.find((j) => j.id === openJobId) ?? null;
  const setJobParam = (id: number | null) => {
    const next = new URLSearchParams(searchParams);
    if (id === null) {
      next.delete('job');
    } else {
      next.set('job', String(id));
    }
    setSearchParams(next, { replace: true });
  };
  const open = (id: number) => setJobParam(id);

  const completedColumn = completed.length > 0 && (
    <section className={columnShell} aria-label="Completed quotations">
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} style={{ color: 'var(--st-confirmed-fg)' }} />
          <span className={sectionTitle}>Completed</span>
          <span className={countBadge}>{completed.length}</span>
        </div>
        <div className="mt-1 text-[11.5px] text-text-600">Finished in the last 14 days.</div>
      </div>
      <div className={columnBody}>
        {completed.map((j) => (
          <JobRowView key={j.id} job={j} news={fresh.get(j.id)} onOpen={open} />
        ))}
      </div>
    </section>
  );

  if (isLoading) {
    return <div className={`${card} p-6 animate-pulse h-40`} />;
  }

  return (
    <>
      {manages ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-none lg:grid-flow-col lg:auto-cols-[minmax(248px,440px)] gap-3 items-start lg:overflow-x-auto pb-1">
          <section className={columnShell} aria-label="Customers to assign">
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <UserPlus size={15} className="text-primary-600" />
                <span className={sectionTitle}>To assign</span>
                <span className={countBadge}>{unassigned.length}</span>
              </div>
              <div className="mt-1 text-[11.5px] text-text-600">
                Everyone in Quotation Stage. Assign the ones nobody is preparing.
              </div>
            </div>
            <div className={columnBody}>
              {unassigned.length === 0 && (
                <p className="m-0 py-3 text-center text-[12px] text-text-500">
                  {withSomeone.length > 0
                    ? 'Nobody is waiting: everyone in Quotation Stage is with someone.'
                    : 'Nobody is in Quotation Stage. Customers appear here when they reach it.'}
                </p>
              )}
              {/* With only one kind of customer in the list a heading would say nothing. */}
              {toAssign.waiting.length > 0 && (toAssign.quoted.length > 0 || withSomeone.length > 0) && (
                <div className={groupLabel}>No quotation yet · {toAssign.waiting.length}</div>
              )}
              {toAssign.waiting.map((c) => (
                <ToAssignRow key={c.customerId} customer={c} onAssign={assignTo} />
              ))}
              {toAssign.quoted.length > 0 && (
                <div className={`${groupLabel} ${toAssign.waiting.length > 0 ? 'mt-1.5' : ''}`}>
                  Already have a quotation · {toAssign.quoted.length}
                </div>
              )}
              {toAssign.quoted.map((c) => (
                <ToAssignRow key={c.customerId} customer={c} onAssign={assignTo} />
              ))}
              {withSomeone.length > 0 && (
                <div className={`${groupLabel} ${unassigned.length > 0 ? 'mt-1.5' : ''}`}>
                  Already with someone · {withSomeone.length}
                </div>
              )}
              {withSomeone.map((j) => (
                <WithSomeoneRow key={j.id} job={j} onOpen={open} />
              ))}
              <button
                type="button"
                onClick={() => setAssignTarget({ mode: 'assign' })}
                className="inline-flex items-center justify-center gap-1.5 h-8 rounded-[10px] border border-dashed border-background-600 text-[12.5px] font-medium text-text-700 hover:border-primary-600 hover:text-text-900 transition-colors"
              >
                <Plus size={14} /> Assign another customer
              </button>
            </div>
          </section>

          {queues.map((q) => (
            <PersonColumn key={q.assigneeId} assigneeId={q.assigneeId} name={q.name} jobs={q.jobs} fresh={fresh} onOpen={open} />
          ))}

          {completedColumn}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          <section className={columnShell} aria-label="Quotations to do">
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-primary-600" />
                <span className={sectionTitle}>To do — in order</span>
                <span className={countBadge}>{mine.length}</span>
              </div>
              <div className="mt-1 text-[11.5px] text-text-600">Start with #1. Open one to create the quotation and mark it completed.</div>
            </div>
            <div className={columnBody}>
              {mine.length === 0 ? (
                <p className="m-0 py-4 text-center text-[12.5px] text-text-500">No quotation is assigned to you right now.</p>
              ) : (
                mine.map((j, i) => <JobRowView key={j.id} job={j} position={i + 1} news={fresh.get(j.id)} onOpen={open} />)
              )}
            </div>
          </section>
          {completedColumn}
        </div>
      )}

      <QuotationJobModal
        job={openJob}
        canManage={manages}
        myId={me?.userId}
        onClose={() => setJobParam(null)}
        onEdit={(job) => {
          setJobParam(null);
          setAssignTarget({ mode: 'edit', job });
        }}
      />
      <AssignQuotationModal target={assignTarget} onClose={() => setAssignTarget(null)} />
    </>
  );
};

export default QuotationWorkBoard;
