import { useGetQuotationJobsQuery, useGetUnassignedQuotationCustomersQuery } from './quotationWorkAPI';
import { isOpenJob, splitToAssign } from './quotationWorkRules';
import type { QuotationWorkMe } from './types';

/** What waits for this person on the board (the number on the tab). */
export const useQuotationBoardCount = (me?: QuotationWorkMe, enabled = true) => {
  const manages = !!me?.canManage;
  const { data: jobs = [], isSuccess: jobsOk, isError: jobsFailed } = useGetQuotationJobsQuery(undefined, {
    pollingInterval: 30000,
    skip: !enabled || !me,
  });
  const {
    data: unassigned = [],
    isSuccess: unassignedOk,
    isError: unassignedFailed,
  } = useGetUnassignedQuotationCustomersQuery(undefined, {
    pollingInterval: 30000,
    skip: !enabled || !manages,
  });
  const openJobs = jobs.filter((j) => isOpenJob(j.status));
  const news = jobs.filter((j) => j.newForAssignee || j.newlyCompleted).length;
  // The list also holds customers that already have a quotation; those are not waiting for anyone.
  const toAssign = splitToAssign(unassigned).waiting.length;
  return {
    /** There is something on the board for this person (work to do, or finished lately). */
    any: jobs.length > 0,
    /** Both lists have answered (a failed one counts as empty), so the numbers below are final. */
    loaded: !!me && (jobsOk || jobsFailed) && (!manages || unassignedOk || unassignedFailed),
    /** Needs a decision or a look: customers still without a quotation that nobody is preparing, plus unseen news. */
    waiting: (manages ? toAssign : 0) + news,
    open: manages ? openJobs.length : openJobs.filter((j) => j.assigneeId === me?.userId).length,
  };
};
