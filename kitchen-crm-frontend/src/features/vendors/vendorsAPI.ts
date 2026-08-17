// Vendor API using RTK Query

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/vendors`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const VENDOR_TYPES = [
  'MATERIAL_SUPPLIER',
  'LABOR_CONTRACTOR',
  'TRANSPORT_SERVICE',
  'APPLIANCE_VENDOR',
  'OTHER',
] as const;
export type VendorType = (typeof VENDOR_TYPES)[number];

export const VENDOR_TYPE_LABELS: Record<VendorType, string> = {
  MATERIAL_SUPPLIER: 'Material Supplier',
  LABOR_CONTRACTOR: 'Labor Contractor',
  TRANSPORT_SERVICE: 'Transport Service',
  APPLIANCE_VENDOR: 'Appliance Vendor',
  OTHER: 'Other',
};

export const vendorTypeLabel = (t?: string): string =>
  VENDOR_TYPE_LABELS[t as VendorType] ?? (t ? t.replace(/_/g, ' ') : '—');

export interface Vendor {
  id: number;
  vendorName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  vendorType: VendorType;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorPage {
  content: Vendor[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface VendorListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  /** Server-side, matches name / contact person / phone / email. */
  search?: string;
  vendorType?: VendorType;
  /** Omit for all; delete is a soft delete, so the default view should be active-only. */
  active?: boolean;
}

export interface VendorCreate {
  vendorName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  vendorType: string;
  active?: boolean;
  notes?: string;
}

export interface VendorUpdate {
  vendorName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  vendorType?: string;
  active?: boolean;
  notes?: string;
}

export const vendorsApi = createApi({
  reducerPath: 'vendorsApi',
  baseQuery,
  tagTypes: ['Vendor', 'VendorList'],
  endpoints: (builder) => ({
    // Get vendors — paging, sorting and the three server-side filters
    getVendors: builder.query<VendorPage, VendorListParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.size !== undefined) queryParams.append('size', params.size.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortDir) queryParams.append('sortDir', params.sortDir);
        if (params.search) queryParams.append('search', params.search);
        if (params.vendorType) queryParams.append('vendorType', params.vendorType);
        if (params.active !== undefined) queryParams.append('active', String(params.active));
        return { url: queryParams.toString() ? `?${queryParams.toString()}` : '' };
      },
      providesTags: ['VendorList'],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true };
      },
    }),

    // Get active vendors only
    getActiveVendors: builder.query<Vendor[], void>({
      query: () => '/active',
      providesTags: ['VendorList'],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      },
    }),

    // Search vendors
    searchVendors: builder.query<any, { searchTerm: string; page?: number; size?: number; sortBy?: string; sortDir?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        queryParams.append('searchTerm', params.searchTerm);
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.size !== undefined) queryParams.append('size', params.size.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortDir) queryParams.append('sortDir', params.sortDir);
        return { url: `/search?${queryParams.toString()}` };
      },
      providesTags: ['VendorList'],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true };
      },
    }),

    // Get vendor by ID
    getVendorById: builder.query<Vendor, number>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Vendor', id }],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Vendor not found');
      },
    }),

    // Create vendor
    createVendor: builder.mutation<any, VendorCreate>({
      query: (body) => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['VendorList'],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to create vendor');
      },
    }),

    // Update vendor
    updateVendor: builder.mutation<any, { id: number; vendor: VendorUpdate }>({
      query: ({ id, vendor }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: vendor,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Vendor', id }, 'VendorList'],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to update vendor');
      },
    }),

    // Delete vendor
    deleteVendor: builder.mutation<any, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['VendorList'],
      transformResponse: (response: any) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to delete vendor');
      },
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useGetActiveVendorsQuery,
  useSearchVendorsQuery,
  useGetVendorByIdQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} = vendorsApi;






