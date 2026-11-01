import { describe, expect, it } from 'vitest';
import { bucketShift, bucketShiftAdvice, bucketShiftShort, dueIn } from './vendorBuckets';
import type { VendorTotal } from './types';

const vendor = (ch: number, ca: number, shift: Partial<VendorTotal> = {}): VendorTotal => ({
  vendorId: 1,
  vendorName: 'V',
  totalExpensed: 0,
  expensedCashInHand: 0,
  expensedCashInAccount: 0,
  totalReleased: 0,
  releasedCashInHand: 0,
  releasedCashInAccount: 0,
  balance: ch + ca,
  balanceCashInHand: ch,
  balanceCashInAccount: ca,
  expenseCount: 1,
  releaseCount: 1,
  ...shift,
});

describe('bucketShift', () => {
  it('reads the shift the server worked out', () => {
    // 20,000 cash + 1,99,800 bank expensed; 33,200 paid in cash.
    const v = vendor(-13200, 199800, { shiftFrom: 'CASH_IN_HAND', shiftAmount: 13200, shiftBeyondTotal: 0 });
    expect(bucketShift(v)).toEqual({ from: 'CASH_IN_HAND', to: 'CASH_IN_ACCOUNT', amount: 13200, beyondTotal: 0 });
    expect(bucketShift(vendor(5000, -2000, { shiftFrom: 'CASH_IN_ACCOUNT', shiftAmount: 2000 }))?.to).toBe('CASH_IN_HAND');
  });

  it('says nothing when the server reports no shift, even if the card balances disagree in sign', () => {
    // e.g. a release linked to another vendor's line: the server does not count it as a shift.
    expect(bucketShift(vendor(-5000, 10000))).toBeNull();
    expect(bucketShift(vendor(0, 0, { shiftFrom: 'CASH_IN_HAND', shiftAmount: 0 }))).toBeNull();
  });

  it('words it plainly', () => {
    const s = bucketShift(vendor(-13200, 199800, { shiftFrom: 'CASH_IN_HAND', shiftAmount: 13200, shiftBeyondTotal: 0 }))!;
    expect(bucketShiftShort(s)).toBe('₹13,200 paid in Cash in Hand towards the Cash in Account share');
    const advice = bucketShiftAdvice('SAJIL', s);
    expect(advice).toContain('SAJIL: ₹13,200 paid in Cash in Hand beyond its Cash in Hand share is counted against its Cash in Account share');
    expect(advice).toContain('If the Cash in Account payment will be ₹13,200 less');
    expect(advice).not.toContain('A further');
  });

  it('names the part beyond the vendor total separately', () => {
    // 10,000 cash + 4,000 bank expensed; 20,000 paid in cash: 4,000 moved across, 6,000 is extra.
    const s = bucketShift(vendor(-10000, 4000, { shiftFrom: 'CASH_IN_HAND', shiftAmount: 4000, shiftBeyondTotal: 6000 }))!;
    expect(bucketShiftAdvice('V', s)).toContain('V: ₹4,000 paid in Cash in Hand');
    expect(bucketShiftAdvice('V', s)).toContain('A further ₹6,000 is more than all of its own expense lines together.');
  });
});

describe('dueIn', () => {
  it('never suggests more than the vendor is owed in total', () => {
    const v = vendor(-13200, 199800);
    expect(dueIn(v, 'CASH_IN_ACCOUNT')).toBe(186600);
    expect(dueIn(v, 'CASH_IN_HAND')).toBe(0);
  });

  it('is the bucket balance when nothing moved across', () => {
    expect(dueIn(vendor(5000, 7000), 'CASH_IN_HAND')).toBe(5000);
    expect(dueIn(vendor(-10000, 4000), 'CASH_IN_ACCOUNT')).toBe(0);
    expect(dueIn(undefined, 'CASH_IN_HAND')).toBe(0);
  });
});
