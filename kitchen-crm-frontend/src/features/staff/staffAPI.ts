/**
 * Staff API - RTK Query endpoints for Staff module
 */

import { baseApi } from '../../app/baseApi';
import { API_ENDPOINTS } from '../../services/endpoints';
import type { ApiResponse } from '../../types/api.types';
import type { Staff, StaffCreate, StaffUpdate } from './types';

export const staffAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all staff
    getStaff: builder.query<Staff[], void>({
      query: () => API_ENDPOINTS.STAFF.BASE,
      transformResponse: (response: ApiResponse<Staff[]>) => response.data ?? [],
      providesTags: [{ type: 'Staff', id: 'LIST' }],
    }),

    // Get staff by ID
    getStaffById: builder.query<Staff, number>({
      query: (id) => API_ENDPOINTS.STAFF.BY_ID(id),
      transformResponse: (response: ApiResponse<Staff>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch staff');
      },
      providesTags: (result, error, id) => [{ type: 'Staff', id }],
    }),

    // Create staff
    createStaff: builder.mutation<Staff, StaffCreate>({
      query: (body) => ({
        url: API_ENDPOINTS.STAFF.BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Staff>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to create staff');
      },
      invalidatesTags: [{ type: 'Staff', id: 'LIST' }],
    }),

    // Update staff
    updateStaff: builder.mutation<Staff, { id: number; data: StaffUpdate }>({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.STAFF.BY_ID(id),
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Staff>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to update staff');
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Staff', id },
        { type: 'Staff', id: 'LIST' },
      ],
    }),

    // Super admin sets a staff member's password directly
    resetStaffPassword: builder.mutation<void, { id: number; newPassword: string }>({
      query: ({ id, newPassword }) => ({
        url: `${API_ENDPOINTS.STAFF.BY_ID(id)}/password`,
        method: 'PATCH',
        body: { newPassword },
      }),
      transformResponse: (response: ApiResponse<string>) => {
        if (response.success) {
          return;
        }
        throw new Error(response.message || 'Failed to update password');
      },
    }),

    // Delete staff
    deleteStaff: builder.mutation<void, number>({
      query: (id) => ({
        url: API_ENDPOINTS.STAFF.BY_ID(id),
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<string>) => {
        if (response.success) {
          return;
        }
        throw new Error(response.message || 'Failed to delete staff');
      },
      invalidatesTags: (result, error, id) => [
        { type: 'Staff', id },
        { type: 'Staff', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetStaffQuery,
  useGetStaffByIdQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useResetStaffPasswordMutation,
  useDeleteStaffMutation,
} = staffAPI;

export default staffAPI;







