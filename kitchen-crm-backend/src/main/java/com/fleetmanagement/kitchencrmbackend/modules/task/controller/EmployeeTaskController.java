package com.fleetmanagement.kitchencrmbackend.modules.task.controller;

import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskBulkCreateDto;
import java.util.Map;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskReplyCreateDto;
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

    // ---- Assignment flow (admin -> staff). Literal paths are matched before /{taskId}. ----

    /** Assign one task to several staff at once (one row each). */
    @PostMapping("/assign-many")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<EmployeeTaskDto>>> assignMany(
            @Valid @RequestBody EmployeeTaskBulkCreateDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<List<EmployeeTaskDto>> response = taskService.assignMany(dto, currentUser.getId());
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    /** Everything the current admin has assigned, newest due first (Team Tasks tab). */
    @GetMapping("/assigned-by-me")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<EmployeeTaskDto>>> getAssignedByMe(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(taskService.getTasksAssignedBy(currentUser.getId()));
    }

    /** Admin bell feed: {count, tasks[]} - completed-but-unseen and overdue tasks I assigned. */
    @GetMapping("/attention")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAttention(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(taskService.getAssignerAttention(currentUser.getId()));
    }

    @PutMapping("/attention/seen-all")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Integer>> markAllCompletionsSeen(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(taskService.markAllCompletionsSeen(currentUser.getId()));
    }

    @PutMapping("/{taskId}/seen")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeTaskDto>> markCompletionSeen(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<EmployeeTaskDto> response = taskService.markCompletionSeen(taskId, currentUser.getId());
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    /** Staff bell feed: {count, tasks[]} - my open tasks due today or earlier, plus any new ones. */
    @GetMapping("/my-due")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyDue(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(taskService.getMyDueTasks(currentUser.getId()));
    }

    /** Called when the staff member opens their list: every new assignment stops being "new". */
    @PutMapping("/my/acknowledge-all")
    public ResponseEntity<ApiResponse<Integer>> acknowledgeAll(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(taskService.acknowledgeAllMine(currentUser.getId()));
    }

    /** Reply on a task (its assignee or its assigner). Returns the task with the whole thread. */
    @PostMapping("/{taskId}/replies")
    public ResponseEntity<ApiResponse<EmployeeTaskDto>> addReply(
            @PathVariable Long taskId,
            @Valid @RequestBody EmployeeTaskReplyCreateDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<EmployeeTaskDto> response = taskService.addReply(taskId,
                currentUser != null ? currentUser.getId() : null,
                currentUser != null ? currentUser.getName() : null,
                dto.getMessage());
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    /** The caller has read the thread: the other side's replies stop counting as unread. */
    @PutMapping("/{taskId}/replies/seen")
    public ResponseEntity<ApiResponse<EmployeeTaskDto>> markRepliesSeen(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<EmployeeTaskDto> response = taskService.markRepliesSeen(taskId,
                currentUser != null ? currentUser.getId() : null);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<ApiResponse<EmployeeTaskDto>> getTaskById(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<EmployeeTaskDto> response = taskService.getTaskById(taskId, currentUser.getId());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}




