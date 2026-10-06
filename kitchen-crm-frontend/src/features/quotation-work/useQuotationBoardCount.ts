import { useGetQuotationJobsQuery, useGetUnassignedQuotationCustomersQuery } from './quotationWorkAPI';
import { isOpenJob } from './quotationWorkRules';
import type { QuotationWorkMe } from './types';

/** What is on the board for whoever manages it (the number on the tab). Nothing for anyone else. */
export const useQuotationBoardCount = (me?: QuotationWorkMe, enabled = true) => {
  const manages = !!me?.canManage;
  const { data: jobs = [], isSuccess: jobsOk, isError: jobsFailed } = useGetQuotationJobsQuery(undefined, {
    pollingInterval: 30000,
    skip: !enabled || !manages,
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
  return {
    /** Both lists have answered (a failed one counts as empty), so the numbers below are final. */
    loaded: manages && (jobsOk || jobsFailed) && (unassignedOk || unassignedFailed),
    /** Needs a decision or a look: customers to assign plus unseen news. */
    waiting: unassigned.length + news,
    open: openJobs.length,
  };
};
