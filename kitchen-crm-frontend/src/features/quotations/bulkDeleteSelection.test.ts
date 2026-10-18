import { describe, expect, it } from 'vitest';
import {
  allSelected,
  bulkDeleteRequest,
  bulkDeleteSummary,
  deleteCount,
  selectedIds,
  someSelected,
  toggleAll,
  toggleOne,
} from './bulkDeleteSelection';

const listed = [11, 12, 13];

describe('ticking quotations', () => {
  it('ticks and unticks one', () => {
    const one = toggleOne(new Set(), 12);
    expect([...one]).toEqual([12]);
    expect([...toggleOne(one, 12)]).toEqual([]);
  });

  it('does not change the set it was given', () => {
    const before = new Set([11]);
    toggleOne(before, 12);
    toggleAll(before, listed);
    expect([...before]).toEqual([11]);
  });

  it('"Select all" ticks every listed one, and unticks them when all are ticked', () => {
    const all = toggleAll(new Set([12]), listed);
    expect(selectedIds(all, listed)).toEqual(listed);
    expect(allSelected(all, listed)).toBe(true);
    expect(toggleAll(all, listed).size).toBe(0);
  });

  it('shows a dash when some but not all are ticked', () => {
    expect(someSelected(new Set([11]), listed)).toBe(true);
    expect(someSelected(new Set(listed), listed)).toBe(false);
    expect(someSelected(new Set(), listed)).toBe(false);
  });

  it('counts nothing as all ticked when the list is empty', () => {
    expect(allSelected(new Set(), [])).toBe(false);
  });

  it('keeps only the ticked ones still listed, in list order', () => {
    expect(selectedIds(new Set([13, 99, 11]), listed)).toEqual([11, 13]);
  });
});

describe('what is sent', () => {
  it('sends the ticked ids that are still listed', () => {
    expect(bulkDeleteRequest('selected', new Set([13, 11, 99]), listed)).toEqual({ ids: [11, 13] });
  });

  it('sends nothing when nothing listed is ticked', () => {
    expect(bulkDeleteRequest('selected', new Set([99]), listed)).toBeNull();
  });

  it('asks the server for every cancelled quotation for "Delete all", whatever is ticked', () => {
    expect(bulkDeleteRequest('all', new Set([11]), listed)).toEqual({ allCancelled: true });
    expect(bulkDeleteRequest('all', new Set(), [])).toBeNull();
  });

  it('counts the ticked ones, or every cancelled one for "Delete all"', () => {
    expect(deleteCount('selected', new Set([11, 99]), listed, 3)).toBe(1);
    // More are cancelled than the window lists.
    expect(deleteCount('all', new Set(), listed, 1200)).toBe(1200);
    expect(deleteCount('all', new Set(), listed, 0)).toBe(3);
  });
});

describe('the toast after deleting', () => {
  const labels: Record<number, string> = { 11: 'Customer A · Kitchen' };
  const labelOf = (id: number) => labels[id];

  it('says how many were deleted', () => {
    expect(bulkDeleteSummary({ deleted: 1, skipped: [] }, labelOf)).toEqual({
      message: '1 quotation deleted',
      skipped: [],
    });
    expect(bulkDeleteSummary({ deleted: 4, skipped: [] }, labelOf).message).toBe('4 quotations deleted');
  });

  it('names each one that stayed, with the reason', () => {
    const s = bulkDeleteSummary(
      {
        deleted: 0,
        skipped: [
          { id: 11, reason: 'Not cancelled' },
          { id: 77, reason: 'Not found' },
        ],
      },
      labelOf,
    );
    expect(s.message).toBe('No quotation was deleted');
    expect(s.skipped).toEqual(['Customer A · Kitchen: Not cancelled', 'Quotation #77: Not found']);
  });
});
