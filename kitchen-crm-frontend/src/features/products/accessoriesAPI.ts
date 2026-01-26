/**
 * Accessories API
 * RTK Query API for managing accessories
 */

import { baseApi } from '../../app/baseApi';
import type { Accessory, ApiResponse, PagedResponse } from './types';

export const accessoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all accessories with pagination and filters
    getAccessories: builder.query<PagedResponse<Accessory>, {
      name?: string;
      categoryId?: number;
      brandId?: number;
      active?: boolean;
      page?: number;
      size?: number;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    }>({
      query: (params) => ({
        url: '/accessories',
        params,
      }),
      providesTags: ['Accessories'],
      transformResponse: (response: any) => {
        // Backend returns ApiResponse<Page<T>>
        // Spring Page has content, totalElements, totalPages, etc.
        const empty = { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0, first: true, last: true } as PagedResponse<Accessory>;
        if (!(response && response.success && response.data)) return empty;
        const page = response.data as PagedResponse<Accessory>;
        const content = Array.isArray(page.content) ? page.content.map((a: any) => ({
          ...a,
          mrp: a?.mrp != null ? Number(a.mrp) : 0,
          discountPercentage: a?.discountPercentage != null ? Number(a.discountPercentage) : 0,
          companyPrice: a?.companyPrice != null ? Number(a.companyPrice) : undefined,
          widthMm: a?.widthMm != null ? Number(a.widthMm) : undefined,
          heightMm: a?.heightMm != null ? Number(a.heightMm) : undefined,
          depthMm: a?.depthMm != null ? Number(a.depthMm) : undefined,
        })) : [];
        return { ...page, content } as PagedResponse<Accessory>;
      },
    }),

    // Get active accessories
    getActiveAccessories: builder.query<Accessory[], void>({
      query: () => '/accessories/active',
      providesTags: ['Accessories'],
      transformResponse: (response: any) => (response?.success && Array.isArray(response.data))
        ? response.data.map((a: any) => ({
            ...a,
            mrp: a?.mrp != null ? Number(a.mrp) : 0,
            discountPercentage: a?.discountPercentage != null ? Number(a.discountPercentage) : 0,
            companyPrice: a?.companyPrice != null ? Number(a.companyPrice) : undefined,
            widthMm: a?.widthMm != null ? Number(a.widthMm) : undefined,
            heightMm: a?.heightMm != null ? Number(a.heightMm) : undefined,
            depthMm: a?.depthMm != null ? Number(a.depthMm) : undefined,
          }))
        : [],
    }),

    // Get accessory by ID
    getAccessoryById: builder.query<Accessory, number>({
      query: (id) => `/accessories/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Accessories', id }],
      transformResponse: (response: any) => ({
        ...response.data,
        mrp: response.data?.mrp != null ? Number(response.data.mrp) : 0,
        discountPercentage: response.data?.discountPercentage != null ? Number(response.data.discountPercentage) : 0,
        companyPrice: response.data?.companyPrice != null ? Number(response.data.companyPrice) : undefined,
        widthMm: response.data?.widthMm != null ? Number(response.data.widthMm) : undefined,
        heightMm: response.data?.heightMm != null ? Number(response.data.heightMm) : undefined,
        depthMm: response.data?.depthMm != null ? Number(response.data.depthMm) : undefined,
      }),
    }),

    // Create accessory
    createAccessory: builder.mutation<Accessory, Omit<Accessory, 'id'>>({
      query: (body) => ({
        url: '/accessories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Accessories'],
      transformResponse: (response: any) => ({
        ...response.data,
        mrp: response.data?.mrp != null ? Number(response.data.mrp) : 0,
        discountPercentage: response.data?.discountPercentage != null ? Number(response.data.discountPercentage) : 0,
        companyPrice: response.data?.companyPrice != null ? Number(response.data.companyPrice) : undefined,
        widthMm: response.data?.widthMm != null ? Number(response.data.widthMm) : undefined,
        heightMm: response.data?.heightMm != null ? Number(response.data.heightMm) : undefined,
        depthMm: response.data?.depthMm != null ? Number(response.data.depthMm) : undefined,
      }),
    }),

    // Update accessory
    updateAccessory: builder.mutation<Accessory, Accessory>({
      query: ({ id, ...body }) => ({
        url: `/accessories/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'Accessories',
        { type: 'Accessories', id },
      ],
      transformResponse: (response: any) => response.data,
    }),

    // Delete accessory
    deleteAccessory: builder.mutation<string, number>({
      query: (id) => ({
        url: `/accessories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Accessories'],
      transformResponse: (response: any) => response.data,
    }),

    // Upload accessory image
    uploadAccessoryImage: builder.mutation<Accessory, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/accessories/${id}/image`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        'Accessories',
        { type: 'Accessories', id },
      ],
      transformResponse: (response: any) => response.data,
    }),
  }),
});

export const {
  useGetAccessoriesQuery,
  useGetActiveAccessoriesQuery,
  useGetAccessoryByIdQuery,
  useCreateAccessoryMutation,
  useUpdateAccessoryMutation,
  useDeleteAccessoryMutation,
  useUploadAccessoryImageMutation,
} = accessoriesApi;
