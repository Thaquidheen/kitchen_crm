/**
 * Lighting API
 * RTK Query API for managing lighting products
 *
 * Delete mutations return the raw ApiResponse (not just .data) so managers can surface the
 * 200-with-success:false "in use" refusal with the server's message.
 */

import { baseApi } from '../../app/baseApi';
import type { LightProfile, Driver, Connector, Sensor, ApiResponse } from './types';

export const lightingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Light Profiles
    getLightProfiles: builder.query<LightProfile[], void>({
      query: () => '/lighting/profiles',
      providesTags: ['Lighting'],
      transformResponse: (response: any) => (response?.success && Array.isArray(response.data))
        ? response.data.map((p: any) => ({
            ...p,
            pricePerMeter: p?.pricePerMeter != null ? Number(p.pricePerMeter) : 0,
            mrp: p?.mrp != null ? Number(p.mrp) : 0,
            discountPercentage: p?.discountPercentage != null ? Number(p.discountPercentage) : 0,
            companyPrice: p?.companyPrice != null ? Number(p.companyPrice) : undefined,
          }))
        : [],
    }),

    createLightProfile: builder.mutation<LightProfile, Omit<LightProfile, 'id'>>({
      query: (body) => ({
        url: '/lighting/profiles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Lighting'],
      transformResponse: (response: any) => ({
        ...response.data,
        pricePerMeter: response.data?.pricePerMeter != null ? Number(response.data.pricePerMeter) : 0,
        mrp: response.data?.mrp != null ? Number(response.data.mrp) : 0,
        discountPercentage: response.data?.discountPercentage != null ? Number(response.data.discountPercentage) : 0,
        companyPrice: response.data?.companyPrice != null ? Number(response.data.companyPrice) : undefined,
      }),
    }),

    updateLightProfile: builder.mutation<LightProfile, LightProfile>({
      query: ({ id, ...body }) => ({
        url: `/lighting/profiles/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Lighting'],
      transformResponse: (response: any) => ({
        ...response.data,
        pricePerMeter: response.data?.pricePerMeter != null ? Number(response.data.pricePerMeter) : 0,
        mrp: response.data?.mrp != null ? Number(response.data.mrp) : 0,
        discountPercentage: response.data?.discountPercentage != null ? Number(response.data.discountPercentage) : 0,
        companyPrice: response.data?.companyPrice != null ? Number(response.data.companyPrice) : undefined,
      }),
    }),

    deleteLightProfile: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: `/lighting/profiles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Lighting'],
    }),

    // Drivers
    getDrivers: builder.query<Driver[], void>({
      query: () => '/lighting/drivers',
      providesTags: ['Lighting'],
      transformResponse: (response: any) => (response?.success && Array.isArray(response.data))
        ? response.data.map((d: any) => ({
            ...d,
            price: d?.price != null ? Number(d.price) : 0,
            mrp: d?.mrp != null ? Number(d.mrp) : 0,
            discountPercentage: d?.discountPercentage != null ? Number(d.discountPercentage) : 0,
            companyPrice: d?.companyPrice != null ? Number(d.companyPrice) : undefined,
          }))
        : [],
    }),

    createDriver: builder.mutation<Driver, Omit<Driver, 'id'>>({
      query: (body) => ({
        url: '/lighting/drivers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Lighting'],
      transformResponse: (response: any) => ({
        ...response.data,
        price: response.data?.price != null ? Number(response.data.price) : 0,
        mrp: response.data?.mrp != null ? Number(response.data.mrp) : 0,
        discountPercentage: response.data?.discountPercentage != null ? Number(response.data.discountPercentage) : 0,
        companyPrice: response.data?.companyPrice != null ? Number(response.data.companyPrice) : undefined,
      }),
    }),

    updateDriver: builder.mutation<Driver, Driver>({
      query: ({ id, ...body }) => ({
        url: `/lighting/drivers/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Lighting'],
      transformResponse: (response: any) => ({
        ...response.data,
        price: response.data?.price != null ? Number(response.data.price) : 0,
        mrp: response.data?.mrp != null ? Number(response.data.mrp) : 0,
        discountPercentage: response.data?.discountPercentage != null ? Number(response.data.discountPercentage) : 0,
        companyPrice: response.data?.companyPrice != null ? Number(response.data.companyPrice) : undefined,
      }),
    }),

    deleteDriver: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: `/lighting/drivers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Lighting'],
    }),

    // Connectors
    getConnectors: builder.query<Connector[], void>({
      query: () => '/lighting/connectors',
      providesTags: ['Lighting'],
      transformResponse: (response: any) => (response?.success && Array.isArray(response.data))
        ? response.data.map((c: any) => ({
            ...c,
            pricePerPiece: c?.pricePerPiece != null ? Number(c.pricePerPiece) : 0,
            mrp: c?.mrp != null ? Number(c.mrp) : 0,
            discountPercentage: c?.discountPercentage != null ? Number(c.discountPercentage) : 0,
            companyPrice: c?.companyPrice != null ? Number(c.companyPrice) : undefined,
          }))
        : [],
    }),

    createConnector: builder.mutation<Connector, Omit<Connector, 'id'>>({
      query: (body) => ({
        url: '/lighting/connectors',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Lighting'],
      transformResponse: (response: any) => ({
        ...response.data,
        pricePerPiece: response.data?.pricePerPiece != null ? Number(response.data.pricePerPiece) : 0,
        mrp: response.data?.mrp != null ? Number(response.data.mrp) : 0,
        discountPercentage: response.data?.discountPercentage != null ? Number(response.data.discountPercentage) : 0,
        companyPrice: response.data?.companyPrice != null ? Number(response.data.companyPrice) : undefined,
      }),
    }),

    updateConnector: builder.mutation<Connector, Connector>({
      query: ({ id, ...body }) => ({
        url: `/lighting/connectors/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Lighting'],
      transformResponse: (response: any) => ({
        ...response.data,
        pricePerPiece: response.data?.pricePerPiece != null ? Number(response.data.pricePerPiece) : 0,
        mrp: response.data?.mrp != null ? Number(response.data.mrp) : 0,
        discountPercentage: response.data?.discountPercentage != null ? Number(response.data.discountPercentage) : 0,
        companyPrice: response.data?.companyPrice != null ? Number(response.data.companyPrice) : undefined,
      }),
    }),

    deleteConnector: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: `/lighting/connectors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Lighting'],
    }),

    // Sensors
    getSensors: builder.query<Sensor[], void>({
      query: () => '/lighting/sensors',
      providesTags: ['Lighting'],
      transformResponse: (response: any) => (response?.success && Array.isArray(response.data))
        ? response.data.map((s: any) => ({
            ...s,
            pricePerPiece: s?.pricePerPiece != null ? Number(s.pricePerPiece) : 0,
            mrp: s?.mrp != null ? Number(s.mrp) : 0,
            discountPercentage: s?.discountPercentage != null ? Number(s.discountPercentage) : 0,
            companyPrice: s?.companyPrice != null ? Number(s.companyPrice) : undefined,
          }))
        : [],
    }),

    createSensor: builder.mutation<Sensor, Omit<Sensor, 'id'>>({
      query: (body) => ({
        url: '/lighting/sensors',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Lighting'],
      transformResponse: (response: any) => ({
        ...response.data,
        pricePerPiece: response.data?.pricePerPiece != null ? Number(response.data.pricePerPiece) : 0,
        mrp: response.data?.mrp != null ? Number(response.data.mrp) : 0,
        discountPercentage: response.data?.discountPercentage != null ? Number(response.data.discountPercentage) : 0,
        companyPrice: response.data?.companyPrice != null ? Number(response.data.companyPrice) : undefined,
      }),
    }),

    updateSensor: builder.mutation<Sensor, Sensor>({
      query: ({ id, ...body }) => ({
        url: `/lighting/sensors/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Lighting'],
      transformResponse: (response: any) => ({
        ...response.data,
        pricePerPiece: response.data?.pricePerPiece != null ? Number(response.data.pricePerPiece) : 0,
        mrp: response.data?.mrp != null ? Number(response.data.mrp) : 0,
        discountPercentage: response.data?.discountPercentage != null ? Number(response.data.discountPercentage) : 0,
        companyPrice: response.data?.companyPrice != null ? Number(response.data.companyPrice) : undefined,
      }),
    }),

    deleteSensor: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: `/lighting/sensors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Lighting'],
    }),
  }),
});

export const {
  useGetLightProfilesQuery,
  useCreateLightProfileMutation,
  useUpdateLightProfileMutation,
  useDeleteLightProfileMutation,
  useGetDriversQuery,
  useCreateDriverMutation,
  useUpdateDriverMutation,
  useDeleteDriverMutation,
  useGetConnectorsQuery,
  useCreateConnectorMutation,
  useUpdateConnectorMutation,
  useDeleteConnectorMutation,
  useGetSensorsQuery,
  useCreateSensorMutation,
  useUpdateSensorMutation,
  useDeleteSensorMutation,
} = lightingApi;
