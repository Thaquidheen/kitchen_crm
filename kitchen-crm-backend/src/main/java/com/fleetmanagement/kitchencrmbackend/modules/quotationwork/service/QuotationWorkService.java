package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.dto.*;

import java.util.List;
import java.util.Map;

/**
 * The quotation work board: quotations handed to people to prepare, in the order the admin set.
 * There is no approval step — the assignee marks the work completed and the admin is told.
 */
public interface QuotationWorkService {

    /**
     * Who is asking. An admin and Admin staff both manage the board (see everything, assign, set
     * priority and order); they are told about completed work separately, so each keeps their own
     * "seen" stamp.
     */
    record Viewer(Long id, String name, boolean superAdmin, boolean coordinator) {
        public boolean manages() {
            return superAdmin || coordinator;
        }
    }

    /** Admin staff: active staff whose staff type is ADMIN_STAFF. */
    boolean isCoordinator(Long userId);

    QuotationWorkMeDto me(Viewer viewer);

    /** Whoever manages gets every open job plus recently completed ones; others only their own. */
    ApiResponse<List<QuotationJobDto>> list(Viewer viewer);

    /** Customers at Quotation Stage with no quotation yet and nobody preparing one. */
    ApiResponse<List<Map<String, Object>>> unassigned();

    ApiResponse<List<QuotationAssigneeDto>> assignees();

    ApiResponse<QuotationJobDto> assign(QuotationJobAssignRequest request, Viewer viewer);

    ApiResponse<QuotationJobDto> update(Long jobId, QuotationJobUpdateRequest request, Viewer viewer);

    ApiResponse<List<QuotationJobDto>> reorder(QuotationJobReorderRequest request, Viewer viewer);

    ApiResponse<QuotationJobDto> cancel(Long jobId, Viewer viewer);

    /** The assignee (or whoever manages) starts work. */
    ApiResponse<QuotationJobDto> start(Long jobId, Viewer viewer);

    /** The assignee (or whoever manages) hands the quotation in. */
    ApiResponse<QuotationJobDto> complete(Long jobId, QuotationJobCompleteRequest request, Viewer viewer);

    /** What the bell shows this person: {count, jobs}. */
    ApiResponse<Map<String, Object>> feed(Viewer viewer);

    /** The person has looked at the board: their news is cleared. Returns how many items. */
    ApiResponse<Integer> markSeen(Viewer viewer);
}
