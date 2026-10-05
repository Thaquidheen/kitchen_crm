import { describe, expect, it } from 'vitest';
import { defaultHandIn, isOpenJob, quotationLabel, quotationNewsText, queuesByAssignee } from './quotationWorkRules';
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
