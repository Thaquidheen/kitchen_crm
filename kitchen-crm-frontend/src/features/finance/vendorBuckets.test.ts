import { describe, expect, it } from 'vitest';
import { bucketShift, bucketShiftAdvice, bucketShiftShort } from './vendorBuckets';
import type { VendorTotal } from './types';

const vendor = (ch: number, ca: number): VendorTotal => ({
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
});

describe('bucketShift', () => {
  it('spots cash paid towards a bank share that is still owed', () => {
    // 20,000 cash + 1,99,800 bank expensed; 33,200 paid in cash.
    expect(bucketShift(vendor(-13200, 199800))).toEqual({ from: 'CASH_IN_HAND', to: 'CASH_IN_ACCOUNT', amount: 13200 });
  });

  it('spots bank paid towards a cash share, the other way round', () => {
    expect(bucketShift(vendor(5000, -2000))).toEqual({ from: 'CASH_IN_ACCOUNT', to: 'CASH_IN_HAND', amount: 2000 });
  });

  it('caps the shift at what the other side still owes', () => {
    // 10,000 over in cash but only 4,000 left in the bank share: 4,000 moved across, 6,000 is extra.
    expect(bucketShift(vendor(-10000, 4000))?.amount).toBe(4000);
  });

  it('says nothing when both sides lean the same way or are settled', () => {
    expect(bucketShift(vendor(0, 0))).toBeNull();
    expect(bucketShift(vendor(100, 200))).toBeNull();
    expect(bucketShift(vendor(-100, -200))).toBeNull();
    expect(bucketShift(vendor(-100, 0))).toBeNull();
  });

  it('words it plainly', () => {
    const s = bucketShift(vendor(-13200, 199800))!;
    expect(bucketShiftShort(s)).toBe('₹13,200 paid in Cash in Hand towards the Cash in Account share');
    expect(bucketShiftAdvice('SAJIL', s)).toContain('SAJIL: ₹13,200 paid in Cash in Hand beyond its Cash in Hand share is counted against its Cash in Account share');
    expect(bucketShiftAdvice('SAJIL', s)).toContain('If the Cash in Account payment will be ₹13,200 less');
  });
});
