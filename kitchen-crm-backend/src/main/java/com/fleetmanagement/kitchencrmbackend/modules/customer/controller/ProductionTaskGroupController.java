package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionTaskGroupCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionTaskGroupDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionTaskGroupUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.ProductionTaskGroupService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/production/task-groups")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Production Task Groups", description = "APIs for managing production task groups/headings")
public class ProductionTaskGroupController {

    private final ProductionTaskGroupService taskGroupService;

    @PostMapping
    @Operation(summary = "Create a new task group", description = "Creates a new task group/heading for organizing tasks")
    public ResponseEntity<ApiResponse<ProductionTaskGroupDto>> createGroup(@RequestBody ProductionTaskGroupCreateDto createDto) {
        log.info("Creating task group for customer ID: {}", createDto.getCustomerId());
        ApiResponse<ProductionTaskGroupDto> response = taskGroupService.createGroup(createDto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get task groups by customer ID", description = "Retrieves all task groups with their tasks for a customer")
    public ResponseEntity<ApiResponse<List<ProductionTaskGroupDto>>> getGroupsByCustomer(@PathVariable Long customerId) {
        log.info("Fetching task groups for customer ID: {}", customerId);
        ApiResponse<List<ProductionTaskGroupDto>> response = taskGroupService.getGroupsByCustomerId(customerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{groupId}")
    @Operation(summary = "Get task group by ID", description = "Retrieves a specific task group by its ID")
    public ResponseEntity<ApiResponse<ProductionTaskGroupDto>> getGroupById(@PathVariable Long groupId) {
        log.info("Fetching task group ID: {}", groupId);
        ApiResponse<ProductionTaskGroupDto> response = taskGroupService.getGroupById(groupId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{groupId}")
    @Operation(summary = "Update a task group", description = "Updates an existing task group")
    public ResponseEntity<ApiResponse<ProductionTaskGroupDto>> updateGroup(
            @PathVariable Long groupId,
            @RequestBody ProductionTaskGroupUpdateDto updateDto) {
        log.info("Updating task group ID: {}", groupId);
        ApiResponse<ProductionTaskGroupDto> response = taskGroupService.updateGroup(groupId, updateDto);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{groupId}")
    @Operation(summary = "Delete a task group", description = "Deletes a task group and all its tasks")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(@PathVariable Long groupId) {
        log.info("Deleting task group ID: {}", groupId);
        ApiResponse<Void> response = taskGroupService.deleteGroup(groupId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/customer/{customerId}/reorder")
    @Operation(summary = "Reorder task groups", description = "Reorders task groups for a customer")
    public ResponseEntity<ApiResponse<List<ProductionTaskGroupDto>>> reorderGroups(
            @PathVariable Long customerId,
            @RequestBody List<Long> groupIds) {
        log.info("Reordering {} task groups for customer ID: {}", groupIds.size(), customerId);
        ApiResponse<List<ProductionTaskGroupDto>> response = taskGroupService.reorderGroups(customerId, groupIds);
        return ResponseEntity.ok(response);
    }
}
