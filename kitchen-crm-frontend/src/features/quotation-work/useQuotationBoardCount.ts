import { usePermissions } from '@/features/permissions/usePermissions';
import { useGetQuotationJobsQuery, useGetUnassignedQuotationCustomersQuery } from './quotationWorkAPI';
import { boardRights, isOpenJob, splitToAssign } from './quotationWorkRules';
import type { QuotationWorkMe } from './types';

/** What waits for this person on the board (the number on the tab). */
export const useQuotationBoardCount = (me?: QuotationWorkMe, enabled = true) => {
  const manages = !!me?.canManage;
  const { can, ready } = usePermissions();
  // The server refuses the board's list without "See the work board" and the customers to assign
  // without "Give out quotations": not asked then, and counted as nothing waiting.
  const seesBoard = can('quotation_work.view');
  const assigns = boardRights(manages, can).assign;
  const { data: jobs = [], isSuccess: jobsOk, isError: jobsFailed } = useGetQuotationJobsQuery(undefined, {
    pollingInterval: 30000,
    skip: !enabled || !me || !seesBoard,
  });
  const {
    data: unassigned = [],
    isSuccess: unassignedOk,
    isError: unassignedFailed,
  } = useGetUnassignedQuotationCustomersQuery(undefined, {
    pollingInterval: 30000,
    skip: !enabled || !assigns,
  });
  const shownJobs = seesBoard ? jobs : [];
  const openJobs = shownJobs.filter((j) => isOpenJob(j.status));
  const news = shownJobs.filter((j) => j.newForAssignee || j.newlyCompleted).length;
  // The list also holds customers that already have a quotation; those are not waiting for anyone.
  const toAssign = assigns ? splitToAssign(unassigned).waiting.length : 0;
  return {
    /** There is something on the board for this person (work to do, or finished lately). */
    any: shownJobs.length > 0,
    /**
     * Both lists have answered (a failed one counts as empty), so the numbers below are final.
     * Waits for the permissions too: until they are known nothing is asked, which is not "empty".
     */
    loaded:
      ready &&
      !!me &&
      (!seesBoard || jobsOk || jobsFailed) &&
      (!assigns || unassignedOk || unassignedFailed),
    /** Needs a decision or a look: customers still without a quotation that nobody is preparing, plus unseen news. */
    waiting: toAssign + news,
    open: manages ? openJobs.length : openJobs.filter((j) => j.assigneeId === me?.userId).length,
  };
};
