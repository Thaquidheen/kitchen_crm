/**
 * Search and filters of the Designs page: what a search matches and what each filter keeps, on
 * the work board and in the customer designs table; and which approved designs the board lists
 * as completed. Pure, so the rules are tested without the page. Filtering only ever narrows what
 * the page already shows: nobody sees a design they did not see before.
 */
import { DESIGN_STATUS, ORIGIN_LABEL, isApprovedDesign } from './designUi';
import type { DesignJob, DesignPriority, DesignStatus } from './types';

/** How a search and a name are compared: lower case, no spaces at the ends, single spaces inside. */
export const normalizeText = (s?: string | null): string => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** The customer's name or place contains the search, whatever the case. An empty search matches everyone. */
export function matchesCustomerSearch(
  row: { customerName?: string | null; customerPlace?: string | null },
  search: string,
): boolean {
  const q = normalizeText(search);
  if (!q) {
    return true;
  }
  return normalizeText(row.customerName).includes(q) || normalizeText(row.customerPlace).includes(q);
}

export interface FilterOption {
  value: string;
  label: string;
}

// ------------------------------------------------------------------ work board

export interface BoardFilter {
  search: string;
  status: DesignStatus | '';
  priority: DesignPriority | '';
  /** Admin and Admin staff: one designer's work only. */
  designerId: number | null;
  overdueOnly: boolean;
}

export const NO_BOARD_FILTER: BoardFilter = { search: '', status: '', priority: '', designerId: null, overdueOnly: false };

/** How many of the filters behind "More Filters" are set (status, priority, designer). */
export const boardPanelCount = (f: BoardFilter): number =>
  (f.status ? 1 : 0) + (f.priority ? 1 : 0) + (f.designerId !== null ? 1 : 0);

/** Something narrows the board: a search, "Overdue only", or a filter. */
export const isBoardFiltered = (f: BoardFilter): boolean =>
  normalizeText(f.search) !== '' || f.overdueOnly || boardPanelCount(f) > 0;

/** Only one designer is picked: that designer's column is shown whole, so it can still be reordered. */
export const onlyDesignerFilter = (f: BoardFilter): boolean =>
  f.designerId !== null && normalizeText(f.search) === '' && !f.overdueOnly && boardPanelCount(f) === 1;

/** Only the search narrows the board (the reorder hint then says "Clear the search"). */
export const onlyBoardSearch = (f: BoardFilter): boolean =>
  normalizeText(f.search) !== '' && !f.overdueOnly && boardPanelCount(f) === 0;

/** Whether a design card stays on the board: it has to pass every filter that is set. */
export function boardJobMatches(
  job: Pick<DesignJob, 'customerName' | 'customerPlace' | 'status' | 'priority' | 'designerId' | 'overdue'>,
  f: BoardFilter,
): boolean {
  if (!matchesCustomerSearch(job, f.search)) {
    return false;
  }
  if (f.status && job.status !== f.status) {
    return false;
  }
  if (f.priority && (job.priority ?? 'MEDIUM') !== f.priority) {
    return false;
  }
  if (f.designerId !== null && job.designerId !== f.designerId) {
    return false;
  }
  if (f.overdueOnly && !job.overdue) {
    return false;
  }
  return true;
}

/**
 * A customer waiting for a designer has no design yet: the search finds them by name or place,
 * and any design filter (status, priority, designer, overdue) leaves them out.
 */
export function boardCustomerMatches(
  customer: { customerName?: string | null; customerPlace?: string | null },
  f: BoardFilter,
): boolean {
  return matchesCustomerSearch(customer, f.search) && !f.overdueOnly && boardPanelCount(f) === 0;
}

/** The statuses on the board, in the usual order, for the status filter. The chosen one stays listed. */
export function boardStatusOptions(jobs: readonly Pick<DesignJob, 'status'>[], selected: DesignStatus | ''): DesignStatus[] {
  const present = new Set<DesignStatus>(jobs.map((j) => j.status));
  if (selected) {
    present.add(selected);
  }
  return (Object.keys(DESIGN_STATUS) as DesignStatus[]).filter((s) => present.has(s));
}

// ------------------------------------------------------------------ completed column

/** Approved designs stay in the board's Completed column this long, as completed quotations do on theirs. */
export const COMPLETED_DAYS = 14;

/** When a design was finished: when its version was approved, else when the designer handed it in. */
export const finishedAt = (job: Pick<DesignJob, 'approvedAt' | 'completedAt'>): string | null =>
  job.approvedAt || job.completedAt || null;

/**
 * The designs whose current version was approved in the last `days` days, newest first. A design
 * sent back for a redesign is open again and leaves the list; a cancelled one never joins it.
 */
export function recentlyCompleted<T extends Pick<DesignJob, 'id' | 'status' | 'approvedAt' | 'completedAt'>>(
  jobs: readonly T[],
  now: Date,
  days: number = COMPLETED_DAYS,
): T[] {
  const since = now.getTime() - days * 24 * 60 * 60 * 1000;
  return jobs
    .filter((j) => isApprovedDesign(j.status))
    .map((job) => ({ job, at: Date.parse(finishedAt(job) ?? '') }))
    .filter(({ at }) => Number.isFinite(at) && at >= since)
    .sort((a, b) => b.at - a.at || b.job.id - a.job.id)
    .map(({ job }) => job);
}

/** "By NAME" / "Uploaded by NAME": who the completed design is from, as the Made by column says it. */
export function completedByText(job: Pick<DesignJob, 'origin' | 'designerName' | 'approvedByName'>): string {
  if (job.origin === 'UPLOADED') {
    return job.approvedByName ? `${ORIGIN_LABEL.UPLOADED} by ${job.approvedByName}` : ORIGIN_LABEL.UPLOADED;
  }
  return job.designerName ? `By ${job.designerName}` : 'Completed';
}

// ------------------------------------------------------------------ customer designs table

/** The design column of a row: 'NONE' when no design was saved, else the design's status. */
export type DesignStateKey = 'NONE' | DesignStatus;

export interface LibraryFilter {
  search: string;
  /** Customer stage (CustomerStatus name); '' = any. */
  stage: string;
  design: DesignStateKey | '';
  /** 'UPLOADED' or 'D:<designer id>'; '' = any. */
  madeBy: string;
}

export const NO_LIBRARY_FILTER: LibraryFilter = { search: '', stage: '', design: '', madeBy: '' };

interface LibraryRowLike {
  customerName?: string | null;
  customerPlace?: string | null;
  customerStatus?: string | null;
  design: Pick<DesignJob, 'status' | 'origin' | 'designerId' | 'designerName'> | null;
}

export const designStateKey = (design: Pick<DesignJob, 'status'> | null): DesignStateKey => (design ? design.status : 'NONE');

/** Who made the design, as the Made by column says it: uploaded, a designer, or nobody (no design). */
export function madeByKey(design: Pick<DesignJob, 'origin' | 'designerId'> | null): string | null {
  if (!design) {
    return null;
  }
  if (design.origin === 'UPLOADED') {
    return 'UPLOADED';
  }
  return design.designerId ? `D:${design.designerId}` : null;
}

/** How many of the filters behind "More Filters" are set (stage, design, made by). */
export const libraryPanelCount = (f: LibraryFilter): number => (f.stage ? 1 : 0) + (f.design ? 1 : 0) + (f.madeBy ? 1 : 0);

export const isLibraryFiltered = (f: LibraryFilter): boolean => normalizeText(f.search) !== '' || libraryPanelCount(f) > 0;

/** Whether a table row stays: it has to pass the search and every filter that is set. */
export function libraryRowMatches(row: LibraryRowLike, f: LibraryFilter): boolean {
  if (!matchesCustomerSearch(row, f.search)) {
    return false;
  }
  if (f.stage && row.customerStatus !== f.stage) {
    return false;
  }
  if (f.design && designStateKey(row.design) !== f.design) {
    return false;
  }
  if (f.madeBy && madeByKey(row.design) !== f.madeBy) {
    return false;
  }
  return true;
}

/** The stages of these rows in pipeline order (`order`), unknown ones last. The chosen one stays listed. */
export function stageOptions(
  rows: readonly Pick<LibraryRowLike, 'customerStatus'>[],
  order: readonly string[],
  selected: string,
): string[] {
  const present = new Set<string>();
  rows.forEach((r) => {
    if (r.customerStatus) {
      present.add(r.customerStatus);
    }
  });
  if (selected) {
    present.add(selected);
  }
  const known = order.filter((s) => present.has(s));
  const rest = [...present].filter((s) => !order.includes(s)).sort();
  return [...known, ...rest];
}

/** "Not uploaded" first, then the design statuses of these rows in the usual order. The chosen one stays listed. */
export function designStateOptions(rows: readonly Pick<LibraryRowLike, 'design'>[], selected: DesignStateKey | ''): DesignStateKey[] {
  const present = new Set<DesignStateKey>(rows.map((r) => designStateKey(r.design)));
  if (selected) {
    present.add(selected);
  }
  const statuses = (Object.keys(DESIGN_STATUS) as DesignStatus[]).filter((s) => present.has(s));
  return present.has('NONE') ? ['NONE', ...statuses] : statuses;
}

/**
 * The designers of these rows by name, then "Uploaded". The chosen one stays listed; its name is
 * looked up in `known` (every row of the table) when the rows on show do not have it.
 */
export function madeByOptions(
  rows: readonly Pick<LibraryRowLike, 'design'>[],
  selected: string,
  known: readonly Pick<LibraryRowLike, 'design'>[] = rows,
): FilterOption[] {
  const nameOf = (key: string, from: readonly Pick<LibraryRowLike, 'design'>[]): string | undefined =>
    from.find((r) => madeByKey(r.design) === key)?.design?.designerName ?? undefined;
  const designers = new Map<string, string>();
  let uploaded = false;
  const add = (key: string, from: readonly Pick<LibraryRowLike, 'design'>[]) => {
    if (key === 'UPLOADED') {
      uploaded = true;
    } else if (!designers.has(key)) {
      designers.set(key, nameOf(key, from) ?? 'Designer');
    }
  };
  rows.forEach((r) => {
    const key = madeByKey(r.design);
    if (key) {
      add(key, rows);
    }
  });
  if (selected) {
    add(selected, known);
  }
  const options: FilterOption[] = [...designers.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label) || a.value.localeCompare(b.value));
  return uploaded ? [...options, { value: 'UPLOADED', label: ORIGIN_LABEL.UPLOADED }] : options;
}
