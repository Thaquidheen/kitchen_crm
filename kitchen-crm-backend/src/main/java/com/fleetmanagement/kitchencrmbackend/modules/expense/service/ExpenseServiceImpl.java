package com.fleetmanagement.kitchencrmbackend.modules.expense.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.expense.dto.ExpenseCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.expense.dto.ExpenseDto;
import com.fleetmanagement.kitchencrmbackend.modules.expense.dto.ExpenseUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.expense.entity.ProjectExpense;
import com.fleetmanagement.kitchencrmbackend.modules.expense.repository.ProjectExpenseRepository;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import com.fleetmanagement.kitchencrmbackend.modules.project.repository.CustomerProjectRepository;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.entity.Vendor;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageImpl;

@Service
@Transactional
public class ExpenseServiceImpl implements ExpenseService {

    @Autowired
    private ProjectExpenseRepository expenseRepository;

    @Autowired
    private CustomerProjectRepository projectRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Override
    public ApiResponse<ExpenseDto> createExpense(ExpenseCreateDto expenseCreateDto) {
        // Validate project exists
        CustomerProject project = projectRepository.findById(expenseCreateDto.getProjectId())
                .orElse(null);
        if (project == null) {
            return ApiResponse.error("Project not found");
        }

        // Validate vendor exists
        Vendor vendor = vendorRepository.findById(expenseCreateDto.getVendorId())
                .orElse(null);
        if (vendor == null) {
            return ApiResponse.error("Vendor not found");
        }

        // Create expense
        ProjectExpense expense = new ProjectExpense();
        expense.setProject(project);
        expense.setVendor(vendor);
        expense.setExpenseCategory(ProjectExpense.ExpenseCategory.valueOf(expenseCreateDto.getExpenseCategory()));
        expense.setDescription(expenseCreateDto.getDescription());
        expense.setAmount(expenseCreateDto.getAmount());
        expense.setPaymentMethod(expenseCreateDto.getPaymentMethod());
        expense.setPaymentDate(expenseCreateDto.getPaymentDate());
        expense.setReferenceNumber(expenseCreateDto.getReferenceNumber());
        expense.setNotes(expenseCreateDto.getNotes());
        expense.setPaidBy(expenseCreateDto.getPaidBy());
        
        if (expenseCreateDto.getStatus() != null) {
            expense.setStatus(ProjectExpense.ExpenseStatus.valueOf(expenseCreateDto.getStatus()));
        } else {
            expense.setStatus(ProjectExpense.ExpenseStatus.PAID);
        }

        ProjectExpense saved = expenseRepository.save(expense);

        // CRITICAL: Update project's total expense
        // This does NOT affect customer payment balances (receivedInHand, receivedInAccount)
        updateProjectTotalExpense(project.getId());

        return ApiResponse.success("Expense recorded successfully", convertToDto(saved));
    }

    @Override
    public ApiResponse<ExpenseDto> getExpenseById(Long id) {
        ProjectExpense expense = expenseRepository.findById(id).orElse(null);
        if (expense == null) {
            return ApiResponse.error("Expense not found");
        }
        return ApiResponse.success(convertToDto(expense));
    }

    @Override
    public ApiResponse<List<ExpenseDto>> getExpensesByProject(Long projectId) {
        List<ProjectExpense> expenses = expenseRepository.findByProjectIdOrderByPaymentDateDesc(projectId);
        List<ExpenseDto> expenseDtos = expenses.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(expenseDtos);
    }

    @Override
    public ApiResponse<Page<ExpenseDto>> getExpensesByProject(Long projectId, Pageable pageable) {
        // Get all expenses and filter by projectId
        List<ProjectExpense> allExpenses = expenseRepository.findByProjectIdOrderByPaymentDateDesc(projectId);
        
        // Manually implement pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allExpenses.size());
        List<ProjectExpense> pageExpenses = allExpenses.subList(start, end);
        
        // Convert to DTOs
        List<ExpenseDto> expenseDtos = pageExpenses.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        
        // Create Page manually
        Page<ExpenseDto> expensePage = new PageImpl<>(
                expenseDtos, pageable, allExpenses.size());
        
        return ApiResponse.success(expensePage);
    }

    @Override
    public ApiResponse<ExpenseDto> updateExpense(Long id, ExpenseUpdateDto expenseUpdateDto) {
        ProjectExpense expense = expenseRepository.findById(id).orElse(null);
        if (expense == null) {
            return ApiResponse.error("Expense not found");
        }

        // Store original project ID for total expense update
        Long originalProjectId = expense.getProject().getId();

        // Update fields
        if (expenseUpdateDto.getVendorId() != null) {
            Vendor vendor = vendorRepository.findById(expenseUpdateDto.getVendorId()).orElse(null);
            if (vendor != null) {
                expense.setVendor(vendor);
            }
        }
        if (expenseUpdateDto.getExpenseCategory() != null) {
            expense.setExpenseCategory(ProjectExpense.ExpenseCategory.valueOf(expenseUpdateDto.getExpenseCategory()));
        }
        if (expenseUpdateDto.getDescription() != null) {
            expense.setDescription(expenseUpdateDto.getDescription());
        }
        if (expenseUpdateDto.getAmount() != null) {
            expense.setAmount(expenseUpdateDto.getAmount());
        }
        if (expenseUpdateDto.getPaymentMethod() != null) {
            expense.setPaymentMethod(expenseUpdateDto.getPaymentMethod());
        }
        if (expenseUpdateDto.getPaymentDate() != null) {
            expense.setPaymentDate(expenseUpdateDto.getPaymentDate());
        }
        if (expenseUpdateDto.getReferenceNumber() != null) {
            expense.setReferenceNumber(expenseUpdateDto.getReferenceNumber());
        }
        if (expenseUpdateDto.getNotes() != null) {
            expense.setNotes(expenseUpdateDto.getNotes());
        }
        if (expenseUpdateDto.getPaidBy() != null) {
            expense.setPaidBy(expenseUpdateDto.getPaidBy());
        }
        if (expenseUpdateDto.getStatus() != null) {
            expense.setStatus(ProjectExpense.ExpenseStatus.valueOf(expenseUpdateDto.getStatus()));
        }

        ProjectExpense updated = expenseRepository.save(expense);

        // Update total expense for the project
        updateProjectTotalExpense(originalProjectId);

        return ApiResponse.success("Expense updated successfully", convertToDto(updated));
    }

    @Override
    public ApiResponse<String> deleteExpense(Long id) {
        ProjectExpense expense = expenseRepository.findById(id).orElse(null);
        if (expense == null) {
            return ApiResponse.error("Expense not found");
        }

        Long projectId = expense.getProject().getId();
        expenseRepository.delete(expense);

        // Update total expense for the project
        updateProjectTotalExpense(projectId);

        return ApiResponse.success("Expense deleted successfully");
    }

    @Override
    public BigDecimal getTotalExpenseByProject(Long projectId) {
        BigDecimal total = expenseRepository.sumAmountByProjectId(projectId);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public void updateProjectTotalExpense(Long projectId) {
        BigDecimal totalExpense = getTotalExpenseByProject(projectId);
        CustomerProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        project.setTotalExpense(totalExpense);
        projectRepository.save(project);
    }

    private ExpenseDto convertToDto(ProjectExpense expense) {
        ExpenseDto dto = new ExpenseDto();
        dto.setId(expense.getId());
        dto.setProjectId(expense.getProject().getId());
        dto.setProjectName(expense.getProject().getProjectName());
        dto.setVendorId(expense.getVendor().getId());
        dto.setVendorName(expense.getVendor().getVendorName());
        dto.setExpenseCategory(expense.getExpenseCategory().name());
        dto.setDescription(expense.getDescription());
        dto.setAmount(expense.getAmount());
        dto.setPaymentMethod(expense.getPaymentMethod());
        dto.setPaymentDate(expense.getPaymentDate());
        dto.setReferenceNumber(expense.getReferenceNumber());
        dto.setNotes(expense.getNotes());
        dto.setPaidBy(expense.getPaidBy());
        dto.setStatus(expense.getStatus().name());
        dto.setCreatedAt(expense.getCreatedAt());
        dto.setUpdatedAt(expense.getUpdatedAt());
        return dto;
    }
}

