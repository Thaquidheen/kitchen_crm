package com.fleetmanagement.kitchencrmbackend.modules.task.service;

import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskBulkCreateDto;
import org.springframework.beans.factory.annotation.Value;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.TaskCompletionStatsDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.entity.EmployeeTask;
import com.fleetmanagement.kitchencrmbackend.modules.task.entity.EmployeeTaskReply;
import com.fleetmanagement.kitchencrmbackend.modules.task.dto.EmployeeTaskReplyDto;
import com.fleetmanagement.kitchencrmbackend.modules.task.repository.EmployeeTaskReplyRepository;
import java.util.Collection;
import java.util.Collections;
import com.fleetmanagement.kitchencrmbackend.modules.task.repository.EmployeeTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmployeeTaskServiceImpl implements EmployeeTaskService {

    @Autowired
    private EmployeeTaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeTaskReplyRepository replyRepository;

    // Same day-granularity convention as reminders and to-dos: the server runs UTC, but
    // "today" (for due / overdue) is the business day in this zone.
    @Value("${app.business-timezone:Asia/Kolkata}")
    private String businessTimezone;

    private LocalDate today() {
        return LocalDate.now(ZoneId.of(businessTimezone));
    }

    @Override
    public ApiResponse<EmployeeTaskDto> createTask(EmployeeTaskCreateDto createDto, Long assignedByUserId) {
        // Validate employee exists
        User employee = userRepository.findById(createDto.getEmployeeId()).orElse(null);
        if (employee == null) {
            return ApiResponse.error("Employee not found");
        }

        // Validate admin exists
        User admin = userRepository.findById(assignedByUserId).orElse(null);
        if (admin == null) {
            return ApiResponse.error("Admin user not found");
        }

        // Create task
        EmployeeTask task = new EmployeeTask();
        task.setAssignedTo(employee);
        task.setAssignedBy(admin);
        task.setTaskTitle(createDto.getTaskTitle());
        task.setTaskDescription(createDto.getTaskDescription());
        task.setTaskDate(createDto.getTaskDate());
        task.setNotes(createDto.getNotes());
        task.setPriority(createDto.getPriority() != null ?
                EmployeeTask.TaskPriority.valueOf(createDto.getPriority()) : EmployeeTask.TaskPriority.MEDIUM);
        task.setStatus(createDto.getStatus() != null ?
                EmployeeTask.TaskStatus.valueOf(createDto.getStatus()) : EmployeeTask.TaskStatus.PENDING);
        task.setCompleted(false);

        EmployeeTask saved = taskRepository.save(task);
        return ApiResponse.success("Task assigned successfully", convertToDto(saved));
    }

    @Override
    public ApiResponse<EmployeeTaskDto> updateTask(Long taskId, EmployeeTaskUpdateDto updateDto, Long updatedByUserId) {
        EmployeeTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return ApiResponse.error("Task not found");
        }

        if (updateDto.getTaskTitle() != null) {
            task.setTaskTitle(updateDto.getTaskTitle());
        }
        if (updateDto.getTaskDescription() != null) {
            task.setTaskDescription(updateDto.getTaskDescription());
        }
        if (updateDto.getTaskDate() != null) {
            task.setTaskDate(updateDto.getTaskDate());
        }
        if (updateDto.getNotes() != null) {
            task.setNotes(updateDto.getNotes());
        }
        if (updateDto.getPriority() != null) {
            task.setPriority(EmployeeTask.TaskPriority.valueOf(updateDto.getPriority()));
        }
        if (updateDto.getStatus() != null) {
            task.setStatus(EmployeeTask.TaskStatus.valueOf(updateDto.getStatus()));
        }

        EmployeeTask updated = taskRepository.save(task);
        return ApiResponse.success("Task updated successfully", convertToDto(updated));
    }

    @Override
    public ApiResponse<EmployeeTaskDto> markTaskComplete(Long taskId, Long completedByUserId) {
        EmployeeTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return ApiResponse.error("Task not found");
        }

        // The assignee completes their own work; the assigner may also close it on their behalf.
        boolean byAssignee = task.getAssignedTo().getId().equals(completedByUserId);
        boolean byAssigner = task.getAssignedBy().getId().equals(completedByUserId);
        if (!byAssignee && !byAssigner) {
            return ApiResponse.error("You can only mark your own tasks as complete");
        }

        task.setCompleted(true);
        task.setCompletedAt(LocalDateTime.now());
        // A completion is "news" for the assigner until they see it - unless they closed it themselves.
        task.setCompletionSeenAt(byAssigner ? LocalDateTime.now() : null);
        if (task.getAcknowledgedAt() == null) {
            task.setAcknowledgedAt(LocalDateTime.now());
        }
        if (task.getStatus() == EmployeeTask.TaskStatus.PENDING || task.getStatus() == EmployeeTask.TaskStatus.IN_PROGRESS) {
            task.setStatus(EmployeeTask.TaskStatus.COMPLETED);
        }

        EmployeeTask updated = taskRepository.save(task);
        return ApiResponse.success("Task marked as complete", convertToDto(updated));
    }

    @Override
    public ApiResponse<EmployeeTaskDto> markTaskIncomplete(Long taskId, Long updatedByUserId) {
        EmployeeTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return ApiResponse.error("Task not found");
        }

        // Reopen: the assignee (undo) or the assigner (send it back). Clearing the seen-stamp means
        // a later re-completion shows up in the assigner's bell again.
        if (!task.getAssignedTo().getId().equals(updatedByUserId)
                && !task.getAssignedBy().getId().equals(updatedByUserId)) {
            return ApiResponse.error("You can only reopen your own tasks");
        }
        task.setCompleted(false);
        task.setCompletedAt(null);
        task.setCompletionSeenAt(null);
        if (task.getStatus() == EmployeeTask.TaskStatus.COMPLETED) {
            task.setStatus(EmployeeTask.TaskStatus.PENDING);
        }

        EmployeeTask updated = taskRepository.save(task);
        return ApiResponse.success("Task marked as incomplete", convertToDto(updated));
    }

    @Override
    public ApiResponse<List<EmployeeTaskDto>> getTasksByEmployeeAndDate(Long employeeId, LocalDate date) {
        List<EmployeeTask> tasks = taskRepository.findByAssignedToIdAndTaskDate(employeeId, date);
        List<EmployeeTaskDto> dtos = toDtos(tasks);
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<List<EmployeeTaskDto>> getTasksByDate(LocalDate date) {
        List<EmployeeTask> tasks = taskRepository.findByTaskDate(date);
        List<EmployeeTaskDto> dtos = toDtos(tasks);
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<List<EmployeeTaskDto>> getTasksByEmployeeAndDateRange(Long employeeId, LocalDate fromDate, LocalDate toDate) {
        List<EmployeeTask> tasks = taskRepository.findByAssignedToIdAndTaskDateBetween(employeeId, fromDate, toDate);
        List<EmployeeTaskDto> dtos = toDtos(tasks);
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<List<EmployeeTaskDto>> getTasksByEmployee(Long employeeId) {
        List<EmployeeTask> tasks = taskRepository.findByAssignedToIdOrderByTaskDateAscIdAsc(employeeId);
        List<EmployeeTaskDto> dtos = toDtos(tasks);
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<List<EmployeeTaskDto>> getMyTasks(Long userId, LocalDate date) {
        if (date != null) {
            return getTasksByEmployeeAndDate(userId, date);
        }
        return getTasksByEmployee(userId);
    }

    @Override
    public ApiResponse<TaskCompletionStatsDto> getTaskCompletionStats(LocalDate fromDate, LocalDate toDate) {
        List<EmployeeTask> allTasks = taskRepository.findByTaskDateBetween(fromDate, toDate);
        
        TaskCompletionStatsDto stats = new TaskCompletionStatsDto();
        stats.setFromDate(fromDate);
        stats.setToDate(toDate);
        stats.setTotalTasks((long) allTasks.size());
        stats.setCompletedTasks(allTasks.stream().filter(t -> Boolean.TRUE.equals(t.getCompleted())).count());
        stats.setPendingTasks(allTasks.stream().filter(t -> !Boolean.TRUE.equals(t.getCompleted())).count());
        
        double completionRate = stats.getTotalTasks() > 0 ? 
                (stats.getCompletedTasks() * 100.0) / stats.getTotalTasks() : 0.0;
        stats.setCompletionRate(completionRate);

        // Group by employee
        Map<String, Long> tasksByEmployee = new HashMap<>();
        Map<Long, String> employeeNames = new HashMap<>();
        for (EmployeeTask task : allTasks) {
            Long empId = task.getAssignedTo().getId();
            String empName = task.getAssignedTo().getName();
            employeeNames.put(empId, empName);
            tasksByEmployee.put(empName, tasksByEmployee.getOrDefault(empName, 0L) + 1);
        }
        stats.setTasksByEmployee(tasksByEmployee);

        // Group by date
        Map<String, Long> tasksByDate = new HashMap<>();
        for (EmployeeTask task : allTasks) {
            String dateStr = task.getTaskDate().toString();
            tasksByDate.put(dateStr, tasksByDate.getOrDefault(dateStr, 0L) + 1);
        }
        stats.setTasksByDate(tasksByDate);

        // Group by priority
        Map<String, Long> tasksByPriority = new HashMap<>();
        for (EmployeeTask task : allTasks) {
            String priority = task.getPriority().name();
            tasksByPriority.put(priority, tasksByPriority.getOrDefault(priority, 0L) + 1);
        }
        stats.setTasksByPriority(tasksByPriority);

        // Group by status
        Map<String, Long> tasksByStatus = new HashMap<>();
        for (EmployeeTask task : allTasks) {
            String status = task.getStatus().name();
            tasksByStatus.put(status, tasksByStatus.getOrDefault(status, 0L) + 1);
        }
        stats.setTasksByStatus(tasksByStatus);

        // Employee stats
        List<TaskCompletionStatsDto.EmployeeTaskStatsDto> employeeStats = employeeNames.entrySet().stream()
                .map(entry -> {
                    Long empId = entry.getKey();
                    String empName = entry.getValue();
                    List<EmployeeTask> empTasks = allTasks.stream()
                            .filter(t -> t.getAssignedTo().getId().equals(empId))
                            .collect(Collectors.toList());
                    long total = empTasks.size();
                    long completed = empTasks.stream().filter(t -> Boolean.TRUE.equals(t.getCompleted())).count();
                    long pending = total - completed;
                    double rate = total > 0 ? (completed * 100.0) / total : 0.0;
                    
                    TaskCompletionStatsDto.EmployeeTaskStatsDto empStat = new TaskCompletionStatsDto.EmployeeTaskStatsDto();
                    empStat.setEmployeeId(empId);
                    empStat.setEmployeeName(empName);
                    empStat.setTotalTasks(total);
                    empStat.setCompletedTasks(completed);
                    empStat.setPendingTasks(pending);
                    empStat.setCompletionRate(rate);
                    return empStat;
                })
                .collect(Collectors.toList());
        stats.setEmployeeStats(employeeStats);

        return ApiResponse.success(stats);
    }

    @Override
    public ApiResponse<String> deleteTask(Long taskId, Long deletedByUserId) {
        EmployeeTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return ApiResponse.error("Task not found");
        }

        taskRepository.delete(task);
        return ApiResponse.success("Task deleted successfully");
    }

    @Override
    public ApiResponse<EmployeeTaskDto> getTaskById(Long taskId, Long userId) {
        EmployeeTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return ApiResponse.error("Task not found");
        }
        // Same answer for missing and foreign tasks so existence is never leaked.
        if (!task.getAssignedTo().getId().equals(userId) && !task.getAssignedBy().getId().equals(userId)) {
            return ApiResponse.error("Task not found");
        }
        return ApiResponse.success(convertToDto(task));
    }

    @Override
    public ApiResponse<List<EmployeeTaskDto>> assignMany(EmployeeTaskBulkCreateDto dto, Long assignedByUserId) {
        User admin = userRepository.findById(assignedByUserId).orElse(null);
        if (admin == null) {
            return ApiResponse.error("Admin user not found");
        }
        EmployeeTask.TaskPriority priority = dto.getPriority() != null
                ? EmployeeTask.TaskPriority.valueOf(dto.getPriority()) : EmployeeTask.TaskPriority.MEDIUM;
        List<EmployeeTaskDto> created = new ArrayList<>();
        // De-duplicate so a double-toggled checkbox cannot assign the same task twice.
        for (Long employeeId : new LinkedHashSet<>(dto.getEmployeeIds())) {
            User employee = userRepository.findById(employeeId).orElse(null);
            if (employee == null) {
                return ApiResponse.error("Staff member not found: " + employeeId);
            }
            EmployeeTask task = new EmployeeTask();
            task.setAssignedTo(employee);
            task.setAssignedBy(admin);
            task.setTaskTitle(dto.getTaskTitle().trim());
            task.setTaskDescription(dto.getTaskDescription());
            task.setTaskDate(dto.getTaskDate());
            task.setNotes(dto.getNotes());
            task.setPriority(priority);
            task.setStatus(EmployeeTask.TaskStatus.PENDING);
            task.setCompleted(false);
            created.add(convertToDto(taskRepository.save(task)));
        }
        return ApiResponse.success("Task assigned to " + created.size() + " staff member"
                + (created.size() == 1 ? "" : "s"), created);
    }

    @Override
    public ApiResponse<List<EmployeeTaskDto>> getTasksAssignedBy(Long adminId) {
        return ApiResponse.success(toDtos(taskRepository.findByAssignedByIdOrderByTaskDateDescIdDesc(adminId)));
    }

    @Override
    public ApiResponse<Map<String, Object>> getMyDueTasks(Long userId) {
        List<EmployeeTask> due = taskRepository.findDueForAssignee(userId, today());
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("count", due.size());
        payload.put("tasks", toDtos(due));
        return ApiResponse.success(payload);
    }

    @Override
    public ApiResponse<Map<String, Object>> getAssignerAttention(Long adminId) {
        List<EmployeeTask> items = taskRepository.findAttentionForAssigner(adminId, today());
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("count", items.size());
        payload.put("tasks", toDtos(items));
        return ApiResponse.success(payload);
    }

    @Override
    public ApiResponse<Integer> acknowledgeAllMine(Long userId) {
        return ApiResponse.success(taskRepository.acknowledgeAllForAssignee(userId, LocalDateTime.now()));
    }

    @Override
    public ApiResponse<EmployeeTaskDto> markCompletionSeen(Long taskId, Long adminId) {
        EmployeeTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null || !task.getAssignedBy().getId().equals(adminId)) {
            return ApiResponse.error("Task not found");
        }
        if (Boolean.TRUE.equals(task.getCompleted()) && task.getCompletionSeenAt() == null) {
            task.setCompletionSeenAt(LocalDateTime.now());
            task = taskRepository.save(task);
        }
        return ApiResponse.success(convertToDto(task));
    }

    @Override
    public ApiResponse<Integer> markAllCompletionsSeen(Long adminId) {
        return ApiResponse.success(taskRepository.markAllCompletionsSeen(adminId, LocalDateTime.now()));
    }

    // ---- Reply thread ----

    @Override
    public ApiResponse<EmployeeTaskDto> addReply(Long taskId, Long userId, String userName, String message) {
        EmployeeTask task = taskRepository.findById(taskId).orElse(null);
        // Same answer for missing and foreign tasks so existence is never leaked.
        if (task == null || userId == null) {
            return ApiResponse.error("Task not found");
        }
        boolean isAssignee = task.getAssignedTo().getId().equals(userId);
        boolean isAssigner = task.getAssignedBy().getId().equals(userId);
        if (!isAssignee && !isAssigner) {
            return ApiResponse.error("Task not found");
        }
        String text = message == null ? "" : message.trim();
        if (text.isEmpty()) {
            return ApiResponse.error("Type a reply first");
        }
        if (text.length() > 2000) {
            return ApiResponse.error("Replies are limited to 2000 characters");
        }
        LocalDateTime now = LocalDateTime.now();
        EmployeeTaskReply reply = new EmployeeTaskReply();
        reply.setTask(task);
        reply.setAuthorUserId(userId);
        reply.setAuthorName(userName);
        // If someone assigned a task to themselves, their messages count as the assignee's.
        reply.setFromAssignee(isAssignee);
        reply.setMessage(text);
        reply.setCreatedAt(now);
        replyRepository.save(reply);
        // Writing in the thread means you have read it.
        if (isAssignee) {
            task.setAssigneeRepliesSeenAt(now);
        }
        if (isAssigner) {
            task.setAssignerRepliesSeenAt(now);
        }
        task = taskRepository.save(task);
        return ApiResponse.success("Reply sent", convertToDto(task));
    }

    @Override
    public ApiResponse<EmployeeTaskDto> markRepliesSeen(Long taskId, Long userId) {
        EmployeeTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null || userId == null) {
            return ApiResponse.error("Task not found");
        }
        boolean isAssignee = task.getAssignedTo().getId().equals(userId);
        boolean isAssigner = task.getAssignedBy().getId().equals(userId);
        if (!isAssignee && !isAssigner) {
            return ApiResponse.error("Task not found");
        }
        LocalDateTime now = LocalDateTime.now();
        if (isAssignee) {
            task.setAssigneeRepliesSeenAt(now);
        }
        if (isAssigner) {
            task.setAssignerRepliesSeenAt(now);
        }
        task = taskRepository.save(task);
        return ApiResponse.success(convertToDto(task));
    }

    /** Threads for many tasks in one query (chunked), keyed by task id. */
    private Map<Long, List<EmployeeTaskReply>> repliesFor(Collection<EmployeeTask> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Long> ids = tasks.stream().map(EmployeeTask::getId).distinct().collect(Collectors.toList());
        Map<Long, List<EmployeeTaskReply>> byTask = new HashMap<>();
        for (int i = 0; i < ids.size(); i += 500) {
            List<Long> chunk = ids.subList(i, Math.min(ids.size(), i + 500));
            for (EmployeeTaskReply r : replyRepository.findForTasks(chunk)) {
                byTask.computeIfAbsent(r.getTask().getId(), k -> new ArrayList<>()).add(r);
            }
        }
        return byTask;
    }

    private List<EmployeeTaskDto> toDtos(List<EmployeeTask> tasks) {
        Map<Long, List<EmployeeTaskReply>> threads = repliesFor(tasks);
        return tasks.stream()
                .map(t -> convertToDto(t, threads.getOrDefault(t.getId(), Collections.emptyList())))
                .collect(Collectors.toList());
    }

    private EmployeeTaskDto convertToDto(EmployeeTask task) {
        return convertToDto(task, repliesFor(Collections.singletonList(task))
                .getOrDefault(task.getId(), Collections.emptyList()));
    }

    private EmployeeTaskDto convertToDto(EmployeeTask task, List<EmployeeTaskReply> thread) {
        EmployeeTaskDto dto = new EmployeeTaskDto();
        dto.setId(task.getId());
        dto.setAssignedToUserId(task.getAssignedTo().getId());
        dto.setAssignedToUserName(task.getAssignedTo().getName());
        dto.setAssignedByUserId(task.getAssignedBy().getId());
        dto.setAssignedByName(task.getAssignedBy().getName());
        dto.setTaskTitle(task.getTaskTitle());
        dto.setTaskDescription(task.getTaskDescription());
        dto.setTaskDate(task.getTaskDate());
        dto.setCompleted(task.getCompleted());
        dto.setCompletedAt(task.getCompletedAt());
        dto.setNotes(task.getNotes());
        dto.setPriority(task.getPriority().name());
        dto.setStatus(task.getStatus().name());
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        dto.setAcknowledgedAt(task.getAcknowledgedAt());
        dto.setCompletionSeenAt(task.getCompletionSeenAt());
        boolean open = !Boolean.TRUE.equals(task.getCompleted());
        dto.setOverdue(open && task.getTaskDate() != null && task.getTaskDate().isBefore(today()));
        dto.setNewForAssignee(open && task.getAcknowledgedAt() == null);

        List<EmployeeTaskReplyDto> replies = new ArrayList<>(thread.size());
        int unreadForAssigner = 0;
        int unreadForAssignee = 0;
        LocalDateTime last = null;
        for (EmployeeTaskReply r : thread) {
            replies.add(new EmployeeTaskReplyDto(r.getId(), r.getAuthorUserId(), r.getAuthorName(),
                    r.getFromAssignee(), r.getMessage(), r.getCreatedAt()));
            boolean fromAssignee = Boolean.TRUE.equals(r.getFromAssignee());
            if (fromAssignee && isAfter(r.getCreatedAt(), task.getAssignerRepliesSeenAt())) {
                unreadForAssigner++;
            }
            if (!fromAssignee && isAfter(r.getCreatedAt(), task.getAssigneeRepliesSeenAt())) {
                unreadForAssignee++;
            }
            if (last == null || (r.getCreatedAt() != null && r.getCreatedAt().isAfter(last))) {
                last = r.getCreatedAt();
            }
        }
        dto.setReplies(replies);
        dto.setReplyCount(replies.size());
        dto.setUnreadForAssigner(unreadForAssigner);
        dto.setUnreadForAssignee(unreadForAssignee);
        dto.setLastReplyAt(last);
        return dto;
    }

    /** A reply is unread when it was written after the reader last looked (or they never did). */
    private static boolean isAfter(LocalDateTime written, LocalDateTime seen) {
        return seen == null || (written != null && written.isAfter(seen));
    }
}




