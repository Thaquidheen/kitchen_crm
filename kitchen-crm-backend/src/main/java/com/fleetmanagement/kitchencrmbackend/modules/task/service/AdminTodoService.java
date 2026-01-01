package com.fleetmanagement.kitchencrmbackend.modules.task.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.AdminTodoCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.AdminTodoDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.AdminTodoUpdateDto;

import java.time.LocalDate;
import java.util.List;

public interface AdminTodoService {

    /**
     * Create a new admin todo
     */
    ApiResponse<AdminTodoDto> createTodo(AdminTodoCreateDto createDto, Long userId);

    /**
     * Update todo
     */
    ApiResponse<AdminTodoDto> updateTodo(Long todoId, AdminTodoUpdateDto updateDto, Long userId);

    /**
     * Mark todo as complete
     */
    ApiResponse<AdminTodoDto> markTodoComplete(Long todoId, Long userId);

    /**
     * Mark todo as incomplete
     */
    ApiResponse<AdminTodoDto> markTodoIncomplete(Long todoId, Long userId);

    /**
     * Get todos for a user on a specific date
     */
    ApiResponse<List<AdminTodoDto>> getTodosByDate(Long userId, LocalDate date);

    /**
     * Get todos for a user within a date range
     */
    ApiResponse<List<AdminTodoDto>> getTodosByDateRange(Long userId, LocalDate fromDate, LocalDate toDate);

    /**
     * Get all todos for a user
     */
    ApiResponse<List<AdminTodoDto>> getTodosByUser(Long userId);

    /**
     * Delete todo
     */
    ApiResponse<String> deleteTodo(Long todoId, Long userId);

    /**
     * Get todo by ID
     */
    ApiResponse<AdminTodoDto> getTodoById(Long todoId);
}




