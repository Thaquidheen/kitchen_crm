/** Words for a request to move a Follow Up customer back (bell, Reminders). */
import type { CustomerStageRequest } from './stageRequestsAPI';

/** The words the server refuses such a move with; the screens then send a request instead. */
export const NEEDS_APPROVAL = "This move needs the admin's approval";

export const needsApproval = (message?: string | null) => !!message && message.startsWith(NEEDS_APPROVAL);

/** Whether a move by someone who is not the admin has to be asked for. */
export const asksAdmin = (fromStage?: string | null, toStage?: string | null) =>
  fromStage === 'FOLLOW_UP' && (toStage === 'DESIGN_STAGE' || toStage === 'QUOTE_GIVEN');


const STAGE: Record<string, string> = {
  LEAD: 'Lead',
  POTENTIAL: 'Potential',
  DESIGN_STAGE: 'Design Stage',
  QUOTE_GIVEN: 'Quotation Stage',
  FOLLOW_UP: 'Follow Up',
  NEGOTIATIONS: 'Negotiations',
  CONFIRMED: 'Confirmed',
  LOST: 'Lost',
};

export const stageLabel = (s?: string | null) => (s ? STAGE[s] ?? s : '');

/** "Follow Up → Design Stage". */
export const stageMoveText = (r: Pick<CustomerStageRequest, 'fromStage' | 'toStage'>) =>
  `${stageLabel(r.fromStage)} → ${stageLabel(r.toStage)}`;

/** What approving does, in one line for the admin. */
export const approvalEffectText = (r: Pick<CustomerStageRequest, 'toStage' | 'reopens'>) =>
  r.toStage === 'DESIGN_STAGE'
    ? 'Approving moves the customer to Design Stage; the design waits in To assign for you to choose the designer.'
    : r.reopens
      ? `Approving moves the customer to Quotation Stage and reopens “${r.reopens}” for whoever prepared it.`
      : 'Approving moves the customer to Quotation Stage; they wait in To assign on the work board.';

/** The bell line: the admin reads who asks and why; whoever asked reads the answer. */
export const stageRequestNewsText = (r: CustomerStageRequest, admin: boolean): string => {
  if (admin || r.status === 'PENDING') {
    const who = r.requestedByName ?? 'Staff';
    return `${who} asks to move back to ${stageLabel(r.toStage)}${r.reason ? `: ${r.reason}` : ''}`;
  }
  const note = r.decisionNote ? ` — ${r.decisionNote}` : '';
  if (r.status === 'APPROVED') {return `Approved: moved to ${stageLabel(r.toStage)}${note}`;}
  if (r.status === 'REFUSED') {return `Not approved: stays in ${stageLabel(r.fromStage)}${note}`;}
  return `Closed${note}`;
};
