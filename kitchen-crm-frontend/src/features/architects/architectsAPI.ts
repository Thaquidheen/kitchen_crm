/**
 * Architects API - RTK Query endpoints for Architect module
 */

import { baseApi } from '../../app/baseApi';
import { API_ENDPOINTS } from '../../services/endpoints';
import type { ApiResponse, PaginatedApiResponse } from '../../types/api.types';
import type {
  Architect,
  ArchitectCreate,
  ArchitectUpdate,
  ArchitectVisit,
  ArchitectVisitCreate,
  ArchitectNote,
  PartnerType,
} from './types';

export const architectsAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List architects (paginated)
    getArchitects: builder.query<any, { page?: number; size?: number; sortBy?: string; sortDir?: string; visitStatus?: string; partnerType?: PartnerType; highlighted?: boolean; search?: string }>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.size !== undefined) queryParams.append('size', params.size.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortDir) queryParams.append('sortDir', params.sortDir);
        if (params.visitStatus) queryParams.append('visitStatus', params.visitStatus);
        if (params.partnerType) queryParams.append('partnerType', params.partnerType);
        if (params.highlighted) queryParams.append('highlighted', 'true');
        if (params.search) queryParams.append('search', params.search);
        const queryString = queryParams.toString();
        return {
          url: API_ENDPOINTS.ARCHITECTS.BASE + (queryString ? `?${queryString}` : ''),
        };
      },
      // Must be id-scoped. This used to be the bare string tag 'Architects', which no
      // mutation's {type:'Architects', id:'LIST'} invalidation matched — so creating an
      // architect never refreshed this list.
      providesTags: (result) =>
        result?.content?.length
          ? [
              ...result.content.map((a: Architect) => ({ type: 'Architects' as const, id: a.id })),
              { type: 'Architects' as const, id: 'LIST' },
            ]
          : [{ type: 'Architects' as const, id: 'LIST' }],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true };
      },
    }),

    // Get all architects (without pagination) — backs the customer form's picker
    getAllArchitects: builder.query<Architect[], { partnerType?: PartnerType } | void>({
      query: (params) => ({
        url: API_ENDPOINTS.ARCHITECTS.ALL,
        params: params && params.partnerType ? { partnerType: params.partnerType } : {},
      }),
      transformResponse: (response: ApiResponse<Architect[]>) => response.data ?? [],
      providesTags: [{ type: 'Architects', id: 'ALL' }],
    }),

    // Get architect by ID
    getArchitectById: builder.query<Architect, number>({
      query: (id) => API_ENDPOINTS.ARCHITECTS.BY_ID(id),
      transformResponse: (response: ApiResponse<Architect>) => response.data as Architect,
      providesTags: (result, error, id) => [{ type: 'Architects', id }],
    }),

    // Create architect
    createArchitect: builder.mutation<Architect, ArchitectCreate>({
      query: (body) => ({
        url: API_ENDPOINTS.ARCHITECTS.BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Architect>) => response.data as Architect,
      invalidatesTags: [{ type: 'Architects', id: 'LIST' }, { type: 'Architects', id: 'ALL' }],
      // The invalidation above refetches, but the picker creates records inline and needs the
      // new row visible to its own duplicate guard immediately — otherwise adding the same
      // builder to two lead-source rows in one modal session would create it twice.
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            architectsAPI.util.updateQueryData('getAllArchitects', undefined, (draft) => {
              if (!draft.some((a) => a.id === data.id)) draft.push(data);
            })
          );
        } catch {
          /* the invalidation refetch reconciles */
        }
      },
    }),

    // Update architect
    updateArchitect: builder.mutation<Architect, { id: number; data: ArchitectUpdate }>({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.ARCHITECTS.BY_ID(id),
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Architect>) => response.data as Architect,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Architects', id },
        { type: 'Architects', id: 'LIST' },
        { type: 'Architects', id: 'ALL' },
      ],
    }),

    // Delete architect
    deleteArchitect: builder.mutation<any, number>({
      query: (id) => ({
        url: API_ENDPOINTS.ARCHITECTS.BY_ID(id),
        method: 'DELETE',
      }),
      transformResponse: (response: any) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to delete architect');
      },
      invalidatesTags: (result, error, id) => [
        { type: 'Architects', id },
        { type: 'Architects', id: 'LIST' },
        { type: 'Architects', id: 'ALL' },
      ],
    }),

    // Search architects
    searchArchitects: builder.query<Architect[], { searchTerm: string; page?: number; size?: number; partnerType?: PartnerType }>({
      query: ({ searchTerm, ...params }) => ({
        url: API_ENDPOINTS.ARCHITECTS.SEARCH,
        params: { searchTerm, ...params },
      }),
      transformResponse: (response: PaginatedApiResponse<Architect>) =>
        response.data?.content ?? [],
      // LIST as well, so a create/update/delete refreshes search results too — no mutation
      // invalidates the SEARCH tag on its own.
      providesTags: [{ type: 'Architects', id: 'SEARCH' }, { type: 'Architects', id: 'LIST' }],
    }),

    // Record visit
    recordVisit: builder.mutation<ArchitectVisit, { id: number; data: ArchitectVisitCreate }>({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.ARCHITECTS.VISITS(id),
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<ArchitectVisit>) => response.data as ArchitectVisit,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Architects', id },
        { type: 'Architects', id: 'LIST' },
        { type: 'Architects', id: 'ALL' },
        { type: 'ArchitectVisits', id },
      ],
    }),

    // Mark as visited (quick)
    markAsVisited: builder.mutation<ArchitectVisit, number>({
      query: (id) => ({
        url: API_ENDPOINTS.ARCHITECTS.VISITS_QUICK(id),
        method: 'POST',
      }),
      transformResponse: (response: ApiResponse<ArchitectVisit>) => response.data as ArchitectVisit,
      invalidatesTags: (result, error, id) => [
        { type: 'Architects', id },
        { type: 'Architects', id: 'LIST' },
        { type: 'Architects', id: 'ALL' },
        { type: 'ArchitectVisits', id },
      ],
    }),

    // Undo a recorded visit. Invalidates exactly what markAsVisited does: the row, the paged
    // list, the picker list (lastVisitDate is a stored column that the backend recomputes)
    // and the visit history.
    deleteVisit: builder.mutation<any, { architectId: number; visitId: number }>({
      query: ({ architectId, visitId }) => ({
        url: API_ENDPOINTS.ARCHITECTS.VISIT_BY_ID(architectId, visitId),
        method: 'DELETE',
      }),
      transformResponse: (response: any) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to remove visit');
      },
      invalidatesTags: (result, error, { architectId }) => [
        { type: 'Architects', id: architectId },
        { type: 'Architects', id: 'LIST' },
        { type: 'Architects', id: 'ALL' },
        { type: 'ArchitectVisits', id: architectId },
      ],
    }),

    // Get visit history
    getVisitHistory: builder.query<ArchitectVisit[], number>({
      query: (id) => API_ENDPOINTS.ARCHITECTS.VISITS(id),
      transformResponse: (response: ApiResponse<ArchitectVisit[]>) => response.data ?? [],
      providesTags: (result, error, id) => [{ type: 'ArchitectVisits', id }],
    }),

    // True per-type totals for the filter chips (the paged list only knows its current page).
    getArchitectCounts: builder.query<{ all: number; architect: number; builder: number }, void>({
      query: () => API_ENDPOINTS.ARCHITECTS.COUNTS,
      transformResponse: (response: ApiResponse<{ all: number; architect: number; builder: number }>) =>
        response.data ?? { all: 0, architect: 0, builder: 0 },
      // Any create/update/delete changes the totals, so ride the LIST tag.
      providesTags: [{ type: 'Architects', id: 'COUNTS' }, { type: 'Architects', id: 'LIST' }],
    }),

    // Notes with history (append-only), newest first.
    getArchitectNotes: builder.query<ArchitectNote[], number>({
      query: (id) => API_ENDPOINTS.ARCHITECTS.NOTES(id),
      transformResponse: (response: ApiResponse<ArchitectNote[]>) => response.data ?? [],
      providesTags: (result, error, id) => [{ type: 'ArchitectNotes', id }],
    }),

    addArchitectNote: builder.mutation<ArchitectNote, { id: number; note: string }>({
      query: ({ id, note }) => ({
        url: API_ENDPOINTS.ARCHITECTS.NOTES(id),
        method: 'POST',
        body: { note },
      }),
      transformResponse: (response: ApiResponse<ArchitectNote>) => response.data as ArchitectNote,
      invalidatesTags: (result, error, { id }) => [{ type: 'ArchitectNotes', id }],
    }),

    // Star / unstar — floats the row to the top. A thin wrapper over update.
    toggleArchitectHighlight: builder.mutation<Architect, { id: number; highlighted: boolean }>({
      query: ({ id, highlighted }) => ({
        url: API_ENDPOINTS.ARCHITECTS.BY_ID(id),
        method: 'PUT',
        body: { highlighted },
      }),
      transformResponse: (response: ApiResponse<Architect>) => response.data as Architect,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Architects', id },
        { type: 'Architects', id: 'LIST' },
        { type: 'Architects', id: 'ALL' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetArchitectsQuery,
  useGetAllArchitectsQuery,
  useGetArchitectByIdQuery,
  useCreateArchitectMutation,
  useUpdateArchitectMutation,
  useDeleteArchitectMutation,
  useSearchArchitectsQuery,
  useRecordVisitMutation,
  useMarkAsVisitedMutation,
  useDeleteVisitMutation,
  useGetVisitHistoryQuery,
  useGetArchitectCountsQuery,
  useGetArchitectNotesQuery,
  useAddArchitectNoteMutation,
  useToggleArchitectHighlightMutation,
} = architectsAPI;

export default architectsAPI;

