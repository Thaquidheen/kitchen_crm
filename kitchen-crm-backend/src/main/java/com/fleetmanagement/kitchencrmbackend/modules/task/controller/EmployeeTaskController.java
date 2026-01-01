package com.fleetmanagement.kitchencrmbackend.modules.task.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.TaskCompletionStatsDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.service.EmployeeTaskService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks/employee")
@CrossOrigin(origins = "*", maxAge = 3600)
public class EmployeeTaskController {

    @Autowired
    private EmployeeTaskService taskService;

    @PostMapping("/assign")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeTaskDto>> assignTask(
            @Valid @RequestBody EmployeeTaskCreateDto createDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<EmployeeTaskDto> response = taskService.createTask(createDto, currentUser.getId());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<EmployeeTaskDto>>> getTasksByEmployee(
            @PathVariable Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date != null) {
            return ResponseEntity.ok(taskService.getTasksByEmployeeAndDate(employeeId, date));
        }
        return ResponseEntity.ok(taskService.getTasksByEmployee(employeeId));
    }

    @GetMapping("/date/{date}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<EmployeeTaskDto>>> getTasksByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(taskService.getTasksByDate(date));
    }

    @GetMapping("/employee/{employeeId}/date/{date}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<EmployeeTaskDto>>> getTasksByEmployeeAndDate(
            @PathVariable Long employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(taskService.getTasksByEmployeeAndDate(employeeId, date));
    }

    @GetMapping("/employee/{employeeId}/date-range")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<EmployeeTaskDto>>> getTasksByEmployeeAndDateRange(
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(taskService.getTasksByEmployeeAndDateRange(employeeId, fromDate, toDate));
    }

    @PutMapping("/{taskId}/complete")
    public ResponseEntity<ApiResponse<EmployeeTaskDto>> markTaskComplete(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<EmployeeTaskDto> response = taskService.markTaskComplete(taskId, currentUser.getId());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{taskId}/incomplete")
    public ResponseEntity<ApiResponse<EmployeeTaskDto>> markTaskIncomplete(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<EmployeeTaskDto> response = taskService.markTaskIncomplete(taskId, currentUser.getId());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{taskId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeTaskDto>> updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody EmployeeTaskUpdateDto updateDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<EmployeeTaskDto> response = taskService.updateTask(taskId, updateDto, currentUser.getId());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{taskId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteTask(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<String> response = taskService.deleteTask(taskId, currentUser.getId());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TaskCompletionStatsDto>> getTaskCompletionStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(taskService.getTaskCompletionStats(fromDate, toDate));
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<ApiResponse<List<EmployeeTaskDto>>> getMyTasks(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(taskService.getMyTasks(currentUser.getId(), date));
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<ApiResponse<EmployeeTaskDto>> getTaskById(@PathVariable Long taskId) {
        ApiResponse<EmployeeTaskDto> response = taskService.getTaskById(taskId);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}




