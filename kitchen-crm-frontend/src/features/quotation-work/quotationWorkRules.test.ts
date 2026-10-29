import { describe, expect, it } from 'vitest';
import {
  defaultHandIn,
  isOpenJob,
  isReopenedJob,
  quotationLabel,
  quotationNewsText,
  heldByText,
  queuesByAssignee,
  quotationStageWork,
  quotedText,
  splitToAssign,
} from './quotationWorkRules';
import type { QuotationJob } from './types';

const job = (over: Partial<QuotationJob>): QuotationJob => ({
  id: 1,
  customerId: 10,
  customerName: 'CUSTOMER',
  assigneeId: 5,
  assigneeName: 'Anu',
  status: 'WAITING',
  priority: 'MEDIUM',
  overdue: false,
  ...over,
});

describe('queuesByAssignee', () => {
  it('groups open work per person in queue order and leaves closed work out', () => {
    const queues = queuesByAssignee([
      job({ id: 1, assigneeId: 5, assigneeName: 'Anu', position: 2 }),
      job({ id: 2, assigneeId: 5, assigneeName: 'Anu', position: 1, status: 'IN_PROGRESS' }),
      job({ id: 3, assigneeId: 7, assigneeName: 'Biju', position: 1 }),
      job({ id: 4, assigneeId: 5, assigneeName: 'Anu', status: 'COMPLETED' }),
      job({ id: 5, assigneeId: 7, assigneeName: 'Biju', status: 'CANCELLED' }),
    ]);
    expect(queues.map((q) => q.name)).toEqual(['Anu', 'Biju']);
    expect(queues[0].jobs.map((j) => j.id)).toEqual([2, 1]);
    expect(queues[1].jobs.map((j) => j.id)).toEqual([3]);
  });

  it('puts work without a position last', () => {
    const [q] = queuesByAssignee([job({ id: 9, position: null }), job({ id: 8, position: 1 })]);
    expect(q.jobs.map((j) => j.id)).toEqual([8, 9]);
  });
});

describe('isOpenJob', () => {
  it('is true only while somebody still has to do it', () => {
    expect(isOpenJob('WAITING')).toBe(true);
    expect(isOpenJob('IN_PROGRESS')).toBe(true);
    expect(isOpenJob('COMPLETED')).toBe(false);
    expect(isOpenJob('CANCELLED')).toBe(false);
  });
});

describe('splitToAssign', () => {
  const c = (customerId: number, quotationCount?: number | null) => ({ customerId, customerName: `C${customerId}`, quotationCount });

  it('keeps everyone, those still without a quotation as their own group', () => {
    const { waiting, quoted } = splitToAssign([c(9, 0), c(8, 2), c(7, 0), c(6, 1)]);
    expect(waiting.map((x) => x.customerId)).toEqual([9, 7]);
    expect(quoted.map((x) => x.customerId)).toEqual([8, 6]);
  });

  it('treats a customer the server says nothing about as still waiting', () => {
    const { waiting, quoted } = splitToAssign([c(1), c(2, null)]);
    expect(waiting).toHaveLength(2);
    expect(quoted).toHaveLength(0);
  });

  it('is empty for an empty list', () => {
    expect(splitToAssign([])).toEqual({ waiting: [], quoted: [] });
  });

  it('also waits: a customer with a quotation who was moved into Quotation Stage afterwards', () => {
    const moved = { ...c(5, 2), toAssign: true };
    const settled = { ...c(4, 1), toAssign: false };
    const fresh = { ...c(3, 0), toAssign: true };
    const { waiting, quoted } = splitToAssign([moved, settled, fresh]);
    expect(waiting.map((x) => x.customerId)).toEqual([5, 3]);
    expect(quoted.map((x) => x.customerId)).toEqual([4]);
  });
});

describe('quotationStageWork', () => {
  it('is the open work of customers in Quotation Stage, by person and then in their order', () => {
    const work = quotationStageWork([
      job({ id: 1, customerStatus: 'QUOTE_GIVEN', assigneeName: 'Biju', position: 1 }),
      job({ id: 2, customerStatus: 'QUOTE_GIVEN', assigneeName: 'Anu', position: 2 }),
      job({ id: 3, customerStatus: 'QUOTE_GIVEN', assigneeName: 'Anu', position: 1, status: 'IN_PROGRESS' }),
    ]);
    expect(work.map((j) => j.id)).toEqual([3, 2, 1]);
  });

  it('leaves out work for customers in another stage, and work that is closed', () => {
    const work = quotationStageWork([
      job({ id: 1, customerStatus: 'LEAD' }),
      job({ id: 2, customerStatus: 'FOLLOW_UP' }),
      job({ id: 3, customerStatus: null }),
      job({ id: 4, customerStatus: 'QUOTE_GIVEN', status: 'COMPLETED' }),
      job({ id: 5, customerStatus: 'QUOTE_GIVEN', status: 'CANCELLED' }),
      job({ id: 6, customerStatus: 'QUOTE_GIVEN' }),
    ]);
    expect(work.map((j) => j.id)).toEqual([6]);
  });

  it('does not reorder the list it was given', () => {
    const given = [job({ id: 2, customerStatus: 'QUOTE_GIVEN', assigneeName: 'Biju' }), job({ id: 1, customerStatus: 'QUOTE_GIVEN', assigneeName: 'Anu' })];
    quotationStageWork(given);
    expect(given.map((j) => j.id)).toEqual([2, 1]);
  });
});

describe('heldByText', () => {
  it('says who has it and how far it is', () => {
    expect(heldByText({ assigneeName: 'Anu' }, 'Waiting')).toBe('With Anu · Waiting');
    expect(heldByText({ assigneeName: null }, 'In progress')).toBe('With someone · In progress');
  });
});

describe('quotedText', () => {
  it('says how many quotations there are and where the newest stands', () => {
    expect(quotedText(1, 'Draft')).toBe('1 quotation · Draft');
    expect(quotedText(3, 'Completed')).toBe('3 quotations · newest Completed');
  });

  it('leaves the status out when there is none to show', () => {
    expect(quotedText(2)).toBe('2 quotations');
    expect(quotedText(1, null)).toBe('1 quotation');
  });
});

describe('defaultHandIn', () => {
  it('offers the newest quotation that is not cancelled', () => {
    expect(
      defaultHandIn([
        { id: 30, quotationNumber: 'Q-30', status: 'CANCELLED' },
        { id: 20, quotationNumber: 'Q-20', status: 'DRAFT' },
        { id: 10, quotationNumber: 'Q-10', status: 'DRAFT' },
      ])?.id,
    ).toBe(20);
  });

  it('has nothing to offer when the customer has no usable quotation', () => {
    expect(defaultHandIn([])).toBeNull();
    expect(defaultHandIn(undefined)).toBeNull();
    expect(defaultHandIn([{ id: 1, quotationNumber: 'Q-1', status: 'CANCELLED' }])).toBeNull();
  });

  it('offers the quotation the work was reopened for, even when a newer one exists', () => {
    const quotations = [
      { id: 30, quotationNumber: 'Q-30', status: 'DRAFT' },
      { id: 20, quotationNumber: 'Q-20', status: 'DRAFT' },
    ];
    expect(defaultHandIn(quotations, 20)?.id).toBe(20);
    // Gone from the list (deleted, or cancelled since): the newest usable one, as usual.
    expect(defaultHandIn(quotations, 99)?.id).toBe(30);
    expect(defaultHandIn([{ id: 20, quotationNumber: 'Q-20', status: 'CANCELLED' }, ...quotations.slice(0, 1)], 20)?.id).toBe(30);
    expect(defaultHandIn(quotations, null)?.id).toBe(30);
  });

  it('offers the newest version saved from the reopened quotation, not another quotation of the customer', () => {
    const quotations = [
      { id: 40, quotationNumber: 'Q-40', status: 'DRAFT', folderId: 9 }, // another kitchen, made later
      { id: 35, quotationNumber: 'Q-35', status: 'DRAFT', folderId: 7 }, // "Save as New" from Q-20
      { id: 30, quotationNumber: 'Q-30', status: 'CANCELLED', folderId: 7 },
      { id: 20, quotationNumber: 'Q-20', status: 'DRAFT', folderId: 7 },
      { id: 10, quotationNumber: 'Q-10', status: 'COMPLETE', folderId: 7 }, // an older version
    ];
    expect(defaultHandIn(quotations, 20)?.id).toBe(35);
    // A newer version already Completed existed before the reopening: not the re-edit.
    expect(defaultHandIn([{ id: 25, quotationNumber: 'Q-25', status: 'COMPLETE', folderId: 7 }, ...quotations.slice(3)], 20)?.id).toBe(20);
    // No folder known: the reopened one itself.
    expect(defaultHandIn(quotations.map((q) => ({ ...q, folderId: null })), 20)?.id).toBe(20);
  });
});

describe('isReopenedJob', () => {
  const q = { id: 7, quotationNumber: 'Q-7', status: 'DRAFT' };
  it('is open work that names a quotation', () => {
    expect(isReopenedJob(job({ status: 'WAITING', quotation: q }))).toBe(true);
    expect(isReopenedJob(job({ status: 'IN_PROGRESS', quotation: q }))).toBe(true);
  });
  it('is not new work, nor closed work', () => {
    expect(isReopenedJob(job({ status: 'WAITING' }))).toBe(false);
    expect(isReopenedJob(job({ status: 'WAITING', quotation: null }))).toBe(false);
    expect(isReopenedJob(job({ status: 'COMPLETED', quotation: q }))).toBe(false);
    expect(isReopenedJob(job({ status: 'CANCELLED', quotation: q }))).toBe(false);
  });
});

describe('quotationNewsText', () => {
  it('shows the priority and due date on new work', () => {
    const text = quotationNewsText(job({ feedKind: 'NEW', priority: 'URGENT', dueDate: '2026-10-07' }), false);
    expect(text).toContain('New quotation to prepare');
    expect(text).toContain('Urgent');
    expect(text).toContain('7 Oct');
  });

  it('says what the admin changed, without repeating it', () => {
    const changed = job({ feedKind: 'CHANGED', assigneeNews: 'Priority changed to High', priority: 'HIGH', dueDate: '2026-10-08' });
    expect(quotationNewsText(changed, false)).toBe('Priority changed to High · due 8 Oct');
    const moved = job({ feedKind: 'CHANGED', assigneeNews: 'Now first in your list', priority: 'URGENT' });
    expect(quotationNewsText(moved, false)).toBe('Now first in your list · Urgent');
    const due = job({ feedKind: 'CHANGED', assigneeNews: 'Due 1 Feb · Note updated', priority: 'LOW', dueDate: '2027-02-01' });
    expect(quotationNewsText(due, false)).toBe('Due 1 Feb · Note updated · Low');
  });

  it('tells the admin who completed it', () => {
    expect(quotationNewsText(job({ feedKind: 'COMPLETED', status: 'COMPLETED', completedByName: 'Anu' }), true)).toBe(
      'Quotation completed by Anu',
    );
  });

  it('names who holds overdue work only for whoever manages the board', () => {
    const late = job({ feedKind: 'OVERDUE', dueDate: '2026-10-01', overdue: true });
    expect(quotationNewsText(late, true)).toContain('with Anu');
    expect(quotationNewsText(late, false)).not.toContain('with Anu');
  });
});

describe('quotationLabel', () => {
  it('uses the project name, falls back to the number, and shows later versions', () => {
    expect(quotationLabel({ id: 1, quotationNumber: 'QUO-1', projectName: 'Villa kitchen', versionNumber: 2 })).toBe('Villa kitchen · V2');
    expect(quotationLabel({ id: 1, quotationNumber: 'QUO-1', versionNumber: 1 })).toBe('QUO-1');
  });
});
