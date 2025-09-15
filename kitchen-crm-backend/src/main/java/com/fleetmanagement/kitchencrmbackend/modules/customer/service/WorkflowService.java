package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.WorkflowHistoryDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface WorkflowService {
    ApiResponse<List<WorkflowHistoryDto>> getWorkflowHistoryByCustomerId(Long customerId);
    ApiResponse<Page<WorkflowHistoryDto>> getAllWorkflowHistory(Long customerId, String changedBy,
                                                                LocalDateTime fromDate, LocalDateTime toDate,
                                                                Pageable pageable);
}