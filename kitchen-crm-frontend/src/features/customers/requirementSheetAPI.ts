/**
 * A customer's requirement sheet: the company's paper checklist (units, accessories, appliances,
 * finishes...), where staff mark each item Needed or Not needed and add a quantity and a note.
 * The server owns the list of items; the screens only show what it sends.
 */
import { baseApi } from '@/app/baseApi';
import type { ApiResponse } from '@/types/api.types';

/** Null means nobody has marked the item yet. */
export type RequirementStatus = 'NEEDED' | 'NOT_NEEDED';

export interface RequirementItem {
  key: string;
  label: string;
  /** Added by staff for this customer, not one of the checklist's own items. */
  custom: boolean;
  /** Quick choices in groups: one choice per group (e.g. size and fitting). Empty when none. */
  options: string[][];
  status: RequirementStatus | null;
  /** The chosen quick options, comma-separated in option order. */
  choice: string | null;
  quantity: number | null;
  note: string | null;
  updatedByName?: string | null;
  updatedAt?: string | null;
}

export interface RequirementSection {
  key: string;
  title: string;
  hint?: string | null;
  items: RequirementItem[];
}

export interface RequirementCounts {
  needed: number;
  notNeeded: number;
  unmarked: number;
}

export interface RequirementSheet {
  customerId: number;
  customerName: string;
  sections: RequirementSection[];
  counts: RequirementCounts;
  /** The latest change to any item; null while nothing was entered. */
  updatedAt?: string | null;
  updatedByName?: string | null;
}

/**
 * One item a save changes; items not sent stay as they are. No key (with a section and a label)
 * adds a custom row; remove takes a custom row out or clears a checklist item.
 */
export interface RequirementItemChange {
  key?: string | null;
  section?: string;
  label?: string;
  status?: RequirementStatus | null;
  choice?: string | null;
  quantity?: number | null;
  note?: string | null;
  remove?: boolean;
}

const unwrap = (fallback: string) => (r: ApiResponse<RequirementSheet>): RequirementSheet => {
  if (r.success) {return r.data as RequirementSheet;}
  throw new Error(r.message || fallback);
};

/** Tag of one customer's sheet; the Designs view of the same sheet listens to it too. */
export const requirementSheetTag = (customerId: number) => ({
  type: 'Customers' as const,
  id: `REQUIREMENT-SHEET-${customerId}`,
});

export const requirementSheetAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRequirementSheet: builder.query<RequirementSheet, number>({
      query: (customerId) => `/customers/${customerId}/requirement-sheet`,
      transformResponse: unwrap('Failed to load the requirement sheet'),
      providesTags: (r, e, customerId) => [requirementSheetTag(customerId)],
    }),
    saveRequirementSheet: builder.mutation<RequirementSheet, { customerId: number; items: RequirementItemChange[] }>({
      query: ({ customerId, items }) => ({
        url: `/customers/${customerId}/requirement-sheet`,
        method: 'PUT',
        body: { items },
      }),
      transformResponse: unwrap('Failed to save the requirement sheet'),
      // The saved sheet goes straight into the cache, so the screen does not show the old answers
      // for a moment between clearing its edits and the refetch coming back.
      async onQueryStarted({ customerId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(requirementSheetAPI.util.updateQueryData('getRequirementSheet', customerId, () => data));
        } catch {
          // The caller shows the error; nothing was saved.
        }
      },
      // The designer's read-only copy in Designs is keyed by the design job, so it is reached
      // through the customer's tag.
      invalidatesTags: (r, e, { customerId }) => (e ? [] : [requirementSheetTag(customerId)]),
    }),
  }),
  overrideExisting: false,
});

export const { useGetRequirementSheetQuery, useSaveRequirementSheetMutation } = requirementSheetAPI;
