import { baseApi } from '@/app/baseApi';
import type { ApiResponse } from '@/types/api.types';
import type { MyPermissions, PermissionMatrix, PermissionValues } from './types';

const unwrap = <T,>(fallback: string) => (r: ApiResponse<T>): T => {
  if (r.success) {return r.data as T;}
  throw new Error(r.message || fallback);
};

export const permissionsAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyPermissions: builder.query<MyPermissions, void>({
      query: () => '/permissions/me',
      transformResponse: unwrap<MyPermissions>('Failed to load permissions'),
      providesTags: ['Permissions'],
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
  }),
});

export const {
  useGetMyPermissionsQuery,
  useGetPermissionMatrixQuery,
  useSavePermissionsMutation,
} = permissionsAPI;
