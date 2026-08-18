/**
 * Activity log API — Settings > Activity Log (SUPER_ADMIN only).
 */

import { baseApi } from '../../app/baseApi';

export interface ActivityLogRow {
  id: number;
  eventType: 'LOGIN' | 'LOGIN_FAILED' | 'LOGOUT' | 'ACTION';
  actorEmail?: string;
  actorName?: string;
  actorRole?: string;
  module?: string;
  httpMethod?: string;
  summary?: string;
  statusCode?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ActivityLogPage {
  content: ActivityLogRow[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface ActivityStats {
  total: number;
  byEvent: Record<string, number>;
  byModule: Record<string, number>;
}

export interface LoginSummary {
  email: string;
  name?: string;
  lastLogin?: string;
  loginCount: number;
  distinctIpCount: number;
  recentIps: string[];
}

export interface ActivityLogParams {
  eventType?: string;
  module?: string;
  actor?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export const activityAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActivityLogs: builder.query<ActivityLogPage, ActivityLogParams>({
      query: (params) => ({
        url: '/activity-logs',
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
      }),
      transformResponse: (r: any) => r?.data ?? { content: [], totalElements: 0, totalPages: 0, number: 0 },
      providesTags: [{ type: 'Dashboard', id: 'ACTIVITY' }],
    }),
    getActivityStats: builder.query<ActivityStats, Omit<ActivityLogParams, 'page' | 'size' | 'eventType'>>({
      query: (params) => ({
        url: '/activity-logs/stats',
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
      }),
      transformResponse: (r: any) => r?.data ?? { total: 0, byEvent: {}, byModule: {} },
      providesTags: [{ type: 'Dashboard', id: 'ACTIVITY' }],
    }),
    getLoginSummary: builder.query<LoginSummary[], void>({
      query: () => '/activity-logs/login-summary',
      transformResponse: (r: any) => r?.data ?? [],
      providesTags: [{ type: 'Dashboard', id: 'ACTIVITY' }],
    }),
  }),
});

export const { useGetActivityLogsQuery, useGetActivityStatsQuery, useGetLoginSummaryQuery } = activityAPI;
