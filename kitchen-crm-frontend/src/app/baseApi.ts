/**
 * Base API configuration for RTK Query
 * All API slices will extend this base query
 * Includes token refresh mechanism with mutex pattern
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { Mutex } from 'async-mutex';
import type { RootState } from './store';
import { tokenRefreshed, logout } from '../features/auth/authSlice';
import { API_ENDPOINTS } from '../services/endpoints';

// Mutex to prevent concurrent refresh attempts
const refreshMutex = new Mutex();

// Helper to check if token will expire within specified seconds
const willTokenExpireSoon = (token: string, withinSeconds: number = 60): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    return Date.now() >= expiryTime - withinSeconds * 1000;
  } catch {
    return true;
  }
};

// Helper to get tokens from storage (checks both localStorage and sessionStorage)
const getStoredTokens = (): { accessToken: string | null; refreshToken: string | null } => {
  // Check localStorage first (persistent session)
  let accessToken = localStorage.getItem('accessToken');
  let refreshToken = localStorage.getItem('refreshToken');

  if (accessToken) {
    return { accessToken, refreshToken };
  }

  // Fall back to sessionStorage (non-persistent session)
  accessToken = sessionStorage.getItem('accessToken');
  refreshToken = sessionStorage.getItem('refreshToken');

  return { accessToken, refreshToken };
};

// Helper to get storage type based on rememberMe setting
const getStorage = (): Storage => {
  const rememberMe = localStorage.getItem('rememberMe') === 'true';
  return rememberMe ? localStorage : sessionStorage;
};

// Helper to save tokens to storage
const saveTokens = (accessToken: string, refreshToken?: string, expiresIn?: number): void => {
  const storage = getStorage();
  storage.setItem('accessToken', accessToken);
  if (refreshToken) {
    storage.setItem('refreshToken', refreshToken);
  }
  if (expiresIn) {
    const expiry = Date.now() + expiresIn * 1000;
    storage.setItem('tokenExpiry', String(expiry));
  }
};

// Helper to clear all auth data from both storages
const clearAuthStorage = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('tokenExpiry');
  sessionStorage.removeItem('user');
};

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Function to refresh access token
const refreshAccessToken = async (): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} | null> => {
  const { refreshToken } = getStoredTokens();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.success && data.data) {
      return {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        expiresIn: data.data.expiresIn,
      };
    }

    return null;
  } catch {
    return null;
  }
};

// Custom base query with token handling
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Get token from Redux state or storage
    const state = getState() as RootState;
    const { accessToken } = getStoredTokens();
    const token = state.auth?.token || accessToken;

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    // Allow multipart/form-data requests to control their own Content-Type
    // If a request sets this flag, we skip forcing JSON so the browser can set a proper boundary
    const skipJsonContentType = headers.get('X-Skip-Json-Content-Type') === 'true';
    if (!skipJsonContentType) {
      headers.set('Content-Type', 'application/json');
    }

    return headers;
  },
});

// Base query with error handling and token refresh
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Wait if a refresh is in progress
  await refreshMutex.waitForUnlock();

  const { accessToken, refreshToken } = getStoredTokens();

  // Proactive refresh: If access token expires soon and we have a refresh token
  if (accessToken && refreshToken && willTokenExpireSoon(accessToken, 60)) {
    if (!refreshMutex.isLocked()) {
      const release = await refreshMutex.acquire();
      try {
        // Double-check after acquiring lock
        const currentTokens = getStoredTokens();
        if (currentTokens.accessToken && willTokenExpireSoon(currentTokens.accessToken, 60)) {
          const newTokens = await refreshAccessToken();
          if (newTokens) {
            saveTokens(newTokens.accessToken, newTokens.refreshToken, newTokens.expiresIn);
            api.dispatch(
              tokenRefreshed({
                token: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
                expiresIn: newTokens.expiresIn,
              })
            );
          } else {
            // Refresh failed - clear auth and redirect
            clearAuthStorage();
            api.dispatch(logout());
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return {
              error: { status: 401, data: { message: 'Session expired' } } as FetchBaseQueryError,
            };
          }
        }
      } finally {
        release();
      }
    } else {
      // Wait for ongoing refresh
      await refreshMutex.waitForUnlock();
    }
  }

  // Make the actual request
  let result = await baseQuery(args, api, extraOptions);

  // Reactive refresh: Handle 401 errors
  if (result.error && result.error.status === 401) {
    const { refreshToken: currentRefreshToken } = getStoredTokens();

    if (currentRefreshToken) {
      if (!refreshMutex.isLocked()) {
        const release = await refreshMutex.acquire();
        try {
          const newTokens = await refreshAccessToken();
          if (newTokens) {
            saveTokens(newTokens.accessToken, newTokens.refreshToken, newTokens.expiresIn);
            api.dispatch(
              tokenRefreshed({
                token: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
                expiresIn: newTokens.expiresIn,
              })
            );
            // Retry the original request with new token
            result = await baseQuery(args, api, extraOptions);
          } else {
            // Refresh failed - clear auth and redirect
            clearAuthStorage();
            api.dispatch(logout());
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        } finally {
          release();
        }
      } else {
        // Wait for ongoing refresh, then retry
        await refreshMutex.waitForUnlock();
        result = await baseQuery(args, api, extraOptions);
      }
    } else {
      // No refresh token - clear auth and redirect
      clearAuthStorage();
      api.dispatch(logout());
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
  }

  return result;
};

// Create base API with RTK Query
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'Customers',
    'DesignPhase',
    'Designers',
    'Designer',
    'Production',
    'CustomTask',
    'TaskGroup',
    'ProductionIssue',
    'Products',
    'Categories',
    'Brands',
    'Materials',
    'InnerPanels',
    'Accessories',
    'Cabinets',
    'Doors',
    'Lighting',
    'Quotations',
    'Projects',
    'Payments',
    'Dashboard',
    'Architects',
    'ArchitectVisits',
    'Tasks',
    'WarrantyCard',
    'WarrantyComponents',
    'Staff',
  ],
  endpoints: (builder) => ({
    // ==================== QUOTATION ENDPOINTS ====================

    // Get all quotations with filters
    getQuotations: builder.query<any, any>({
      query: (filters) => {
        const params = new URLSearchParams();

        if (filters.customerId) params.append('customerId', filters.customerId.toString());
        if (filters.status) params.append('status', filters.status);
        if (filters.customerName) params.append('customerName', filters.customerName);
        if (filters.fromDate) params.append('fromDate', filters.fromDate);
        if (filters.toDate) params.append('toDate', filters.toDate);
        if (filters.page !== undefined) params.append('page', filters.page.toString());
        if (filters.size !== undefined) params.append('size', filters.size.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortDir) params.append('sortDir', filters.sortDir);

        return {
          url: '/quotations',
          params: Object.fromEntries(params),
        };
      },
      transformResponse: (response: any) => response?.data ?? { content: [], totalElements: 0, totalPages: 0 },
      providesTags: ['Quotations'],
    }),

    // Get quotation statistics
    getQuotationStatistics: builder.query<any, void>({
      query: () => '/quotations/statistics',
      providesTags: ['Quotations'],
    }),

    // Get quotation by ID
    getQuotationById: builder.query<any, number>({
      query: (id) => `/quotations/${id}`,
      transformResponse: (response: any) => {
        console.log('Raw API response for getQuotationById:', response);
        // Backend returns ApiResponse<QuotationDto>, so extract the data
        return response?.data || response;
      },
      providesTags: (_result, _error, id) => [{ type: 'Quotations', id }],
    }),

    // Get quotations by customer
    getQuotationsByCustomer: builder.query<any, number>({
      query: (customerId) => `/quotations/customer/${customerId}`,
      providesTags: (_result, _error, customerId) => [
        { type: 'Quotations', id: `customer-${customerId}` }
      ],
    }),

    // Search quotations
    searchQuotations: builder.query<any, string>({
      query: (searchTerm) => `/quotations/search?q=${encodeURIComponent(searchTerm)}`,
      providesTags: ['Quotations'],
    }),

    // Create quotation
    createQuotation: builder.mutation<any, any>({
      query: (quotation) => ({
        url: '/quotations',
        method: 'POST',
        body: quotation,
      }),
      invalidatesTags: ['Quotations'],
    }),

    // Update quotation
    updateQuotation: builder.mutation<any, any>({
      query: ({ id, ...quotation }) => ({
        url: `/quotations/${id}`,
        method: 'PUT',
        body: quotation,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Quotations', id },
        'Quotations',
      ],
    }),

    // Delete quotation (SUPER_ADMIN only)
    deleteQuotation: builder.mutation<any, number>({
      query: (id) => ({
        url: `/quotations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Quotations'],
    }),

    // Update quotation status (SUPER_ADMIN only)
    updateQuotationStatus: builder.mutation<any, { id: number; status: string }>({
      query: ({ id, status }) => ({
        url: `/quotations/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Quotations', id },
        'Quotations',
      ],
    }),

    // Duplicate quotation
    duplicateQuotation: builder.mutation<any, number>({
      query: (id) => ({
        url: `/quotations/${id}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: ['Quotations'],
    }),

    // ==================== QUOTATION FOLDER ENDPOINTS ====================

    // Folders (one per quotation, holding all its versions)
    getQuotationFolders: builder.query<any, { customerName?: string; page?: number; size?: number }>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params.customerName) search.append('customerName', params.customerName);
        if (params.page !== undefined) search.append('page', params.page.toString());
        if (params.size !== undefined) search.append('size', params.size.toString());
        return { url: '/quotations/folders', params: Object.fromEntries(search) };
      },
      transformResponse: (response: any) => response?.data ?? { content: [], totalElements: 0, totalPages: 0 },
      providesTags: ['Quotations'],
    }),

    // Versions inside a folder (newest version first)
    getFolderVersions: builder.query<any, number>({
      query: (folderId) => `/quotations/folders/${folderId}/versions`,
      transformResponse: (response: any) => response?.data ?? [],
      providesTags: ['Quotations'],
    }),

    // Rename a folder
    renameQuotationFolder: builder.mutation<any, { id: number; name: string }>({
      query: ({ id, name }) => ({
        url: `/quotations/folders/${id}`,
        method: 'PUT',
        body: { name },
      }),
      invalidatesTags: ['Quotations'],
    }),

    // Delete a folder and ALL versions inside it
    deleteQuotationFolder: builder.mutation<any, number>({
      query: (id) => ({
        url: `/quotations/folders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Quotations'],
    }),

    // Download quotation PDF
    downloadQuotationPDF: builder.mutation<Blob, number>({
      query: (id) => ({
        url: `/quotations/${id}/pdf`,
        method: 'GET',
        headers: { accept: 'application/pdf, application/json' },
        // Force blob parsing to avoid JSON parser errors
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Download quotation bill PDF (SUPER_ADMIN only)
    downloadQuotationBillPDF: builder.mutation<Blob, number>({
      query: (id) => ({
        url: `/quotations/${id}/bill/pdf`,
        method: 'GET',
        headers: { accept: 'application/pdf, application/json' },
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Get available plan images for a customer
    getCustomerAvailablePlanImages: builder.query<any, number>({
      query: (customerId) => `/quotations/customers/${customerId}/available-plan-images`,
      transformResponse: (response: any) => response?.data || { planImages: [], designFiles: [] },
      providesTags: (result, error, customerId) => [
        { type: 'Quotations', id: `plan-images-${customerId}` },
      ],
    }),

    // Upload plan image for a customer
    uploadPlanImage: builder.mutation<any, { customerId: number; file: File; imageType: string; description?: string }>({
      query: ({ customerId, file, imageType, description }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('customerId', customerId.toString());
        formData.append('imageType', imageType);
        if (description) {
          formData.append('description', description);
        }
        return {
          url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/customers/plan-images/upload`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'Quotations', id: `plan-images-${customerId}` },
      ],
    }),
  }),
});

// Export hooks
export const {
  useGetQuotationsQuery,
  useGetQuotationStatisticsQuery,
  useGetQuotationByIdQuery,
  useGetQuotationsByCustomerQuery,
  useSearchQuotationsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useUpdateQuotationStatusMutation,
  useDuplicateQuotationMutation,
  useGetQuotationFoldersQuery,
  useGetFolderVersionsQuery,
  useRenameQuotationFolderMutation,
  useDeleteQuotationFolderMutation,
  useDownloadQuotationPDFMutation,
  useDownloadQuotationBillPDFMutation,
  useGetCustomerAvailablePlanImagesQuery,
  useUploadPlanImageMutation,
} = baseApi;

export default baseApi;
