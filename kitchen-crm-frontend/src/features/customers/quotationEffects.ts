/**
 * What a customer's stage does to their quotations, in words for the status window:
 * Confirmed approves one completed quotation, Lost cancels every quotation that is still open.
 * The server does it (QuotationStageEffects); this only says so before the change is saved.
 */
import type { QuotationEffectRow, QuotationEffects } from './customersAPI';

/**
 * The stages that take quotations along. Leaving Confirmed (for anything but Lost) takes the
 * approval back: the approved quotation is Completed again.
 */
export const stageMovesQuotations = (status?: string | null, currentStatus?: string | null) =>
  status === 'CONFIRMED' || status === 'LOST' || (currentStatus === 'CONFIRMED' && !!status && status !== 'CONFIRMED');

export const effectRowLabel = (q: QuotationEffectRow) => {
  const name = q.projectName?.trim() || q.quotationNumber || `Quotation ${q.id}`;
  return q.versionNumber && q.versionNumber > 0 ? `${name} · V${q.versionNumber}` : name;
};

/** The quotation approved when nothing is chosen: the newest (the server lists newest first). */
export const defaultApproveId = (effects?: QuotationEffects | null): number | null =>
  effects?.action === 'APPROVE' ? effects.quotations[0]?.id ?? null : null;

/** The user picks only when there is something to pick between. */
export const needsApproveChoice = (effects?: QuotationEffects | null) =>
  effects?.action === 'APPROVE' && effects.quotations.length > 1;

/** One line for the window. Null when the move touches no quotation. */
export const effectSummary = (effects?: QuotationEffects | null): string | null => {
  const n = effects?.quotations.length ?? 0;
  if (!effects?.action || n === 0) {return null;}
  if (effects.action === 'TAKE_BACK') {
    return n === 1
      ? `The approved quotation “${effectRowLabel(effects.quotations[0])}” goes back to Completed: the customer is no longer confirmed on it.`
      : `${n} approved quotations go back to Completed: the customer is no longer confirmed on them.`;
  }
  if (effects.action === 'APPROVE') {
    if (n === 1 && effects.quotations[0].status === 'APPROVED') {
      return `“${effectRowLabel(effects.quotations[0])}” stays the approved quotation.`;
    }
    return n === 1
      ? `The completed quotation “${effectRowLabel(effects.quotations[0])}” becomes Approved.`
      : `This customer has ${n} completed quotations. Choose the one that becomes Approved; the others stay Completed.`;
  }
  return n === 1
    ? `The quotation “${effectRowLabel(effects.quotations[0])}” becomes Cancelled.`
    : `${n} quotations of this customer become Cancelled.`;
};

/** For a bulk move, where each customer is not looked at one by one. */
export const bulkEffectNote = (status?: string | null): string | null =>
  status === 'CONFIRMED'
    ? 'For each customer the newest completed quotation becomes Approved. To choose another version, change that customer on their own page.'
    : status === 'LOST'
      ? 'Every quotation of these customers that is still Draft or Completed becomes Cancelled.'
      : null;
