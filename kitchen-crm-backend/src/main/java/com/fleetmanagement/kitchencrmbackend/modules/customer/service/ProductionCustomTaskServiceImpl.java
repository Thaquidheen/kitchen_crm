package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionCustomTaskCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionCustomTaskDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionCustomTaskUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionCustomTask;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionInstallation;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionTaskGroup;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionCustomTaskRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionInstallationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionTaskGroupRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductionCustomTaskServiceImpl implements ProductionCustomTaskService {

    private final ProductionCustomTaskRepository taskRepository;
    private final ProductionInstallationRepository productionInstallationRepository;
    private final ProductionTaskGroupRepository taskGroupRepository;
    private final UserRepository userRepository;
    private final CustomerReminderService customerReminderService;
    private final com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerReminderRepository customerReminderRepository;

    @Override
    @Transactional
    public ApiResponse<ProductionCustomTaskDto> createTask(ProductionCustomTaskCreateDto createDto) {
        try {
            // Find production installation by customer ID
            Optional<ProductionInstallation> productionOpt = productionInstallationRepository
                    .findByCustomerId(createDto.getCustomerId());

            if (productionOpt.isEmpty()) {
                return ApiResponse.error("No production installation found for customer ID: " + createDto.getCustomerId());
            }

            ProductionInstallation production = productionOpt.get();
            User currentUser = getCurrentUser();

            ProductionCustomTask task = new ProductionCustomTask();
            task.setProductionInstallation(production);
            task.setTaskTitle(createDto.getTaskTitle());
            task.setTaskDescription(createDto.getTaskDescription());
            task.setNotes(createDto.getNotes());
            task.setCompleted(false);
            task.setCreatedByUser(currentUser);

            // Set phase
            if (createDto.getPhase() != null && !createDto.getPhase().isEmpty()) {
                try {
                    task.setPhase(ProductionCustomTask.TaskPhase.valueOf(createDto.getPhase().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    task.setPhase(ProductionCustomTask.TaskPhase.CUSTOM);
                }
            } else {
                task.setPhase(ProductionCustomTask.TaskPhase.CUSTOM);
            }

            // Set priority
            if (createDto.getPriority() != null && !createDto.getPriority().isEmpty()) {
                try {
                    task.setPriority(ProductionCustomTask.TaskPriority.valueOf(createDto.getPriority().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    task.setPriority(ProductionCustomTask.TaskPriority.MEDIUM);
                }
            }

            // Set sort order
            if (createDto.getSortOrder() != null) {
                task.setSortOrder(createDto.getSortOrder());
            } else {
                // Get the next sort order
                Long count = taskRepository.countByCustomerId(createDto.getCustomerId());
                task.setSortOrder(count.intValue());
            }

            // Set task group if provided
            if (createDto.getTaskGroupId() != null) {
                Optional<ProductionTaskGroup> groupOpt = taskGroupRepository.findById(createDto.getTaskGroupId());
                if (groupOpt.isPresent()) {
                    task.setTaskGroup(groupOpt.get());
                }
            }

            ProductionCustomTask savedTask = taskRepository.save(task);
            log.info("Created custom task '{}' for customer ID: {}", savedTask.getTaskTitle(), createDto.getCustomerId());

            return ApiResponse.success("Task created successfully", ProductionCustomTaskDto.fromEntity(savedTask));
        } catch (Exception e) {
            log.error("Error creating custom task: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to create task: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ApiResponse<ProductionCustomTaskDto> updateTask(Long taskId, ProductionCustomTaskUpdateDto updateDto) {
        try {
            Optional<ProductionCustomTask> taskOpt = taskRepository.findById(taskId);
            if (taskOpt.isEmpty()) {
                return ApiResponse.error("Task not found with ID: " + taskId);
            }

            ProductionCustomTask task = taskOpt.get();

            if (updateDto.getTaskTitle() != null) {
                task.setTaskTitle(updateDto.getTaskTitle());
            }
            if (updateDto.getTaskDescription() != null) {
                task.setTaskDescription(updateDto.getTaskDescription());
            }
            if (updateDto.getNotes() != null) {
                task.setNotes(updateDto.getNotes());
            }
            if (updateDto.getSortOrder() != null) {
                task.setSortOrder(updateDto.getSortOrder());
            }

            // Update phase
            if (updateDto.getPhase() != null && !updateDto.getPhase().isEmpty()) {
                try {
                    task.setPhase(ProductionCustomTask.TaskPhase.valueOf(updateDto.getPhase().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    // Keep existing phase
                }
            }

            // Update priority
            if (updateDto.getPriority() != null && !updateDto.getPriority().isEmpty()) {
                try {
                    task.setPriority(ProductionCustomTask.TaskPriority.valueOf(updateDto.getPriority().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    // Keep existing priority
                }
            }

            // Update completion status
            if (updateDto.getCompleted() != null) {
                task.setCompleted(updateDto.getCompleted());
                if (updateDto.getCompleted()) {
                    task.setCompletedAt(LocalDateTime.now());
                    task.setCompletedBy(getCurrentUser());
                    task.setCompletionDate(updateDto.getCompletionDate() != null ? updateDto.getCompletionDate() : LocalDate.now());
                } else {
                    task.setCompletedAt(null);
                    task.setCompletedBy(null);
                    task.setCompletionDate(null);
                }
            }

            ProductionCustomTask savedTask = taskRepository.save(task);
            log.info("Updated custom task ID: {}", taskId);

            return ApiResponse.success("Task updated successfully", ProductionCustomTaskDto.fromEntity(savedTask));
        } catch (Exception e) {
            log.error("Error updating custom task: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to update task: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ApiResponse<ProductionCustomTaskDto> toggleTaskCompletion(Long taskId) {
        try {
            Optional<ProductionCustomTask> taskOpt = taskRepository.findById(taskId);
            if (taskOpt.isEmpty()) {
                return ApiResponse.error("Task not found with ID: " + taskId);
            }

            ProductionCustomTask task = taskOpt.get();
            boolean newCompletedStatus = !Boolean.TRUE.equals(task.getCompleted());

            task.setCompleted(newCompletedStatus);
            if (newCompletedStatus) {
                task.setCompletedAt(LocalDateTime.now());
                task.setCompletedBy(getCurrentUser());
                task.setCompletionDate(LocalDate.now());
            } else {
                task.setCompletedAt(null);
                task.setCompletedBy(null);
                task.setCompletionDate(null);
            }

            ProductionCustomTask savedTask = taskRepository.save(task);
            log.info("Toggled custom task ID: {} to completed={}", taskId, newCompletedStatus);

            return ApiResponse.success(
                    newCompletedStatus ? "Task marked as completed" : "Task marked as incomplete",
                    ProductionCustomTaskDto.fromEntity(savedTask));
        } catch (Exception e) {
            log.error("Error toggling task completion: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to toggle task: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<ProductionCustomTaskDto>> getTasksByCustomerId(Long customerId) {
        try {
            List<ProductionCustomTask> tasks = taskRepository.findByCustomerIdOrderBySortOrderAsc(customerId);
            List<ProductionCustomTaskDto> dtos = tasks.stream()
                    .map(ProductionCustomTaskDto::fromEntity)
                    .collect(Collectors.toList());

            return ApiResponse.success("Tasks retrieved successfully", dtos);
        } catch (Exception e) {
            log.error("Error fetching tasks for customer: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to fetch tasks: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<ProductionCustomTaskDto>> getTasksByCustomerIdAndPhase(Long customerId, String phase) {
        try {
            ProductionCustomTask.TaskPhase taskPhase = ProductionCustomTask.TaskPhase.valueOf(phase.toUpperCase());
            List<ProductionCustomTask> tasks = taskRepository.findByCustomerIdAndPhaseOrderBySortOrderAsc(customerId, taskPhase);
            List<ProductionCustomTaskDto> dtos = tasks.stream()
                    .map(ProductionCustomTaskDto::fromEntity)
                    .collect(Collectors.toList());

            return ApiResponse.success("Tasks retrieved successfully", dtos);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("Invalid phase: " + phase);
        } catch (Exception e) {
            log.error("Error fetching tasks by phase: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to fetch tasks: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<ProductionCustomTaskDto> getTaskById(Long taskId) {
        try {
            Optional<ProductionCustomTask> taskOpt = taskRepository.findById(taskId);
            if (taskOpt.isEmpty()) {
                return ApiResponse.error("Task not found with ID: " + taskId);
            }

            return ApiResponse.success("Task retrieved successfully", ProductionCustomTaskDto.fromEntity(taskOpt.get()));
        } catch (Exception e) {
            log.error("Error fetching task: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to fetch task: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ApiResponse<Void> deleteTask(Long taskId) {
        try {
            Optional<ProductionCustomTask> taskOpt = taskRepository.findById(taskId);
            if (taskOpt.isEmpty()) {
                return ApiResponse.error("Task not found with ID: " + taskId);
            }

            taskRepository.deleteById(taskId);
            log.info("Deleted custom task ID: {}", taskId);

            return ApiResponse.success("Task deleted successfully", null);
        } catch (Exception e) {
            log.error("Error deleting task: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to delete task: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ApiResponse<List<ProductionCustomTaskDto>> reorderTasks(Long customerId, List<Long> taskIds) {
        try {
            List<ProductionCustomTaskDto> reorderedTasks = new ArrayList<>();

            for (int i = 0; i < taskIds.size(); i++) {
                Optional<ProductionCustomTask> taskOpt = taskRepository.findById(taskIds.get(i));
                if (taskOpt.isPresent()) {
                    ProductionCustomTask task = taskOpt.get();
                    task.setSortOrder(i);
                    ProductionCustomTask savedTask = taskRepository.save(task);
                    reorderedTasks.add(ProductionCustomTaskDto.fromEntity(savedTask));
                }
            }

            log.info("Reordered {} tasks for customer ID: {}", taskIds.size(), customerId);
            return ApiResponse.success("Tasks reordered successfully", reorderedTasks);
        } catch (Exception e) {
            log.error("Error reordering tasks: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to reorder tasks: " + e.getMessage());
        }
    }

    private User getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getName() != null) {
                return userRepository.findByEmail(authentication.getName()).orElse(null);
            }
        } catch (Exception e) {
            log.warn("Could not get current user: {}", e.getMessage());
        }
        return null;
    }

    @Override
    public ApiResponse<ProductionCustomTaskDto> setTaskReminder(Long taskId, java.time.LocalDateTime remindAt,
                                                                String notes, String createdBy) {
        ProductionCustomTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return ApiResponse.error("Task not found");
        }
        if (remindAt == null) {
            return ApiResponse.error("A reminder date is required");
        }

        com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerReminderDto reminderDto =
                new com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerReminderDto();
        reminderDto.setCustomerId(task.getProductionInstallation().getCustomer().getId());
        reminderDto.setTitle(task.getTaskTitle());
        reminderDto.setNotes(notes != null && !notes.isBlank() ? notes : task.getTaskDescription());
        reminderDto.setRemindAt(remindAt);
        reminderDto.setSource("PRODUCTION");

        ApiResponse<com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerReminderDto> created =
                customerReminderService.createReminder(reminderDto, createdBy);
        if (!Boolean.TRUE.equals(created.getSuccess()) || created.getData() == null) {
            return ApiResponse.error(created.getMessage() != null ? created.getMessage() : "Failed to create reminder");
        }

        task.setReminder(customerReminderRepository.findById(created.getData().getId()).orElse(null));
        ProductionCustomTask saved = taskRepository.save(task);
        return ApiResponse.success("Reminder set", ProductionCustomTaskDto.fromEntity(saved));
    }
}
