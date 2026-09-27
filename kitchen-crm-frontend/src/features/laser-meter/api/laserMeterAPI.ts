/**
 * RTK Query endpoints for the laser meter module: site measurements (step 2), adapters and
 * Device Lab logs (admin).
 */

import { baseApi } from '@/app/baseApi';
import { API_ENDPOINTS } from '@/services/endpoints';
import type { ApiResponse } from '@/types/api.types';
import type { MeasurementValue } from '../core/measurementSession';
import type { RoomLayout } from '../core/guidedSequence';
import type { LaserAdapterConfig } from '../core/types';

/** An adapter row as the server returns it. `config` is the JSON the app runs on. */
export interface LaserAdapterRecord {
  id: number;
  adapterKey: string;
  displayName: string;
  active: boolean;
  config: LaserAdapterConfig;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** The columns are the source of truth for id/name/active; the JSON carries the rest. */
export const recordToConfig = (r: LaserAdapterRecord): LaserAdapterConfig => ({
  ...r.config,
  id: r.adapterKey,
  displayName: r.displayName,
  active: r.active,
});

export interface LaserAdapterWrite {
  adapterKey: string;
  displayName: string;
  active: boolean;
  config: LaserAdapterConfig;
}

export interface LaserAdapterAuditRecord {
  id: number;
  adapterId: number | null;
  adapterKey: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  beforeConfig: LaserAdapterConfig | null;
  afterConfig: LaserAdapterConfig | null;
  actorEmail: string | null;
  actorName: string | null;
  createdAt: string | null;
}

export interface DeviceLabLogRecord {
  id: number;
  title: string;
  deviceName: string | null;
  adapterKey: string | null;
  notes: string | null;
  entryCount: number;
  log?: Record<string, unknown> | null;
  createdBy: string | null;
  createdAt: string | null;
}

export interface SiteMeasurementRecord {
  customerId: number;
  layout: RoomLayout | null;
  notes: string | null;
  values: MeasurementValue[];
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface SiteMeasurementSave {
  customerId: number;
  layout: RoomLayout;
  notes?: string | null;
  values: MeasurementValue[];
}

// The API calls the field key `key` and omits nothing, so values map 1:1.
const fromApi = (r: SiteMeasurementRecord): SiteMeasurementRecord => ({
  ...r,
  values: (r.values ?? []).map((v) => ({
    key: v.key,
    valueMm: v.valueMm,
    source: v.source,
    deviceAdapterId: v.deviceAdapterId ?? null,
    raw: v.raw ?? null,
    capturedAt: v.capturedAt,
    editedAfterCapture: !!v.editedAfterCapture,
  })),
});

export const laserMeterAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Active adapters for surveyors; cached client-side by the registry for offline use. */
    getActiveLaserAdapters: builder.query<LaserAdapterConfig[], void>({
      query: () => API_ENDPOINTS.LASER_METER.ADAPTERS_ACTIVE,
      transformResponse: (response: ApiResponse<LaserAdapterRecord[]>) =>
        (response.data ?? []).map(recordToConfig),
      providesTags: [{ type: 'LaserAdapters', id: 'ACTIVE' }],
    }),

    // ---------------------------------------------------------------- admin: adapters

    getLaserAdapters: builder.query<LaserAdapterRecord[], void>({
      query: () => API_ENDPOINTS.LASER_METER.ADAPTERS,
      transformResponse: (response: ApiResponse<LaserAdapterRecord[]>) => response.data ?? [],
      providesTags: [{ type: 'LaserAdapters', id: 'LIST' }],
    }),

    createLaserAdapter: builder.mutation<LaserAdapterRecord, LaserAdapterWrite>({
      query: (body) => ({ url: API_ENDPOINTS.LASER_METER.ADAPTERS, method: 'POST', body }),
      transformResponse: (response: ApiResponse<LaserAdapterRecord>) => response.data as LaserAdapterRecord,
      invalidatesTags: [
        { type: 'LaserAdapters', id: 'LIST' },
        { type: 'LaserAdapters', id: 'ACTIVE' },
        { type: 'LaserAdapters', id: 'AUDIT' },
      ],
    }),

    updateLaserAdapter: builder.mutation<LaserAdapterRecord, LaserAdapterWrite & { id: number }>({
      query: ({ id, ...body }) => ({ url: API_ENDPOINTS.LASER_METER.ADAPTER_BY_ID(id), method: 'PUT', body }),
      transformResponse: (response: ApiResponse<LaserAdapterRecord>) => response.data as LaserAdapterRecord,
      invalidatesTags: [
        { type: 'LaserAdapters', id: 'LIST' },
        { type: 'LaserAdapters', id: 'ACTIVE' },
        { type: 'LaserAdapters', id: 'AUDIT' },
      ],
    }),

    deleteLaserAdapter: builder.mutation<void, number>({
      query: (id) => ({ url: API_ENDPOINTS.LASER_METER.ADAPTER_BY_ID(id), method: 'DELETE' }),
      invalidatesTags: [
        { type: 'LaserAdapters', id: 'LIST' },
        { type: 'LaserAdapters', id: 'ACTIVE' },
        { type: 'LaserAdapters', id: 'AUDIT' },
      ],
    }),

    getLaserAdapterAudit: builder.query<LaserAdapterAuditRecord[], number | void>({
      query: (id) => (typeof id === 'number' ? API_ENDPOINTS.LASER_METER.ADAPTER_AUDIT(id) : API_ENDPOINTS.LASER_METER.AUDIT),
      transformResponse: (response: ApiResponse<LaserAdapterAuditRecord[]>) => response.data ?? [],
      providesTags: [{ type: 'LaserAdapters', id: 'AUDIT' }],
    }),

    // ---------------------------------------------------------------- admin: device lab logs

    getDeviceLabLogs: builder.query<DeviceLabLogRecord[], void>({
      query: () => API_ENDPOINTS.LASER_METER.LAB_LOGS,
      transformResponse: (response: ApiResponse<DeviceLabLogRecord[]>) => response.data ?? [],
      providesTags: [{ type: 'DeviceLabLogs', id: 'LIST' }],
    }),

    getDeviceLabLog: builder.query<DeviceLabLogRecord, number>({
      query: (id) => API_ENDPOINTS.LASER_METER.LAB_LOG_BY_ID(id),
      transformResponse: (response: ApiResponse<DeviceLabLogRecord>) => response.data as DeviceLabLogRecord,
    }),

    saveDeviceLabLog: builder.mutation<
      DeviceLabLogRecord,
      { title: string; deviceName?: string | null; adapterKey?: string | null; notes?: string | null; log: Record<string, unknown> }
    >({
      query: (body) => ({ url: API_ENDPOINTS.LASER_METER.LAB_LOGS, method: 'POST', body }),
      transformResponse: (response: ApiResponse<DeviceLabLogRecord>) => response.data as DeviceLabLogRecord,
      invalidatesTags: [{ type: 'DeviceLabLogs', id: 'LIST' }],
    }),

    // ---------------------------------------------------------------- site measurements

    getSiteMeasurement: builder.query<SiteMeasurementRecord, number>({
      query: (customerId) => API_ENDPOINTS.SITE_MEASUREMENTS.BY_CUSTOMER(customerId),
      transformResponse: (response: ApiResponse<SiteMeasurementRecord>) =>
        fromApi(response.data as SiteMeasurementRecord),
      providesTags: (_r, _e, customerId) => [{ type: 'SiteMeasurements', id: customerId }],
    }),

    saveSiteMeasurement: builder.mutation<SiteMeasurementRecord, SiteMeasurementSave>({
      query: ({ customerId, ...body }) => ({
        url: API_ENDPOINTS.SITE_MEASUREMENTS.BY_CUSTOMER(customerId),
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiResponse<SiteMeasurementRecord>) =>
        fromApi(response.data as SiteMeasurementRecord),
      invalidatesTags: (_r, _e, { customerId }) => [{ type: 'SiteMeasurements', id: customerId }],
    }),
  }),
});

export const {
  useGetLaserAdaptersQuery,
  useCreateLaserAdapterMutation,
  useUpdateLaserAdapterMutation,
  useDeleteLaserAdapterMutation,
  useGetLaserAdapterAuditQuery,
  useGetDeviceLabLogsQuery,
  useLazyGetDeviceLabLogQuery,
  useSaveDeviceLabLogMutation,
  useGetActiveLaserAdaptersQuery,
  useGetSiteMeasurementQuery,
  useSaveSiteMeasurementMutation,
} = laserMeterAPI;
