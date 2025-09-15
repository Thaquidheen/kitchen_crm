package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.WorkflowHistoryDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.WorkflowService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow")
@CrossOrigin(origins = "*", maxAge = 3600)
public class WorkflowController {

    @Autowired
    private WorkflowService workflowService;

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<WorkflowHistoryDto>>> getWorkflowHistoryByCustomerId(
            @PathVariable Long customerId) {
        return ResponseEntity.ok(workflowService.getWorkflowHistoryByCustomerId(customerId));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Page<WorkflowHistoryDto>>> getAllWorkflowHistory(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String changedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());

        return ResponseEntity.ok(workflowService.getAllWorkflowHistory(
                customerId, changedBy, fromDate, toDate, pageable));
    }
}