package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionCustomTaskCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionCustomTaskDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionCustomTaskUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.ProductionCustomTaskService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.permission.Permission;
import com.fleetmanagement.kitchencrmbackend.modules.permission.service.PermissionService;
import com.fleetmanagement.kitchencrmbackend.modules.permission.web.PermissionInterceptor;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/production-custom-tasks")
@RequiredArgsConstructor
@Tag(name = "Production Custom Tasks", description = "API for managing custom production checklist tasks")
public class ProductionCustomTaskController {

    private final ProductionCustomTaskService taskService;
    private final PermissionService permissionService;

    @PostMapping
    @Operation(summary = "Create a new custom task")
    public ResponseEntity<ApiResponse<ProductionCustomTaskDto>> createTask(
            @Valid @RequestBody ProductionCustomTaskCreateDto createDto) {
        ApiResponse<ProductionCustomTaskDto> response = taskService.createTask(createDto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get all custom tasks for a customer")
    public ResponseEntity<ApiResponse<List<ProductionCustomTaskDto>>> getTasksByCustomerId(
            @PathVariable Long customerId) {
        ApiResponse<List<ProductionCustomTaskDto>> response = taskService.getTasksByCustomerId(customerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/customer/{customerId}/phase/{phase}")
    @Operation(summary = "Get custom tasks by customer and phase")
    public ResponseEntity<ApiResponse<List<ProductionCustomTaskDto>>> getTasksByCustomerIdAndPhase(
            @PathVariable Long customerId,
            @PathVariable String phase) {
        ApiResponse<List<ProductionCustomTaskDto>> response = taskService.getTasksByCustomerIdAndPhase(customerId, phase);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{taskId}")
    @Operation(summary = "Get a specific task by ID")
    public ResponseEntity<ApiResponse<ProductionCustomTaskDto>> getTaskById(
            @PathVariable Long taskId) {
        ApiResponse<ProductionCustomTaskDto> response = taskService.getTaskById(taskId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{taskId}")
    @Operation(summary = "Update a custom task")
    public ResponseEntity<ApiResponse<ProductionCustomTaskDto>> updateTask(
            @PathVariable Long taskId,
            @RequestBody ProductionCustomTaskUpdateDto updateDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        // The edit can also tick a task done or not done. That is "Tick off tasks", not "Change the
        // checklist" (which is what lets this call through), so a change to it is checked here.
        if (updateDto.getCompleted() != null && !permissionService.can(currentUser, Permission.PRODUCTION_TICK)) {
            ProductionCustomTaskDto stored = taskService.getTaskById(taskId).getData();
            if (stored == null || !updateDto.getCompleted().equals(stored.getCompleted())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error(PermissionInterceptor.message(Permission.PRODUCTION_TICK)));
            }
        }
        ApiResponse<ProductionCustomTaskDto> response = taskService.updateTask(taskId, updateDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{taskId}/reminder")
    @Operation(summary = "Create a reminder for this task and link it")
    public ResponseEntity<ApiResponse<ProductionCustomTaskDto>> setTaskReminder(
            @PathVariable Long taskId,
            @RequestBody java.util.Map<String, String> body,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            com.fleetmanagement.kitchencrmbackend.security.UserPrincipal currentUser) {
        java.time.LocalDateTime remindAt;
        try {
            remindAt = java.time.LocalDateTime.parse(body.get("remindAt"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("A valid reminder date is required"));
        }
        ApiResponse<ProductionCustomTaskDto> response = taskService.setTaskReminder(
                taskId, remindAt, body.get("notes"),
                currentUser != null ? currentUser.getName() : "System",
                currentUser != null ? currentUser.getId() : null);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @PatchMapping("/{taskId}/toggle")
    @Operation(summary = "Toggle task completion status")
    public ResponseEntity<ApiResponse<ProductionCustomTaskDto>> toggleTaskCompletion(
            @PathVariable Long taskId) {
        ApiResponse<ProductionCustomTaskDto> response = taskService.toggleTaskCompletion(taskId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{taskId}")
    @Operation(summary = "Delete a custom task")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable Long taskId) {
        ApiResponse<Void> response = taskService.deleteTask(taskId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/customer/{customerId}/reorder")
    @Operation(summary = "Reorder tasks for a customer")
    public ResponseEntity<ApiResponse<List<ProductionCustomTaskDto>>> reorderTasks(
            @PathVariable Long customerId,
            @RequestBody List<Long> taskIds) {
        ApiResponse<List<ProductionCustomTaskDto>> response = taskService.reorderTasks(customerId, taskIds);
        return ResponseEntity.ok(response);
    }
}
