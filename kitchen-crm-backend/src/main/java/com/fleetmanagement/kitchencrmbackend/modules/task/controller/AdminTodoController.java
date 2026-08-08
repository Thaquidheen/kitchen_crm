package com.fleetmanagement.kitchencrmbackend.modules.task.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.AdminTodoCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.AdminTodoDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.AdminTodoUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.service.AdminTodoService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Personal to-dos. Every endpoint is scoped to the logged-in user and the service
 * enforces ownership on each mutation, so any authenticated staff member can use
 * this and still only ever see their own list.
 */
@RestController
@RequestMapping("/api/v1/tasks/admin-todo")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminTodoController {

    @Autowired
    private AdminTodoService todoService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<AdminTodoDto>> createTodo(
            @Valid @RequestBody AdminTodoCreateDto createDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<AdminTodoDto> response = todoService.createTodo(createDto, currentUser.getId());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<ApiResponse<List<AdminTodoDto>>> getTodosByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(todoService.getTodosByDate(currentUser.getId(), date));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<AdminTodoDto>>> getTodosByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(todoService.getTodosByDateRange(currentUser.getId(), fromDate, toDate));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminTodoDto>>> getTodosByUser(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(todoService.getTodosByUser(currentUser.getId()));
    }

    /** Bell feed: the current user's open, dated to-dos due today or earlier. */
    @GetMapping("/due")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDueTodos(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(todoService.getDueTodos(currentUser.getId()));
    }

    @PutMapping("/{todoId}/complete")
    public ResponseEntity<ApiResponse<AdminTodoDto>> markTodoComplete(
            @PathVariable Long todoId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<AdminTodoDto> response = todoService.markTodoComplete(todoId, currentUser.getId());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{todoId}/incomplete")
    public ResponseEntity<ApiResponse<AdminTodoDto>> markTodoIncomplete(
            @PathVariable Long todoId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<AdminTodoDto> response = todoService.markTodoIncomplete(todoId, currentUser.getId());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{todoId}")
    public ResponseEntity<ApiResponse<AdminTodoDto>> updateTodo(
            @PathVariable Long todoId,
            @Valid @RequestBody AdminTodoUpdateDto updateDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<AdminTodoDto> response = todoService.updateTodo(todoId, updateDto, currentUser.getId());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{todoId}")
    public ResponseEntity<ApiResponse<String>> deleteTodo(
            @PathVariable Long todoId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<String> response = todoService.deleteTodo(todoId, currentUser.getId());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{todoId}")
    public ResponseEntity<ApiResponse<AdminTodoDto>> getTodoById(
            @PathVariable Long todoId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<AdminTodoDto> response = todoService.getTodoById(todoId, currentUser.getId());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
