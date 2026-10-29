import { describe, expect, it } from 'vitest';
import { followUpNotice, movedToFollowUp, movedToQuotationStage, quotationStageNotice } from './followUpMove';

describe('the customer a completed quotation moved on', () => {
  it('is read from the end of the reply', () => {
    expect(movedToFollowUp('Quotation status updated successfully; MR. ALEX MANI moved to Follow Up')).toBe('MR. ALEX MANI');
    expect(movedToFollowUp('Quotation completed; DR. K; M moved to Follow Up')).toBe('DR. K; M');
  });
  it('is none when the customer did not move', () => {
    expect(movedToFollowUp('Quotation status updated successfully')).toBeNull();
    expect(movedToFollowUp('Quotation completed')).toBeNull();
    expect(movedToFollowUp(undefined)).toBeNull();
  });
  it('is said in plain words', () => {
    expect(followUpNotice('LIYAKHATH ALI')).toBe('LIYAKHATH ALI moved to Follow Up');
  });
});

describe('the customer a reopened quotation moved back', () => {
  it('is read from the end of the reply', () => {
    expect(movedToQuotationStage('Approved: the quotation is a draft again; MR. ALEX MANI moved to Quotation Stage')).toBe('MR. ALEX MANI');
    expect(movedToQuotationStage('Quotation status updated successfully; DR. K; M moved to Quotation Stage')).toBe('DR. K; M');
  });
  it('is none when the customer did not move', () => {
    expect(movedToQuotationStage('Approved: the quotation is a draft again')).toBeNull();
    expect(movedToQuotationStage('Quotation status updated successfully; A moved to Follow Up')).toBeNull();
    expect(movedToQuotationStage(null)).toBeNull();
  });
  it('is not mistaken for a move to Follow Up', () => {
    expect(movedToFollowUp('Approved: the quotation is a draft again; A moved to Quotation Stage')).toBeNull();
  });
  it('is said in plain words', () => {
    expect(quotationStageNotice('LIYAKHATH ALI')).toBe('LIYAKHATH ALI moved back to Quotation Stage');
  });
});
