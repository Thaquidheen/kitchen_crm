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
  PartnerType,
} from './types';

export const architectsAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List architects (paginated)
    getArchitects: builder.query<any, { page?: number; size?: number; sortBy?: string; sortDir?: string; visitStatus?: string; partnerType?: PartnerType }>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.size !== undefined) queryParams.append('size', params.size.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortDir) queryParams.append('sortDir', params.sortDir);
        if (params.visitStatus) queryParams.append('visitStatus', params.visitStatus);
        if (params.partnerType) queryParams.append('partnerType', params.partnerType);
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

    // Get visit history
    getVisitHistory: builder.query<ArchitectVisit[], number>({
      query: (id) => API_ENDPOINTS.ARCHITECTS.VISITS(id),
      transformResponse: (response: ApiResponse<ArchitectVisit[]>) => response.data ?? [],
      providesTags: (result, error, id) => [{ type: 'ArchitectVisits', id }],
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
  useGetVisitHistoryQuery,
} = architectsAPI;

export default architectsAPI;

