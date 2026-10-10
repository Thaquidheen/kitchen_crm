/**
 * Plain rules of the quotation work board (no React), so they can be unit tested.
 */
import type { QuotationJob, QuotationJobStatus, QuotationRef, QuotationWorkPriority } from './types';

export const PRIORITY_TEXT: Record<QuotationWorkPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const isOpenJob = (s: QuotationJobStatus) => s === 'WAITING' || s === 'IN_PROGRESS';

const dayLabel = (iso: string) =>
  new Date(iso.length > 10 ? iso : iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** One queue per person, each in the order to do them. People appear in the order given. */
export const queuesByAssignee = (jobs: QuotationJob[]): Array<{ assigneeId: number; name: string; jobs: QuotationJob[] }> => {
  const map = new Map<number, { assigneeId: number; name: string; jobs: QuotationJob[] }>();
  for (const j of jobs) {
    if (!isOpenJob(j.status)) {continue;}
    const q = map.get(j.assigneeId) ?? { assigneeId: j.assigneeId, name: j.assigneeName || 'Staff', jobs: [] };
    q.jobs.push(j);
    map.set(j.assigneeId, q);
  }
  const queues = [...map.values()];
  for (const q of queues) {
    q.jobs.sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER) || a.id - b.id);
  }
  return queues.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * The "To assign" column lists everyone in Quotation Stage that nobody is preparing. Those still
 * without a quotation are the ones waiting for somebody; the others already have one and are
 * listed so that finishing or revising it can be handed out too. The order inside each group is kept.
 */
export const splitToAssign = <T extends { quotationCount?: number | null }>(customers: T[]): { waiting: T[]; quoted: T[] } => ({
  waiting: customers.filter((c) => !c.quotationCount),
  quoted: customers.filter((c) => !!c.quotationCount),
});

/**
 * The rest of Quotation Stage: customers somebody is already preparing a quotation for. They are
 * listed in the same column, after the ones still to assign, so the column is the whole stage.
 * Grouped by who has them, each person's in the order they will be done.
 */
export const quotationStageWork = (jobs: QuotationJob[]): QuotationJob[] =>
  jobs
    .filter((j) => isOpenJob(j.status) && j.customerStatus === 'QUOTE_GIVEN')
    .sort(
      (a, b) =>
        (a.assigneeName || '').localeCompare(b.assigneeName || '') ||
        (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER) ||
        a.id - b.id,
    );

/** Who has it and how far it is: "With Anu · Waiting". */
export const heldByText = (job: Pick<QuotationJob, 'assigneeName'>, statusLabel: string): string =>
  `With ${job.assigneeName || 'someone'} · ${statusLabel}`;

/** What such a customer already has: "1 quotation · Draft", "3 quotations · newest Completed". */
export const quotedText = (count: number, latestStatusLabel?: string | null): string => {
  const n = `${count} quotation${count === 1 ? '' : 's'}`;
  if (!latestStatusLabel) {return n;}
  return count === 1 ? `${n} · ${latestStatusLabel}` : `${n} · newest ${latestStatusLabel}`;
};

/** The quotation offered first when handing work in: the newest one that is not cancelled. */
export const defaultHandIn = (quotations: QuotationRef[] | undefined): QuotationRef | null =>
  [...(quotations ?? [])].filter((q) => q.status !== 'CANCELLED').sort((a, b) => b.id - a.id)[0] ?? null;

/** What a job's row in the bell says. `manages` = the reader is the admin or Admin staff. */
export const quotationNewsText = (job: QuotationJob, manages: boolean): string => {
  const priority = PRIORITY_TEXT[job.priority] ?? 'Medium';
  const due = job.dueDate ? ` · due ${dayLabel(job.dueDate)}` : '';
  switch (job.feedKind) {
    case 'COMPLETED':
      return `Quotation completed${job.completedByName ? ` by ${job.completedByName}` : ''}`;
    case 'CHANGED': {
      const news = job.assigneeNews || 'Changed by the admin';
      // The news already names what changed; add only what it does not mention.
      return `${news}${/priority/i.test(news) ? '' : ` · ${priority}`}${/\bdue\b/i.test(news) ? '' : due}`;
    }
    case 'OVERDUE':
      return manages && job.assigneeName
        ? `Overdue${job.dueDate ? ` since ${dayLabel(job.dueDate)}` : ''} · with ${job.assigneeName}`
        : `Overdue${job.dueDate ? ` since ${dayLabel(job.dueDate)}` : ''} · ${priority}`;
    default:
      return `New quotation to prepare · ${priority}${due}`;
  }
};

export const quotationLabel = (q: QuotationRef): string =>
  [q.projectName || q.quotationNumber, q.versionNumber && q.versionNumber > 1 ? `V${q.versionNumber}` : null]
    .filter(Boolean)
    .join(' · ');
