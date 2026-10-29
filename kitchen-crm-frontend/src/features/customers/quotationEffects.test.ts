import { describe, expect, it } from 'vitest';
import {
  bulkEffectNote,
  defaultApproveId,
  effectRowLabel,
  effectSummary,
  needsApproveChoice,
  stageMovesQuotations,
} from './quotationEffects';
import type { QuotationEffects } from './customersAPI';

const row = (id: number, over: Record<string, unknown> = {}) => ({
  id,
  quotationNumber: `Q-${id}`,
  projectName: 'Kitchen',
  versionNumber: 1,
  status: 'COMPLETE',
  ...over,
});

describe('which stages take the quotations along', () => {
  it('is Confirmed and Lost, nothing else', () => {
    expect(stageMovesQuotations('CONFIRMED')).toBe(true);
    expect(stageMovesQuotations('LOST')).toBe(true);
    for (const s of ['LEAD', 'DESIGN_STAGE', 'QUOTE_GIVEN', 'NEGOTIATIONS', 'FOLLOW_UP', undefined, null]) {
      expect(stageMovesQuotations(s)).toBe(false);
    }
  });
});

describe('the row label', () => {
  it('names the project and the version, falling back to the number', () => {
    expect(effectRowLabel(row(1, { versionNumber: 3 }))).toBe('Kitchen · V3');
    expect(effectRowLabel(row(2, { projectName: '  ' }))).toBe('Q-2 · V1');
    expect(effectRowLabel({ id: 9 })).toBe('Quotation 9');
  });
});

describe('moving to Confirmed', () => {
  const one: QuotationEffects = { action: 'APPROVE', quotations: [row(5)] };
  const several: QuotationEffects = { action: 'APPROVE', quotations: [row(8, { versionNumber: 2 }), row(5)] };

  it('approves the only completed quotation without asking', () => {
    expect(needsApproveChoice(one)).toBe(false);
    expect(defaultApproveId(one)).toBe(5);
    expect(effectSummary(one)).toContain('becomes Approved');
  });

  it('asks which one when there are several, with the newest preselected', () => {
    expect(needsApproveChoice(several)).toBe(true);
    expect(defaultApproveId(several)).toBe(8);
    expect(effectSummary(several)).toContain('2 completed quotations');
  });

  it('says nothing when the customer has no completed quotation', () => {
    const none: QuotationEffects = { action: 'APPROVE', quotations: [] };
    expect(effectSummary(none)).toBeNull();
    expect(defaultApproveId(none)).toBeNull();
    expect(needsApproveChoice(none)).toBe(false);
  });
});

describe('moving to Lost', () => {
  it('cancels every open quotation and never offers a choice', () => {
    const lost: QuotationEffects = { action: 'CANCEL', quotations: [row(3, { status: 'DRAFT' }), row(2)] };
    expect(effectSummary(lost)).toBe('2 quotations of this customer become Cancelled.');
    expect(needsApproveChoice(lost)).toBe(false);
    expect(defaultApproveId(lost)).toBeNull();
  });

  it('names the quotation when there is one', () => {
    expect(effectSummary({ action: 'CANCEL', quotations: [row(3)] })).toBe('The quotation “Kitchen · V1” becomes Cancelled.');
  });
});

describe('other stages and missing answers', () => {
  it('have nothing to say', () => {
    expect(effectSummary({ action: null, quotations: [] })).toBeNull();
    expect(effectSummary(undefined)).toBeNull();
    expect(effectSummary(null)).toBeNull();
  });
});

describe('a bulk move', () => {
  it('explains the rule instead of listing quotations', () => {
    expect(bulkEffectNote('CONFIRMED')).toContain('newest completed quotation');
    expect(bulkEffectNote('LOST')).toContain('Cancelled');
    expect(bulkEffectNote('QUOTE_GIVEN')).toBeNull();
  });
});

describe('leaving Confirmed', () => {
  it('takes quotations along from Confirmed to any other stage', () => {
    expect(stageMovesQuotations('FOLLOW_UP', 'CONFIRMED')).toBe(true);
    expect(stageMovesQuotations('DESIGN_STAGE', 'CONFIRMED')).toBe(true);
    expect(stageMovesQuotations('FOLLOW_UP', 'NEGOTIATIONS')).toBe(false);
    expect(stageMovesQuotations(undefined, 'CONFIRMED')).toBe(false);
  });
  it('says the approval goes back to Completed', () => {
    expect(effectSummary({ action: 'TAKE_BACK', quotations: [row(3)] })).toBe(
      'The approved quotation “Kitchen · V1” goes back to Completed: the customer is no longer confirmed on it.',
    );
  });
});
