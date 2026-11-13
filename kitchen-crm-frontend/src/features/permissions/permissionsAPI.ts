import { baseApi } from '@/app/baseApi';
import type { ApiResponse } from '@/types/api.types';
import type {
  MyPermissions,
  PermissionMatrix,
  PermissionValues,
  PersonChanges,
  PersonPermissions,
  PersonSummary,
} from './types';

const unwrap = <T,>(fallback: string) => (r: ApiResponse<T>): T => {
  if (r.success) {return r.data as T;}
  throw new Error(r.message || fallback);
};

// Tags: the staff type table keeps the bare 'Permissions' tag, so saving it refreshes everything
// below as well (a person's "Staff type" column comes from it). A save for one person only
// refreshes the picker, that person and the signed-in person's own answers.
const PEOPLE = { type: 'Permissions', id: 'PEOPLE' } as const;
const ME = { type: 'Permissions', id: 'ME' } as const;
const person = (userId: number) => ({ type: 'Permissions', id: `PERSON-${userId}` }) as const;

export const permissionsAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyPermissions: builder.query<MyPermissions, void>({
      query: () => '/permissions/me',
      transformResponse: unwrap<MyPermissions>('Failed to load permissions'),
      providesTags: [ME],
    }),
    getPermissionMatrix: builder.query<PermissionMatrix, void>({
      query: () => '/permissions',
      transformResponse: unwrap<PermissionMatrix>('Failed to load permissions'),
      providesTags: ['Permissions'],
    }),
    savePermissions: builder.mutation<PermissionMatrix, PermissionValues>({
      query: (values) => ({ url: '/permissions', method: 'PUT', body: { values } }),
      transformResponse: unwrap<PermissionMatrix>('Failed to save permissions'),
      invalidatesTags: ['Permissions'],
    }),
    // Also tagged with the staff list, so a new member, a changed staff type or a deactivation
    // made on the Staff page shows up here without a reload.
    getPermissionPeople: builder.query<PersonSummary[], void>({
      query: () => '/permissions/people',
      transformResponse: unwrap<PersonSummary[]>('Failed to load staff'),
      providesTags: [PEOPLE, { type: 'Staff', id: 'LIST' }],
    }),
    getPersonPermissions: builder.query<PersonPermissions, number>({
      query: (userId) => `/permissions/people/${userId}`,
      transformResponse: unwrap<PersonPermissions>('Failed to load permissions'),
      providesTags: (_r, _e, userId) => [person(userId), { type: 'Staff', id: userId }],
    }),
    savePersonPermissions: builder.mutation<PersonPermissions, { userId: number; values: PersonChanges }>({
      query: ({ userId, values }) => ({ url: `/permissions/people/${userId}`, method: 'PUT', body: { values } }),
      transformResponse: unwrap<PersonPermissions>('Failed to save permissions'),
      invalidatesTags: (_r, _e, { userId }) => [PEOPLE, person(userId), ME],
    }),
    resetPersonPermissions: builder.mutation<PersonPermissions, number>({
      query: (userId) => ({ url: `/permissions/people/${userId}`, method: 'DELETE' }),
      transformResponse: unwrap<PersonPermissions>('Failed to reset permissions'),
      invalidatesTags: (_r, _e, userId) => [PEOPLE, person(userId), ME],
    }),
  }),
});

export const {
  useGetMyPermissionsQuery,
  useGetPermissionMatrixQuery,
  useSavePermissionsMutation,
  useGetPermissionPeopleQuery,
  useGetPersonPermissionsQuery,
  useSavePersonPermissionsMutation,
  useResetPersonPermissionsMutation,
} = permissionsAPI;
