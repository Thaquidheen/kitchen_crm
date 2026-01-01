import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../app/store';
import type { MarginsData, ApiResponse } from './settingsAPI.types';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/settings`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.token || localStorage.getItem('accessToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export interface CompanySettings {
  'company.name': string;
  'company.tagline': string;
  'company.address_line1': string;
  'company.address_line2': string;
  'company.phone': string;
  'company.email': string;
  'company.website': string;
  'quotation.terms.general': string;
  'quotation.terms.warranty': string;
}

export interface DashboardSettings {
  'dashboard.pagePadding': string;
  'dashboard.headerMarginBottom': string;
  'dashboard.headerGap': string;
  'dashboard.iconSize': string;
  'dashboard.titleSize': string;
  'dashboard.subtitleSize': string;
  'dashboard.buttonGap': string;
  'dashboard.buttonIconSize': string;
  'dashboard.cardPadding': string;
  'dashboard.cardMarginBottom': string;
  'dashboard.sectionMarginBottom': string;
  'dashboard.tabPaddingX': string;
  'dashboard.tabPaddingY': string;
  'dashboard.tabGap': string;
  'dashboard.contentGap': string;
  'dashboard.gridGap': string;
  'dashboard.gridColsMobile': string;
  'dashboard.gridColsDesktop': string;
}

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery,
  tagTypes: ['Margins', 'CompanySettings', 'DashboardSettings'],
  endpoints: (builder) => ({
    getMargins: builder.query<ApiResponse<MarginsData>, void>({
      query: () => '/margins',
      providesTags: ['Margins'],
    }),
    updateMargins: builder.mutation<ApiResponse<string>, MarginsData>({
      query: (margins) => ({
        url: '/margins',
        method: 'PUT',
        body: margins,
      }),
      invalidatesTags: ['Margins'],
    }),
    getCompanySettings: builder.query<ApiResponse<CompanySettings>, void>({
      query: () => '/company',
      providesTags: ['CompanySettings'],
    }),
    updateCompanySettings: builder.mutation<ApiResponse<string>, CompanySettings>({
      query: (settings) => ({
        url: '/company',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['CompanySettings'],
    }),
    getDashboardSettings: builder.query<ApiResponse<DashboardSettings>, void>({
      query: () => '/dashboard',
      providesTags: ['DashboardSettings'],
    }),
    updateDashboardSettings: builder.mutation<ApiResponse<string>, DashboardSettings>({
      query: (settings) => ({
        url: '/dashboard',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['DashboardSettings'],
    }),
  }),
});

export const { 
  useGetMarginsQuery, 
  useUpdateMarginsMutation,
  useGetCompanySettingsQuery,
  useUpdateCompanySettingsMutation,
  useGetDashboardSettingsQuery,
  useUpdateDashboardSettingsMutation,
} = settingsApi;

// Re-export types for convenience
export type { MarginsData, ApiResponse } from './settingsAPI.types';

