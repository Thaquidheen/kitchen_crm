package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.WorkflowHistoryDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.WorkflowHistory;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.WorkflowHistoryRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class WorkflowServiceImpl implements WorkflowService {

    @Autowired
    private WorkflowHistoryRepository workflowHistoryRepository;

    @Override
    public ApiResponse<List<WorkflowHistoryDto>> getWorkflowHistoryByCustomerId(Long customerId) {
        List<WorkflowHistory> history = workflowHistoryRepository.findByCustomerIdOrderByTimestampDesc(customerId);
        List<WorkflowHistoryDto> historyDtos = history.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(historyDtos);
    }

    @Override
    public ApiResponse<Page<WorkflowHistoryDto>> getAllWorkflowHistory(Long customerId, String changedBy,
                                                                       LocalDateTime fromDate, LocalDateTime toDate,
                                                                       Pageable pageable) {
        Page<WorkflowHistory> history = workflowHistoryRepository.findByFilters(
                customerId, changedBy, fromDate, toDate, pageable);
        Page<WorkflowHistoryDto> historyDtos = history.map(this::convertToDto);
        return ApiResponse.success(historyDtos);
    }

    private WorkflowHistoryDto convertToDto(WorkflowHistory history) {
        return new WorkflowHistoryDto(
                history.getId(),
                history.getCustomer().getId(),
                history.getCustomer().getName(),
                history.getPreviousState(),
                history.getNewState(),
                history.getChangedBy(),
                history.getChangeReason(),
                history.getTimestamp()
        );
    }
}