package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.WorkflowHistoryDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.WorkflowHistory;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
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

    @Autowired
    private CustomerRepository customerRepository;

    @Override
    public ApiResponse<List<WorkflowHistoryDto>> getWorkflowHistoryByCustomerId(Long customerId) {
        List<WorkflowHistory> history = workflowHistoryRepository.findByCustomerIdOrderByTimestampDesc(customerId);
        List<WorkflowHistoryDto> historyDtos = history.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(historyDtos);
    }

    @Override
    public ApiResponse<WorkflowHistoryDto> addCustomerNote(Long customerId, String note, String author) {
        Customer customer = customerRepository.findById(customerId).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }

        String trimmed = note == null ? "" : note.trim();
        if (trimmed.isEmpty()) {
            return ApiResponse.error("Note cannot be empty");
        }

        WorkflowHistory entry = new WorkflowHistory();
        entry.setCustomer(customer);
        entry.setPreviousState(NOTE_MARKER);
        // new_state is NOT NULL, and the feed keys off previousState, so it carries the marker too.
        entry.setNewState(NOTE_MARKER);
        entry.setChangedBy(author);
        entry.setChangeReason(trimmed);
        entry.setTimestamp(LocalDateTime.now());

        return ApiResponse.success("Note added", convertToDto(workflowHistoryRepository.save(entry)));
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