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
 *
 * A design moves the customer through the pipeline: approving it sends a customer in Design on to
 * Quotation Stage, and a redesign of an approved design opens its next version and brings the
 * customer back into Design. Quotation Stage needs an approved design — made here, or uploaded as
 * an already existing one.
 */
public interface DesignJobService {

    DesignMeDto me(Long userId, boolean superAdmin);

    /**
     * Staff whose type is Admin staff coordinate designs next to the admins: they see every
     * design, assign designers and attach plan documents. Everything else stays with admins.
     */
    boolean isCoordinator(Long userId);

    ApiResponse<List<DesignJobDto>> list(Long callerId, boolean admin, boolean coordinator, Long designerId,
                                         boolean includeClosed);

    ApiResponse<DesignJobDto> get(Long jobId, Long callerId, boolean admin, boolean coordinator);

    /** Summary of a customer's design job (no notes/files) — readable by any signed-in staff. */
    ApiResponse<DesignJobDto> getForCustomer(Long customerId);

    ApiResponse<List<Map<String, Object>>> unassignedCustomers();

    /**
     * Called by the customer status change when moving to Design. Validates first and writes only
     * when valid; returns an error message for the caller to surface, or null on success.
     *
     * <p>Choosing the designer is for the admin and Admin staff ({@code canAssign}). For anyone
     * else the designer arguments are ignored: the customer moves without one and waits under
     * "To assign" on the Designs board.
     */
    String ensureAssignedForDesignStage(Customer customer, Long designerId, LocalDate dueDate, String priority,
                                        String brief, Long byUserId, boolean canAssign);

    /**
     * Called by the customer status change when moving to Quotation Stage: null when the customer
     * has an approved design, otherwise the message telling the user what is missing.
     */
    String requireDesignForQuotationStage(Customer customer);

    /** Customers at Quotation Stage or later with their design, or none when it was never uploaded. */
    ApiResponse<List<DesignLibraryRowDto>> library();

    ApiResponse<DesignJobDto> assign(DesignAssignRequest request, Long adminId);

    /** Opens the next version of an approved design and brings the customer back into Design. */
    ApiResponse<DesignJobDto> requestRedesign(Long jobId, DesignRedesignRequest request, Long adminId, String adminName);

    ApiResponse<DesignJobDto> update(Long jobId, DesignJobUpdateRequest request, Long adminId);

    ApiResponse<List<DesignJobDto>> reorder(DesignReorderRequest request);

    ApiResponse<DesignJobDto> start(Long jobId, Long callerId);

    ApiResponse<DesignJobDto> complete(Long jobId, String message, Long callerId, String callerName);

    ApiResponse<DesignJobDto> review(Long jobId, DesignReviewRequest request, Long adminId, String adminName);

    ApiResponse<DesignJobDto> addNote(Long jobId, String message, Long callerId, String callerName, boolean admin);

    ApiResponse<DesignJobDto> markSeen(Long jobId, Long callerId, boolean admin);

    ApiResponse<DesignJobDto> uploadFile(Long jobId, MultipartFile file, String description, Long callerId,
                                         String callerName, boolean admin);

    /** Plan documents the admin hands to the designer; kept apart from the design files. */
    ApiResponse<DesignJobDto> uploadPlanDocuments(Long jobId, MultipartFile[] files, String callerName, boolean admin);

    ApiResponse<DesignJobDto> deleteFile(Long jobId, Long fileId, Long callerId, boolean admin, boolean coordinator);

    /**
     * Saves an already existing design PDF as the customer's approved design (a new version when
     * one is already approved) and, when asked, moves the customer to Quotation Stage with the note.
     */
    ApiResponse<DesignJobDto> uploadCustomerDesign(Long customerId, MultipartFile file, String note,
                                                   boolean moveToQuotation, Long callerId, String callerName,
                                                   boolean admin);

    ApiResponse<List<DesignerSummaryDto>> designers();

    ApiResponse<DesignerSummaryDto> setDesignerStatus(Long userId, String status);

    /** Designer bell: {count, jobs[]}. */
    ApiResponse<Map<String, Object>> myFeed(Long designerId);

    /** Admin bell: {count, jobs[]}. */
    ApiResponse<Map<String, Object>> attention();

    ApiResponse<Integer> markAllMineSeen(Long designerId);
}
