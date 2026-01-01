import { baseApi } from '../app/baseApi';

export interface WarrantyCard {
  id?: number;
  customerId: number;
  customerName?: string;
  customerEmail?: string;
  projectId?: number;
  projectName?: string;
  certificateNumber?: string;
  issueDate?: string;
  projectCompletionDate?: string;
  projectAddress?: string;
  projectDescription?: string;
  authorizedName?: string;
  authorizedDesignation?: string;
  signatureDate?: string;
  pdfFilePath?: string;
  emailSent?: boolean;
  emailSentAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WarrantyComponent {
  id: number;
  componentName: string;
  warrantyPeriod: string;
  displayOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const warrantyCardAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWarrantyCardByCustomer: builder.query<WarrantyCard, number>({
      query: (customerId) => ({
        url: `/warranty-cards/customer/${customerId}`,
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; data: WarrantyCard; message: string }) => response.data,
      providesTags: (result, error, customerId) => [
        { type: 'WarrantyCard', id: customerId },
      ],
    }),
    getWarrantyCard: builder.query<WarrantyCard, number>({
      query: (id) => ({
        url: `/warranty-cards/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; data: WarrantyCard; message: string }) => response.data,
      providesTags: (result, error, id) => [{ type: 'WarrantyCard', id }],
    }),
    createWarrantyCard: builder.mutation<WarrantyCard, Partial<WarrantyCard>>({
      query: (data) => ({
        url: '/warranty-cards',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: WarrantyCard; message: string }) => response.data,
      invalidatesTags: (result, error, data) => [
        { type: 'WarrantyCard', id: data.customerId },
      ],
    }),
    updateWarrantyCard: builder.mutation<WarrantyCard, { id: number; data: Partial<WarrantyCard> }>({
      query: ({ id, data }) => ({
        url: `/warranty-cards/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: WarrantyCard; message: string }) => response.data,
      invalidatesTags: (result, error, { id, data }) => [
        { type: 'WarrantyCard', id },
        { type: 'WarrantyCard', id: data.customerId },
      ],
    }),
    generatePdf: builder.mutation<string, number>({
      query: (id) => ({
        url: `/warranty-cards/${id}/generate-pdf`,
        method: 'POST',
      }),
      transformResponse: (response: { success: boolean; data: string; message: string }) => response.data,
      invalidatesTags: (result, error, id) => [{ type: 'WarrantyCard', id }],
    }),
    downloadPdf: builder.query<Blob, number>({
      query: (id) => ({
        url: `/warranty-cards/${id}/pdf`,
        responseHandler: async (response) => {
          if (!response.ok) {
            throw new Error('Failed to download PDF');
          }
          return await response.blob();
        },
      }),
    }),
    sendEmail: builder.mutation<string, number>({
      query: (id) => ({
        url: `/warranty-cards/${id}/send-email`,
        method: 'POST',
      }),
      transformResponse: (response: { success: boolean; data: string; message: string }) => response.data,
      invalidatesTags: (result, error, id) => [{ type: 'WarrantyCard', id }],
    }),
    generateCertificateNumber: builder.mutation<string, void>({
      query: () => ({
        url: '/warranty-cards/generate-certificate-number',
        method: 'POST',
      }),
      transformResponse: (response: { success: boolean; data: string; message: string }) => response.data,
    }),
    getActiveWarrantyComponents: builder.query<WarrantyComponent[], void>({
      query: () => ({
        url: '/warranty-components',
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; data: WarrantyComponent[]; message: string }) => response.data,
      providesTags: ['WarrantyComponents'],
    }),
    getAllWarrantyComponents: builder.query<WarrantyComponent[], void>({
      query: () => ({
        url: '/warranty-components/all',
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; data: WarrantyComponent[]; message: string }) => response.data,
      providesTags: ['WarrantyComponents'],
    }),
    createWarrantyComponent: builder.mutation<WarrantyComponent, Partial<WarrantyComponent>>({
      query: (data) => ({
        url: '/warranty-components',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: WarrantyComponent; message: string }) => response.data,
      invalidatesTags: ['WarrantyComponents'],
    }),
    updateWarrantyComponent: builder.mutation<WarrantyComponent, { id: number; data: Partial<WarrantyComponent> }>({
      query: ({ id, data }) => ({
        url: `/warranty-components/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: WarrantyComponent; message: string }) => response.data,
      invalidatesTags: ['WarrantyComponents'],
    }),
    deleteWarrantyComponent: builder.mutation<string, number>({
      query: (id) => ({
        url: `/warranty-components/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: { success: boolean; data: string; message: string }) => response.data,
      invalidatesTags: ['WarrantyComponents'],
    }),
    reorderWarrantyComponents: builder.mutation<string, number[]>({
      query: (orderedIds) => ({
        url: '/warranty-components/reorder',
        method: 'PUT',
        body: orderedIds,
      }),
      transformResponse: (response: { success: boolean; data: string; message: string }) => response.data,
      invalidatesTags: ['WarrantyComponents'],
    }),
  }),
});

export const {
  useGetWarrantyCardByCustomerQuery,
  useGetWarrantyCardQuery,
  useCreateWarrantyCardMutation,
  useUpdateWarrantyCardMutation,
  useGeneratePdfMutation,
  useDownloadPdfQuery,
  useSendEmailMutation,
  useGenerateCertificateNumberMutation,
  useGetActiveWarrantyComponentsQuery,
  useGetAllWarrantyComponentsQuery,
  useCreateWarrantyComponentMutation,
  useUpdateWarrantyComponentMutation,
  useDeleteWarrantyComponentMutation,
  useReorderWarrantyComponentsMutation,
} = warrantyCardAPI;

