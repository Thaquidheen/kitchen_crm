/** Words for a request to reopen a completed quotation (bell, Reminders, lists). */
import type { PendingEditRequest, QuotationEditRequest } from './editRequestsAPI';

/** Customer · quotation · version, with whatever is known. */
export const editRequestTitle = (r: Pick<QuotationEditRequest, 'customerName' | 'projectName' | 'quotationNumber' | 'versionNumber'>) =>
  [r.customerName, r.projectName?.trim() || r.quotationNumber, r.versionNumber && r.versionNumber > 1 ? `V${r.versionNumber}` : null]
    .filter(Boolean)
    .join(' · ') || 'Quotation';

/** The bell line: the admin reads who asks and why; whoever asked reads the answer. */
export const editRequestNewsText = (r: QuotationEditRequest, admin: boolean): string => {
  if (admin || r.status === 'PENDING') {
    const who = r.requestedByName ?? 'Staff';
    return r.reason ? `${who} asks to edit: ${r.reason}` : `${who} asks to edit this completed quotation`;
  }
  // Nobody answered: the quotation moved on by itself (approved or cancelled with its customer).
  if (r.status === 'REFUSED' && !r.decidedByName && r.decisionNote) {
    return `Closed: ${r.decisionNote}`;
  }
  const note = r.decisionNote ? ` — ${r.decisionNote}` : '';
  return r.status !== 'REFUSED'
    ? `Approved: the quotation is a draft again, you can edit it${note}`
    : `Not approved: the quotation stays as it is${note}`;
};

/** The request waiting on one quotation, if any. */
export const pendingFor = (pending: PendingEditRequest[] | undefined, quotationId?: number | null) =>
  quotationId ? pending?.find((p) => p.quotationId === quotationId) : undefined;

/**
 * Who has to ask: editing a completed quotation means putting it back to Draft, so whoever may
 * edit quotations but not change their status asks the admin. Only a completed quotation is asked for.
 */
export const mustAskToEdit = (access: { edit: boolean; changeStatus: boolean }, status?: string | null) =>
  access.edit && !access.changeStatus && status === 'COMPLETE';
