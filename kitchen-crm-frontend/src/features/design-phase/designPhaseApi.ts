/**
 * Design Phase API integration
 * Handles all design phase-related API calls
 */

import { baseApi } from '../../app/baseApi';
import { API_ENDPOINTS } from '../../services/endpoints';
import type {
  DesignPhase,
  DesignPhaseCreateRequest,
  DesignPhaseUpdateRequest,
  DesignSubmissionRequest,
  StaffSubmissionRequest,
  ClientFeedbackRequest,
  MeetingScheduleRequest,
  DesignPhaseFilters,
  DesignPhaseStatistics,
  DesignPhaseListResponse,
  DesignPhaseApiResponse,
  UpcomingMeeting,
} from './types';

export const designPhaseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all design phases with filters and pagination
    getDesignPhases: builder.query<DesignPhaseApiResponse<DesignPhaseListResponse>, DesignPhaseFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.designStatus) params.append('designStatus', filters.designStatus);
        // Only send staffAssignedId if it's a valid number (not 0, not undefined, not null)
        if (filters.staffAssignedId !== undefined && filters.staffAssignedId !== null && filters.staffAssignedId > 0) {
          params.append('staffAssignedId', filters.staffAssignedId.toString());
        }
        if (filters.customerName) params.append('customerName', filters.customerName);
        if (filters.submittedToClient !== undefined) params.append('submittedToClient', filters.submittedToClient.toString());
        if (filters.page !== undefined) params.append('page', filters.page.toString());
        if (filters.size !== undefined) params.append('size', filters.size.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortDir) params.append('sortDir', filters.sortDir);

        return {
          url: `${API_ENDPOINTS.DESIGN_PHASE.BASE}?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['DesignPhase'],
    }),

    // Get design phase by customer ID
    getDesignPhaseByCustomer: builder.query<DesignPhaseApiResponse<DesignPhase>, number>({
      query: (customerId) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.BY_CUSTOMER(customerId),
        method: 'GET',
      }),
      providesTags: (_result, _error, customerId) => [{ type: 'DesignPhase', id: customerId }],
    }),

    // Check if design phase exists for customer
    checkDesignPhaseExists: builder.query<DesignPhaseApiResponse<boolean>, number>({
      query: (customerId) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.EXISTS(customerId),
        method: 'GET',
      }),
      providesTags: (_result, _error, customerId) => [{ type: 'DesignPhase', id: `${customerId}-exists` }],
    }),

    // Get design phases by status
    getDesignPhasesByStatus: builder.query<DesignPhaseApiResponse<DesignPhase[]>, string>({
      query: (status) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.BY_STATUS(status),
        method: 'GET',
      }),
      providesTags: (_result, _error, status) => [
        { type: 'DesignPhase', id: 'LIST' },
        { type: 'DesignPhase', id: status },
      ],
    }),

    // Get design phases by designer
    getDesignPhasesByDesigner: builder.query<DesignPhaseApiResponse<DesignPhase[]>, string>({
      query: (designer) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.BY_DESIGNER(designer),
        method: 'GET',
      }),
      providesTags: (_result, _error, designer) => [
        { type: 'DesignPhase', id: 'LIST' },
        { type: 'DesignPhase', id: designer },
      ],
    }),

    // Get upcoming meetings
    getUpcomingMeetings: builder.query<DesignPhaseApiResponse<UpcomingMeeting[]>, { fromDate: string; toDate: string }>({
      query: ({ fromDate, toDate }) => ({
        url: `${API_ENDPOINTS.DESIGN_PHASE.MEETINGS_UPCOMING}?fromDate=${fromDate}&toDate=${toDate}`,
        method: 'GET',
      }),
      providesTags: ['DesignPhase'],
    }),

    // Get design phase statistics
    getDesignPhaseStatistics: builder.query<DesignPhaseApiResponse<DesignPhaseStatistics>, void>({
      query: () => ({
        url: API_ENDPOINTS.DESIGN_PHASE.STATISTICS,
        method: 'GET',
      }),
      providesTags: ['DesignPhase'],
    }),

    // Create design phase
    createDesignPhase: builder.mutation<DesignPhaseApiResponse<DesignPhase>, DesignPhaseCreateRequest>({
      query: (designPhaseData) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.BASE,
        method: 'POST',
        body: designPhaseData,
      }),
      invalidatesTags: ['DesignPhase'],
    }),

    // Update design phase
    updateDesignPhase: builder.mutation<
      DesignPhaseApiResponse<DesignPhase>,
      { customerId: number; designPhaseData: DesignPhaseUpdateRequest }
    >({
      query: ({ customerId, designPhaseData }) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.BY_CUSTOMER(customerId),
        method: 'PUT',
        body: designPhaseData,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'DesignPhase', id: customerId },
        'DesignPhase',
      ],
    }),

    // Submit design to client
    submitDesignToClient: builder.mutation<
      DesignPhaseApiResponse<DesignPhase>,
      { customerId: number; submissionData: DesignSubmissionRequest }
    >({
      query: ({ customerId, submissionData }) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.SUBMIT_TO_CLIENT(customerId),
        method: 'POST',
        body: submissionData,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'DesignPhase', id: customerId },
        'DesignPhase',
      ],
    }),

    // Record client feedback
    recordClientFeedback: builder.mutation<
      DesignPhaseApiResponse<string>,
      { customerId: number; feedbackData: ClientFeedbackRequest }
    >({
      query: ({ customerId, feedbackData }) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.CLIENT_FEEDBACK(customerId),
        method: 'POST',
        body: feedbackData,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'DesignPhase', id: customerId },
        'DesignPhase',
      ],
    }),

    // Schedule meeting
    scheduleMeeting: builder.mutation<
      DesignPhaseApiResponse<string>,
      { customerId: number; meetingData: MeetingScheduleRequest }
    >({
      query: ({ customerId, meetingData }) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.SCHEDULE_MEETING(customerId),
        method: 'POST',
        body: meetingData,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'DesignPhase', id: customerId },
        'DesignPhase',
      ],
    }),

    // Complete meeting
    completeMeeting: builder.mutation<
      DesignPhaseApiResponse<string>,
      { customerId: number; meetingNotes: string }
    >({
      query: ({ customerId, meetingNotes }) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.COMPLETE_MEETING(customerId),
        method: 'POST',
        body: { meetingNotes },
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'DesignPhase', id: customerId },
        'DesignPhase',
      ],
    }),

    // Freeze design amount
    freezeDesignAmount: builder.mutation<
      DesignPhaseApiResponse<string>,
      { customerId: number; amount: number }
    >({
      query: ({ customerId, amount }) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.FREEZE_AMOUNT(customerId),
        method: 'POST',
        body: { amount },
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'DesignPhase', id: customerId },
        'DesignPhase',
      ],
    }),

    // Create client group
    createClientGroup: builder.mutation<
      DesignPhaseApiResponse<string>,
      { customerId: number; whatsappGroupLink: string }
    >({
      query: ({ customerId, whatsappGroupLink }) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.CREATE_GROUP(customerId),
        method: 'POST',
        body: { whatsappGroupLink },
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'DesignPhase', id: customerId },
        'DesignPhase',
      ],
    }),

    // Update design status
    updateDesignStatus: builder.mutation<
      DesignPhaseApiResponse<string>,
      { customerId: number; status: string }
    >({
      query: ({ customerId, status }) => ({
        url: `${API_ENDPOINTS.DESIGN_PHASE.UPDATE_STATUS(customerId)}?status=${status}`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'DesignPhase', id: customerId },
        'DesignPhase',
      ],
    }),

    // Approve design
    approveDesign: builder.mutation<
      DesignPhaseApiResponse<string>,
      { customerId: number }
    >({
      query: ({ customerId }) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.APPROVE(customerId),
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'DesignPhase', id: customerId },
        'DesignPhase',
      ],
    }),

    // Submit for superadmin approval (staff only)
    submitForApproval: builder.mutation<
      DesignPhaseApiResponse<DesignPhase>,
      { customerId: number; submissionData: StaffSubmissionRequest }
    >({
      query: ({ customerId, submissionData }) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.SUBMIT_FOR_APPROVAL(customerId),
        method: 'POST',
        body: submissionData,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'DesignPhase', id: customerId },
        'DesignPhase',
      ],
    }),

    // Approve staff submission (superadmin only)
    approveStaffSubmission: builder.mutation<
      DesignPhaseApiResponse<DesignPhase>,
      { customerId: number }
    >({
      query: ({ customerId }) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.APPROVE_STAFF_SUBMISSION(customerId),
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'DesignPhase', id: customerId },
        'DesignPhase',
      ],
    }),

    // Get design phases by assigned staff
    getDesignPhasesByStaff: builder.query<DesignPhaseApiResponse<DesignPhase[]>, number>({
      query: (staffId) => ({
        url: API_ENDPOINTS.DESIGN_PHASE.BY_STAFF(staffId),
        method: 'GET',
      }),
      providesTags: (_result, _error, staffId) => [
        { type: 'DesignPhase', id: 'LIST' },
        { type: 'DesignPhase', id: `staff-${staffId}` },
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetDesignPhasesQuery,
  useGetDesignPhaseByCustomerQuery,
  useCheckDesignPhaseExistsQuery,
  useGetDesignPhasesByStatusQuery,
  useGetDesignPhasesByDesignerQuery,
  useGetDesignPhasesByStaffQuery,
  useGetUpcomingMeetingsQuery,
  useGetDesignPhaseStatisticsQuery,
  useCreateDesignPhaseMutation,
  useUpdateDesignPhaseMutation,
  useSubmitDesignToClientMutation,
  useSubmitForApprovalMutation,
  useApproveStaffSubmissionMutation,
  useRecordClientFeedbackMutation,
  useScheduleMeetingMutation,
  useCompleteMeetingMutation,
  useFreezeDesignAmountMutation,
  useCreateClientGroupMutation,
  useUpdateDesignStatusMutation,
  useApproveDesignMutation,
} = designPhaseApi;
