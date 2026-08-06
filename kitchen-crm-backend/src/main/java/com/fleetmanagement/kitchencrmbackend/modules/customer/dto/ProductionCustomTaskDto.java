package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionCustomTask;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductionCustomTaskDto {
    private Long id;
    private Long productionInstallationId;
    private Long customerId;
    private String taskTitle;
    private String taskDescription;
    private String phase;
    private Boolean completed;
    private LocalDate completionDate;
    private LocalDateTime completedAt;
    private Long completedByUserId;
    private String completedByUserName;
    private String priority;
    private Integer sortOrder;
    private String notes;
    private Long createdByUserId;
    private String createdByUserName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long taskGroupId;
    private String taskGroupTitle;

    // Linked reminder (null when none is set)
    private Long reminderId;
    private LocalDateTime reminderDate;

    public static ProductionCustomTaskDto fromEntity(ProductionCustomTask entity) {
        ProductionCustomTaskDto dto = new ProductionCustomTaskDto();
        dto.setId(entity.getId());
        dto.setProductionInstallationId(entity.getProductionInstallation().getId());
        dto.setCustomerId(entity.getProductionInstallation().getCustomer().getId());
        dto.setTaskTitle(entity.getTaskTitle());
        dto.setTaskDescription(entity.getTaskDescription());
        dto.setPhase(entity.getPhase() != null ? entity.getPhase().name() : null);
        dto.setCompleted(entity.getCompleted());
        dto.setCompletionDate(entity.getCompletionDate());
        dto.setCompletedAt(entity.getCompletedAt());
        if (entity.getCompletedBy() != null) {
            dto.setCompletedByUserId(entity.getCompletedBy().getId());
            dto.setCompletedByUserName(entity.getCompletedBy().getName());
        }
        dto.setPriority(entity.getPriority() != null ? entity.getPriority().name() : null);
        dto.setSortOrder(entity.getSortOrder());
        dto.setNotes(entity.getNotes());
        if (entity.getCreatedByUser() != null) {
            dto.setCreatedByUserId(entity.getCreatedByUser().getId());
            dto.setCreatedByUserName(entity.getCreatedByUser().getName());
        }
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        if (entity.getTaskGroup() != null) {
            dto.setTaskGroupId(entity.getTaskGroup().getId());
            dto.setTaskGroupTitle(entity.getTaskGroup().getGroupTitle());
        }
        if (entity.getReminder() != null) {
            dto.setReminderId(entity.getReminder().getId());
            dto.setReminderDate(entity.getReminder().getRemindAt());
        }
        return dto;
    }
}
