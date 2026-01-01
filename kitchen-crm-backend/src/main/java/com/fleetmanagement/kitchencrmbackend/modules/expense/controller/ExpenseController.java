package com.fleetmanagement.kitchencrmbackend.modules.expense.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.expense.dto.ExpenseCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.expense.dto.ExpenseDto;
import com.fleetmanagement.kitchencrmbackend.modules.expense.dto.ExpenseUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.expense.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/expenses")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseDto>> createExpense(@Valid @RequestBody ExpenseCreateDto expenseCreateDto) {
        ApiResponse<ExpenseDto> response = expenseService.createExpense(expenseCreateDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseDto>> getExpenseById(@PathVariable Long id) {
        ApiResponse<ExpenseDto> response = expenseService.getExpenseById(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<ExpenseDto>>> getExpensesByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(expenseService.getExpensesByProject(projectId));
    }

    @GetMapping("/project/{projectId}/page")
    public ResponseEntity<ApiResponse<Page<ExpenseDto>>> getExpensesByProjectPaginated(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "paymentDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return ResponseEntity.ok(expenseService.getExpensesByProject(projectId, pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseDto>> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseUpdateDto expenseUpdateDto) {
        ApiResponse<ExpenseDto> response = expenseService.updateExpense(id, expenseUpdateDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteExpense(@PathVariable Long id) {
        ApiResponse<String> response = expenseService.deleteExpense(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}






