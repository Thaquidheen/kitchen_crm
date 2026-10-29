import { describe, expect, it } from 'vitest';
import { followUpNotice, movedToFollowUp } from './followUpMove';

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
