import { describe, expect, it } from 'vitest';
import { editRequestNewsText, editRequestTitle, mustAskToEdit, pendingFor } from './editRequestRules';
import type { QuotationEditRequest } from './editRequestsAPI';

const request = (over: Partial<QuotationEditRequest> = {}): QuotationEditRequest => ({
  id: 1,
  quotationId: 40,
  quotationNumber: 'Q-40',
  projectName: 'Kitchen',
  versionNumber: 1,
  customerName: 'Customer',
  requestedByName: 'Designer',
  mine: false,
  status: 'PENDING',
  ...over,
});

describe('who has to ask before editing', () => {
  const staff = { edit: true, changeStatus: false };
  it('is whoever may edit but not change the status, and only for a completed quotation', () => {
    expect(mustAskToEdit(staff, 'COMPLETE')).toBe(true);
    for (const s of ['DRAFT', 'APPROVED', 'CANCELLED', 'ON_HOLD', undefined, null]) {
      expect(mustAskToEdit(staff, s)).toBe(false);
    }
  });
  it('is not someone who can change the status themselves', () => {
    expect(mustAskToEdit({ edit: true, changeStatus: true }, 'COMPLETE')).toBe(false);
  });
  it('is not someone who may not edit quotations at all', () => {
    expect(mustAskToEdit({ edit: false, changeStatus: false }, 'COMPLETE')).toBe(false);
  });
});

describe('the request waiting on a quotation', () => {
  const pending = [
    { id: 1, quotationId: 40, state: 'PENDING' as const, mine: true },
    { id: 2, quotationId: 41, state: 'REOPENED' as const, mine: false, requestedByName: 'Admin staff' },
  ];
  it('is found by quotation', () => {
    expect(pendingFor(pending, 41)?.id).toBe(2);
    expect(pendingFor(pending, 99)).toBeUndefined();
    expect(pendingFor(undefined, 40)).toBeUndefined();
    expect(pendingFor(pending, null)).toBeUndefined();
  });
});

describe('the title', () => {
  it('is customer, quotation and a version above the first', () => {
    expect(editRequestTitle(request())).toBe('Customer · Kitchen');
    expect(editRequestTitle(request({ versionNumber: 3 }))).toBe('Customer · Kitchen · V3');
    expect(editRequestTitle(request({ projectName: ' ' }))).toBe('Customer · Q-40');
    expect(editRequestTitle({})).toBe('Quotation');
  });
});

describe('the bell line', () => {
  it('tells the admin who asks, and why', () => {
    expect(editRequestNewsText(request({ reason: 'change the hob' }), true)).toBe('Designer asks to edit: change the hob');
    expect(editRequestNewsText(request(), true)).toBe('Designer asks to edit this completed quotation');
  });
  it('tells whoever asked the answer, with the note', () => {
    expect(editRequestNewsText(request({ status: 'APPROVED' }), false)).toContain('you can edit it');
    expect(
      editRequestNewsText(request({ status: 'REFUSED', decidedByName: 'Admin', decisionNote: 'already sent' }), false),
    ).toBe('Not approved: the quotation stays as it is — already sent');
  });
  it('says why when the quotation moved on before anyone answered', () => {
    expect(
      editRequestNewsText(request({ status: 'REFUSED', decisionNote: 'The quotation was approved when the customer was confirmed' }), false),
    ).toBe('Closed: The quotation was approved when the customer was confirmed');
  });
});
