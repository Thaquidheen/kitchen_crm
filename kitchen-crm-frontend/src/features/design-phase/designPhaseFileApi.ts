/**
 * Design Phase File API integration
 * Handles all design file upload and management API calls
 */

import { baseApi } from '../../app/baseApi';
import { API_ENDPOINTS } from '../../services/endpoints';
import type {
  DesignPhaseFile,
  DesignPhaseApiResponse,
} from './types';

export const designPhaseFileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Upload design file
    uploadDesignFile: builder.mutation<
      DesignPhaseApiResponse<DesignPhaseFile>,
      { formData: FormData }
    >({
      query: ({ formData }) => ({
        url: API_ENDPOINTS.DESIGN_PHASE_FILES.UPLOAD,
        method: 'POST',
        body: formData,
        // Signal baseApi to not force application/json so the browser sets multipart boundary
        headers: { 'X-Skip-Json-Content-Type': 'true' },
      }),
      invalidatesTags: ['DesignPhase'],
    }),

    // Get files by design phase
    getDesignPhaseFiles: builder.query<
      DesignPhaseApiResponse<DesignPhaseFile[]>,
      number
    >({
      query: (designPhaseId) => ({
        url: API_ENDPOINTS.DESIGN_PHASE_FILES.BY_DESIGN_PHASE(designPhaseId),
        method: 'GET',
      }),
      providesTags: (_result, _error, designPhaseId) => [
        { type: 'DesignPhase', id: `files-${designPhaseId}` },
      ],
    }),

    // Get files by customer
    getDesignFilesByCustomer: builder.query<
      DesignPhaseApiResponse<DesignPhaseFile[]>,
      number
    >({
      query: (customerId) => ({
        url: API_ENDPOINTS.DESIGN_PHASE_FILES.BY_CUSTOMER(customerId),
        method: 'GET',
      }),
      providesTags: (_result, _error, customerId) => [
        { type: 'DesignPhase', id: `customer-files-${customerId}` },
      ],
    }),

    // Get files by category
    getDesignFilesByCategory: builder.query<
      DesignPhaseApiResponse<DesignPhaseFile[]>,
      { designPhaseId: number; category: string }
    >({
      query: ({ designPhaseId, category }) => ({
        url: API_ENDPOINTS.DESIGN_PHASE_FILES.BY_CATEGORY(designPhaseId, category),
        method: 'GET',
      }),
      providesTags: (_result, _error, { designPhaseId, category }) => [
        { type: 'DesignPhase', id: `files-${designPhaseId}-${category}` },
      ],
    }),

    // Get file by ID
    getDesignFileById: builder.query<
      DesignPhaseApiResponse<DesignPhaseFile>,
      number
    >({
      query: (id) => ({
        url: API_ENDPOINTS.DESIGN_PHASE_FILES.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [
        { type: 'DesignPhase', id: `file-${id}` },
      ],
    }),

    // Delete file
    deleteDesignFile: builder.mutation<
      DesignPhaseApiResponse<string>,
      number
    >({
      query: (id) => ({
        url: API_ENDPOINTS.DESIGN_PHASE_FILES.DELETE(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['DesignPhase'],
    }),

    // Update file info
    updateDesignFileInfo: builder.mutation<
      DesignPhaseApiResponse<DesignPhaseFile>,
      { id: number; data: Partial<DesignPhaseFile> }
    >({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.DESIGN_PHASE_FILES.UPDATE(id),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DesignPhase', id: `file-${id}` },
        'DesignPhase',
      ],
    }),

    // Get file categories
    getFileCategories: builder.query<
      DesignPhaseApiResponse<string[]>,
      void
    >({
      query: () => ({
        url: API_ENDPOINTS.DESIGN_PHASE_FILES.FILE_CATEGORIES,
        method: 'GET',
      }),
    }),
  }),
});

// Export hooks for use in components
export const {
  useUploadDesignFileMutation,
  useGetDesignPhaseFilesQuery,
  useGetDesignFilesByCustomerQuery,
  useGetDesignFilesByCategoryQuery,
  useGetDesignFileByIdQuery,
  useDeleteDesignFileMutation,
  useUpdateDesignFileInfoMutation,
  useGetFileCategoriesQuery,
} = designPhaseFileApi;
