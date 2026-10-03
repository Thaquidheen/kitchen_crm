package com.fleetmanagement.kitchencrmbackend.modules.design.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.design.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Design jobs: one per customer (design_phase), assigned to a Designer-type staff member, ordered in
 * that designer's queue by an admin, with a note thread and file uploads. A designer sees only their
 * own jobs; admins see everything.
 */
public interface DesignJobService {

    DesignMeDto me(Long userId);

    ApiResponse<List<DesignJobDto>> list(Long callerId, boolean admin, Long designerId, boolean includeClosed);

    ApiResponse<DesignJobDto> get(Long jobId, Long callerId, boolean admin);

    /** Summary of a customer's design job (no notes/files) — readable by any signed-in staff. */
    ApiResponse<DesignJobDto> getForCustomer(Long customerId);

    ApiResponse<List<Map<String, Object>>> unassignedCustomers();

    /**
     * Called by the customer status change when moving to Design. Validates first and writes only
     * when valid; returns an error message for the caller to surface, or null on success.
     */
    String ensureAssignedForDesignStage(Customer customer, Long designerId, LocalDate dueDate, String priority,
                                        String brief, Long byUserId);

    ApiResponse<DesignJobDto> assign(DesignAssignRequest request, Long adminId);

    ApiResponse<DesignJobDto> update(Long jobId, DesignJobUpdateRequest request, Long adminId);

    ApiResponse<List<DesignJobDto>> reorder(DesignReorderRequest request);

    ApiResponse<DesignJobDto> start(Long jobId, Long callerId);

    ApiResponse<DesignJobDto> complete(Long jobId, String message, Long callerId, String callerName);

    ApiResponse<DesignJobDto> review(Long jobId, DesignReviewRequest request, Long adminId, String adminName);

    ApiResponse<DesignJobDto> addNote(Long jobId, String message, Long callerId, String callerName, boolean admin);

    ApiResponse<DesignJobDto> markSeen(Long jobId, Long callerId, boolean admin);

    ApiResponse<DesignJobDto> uploadFile(Long jobId, MultipartFile file, String description, Long callerId,
                                         String callerName, boolean admin);

    ApiResponse<List<DesignerSummaryDto>> designers();

    ApiResponse<DesignerSummaryDto> setDesignerStatus(Long userId, String status);

    /** Designer bell: {count, jobs[]}. */
    ApiResponse<Map<String, Object>> myFeed(Long designerId);

    /** Admin bell: {count, jobs[]}. */
    ApiResponse<Map<String, Object>> attention();

    ApiResponse<Integer> markAllMineSeen(Long designerId);
}
