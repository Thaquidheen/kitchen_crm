package com.fleetmanagement.kitchencrmbackend.modules.task.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.AdminTodoCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.AdminTodoDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.AdminTodoUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.entity.AdminTodo;
import com.fleetmanagement.kitchencrmbackend.modules.task.repository.AdminTodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminTodoServiceImpl implements AdminTodoService {

    @Autowired
    private AdminTodoRepository todoRepository;

    @Autowired
    private UserRepository userRepository;

    // Same day-granularity convention as customer reminders: the server runs UTC,
    // but "today" is the business day in this zone.
    @Value("${app.business-timezone:Asia/Kolkata}")
    private String businessTimezone;

    private LocalDate today() {
        return LocalDate.now(ZoneId.of(businessTimezone));
    }

    @Override
    public ApiResponse<AdminTodoDto> createTodo(AdminTodoCreateDto createDto, Long userId) {
        // Validate user exists
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.error("User not found");
        }

        // Create todo
        AdminTodo todo = new AdminTodo();
        todo.setUser(user);
        todo.setTodoTitle(createDto.getTodoTitle());
        todo.setTodoDescription(createDto.getTodoDescription());
        todo.setTodoDate(createDto.getTodoDate());
        todo.setNotes(createDto.getNotes());
        todo.setPriority(createDto.getPriority() != null ?
                AdminTodo.TodoPriority.valueOf(createDto.getPriority()) : AdminTodo.TodoPriority.MEDIUM);
        todo.setCategory(createDto.getCategory());
        todo.setCompleted(false);

        AdminTodo saved = todoRepository.save(todo);
        return ApiResponse.success("Todo created successfully", convertToDto(saved));
    }

    @Override
    public ApiResponse<AdminTodoDto> updateTodo(Long todoId, AdminTodoUpdateDto updateDto, Long userId) {
        AdminTodo todo = todoRepository.findById(todoId).orElse(null);
        if (todo == null) {
            return ApiResponse.error("Todo not found");
        }

        // Verify ownership
        if (!todo.getUser().getId().equals(userId)) {
            return ApiResponse.error("You can only update your own todos");
        }

        if (updateDto.getTodoTitle() != null) {
            todo.setTodoTitle(updateDto.getTodoTitle());
        }
        if (updateDto.getTodoDescription() != null) {
            todo.setTodoDescription(updateDto.getTodoDescription());
        }
        if (updateDto.getTodoDate() != null) {
            todo.setTodoDate(updateDto.getTodoDate());
        }
        if (Boolean.TRUE.equals(updateDto.getClearDate())) {
            todo.setTodoDate(null);
        }
        if (updateDto.getNotes() != null) {
            todo.setNotes(updateDto.getNotes());
        }
        if (updateDto.getPriority() != null) {
            todo.setPriority(AdminTodo.TodoPriority.valueOf(updateDto.getPriority()));
        }
        if (updateDto.getCategory() != null) {
            todo.setCategory(updateDto.getCategory());
        }

        AdminTodo updated = todoRepository.save(todo);
        return ApiResponse.success("Todo updated successfully", convertToDto(updated));
    }

    @Override
    public ApiResponse<AdminTodoDto> markTodoComplete(Long todoId, Long userId) {
        AdminTodo todo = todoRepository.findById(todoId).orElse(null);
        if (todo == null) {
            return ApiResponse.error("Todo not found");
        }

        // Verify ownership
        if (!todo.getUser().getId().equals(userId)) {
            return ApiResponse.error("You can only mark your own todos as complete");
        }

        todo.setCompleted(true);
        todo.setCompletedAt(LocalDateTime.now());

        AdminTodo updated = todoRepository.save(todo);
        return ApiResponse.success("Todo marked as complete", convertToDto(updated));
    }

    @Override
    public ApiResponse<AdminTodoDto> markTodoIncomplete(Long todoId, Long userId) {
        AdminTodo todo = todoRepository.findById(todoId).orElse(null);
        if (todo == null) {
            return ApiResponse.error("Todo not found");
        }

        // Verify ownership
        if (!todo.getUser().getId().equals(userId)) {
            return ApiResponse.error("You can only update your own todos");
        }

        todo.setCompleted(false);
        todo.setCompletedAt(null);

        AdminTodo updated = todoRepository.save(todo);
        return ApiResponse.success("Todo marked as incomplete", convertToDto(updated));
    }

    @Override
    public ApiResponse<List<AdminTodoDto>> getTodosByDate(Long userId, LocalDate date) {
        List<AdminTodo> todos = todoRepository.findByUserIdAndTodoDate(userId, date);
        List<AdminTodoDto> dtos = todos.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<List<AdminTodoDto>> getTodosByDateRange(Long userId, LocalDate fromDate, LocalDate toDate) {
        List<AdminTodo> todos = todoRepository.findByUserIdAndTodoDateBetween(userId, fromDate, toDate);
        List<AdminTodoDto> dtos = todos.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<List<AdminTodoDto>> getTodosByUser(Long userId) {
        List<AdminTodo> todos = todoRepository.findByUserId(userId);
        List<AdminTodoDto> dtos = todos.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<String> deleteTodo(Long todoId, Long userId) {
        AdminTodo todo = todoRepository.findById(todoId).orElse(null);
        if (todo == null) {
            return ApiResponse.error("Todo not found");
        }

        // Verify ownership
        if (!todo.getUser().getId().equals(userId)) {
            return ApiResponse.error("You can only delete your own todos");
        }

        todoRepository.delete(todo);
        return ApiResponse.success("Todo deleted successfully");
    }

    @Override
    public ApiResponse<AdminTodoDto> getTodoById(Long todoId, Long userId) {
        AdminTodo todo = todoRepository.findById(todoId).orElse(null);
        // Same error for missing and foreign todos so existence is never leaked.
        if (todo == null || !todo.getUser().getId().equals(userId)) {
            return ApiResponse.error("Todo not found");
        }
        return ApiResponse.success(convertToDto(todo));
    }

    @Override
    public ApiResponse<Map<String, Object>> getDueTodos(Long userId) {
        List<AdminTodo> due = todoRepository
                .findByUserIdAndCompletedFalseAndTodoDateLessThanEqualOrderByTodoDateAsc(userId, today());
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("count", due.size());
        payload.put("todos", due.stream().map(this::convertToDto).collect(Collectors.toList()));
        return ApiResponse.success(payload);
    }

    private AdminTodoDto convertToDto(AdminTodo todo) {
        AdminTodoDto dto = new AdminTodoDto();
        dto.setId(todo.getId());
        dto.setUserId(todo.getUser().getId());
        dto.setUserName(todo.getUser().getName());
        dto.setTodoTitle(todo.getTodoTitle());
        dto.setTodoDescription(todo.getTodoDescription());
        dto.setTodoDate(todo.getTodoDate());
        dto.setCompleted(todo.getCompleted());
        dto.setCompletedAt(todo.getCompletedAt());
        dto.setNotes(todo.getNotes());
        dto.setPriority(todo.getPriority().name());
        dto.setCategory(todo.getCategory());
        dto.setCreatedAt(todo.getCreatedAt());
        dto.setUpdatedAt(todo.getUpdatedAt());
        return dto;
    }
}




