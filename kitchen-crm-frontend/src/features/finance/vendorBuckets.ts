/**
 * A vendor paid more from one bucket than that bucket's share while the other bucket is still
 * owed. The server works this out (VendorTotal.shift*) on the same grouping as Outstanding and
 * Extra Expenses, so the card and the notice never disagree with those figures. `amount` is the
 * part counted against the other side's share (not extra money); `beyondTotal` is anything paid
 * beyond the vendor's total.
 */
import type { PaymentMode, VendorTotal } from './types';
import { MODE_LABEL, inr } from './constants';

export interface BucketShift {
  /** The bucket that was paid beyond its share. */
  from: PaymentMode;
  /** The bucket still owed, which should now be that much less. */
  to: PaymentMode;
  amount: number;
  beyondTotal: number;
}

export function bucketShift(v: VendorTotal): BucketShift | null {
  if (!v.shiftFrom || !(Number(v.shiftAmount) > 0)) return null;
  return {
    from: v.shiftFrom,
    to: v.shiftFrom === 'CASH_IN_HAND' ? 'CASH_IN_ACCOUNT' : 'CASH_IN_HAND',
    amount: Number(v.shiftAmount),
    beyondTotal: Number(v.shiftBeyondTotal ?? 0),
  };
}

/** One line for the vendor card, e.g. "₹13,200 paid in Cash in Hand towards the Cash in Account share". */
export function bucketShiftShort(s: BucketShift): string {
  return `${inr(s.amount)} paid in ${MODE_LABEL[s.from]} towards the ${MODE_LABEL[s.to]} share`;
}

/** What it means and the two ways to put it right, for the notice at the top of the page. */
export function bucketShiftAdvice(vendorName: string, s: BucketShift): string {
  const beyond =
    s.beyondTotal > 0
      ? ` A further ${inr(s.beyondTotal)} is more than all of its expense lines together, and counts as extra.`
      : '';
  return (
    `${vendorName}: ${inr(s.amount)} paid in ${MODE_LABEL[s.from]} beyond its ${MODE_LABEL[s.from]} share is counted ` +
    `against its ${MODE_LABEL[s.to]} share, which has not been paid yet. That part is not extra money.${beyond} ` +
    `If the ${MODE_LABEL[s.to]} payment will be ${inr(s.amount)} less, change the split of its expense line; ` +
    `if it was extra work, add an expense line for it.`
  );
}

/**
 * What is still due to a vendor from one bucket: that bucket's balance, but never more than the
 * vendor's overall balance. After cash was paid towards the bank share, paying the full bank share
 * as well would pay the vendor more than its total.
 */
export function dueIn(v: VendorTotal | undefined, mode: PaymentMode): number {
  if (!v) return 0;
  const bucket = mode === 'CASH_IN_HAND' ? v.balanceCashInHand ?? 0 : v.balanceCashInAccount ?? 0;
  return Math.max(0, Math.min(bucket, v.balance ?? 0));
}
