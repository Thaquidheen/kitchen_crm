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
  RefreshTokenRequest,
  RefreshTokenResponse,
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

    // Logout endpoint - sends refresh token for revocation
    logout: builder.mutation<ApiResponse<string>, { refreshToken?: string } | void>({
      query: (data) => ({
        url: API_ENDPOINTS.AUTH.LOGOUT,
        method: 'POST',
        body: data && 'refreshToken' in data ? { refreshToken: data.refreshToken } : undefined,
      }),
      invalidatesTags: ['Auth'],
    }),

    // Refresh token endpoint
    refreshToken: builder.mutation<ApiResponse<RefreshTokenResponse>, RefreshTokenRequest>({
      query: (data) => ({
        url: API_ENDPOINTS.AUTH.REFRESH,
        method: 'POST',
        body: data,
      }),
    }),

    // Logout from all devices
    logoutAllDevices: builder.mutation<ApiResponse<string>, void>({
      query: () => ({
        url: API_ENDPOINTS.AUTH.LOGOUT_ALL,
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),

    // Forgot password endpoint
    forgotPassword: builder.mutation<ApiResponse<string>, { email: string }>({
      query: (data) => ({
        url: API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        method: 'POST',
        body: data,
      }),
    }),

    // Reset password endpoint
    resetPassword: builder.mutation<ApiResponse<string>, { token: string; newPassword: string }>({
      query: (data) => ({
        url: API_ENDPOINTS.AUTH.RESET_PASSWORD,
        method: 'POST',
        body: data,
      }),
    }),

    // Validate reset token endpoint
    validateResetToken: builder.query<ApiResponse<boolean>, string>({
      query: (token) => `${API_ENDPOINTS.AUTH.VALIDATE_RESET_TOKEN}?token=${token}`,
    }),

    // Change your own password. Requires auth; the server verifies the current password and
    // revokes every refresh token afterwards, so the user must sign in again.
    changePassword: builder.mutation<
      ApiResponse<string>,
      { currentPassword: string; newPassword: string }
    >({
      query: (data) => ({
        url: API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
  useRefreshTokenMutation,
  useLogoutAllDevicesMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useValidateResetTokenQuery,
  useChangePasswordMutation,
} = authApi;
