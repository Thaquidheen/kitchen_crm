package com.fleetmanagement.kitchencrmbackend.modules.task.service;

import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskBulkCreateDto;
import java.util.Map;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.TaskCompletionStatsDto;

import java.time.LocalDate;
import java.util.List;

public interface EmployeeTaskService {

    /**
     * Create a new task assigned to an employee
     */
    ApiResponse<EmployeeTaskDto> createTask(EmployeeTaskCreateDto createDto, Long assignedByUserId);

    /**
     * Update task details
     */
    ApiResponse<EmployeeTaskDto> updateTask(Long taskId, EmployeeTaskUpdateDto updateDto, Long updatedByUserId);

    /**
     * Mark task as complete
     */
    ApiResponse<EmployeeTaskDto> markTaskComplete(Long taskId, Long completedByUserId);

    /**
     * Mark task as incomplete
     */
    ApiResponse<EmployeeTaskDto> markTaskIncomplete(Long taskId, Long updatedByUserId);

    /**
     * Get tasks for a specific employee on a specific date
     */
    ApiResponse<List<EmployeeTaskDto>> getTasksByEmployeeAndDate(Long employeeId, LocalDate date);

    /**
     * Get all tasks for a specific date (admin view)
     */
    ApiResponse<List<EmployeeTaskDto>> getTasksByDate(LocalDate date);

    /**
     * Get tasks for an employee within a date range
     */
    ApiResponse<List<EmployeeTaskDto>> getTasksByEmployeeAndDateRange(Long employeeId, LocalDate fromDate, LocalDate toDate);

    /**
     * Get all tasks assigned to a specific employee
     */
    ApiResponse<List<EmployeeTaskDto>> getTasksByEmployee(Long employeeId);

    /**
     * Get current user's assigned tasks
     */
    ApiResponse<List<EmployeeTaskDto>> getMyTasks(Long userId, LocalDate date);

    /**
     * Get completion statistics
     */
    ApiResponse<TaskCompletionStatsDto> getTaskCompletionStats(LocalDate fromDate, LocalDate toDate);

    /**
     * Delete task
     */
    ApiResponse<String> deleteTask(Long taskId, Long deletedByUserId);

    /**
     * Get task by ID
     */
    ApiResponse<EmployeeTaskDto> getTaskById(Long taskId, Long userId);

    // ---- Assignment flow (admin -> staff) ----

    /** One task to several staff (one row each). SUPER_ADMIN only at the controller. */
    ApiResponse<List<EmployeeTaskDto>> assignMany(EmployeeTaskBulkCreateDto dto, Long assignedByUserId);

    /** Everything this admin has assigned, newest due first. */
    ApiResponse<List<EmployeeTaskDto>> getTasksAssignedBy(Long adminId);

    /** Staff bell feed: {count, tasks[]} - open tasks due today or earlier, plus any not yet acknowledged. */
    ApiResponse<Map<String, Object>> getMyDueTasks(Long userId);

    /** Admin bell feed: {count, tasks[]} - completed-but-unseen and overdue tasks this admin assigned. */
    ApiResponse<Map<String, Object>> getAssignerAttention(Long adminId);

    /** Stamp acknowledged_at on all my open, unseen assignments; returns how many. */
    ApiResponse<Integer> acknowledgeAllMine(Long userId);

    /** The assigner has seen this completion (drops it from their bell). */
    ApiResponse<EmployeeTaskDto> markCompletionSeen(Long taskId, Long adminId);

    /** The assigner has seen every completion; returns how many. */
    ApiResponse<Integer> markAllCompletionsSeen(Long adminId);
}
