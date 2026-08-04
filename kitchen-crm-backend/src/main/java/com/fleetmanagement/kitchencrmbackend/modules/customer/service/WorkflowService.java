package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.WorkflowHistoryDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface WorkflowService {

    /**
     * Marks a workflow_history row as a free-text note rather than a state transition. The
     * activity feed already carries two non-status kinds (creation, and the "Customer Update"
     * edit marker); this is a third, so notes stay in the one ordered feed with everything else.
     */
    String NOTE_MARKER = "Note";

    ApiResponse<List<WorkflowHistoryDto>> getWorkflowHistoryByCustomerId(Long customerId);

    /** Adds a note to the customer's activity feed. */
    ApiResponse<WorkflowHistoryDto> addCustomerNote(Long customerId, String note, String author);
    ApiResponse<Page<WorkflowHistoryDto>> getAllWorkflowHistory(Long customerId, String changedBy,
                                                                LocalDateTime fromDate, LocalDateTime toDate,
                                                                Pageable pageable);
}