/**
 * A vendor paid more from one bucket than that bucket's share while the other bucket is still
 * owed. Nothing extra has left the business (the vendor's total is what decides that), but the
 * cash/bank split no longer matches the expense lines. `amount` is the part that moved across.
 */
import type { PaymentMode, VendorTotal } from './types';
import { MODE_LABEL, inr } from './constants';

export interface BucketShift {
  /** The bucket that was paid beyond its share. */
  from: PaymentMode;
  /** The bucket still owed, which should now be that much less. */
  to: PaymentMode;
  amount: number;
}

export function bucketShift(v: VendorTotal): BucketShift | null {
  const ch = v.balanceCashInHand ?? 0;
  const ca = v.balanceCashInAccount ?? 0;
  if (ch < 0 && ca > 0) return { from: 'CASH_IN_HAND', to: 'CASH_IN_ACCOUNT', amount: Math.min(-ch, ca) };
  if (ca < 0 && ch > 0) return { from: 'CASH_IN_ACCOUNT', to: 'CASH_IN_HAND', amount: Math.min(-ca, ch) };
  return null;
}

/** One line for the vendor card, e.g. "₹13,200 paid in Cash in Hand towards the Cash in Account share". */
export function bucketShiftShort(s: BucketShift): string {
  return `${inr(s.amount)} paid in ${MODE_LABEL[s.from]} towards the ${MODE_LABEL[s.to]} share`;
}

/** What it means and the two ways to put it right, for the notice at the top of the page. */
export function bucketShiftAdvice(vendorName: string, s: BucketShift): string {
  return (
    `${vendorName}: ${inr(s.amount)} paid in ${MODE_LABEL[s.from]} beyond its ${MODE_LABEL[s.from]} share is counted ` +
    `against its ${MODE_LABEL[s.to]} share, which has not been paid yet. This is not extra money. ` +
    `If the ${MODE_LABEL[s.to]} payment will be ${inr(s.amount)} less, change the split of its expense line; ` +
    `if it was extra work, add an expense line for it.`
  );
}
