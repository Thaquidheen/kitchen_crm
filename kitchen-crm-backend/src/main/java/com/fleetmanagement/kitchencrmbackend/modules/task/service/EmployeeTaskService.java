package com.fleetmanagement.kitchencrmbackend.modules.task.service;

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
    ApiResponse<EmployeeTaskDto> getTaskById(Long taskId);
}




