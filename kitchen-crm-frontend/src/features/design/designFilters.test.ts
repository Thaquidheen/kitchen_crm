import { describe, expect, it } from 'vitest';
import {
  NO_BOARD_FILTER,
  NO_LIBRARY_FILTER,
  boardCustomerMatches,
  boardJobMatches,
  boardPanelCount,
  boardStatusOptions,
  completedByText,
  designStateOptions,
  isBoardFiltered,
  isLibraryFiltered,
  libraryPanelCount,
  libraryRowMatches,
  madeByKey,
  madeByOptions,
  matchesCustomerSearch,
  onlyBoardSearch,
  recentlyCompleted,
  stageOptions,
  type BoardFilter,
  type LibraryFilter,
} from './designFilters';
import type { DesignJob } from './types';

const job = (over: Partial<DesignJob> = {}): DesignJob => ({
  id: 1,
  customerId: 9,
  customerName: 'MR. TEST CUSTOMER',
  customerPlace: 'North Town',
  designerId: 4,
  designerName: 'Designer A',
  status: 'PLANNING',
  priority: 'MEDIUM',
  revisionCount: 0,
  overdue: false,
  newForDesigner: false,
  newForAdmin: false,
  unreadForAdmin: 0,
  unreadForDesigner: 0,
  noteCount: 0,
  fileCount: 0,
  ...over,
});

const board = (over: Partial<BoardFilter> = {}): BoardFilter => ({ ...NO_BOARD_FILTER, ...over });
const lib = (over: Partial<LibraryFilter> = {}): LibraryFilter => ({ ...NO_LIBRARY_FILTER, ...over });

describe('searching a customer', () => {
  it('matches the name whatever the case', () => {
    expect(matchesCustomerSearch({ customerName: 'MR. TEST CUSTOMER' }, 'test')).toBe(true);
    expect(matchesCustomerSearch({ customerName: 'mr. test customer' }, 'TEST CUST')).toBe(true);
  });

  it('matches the place too', () => {
    expect(matchesCustomerSearch({ customerName: 'MR. TEST', customerPlace: 'North Town' }, 'north')).toBe(true);
    expect(matchesCustomerSearch({ customerName: 'MR. TEST', customerPlace: null }, 'north')).toBe(false);
  });

  it('ignores spaces at the ends and doubled spaces', () => {
    expect(matchesCustomerSearch({ customerName: 'MR.  TEST   CUSTOMER' }, '  test customer ')).toBe(true);
  });

  it('matches everyone when the search is empty or only spaces', () => {
    expect(matchesCustomerSearch({ customerName: 'Anyone' }, '')).toBe(true);
    expect(matchesCustomerSearch({ customerName: 'Anyone' }, '   ')).toBe(true);
  });

  it('does not match what is in neither the name nor the place', () => {
    expect(matchesCustomerSearch({ customerName: 'MR. TEST', customerPlace: 'North Town' }, 'south')).toBe(false);
  });
});

describe('work board filters', () => {
  it('keeps every card when nothing is set', () => {
    expect(isBoardFiltered(NO_BOARD_FILTER)).toBe(false);
    expect(boardJobMatches(job(), NO_BOARD_FILTER)).toBe(true);
    expect(boardCustomerMatches({ customerName: 'MR. TEST' }, NO_BOARD_FILTER)).toBe(true);
  });

  it('does not count a search of only spaces as filtering', () => {
    expect(isBoardFiltered(board({ search: '   ' }))).toBe(false);
  });

  it('keeps cards of the chosen status only', () => {
    const f = board({ status: 'IN_PROGRESS' });
    expect(boardJobMatches(job({ status: 'IN_PROGRESS' }), f)).toBe(true);
    expect(boardJobMatches(job({ status: 'PLANNING' }), f)).toBe(false);
  });

  it('keeps cards of the chosen priority only', () => {
    const f = board({ priority: 'URGENT' });
    expect(boardJobMatches(job({ priority: 'URGENT' }), f)).toBe(true);
    expect(boardJobMatches(job({ priority: 'MEDIUM' }), f)).toBe(false);
  });

  it('keeps overdue cards only with "Overdue only"', () => {
    const f = board({ overdueOnly: true });
    expect(boardJobMatches(job({ overdue: true }), f)).toBe(true);
    expect(boardJobMatches(job({ overdue: false }), f)).toBe(false);
  });

  it('keeps one designer’s cards with the designer filter', () => {
    const f = board({ designerId: 4 });
    expect(boardJobMatches(job({ designerId: 4 }), f)).toBe(true);
    expect(boardJobMatches(job({ designerId: 7 }), f)).toBe(false);
    expect(boardJobMatches(job({ designerId: null }), f)).toBe(false);
  });

  it('needs every filter that is set to pass', () => {
    const f = board({ search: 'north', status: 'IN_PROGRESS', overdueOnly: true });
    expect(boardJobMatches(job({ status: 'IN_PROGRESS', overdue: true }), f)).toBe(true);
    expect(boardJobMatches(job({ status: 'IN_PROGRESS', overdue: false }), f)).toBe(false);
    expect(boardJobMatches(job({ status: 'IN_PROGRESS', overdue: true, customerPlace: 'South' }), f)).toBe(false);
  });

  it('finds customers to assign by the search only; a design filter leaves them out', () => {
    const c = { customerName: 'MR. TEST', customerPlace: 'North Town' };
    expect(boardCustomerMatches(c, board({ search: 'north' }))).toBe(true);
    expect(boardCustomerMatches(c, board({ search: 'south' }))).toBe(false);
    expect(boardCustomerMatches(c, board({ status: 'PLANNING' }))).toBe(false);
    expect(boardCustomerMatches(c, board({ priority: 'LOW' }))).toBe(false);
    expect(boardCustomerMatches(c, board({ designerId: 4 }))).toBe(false);
    expect(boardCustomerMatches(c, board({ overdueOnly: true }))).toBe(false);
  });

  it('counts the filters behind "More Filters" and knows when only the search is on', () => {
    expect(boardPanelCount(board({ status: 'PLANNING', designerId: 4 }))).toBe(2);
    expect(boardPanelCount(board({ search: 'x', overdueOnly: true }))).toBe(0);
    expect(onlyBoardSearch(board({ search: 'x' }))).toBe(true);
    expect(onlyBoardSearch(board({ search: 'x', priority: 'HIGH' }))).toBe(false);
    expect(onlyBoardSearch(board({ overdueOnly: true }))).toBe(false);
  });

  it('offers the statuses on the board in the usual order, and keeps the chosen one', () => {
    const jobs = [job({ status: 'REVISION_REQUIRED' }), job({ status: 'PLANNING' }), job({ status: 'PLANNING' })];
    expect(boardStatusOptions(jobs, '')).toEqual(['PLANNING', 'REVISION_REQUIRED']);
    expect(boardStatusOptions(jobs, 'IN_PROGRESS')).toEqual(['PLANNING', 'IN_PROGRESS', 'REVISION_REQUIRED']);
  });
});

describe('completed designs on the board', () => {
  const now = new Date('2026-10-29T12:00:00');

  it('lists designs approved in the last 14 days, newest first', () => {
    const jobs = [
      job({ id: 1, status: 'APPROVED_BY_ADMIN', approvedAt: '2026-10-20T10:00:00' }),
      job({ id: 2, status: 'APPROVED_BY_ADMIN', approvedAt: '2026-10-28T09:00:00' }),
      job({ id: 3, status: 'APPROVED_BY_ADMIN', approvedAt: '2026-10-01T09:00:00' }),
    ];
    expect(recentlyCompleted(jobs, now).map((j) => j.id)).toEqual([2, 1]);
  });

  it('keeps a design approved exactly 14 days ago and drops one a minute older', () => {
    const edge = job({ id: 1, status: 'APPROVED_BY_ADMIN', approvedAt: '2026-10-15T12:00:00' });
    const older = job({ id: 2, status: 'APPROVED_BY_ADMIN', approvedAt: '2026-10-15T11:59:00' });
    expect(recentlyCompleted([edge, older], now).map((j) => j.id)).toEqual([1]);
  });

  it('counts every approved state, and leaves out open and cancelled designs', () => {
    const at = '2026-10-27T10:00:00';
    const jobs = [
      job({ id: 1, status: 'APPROVED_BY_ADMIN', approvedAt: at }),
      job({ id: 2, status: 'FROZEN', approvedAt: at }),
      job({ id: 3, status: 'PENDING_SUPERADMIN_APPROVAL', completedAt: at }),
      job({ id: 4, status: 'PLANNING', approvedAt: at, version: 2 }),
      job({ id: 5, status: 'CANCELLED', completedAt: at }),
    ];
    expect(recentlyCompleted(jobs, now).map((j) => j.id).sort()).toEqual([1, 2]);
  });

  it('uses the hand-in time for a design approved before approvals were dated, and skips one with neither', () => {
    const jobs = [
      job({ id: 1, status: 'APPROVED_BY_ADMIN', approvedAt: null, completedAt: '2026-10-26T10:00:00' }),
      job({ id: 2, status: 'APPROVED_BY_ADMIN', approvedAt: null, completedAt: null }),
    ];
    expect(recentlyCompleted(jobs, now).map((j) => j.id)).toEqual([1]);
  });

  it('says who the design is from, as the Made by column does', () => {
    expect(completedByText(job({ origin: 'DESIGNER', designerName: 'Designer A' }))).toBe('By Designer A');
    expect(completedByText(job({ origin: 'UPLOADED', approvedByName: 'Office' }))).toBe('Uploaded by Office');
    expect(completedByText(job({ origin: 'UPLOADED', approvedByName: null }))).toBe('Uploaded');
    expect(completedByText(job({ origin: 'DESIGNER', designerName: null }))).toBe('Completed');
  });

  it('is filtered like any other card', () => {
    const done = job({ status: 'APPROVED_BY_ADMIN', approvedAt: '2026-10-27T10:00:00' });
    expect(boardJobMatches(done, board({ search: 'test' }))).toBe(true);
    expect(boardJobMatches(done, board({ status: 'PLANNING' }))).toBe(false);
    expect(boardJobMatches(done, board({ overdueOnly: true }))).toBe(false);
  });
});

describe('customer designs filters', () => {
  const approved = job({ status: 'APPROVED_BY_ADMIN', origin: 'DESIGNER', designerId: 4, designerName: 'Designer A' });
  const uploaded = job({ status: 'APPROVED_BY_ADMIN', origin: 'UPLOADED', designerId: null, designerName: null });
  const row = (over: { customerStatus?: string; customerPlace?: string; design?: DesignJob | null } = {}) => ({
    customerName: 'MR. TEST',
    customerPlace: 'North Town',
    customerStatus: 'QUOTE_GIVEN',
    design: approved as DesignJob | null,
    ...over,
  });

  it('keeps every row when nothing is set', () => {
    expect(isLibraryFiltered(NO_LIBRARY_FILTER)).toBe(false);
    expect(libraryRowMatches(row(), NO_LIBRARY_FILTER)).toBe(true);
    expect(libraryRowMatches(row({ design: null }), NO_LIBRARY_FILTER)).toBe(true);
  });

  it('searches the name and the place line', () => {
    expect(libraryRowMatches(row(), lib({ search: 'north' }))).toBe(true);
    expect(libraryRowMatches(row(), lib({ search: 'mr. te' }))).toBe(true);
    expect(libraryRowMatches(row(), lib({ search: 'south' }))).toBe(false);
  });

  it('keeps the chosen stage only', () => {
    expect(libraryRowMatches(row({ customerStatus: 'CONFIRMED' }), lib({ stage: 'CONFIRMED' }))).toBe(true);
    expect(libraryRowMatches(row({ customerStatus: 'FOLLOW_UP' }), lib({ stage: 'CONFIRMED' }))).toBe(false);
  });

  it('keeps rows by their design: not uploaded, or the design status', () => {
    expect(libraryRowMatches(row({ design: null }), lib({ design: 'NONE' }))).toBe(true);
    expect(libraryRowMatches(row(), lib({ design: 'NONE' }))).toBe(false);
    expect(libraryRowMatches(row(), lib({ design: 'APPROVED_BY_ADMIN' }))).toBe(true);
    expect(libraryRowMatches(row({ design: null }), lib({ design: 'APPROVED_BY_ADMIN' }))).toBe(false);
  });

  it('keeps rows by who made the design: a designer, or uploaded', () => {
    expect(madeByKey(approved)).toBe('D:4');
    expect(madeByKey(uploaded)).toBe('UPLOADED');
    expect(madeByKey(null)).toBeNull();
    expect(libraryRowMatches(row(), lib({ madeBy: 'D:4' }))).toBe(true);
    expect(libraryRowMatches(row(), lib({ madeBy: 'D:7' }))).toBe(false);
    expect(libraryRowMatches(row({ design: uploaded }), lib({ madeBy: 'UPLOADED' }))).toBe(true);
    expect(libraryRowMatches(row({ design: null }), lib({ madeBy: 'UPLOADED' }))).toBe(false);
  });

  it('counts uploaded designs as uploaded even when a designer was on them', () => {
    expect(madeByKey(job({ origin: 'UPLOADED', designerId: 4 }))).toBe('UPLOADED');
  });

  it('needs every filter that is set to pass, and counts them', () => {
    const f = lib({ search: 'north', stage: 'QUOTE_GIVEN', madeBy: 'D:4' });
    expect(libraryRowMatches(row(), f)).toBe(true);
    expect(libraryRowMatches(row({ customerStatus: 'CONFIRMED' }), f)).toBe(false);
    expect(libraryPanelCount(f)).toBe(2);
    expect(isLibraryFiltered(lib({ search: '  ' }))).toBe(false);
  });

  it('offers the stages of the rows in pipeline order, unknown ones last, and keeps the chosen one', () => {
    const order = ['QUOTE_GIVEN', 'FOLLOW_UP', 'NEGOTIATIONS', 'CONFIRMED'];
    const rows = [row({ customerStatus: 'CONFIRMED' }), row({ customerStatus: 'QUOTE_GIVEN' }), row({ customerStatus: 'ODD' })];
    expect(stageOptions(rows, order, '')).toEqual(['QUOTE_GIVEN', 'CONFIRMED', 'ODD']);
    expect(stageOptions(rows, order, 'FOLLOW_UP')).toEqual(['QUOTE_GIVEN', 'FOLLOW_UP', 'CONFIRMED', 'ODD']);
  });

  it('offers "Not uploaded" first, then the design statuses of the rows', () => {
    const rows = [row(), row({ design: null }), row({ design: job({ status: 'IN_PROGRESS' }) })];
    expect(designStateOptions(rows, '')).toEqual(['NONE', 'IN_PROGRESS', 'APPROVED_BY_ADMIN']);
    expect(designStateOptions([row()], '')).toEqual(['APPROVED_BY_ADMIN']);
    expect(designStateOptions([row()], 'NONE')).toEqual(['NONE', 'APPROVED_BY_ADMIN']);
  });

  it('offers the designers by name, then "Uploaded"', () => {
    const other = job({ origin: 'DESIGNER', designerId: 7, designerName: 'Another Designer' });
    const rows = [row(), row({ design: uploaded }), row({ design: other }), row({ design: null })];
    expect(madeByOptions(rows, '')).toEqual([
      { value: 'D:7', label: 'Another Designer' },
      { value: 'D:4', label: 'Designer A' },
      { value: 'UPLOADED', label: 'Uploaded' },
    ]);
  });

  it('keeps the chosen designer listed, by name, when the rows on show do not have them', () => {
    const elsewhere = [row({ design: job({ origin: 'DESIGNER', designerId: 7, designerName: 'Another Designer' }) })];
    expect(madeByOptions([row()], 'D:7', elsewhere)).toEqual([
      { value: 'D:7', label: 'Another Designer' },
      { value: 'D:4', label: 'Designer A' },
    ]);
  });
});
