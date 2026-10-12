/**
 * The edit requests the lists show next to quotations, kept fresh. When one changes (asked,
 * approved, finished) the quotation behind it has changed status too, so the quotation lists are
 * reloaded with it: whoever asked sees "Draft" without reloading the page.
 */
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { baseApi } from '@/app/baseApi';
import { useGetPendingEditRequestsQuery } from './editRequestsAPI';

export function usePendingEditRequests(skip = false) {
  const dispatch = useDispatch();
  const { data } = useGetPendingEditRequestsQuery(undefined, {
    skip,
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });
  const signature = data ? data.map((p) => `${p.id}:${p.state}`).join(',') : null;
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (signature === null) {return;}
    if (last.current !== null && last.current !== signature) {
      dispatch(baseApi.util.invalidateTags(['Quotations', 'QuotationWork']));
    }
    last.current = signature;
  }, [signature, dispatch]);
  return data;
}

export default usePendingEditRequests;
