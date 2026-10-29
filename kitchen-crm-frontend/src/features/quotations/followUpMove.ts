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
