/**
 * Base API configuration for RTK Query
 * All API slices will extend this base query
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from './store';

// Custom base query with token handling
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  prepareHeaders: (headers, { getState }) => {
    // Get token from Redux state or localStorage
    const state = getState() as RootState;
    const token = state.auth?.token || localStorage.getItem('accessToken');

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
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Token expired - clear auth and redirect to login
    console.error('Unauthorized: Clearing auth state');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');

    // Redirect to login if not already there
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
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
    'Production',
    'CustomTask',
    'TaskGroup',
    'ProductionIssue',
    'Products',
    'Categories',
    'Brands',
    'Materials',
    'Accessories',
    'Cabinets',
    'Doors',
    'Lighting',
    'Quotations',
    'Projects',
    'Payments',
    'Dashboard',
    'Architects',
    'Tasks',
    'WarrantyCard',
    'WarrantyComponents',
    'Staff',
  ],
  endpoints: () => ({}),
});

export default baseApi;
