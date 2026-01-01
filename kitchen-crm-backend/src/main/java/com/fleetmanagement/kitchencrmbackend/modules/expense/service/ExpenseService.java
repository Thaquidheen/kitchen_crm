package com.fleetmanagement.kitchencrmbackend.modules.expense.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.expense.dto.ExpenseCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.expense.dto.ExpenseDto;
import com.fleetmanagement.kitchencrmbackend.modules.expense.dto.ExpenseUpdateDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface ExpenseService {

    /**
     * Create new expense for a project
     * IMPORTANT: This updates project.totalExpense but does NOT affect customer payment balances
     */
    ApiResponse<ExpenseDto> createExpense(ExpenseCreateDto expenseCreateDto);

    /**
     * Get expense by ID
     */
    ApiResponse<ExpenseDto> getExpenseById(Long id);

    /**
     * Get all expenses for a project
     */
    ApiResponse<List<ExpenseDto>> getExpensesByProject(Long projectId);

    /**
     * Get expenses by project with pagination
     */
    ApiResponse<Page<ExpenseDto>> getExpensesByProject(Long projectId, Pageable pageable);

    /**
     * Update expense
     */
    ApiResponse<ExpenseDto> updateExpense(Long id, ExpenseUpdateDto expenseUpdateDto);

    /**
     * Delete expense
     */
    ApiResponse<String> deleteExpense(Long id);

    /**
     * Get total expense for a project
     */
    BigDecimal getTotalExpenseByProject(Long projectId);

    /**
     * Update project's total expense (called automatically after create/update/delete)
     */
    void updateProjectTotalExpense(Long projectId);
}






