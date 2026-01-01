/**
 * Authentication API
 * RTK Query endpoints for authentication operations
 */

import { baseApi } from '../../app/baseApi';
import { API_ENDPOINTS } from '../../services/endpoints';
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  ApiResponse,
} from '../../types/api.types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login endpoint
    login: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
      query: (credentials) => ({
        url: API_ENDPOINTS.AUTH.SIGNIN,
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),

    // Signup endpoint
    signup: builder.mutation<ApiResponse<LoginResponse>, SignupRequest>({
      query: (userData) => ({
        url: API_ENDPOINTS.AUTH.SIGNUP,
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Auth'],
    }),

    // Get current user endpoint
    getCurrentUser: builder.query<ApiResponse<LoginResponse['user']>, void>({
      query: () => API_ENDPOINTS.AUTH.ME,
      providesTags: ['Auth'],
    }),

    // Logout endpoint (if backend provides one)
    logout: builder.mutation<void, void>({
      query: () => ({
        url: API_ENDPOINTS.AUTH.LOGOUT,
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
} = authApi;
