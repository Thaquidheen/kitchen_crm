/**
 * A quotation set to Completed moves its customer on to Follow Up when they are not there or further
 * yet (the server decides; see QuotationCompletedEffects). The server says so at the end of its
 * reply: "…; NAME moved to Follow Up". Read here, so the screens can tell the person.
 */
export const movedToFollowUp = (message?: string | null): string | null => {
  const m = /;\s*(.+?)\s+moved to Follow Up\s*$/.exec(message ?? '');
  return m ? m[1] : null;
};

/** What the screens say when it happened. */
export const followUpNotice = (customerName: string): string => `${customerName} moved to Follow Up`;

/**
 * The other way: a completed quotation reopened for editing (a request approved, or set back to
 * Draft by hand) takes its customer from Follow Up back to Quotation Stage (see
 * QuotationReopenedEffects). The reply then ends "…; NAME moved to Quotation Stage".
 */
export const movedToQuotationStage = (message?: string | null): string | null => {
  const m = /;\s*(.+?)\s+moved to Quotation Stage\s*$/.exec(message ?? '');
  return m ? m[1] : null;
};

export const quotationStageNotice = (customerName: string): string => `${customerName} moved back to Quotation Stage`;
