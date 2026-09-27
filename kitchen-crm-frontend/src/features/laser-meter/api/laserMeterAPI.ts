/**
 * RTK Query endpoints for the laser meter module: site measurements (step 2), adapters and
 * Device Lab logs (admin).
 */

import { baseApi } from '@/app/baseApi';
import { API_ENDPOINTS } from '@/services/endpoints';
import type { ApiResponse } from '@/types/api.types';
import type { MeasurementValue } from '../core/measurementSession';
import type { RoomLayout } from '../core/guidedSequence';

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

export const { useGetSiteMeasurementQuery, useSaveSiteMeasurementMutation } = laserMeterAPI;
