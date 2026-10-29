import { describe, expect, it } from 'vitest';
import { approvalEffectText, asksAdmin, needsApproval, NEEDS_APPROVAL, stageMoveText, stageRequestNewsText } from './stageRequestRules';
import type { CustomerStageRequest } from './stageRequestsAPI';

const req = (over: Partial<CustomerStageRequest>): CustomerStageRequest => ({
  id: 1,
  customerId: 2,
  fromStage: 'FOLLOW_UP',
  toStage: 'DESIGN_STAGE',
  status: 'PENDING',
  mine: false,
  requestedByName: 'Anu',
  reason: 'client wants a bigger island',
  ...over,
});

describe('which moves need the admin', () => {
  it('is only Follow Up back to Design or Quotation Stage', () => {
    expect(asksAdmin('FOLLOW_UP', 'DESIGN_STAGE')).toBe(true);
    expect(asksAdmin('FOLLOW_UP', 'QUOTE_GIVEN')).toBe(true);
    expect(asksAdmin('FOLLOW_UP', 'NEGOTIATIONS')).toBe(false);
    expect(asksAdmin('QUOTE_GIVEN', 'DESIGN_STAGE')).toBe(false);
  });
  it('recognises the server refusing a move for that reason', () => {
    expect(needsApproval(`${NEEDS_APPROVAL}: send a request`)).toBe(true);
    expect(needsApproval('Choose a designer for this design')).toBe(false);
    expect(needsApproval(undefined)).toBe(false);
  });
});

describe('the words', () => {
  it('names the move', () => {
    expect(stageMoveText(req({}))).toBe('Follow Up → Design Stage');
  });
  it('tells the admin what approving does', () => {
    expect(approvalEffectText(req({}))).toContain('waits in To assign');
    expect(approvalEffectText(req({ toStage: 'QUOTE_GIVEN', reopens: 'Kitchen V2' }))).toContain('reopens “Kitchen V2”');
    expect(approvalEffectText(req({ toStage: 'QUOTE_GIVEN' }))).toContain('To assign on the work board');
  });
  it('gives the admin the ask and the requester the answer', () => {
    expect(stageRequestNewsText(req({}), true)).toBe('Anu asks to move back to Design Stage: client wants a bigger island');
    expect(stageRequestNewsText(req({ status: 'APPROVED', decisionNote: 'ok' }), false)).toBe('Approved: moved to Design Stage — ok');
    expect(stageRequestNewsText(req({ status: 'REFUSED' }), false)).toBe('Not approved: stays in Follow Up');
  });
});
