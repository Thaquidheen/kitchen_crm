package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionTaskGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionTaskGroupDto {

    private Long id;
    private Long productionInstallationId;
    private String groupTitle;
    private String groupDescription;
    private Integer sortOrder;
    private Boolean isExpanded;
    private Long createdByUserId;
    private String createdByUserName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ProductionCustomTaskDto> tasks;
    private Integer totalTasks;
    private Integer completedTasks;

    public static ProductionTaskGroupDto fromEntity(ProductionTaskGroup entity) {
        if (entity == null) return null;

        List<ProductionCustomTaskDto> taskDtos = null;
        int totalTasks = 0;
        int completedTasks = 0;

        if (entity.getTasks() != null) {
            taskDtos = entity.getTasks().stream()
                    .map(ProductionCustomTaskDto::fromEntity)
                    .collect(Collectors.toList());
            totalTasks = entity.getTasks().size();
            completedTasks = (int) entity.getTasks().stream()
                    .filter(t -> Boolean.TRUE.equals(t.getCompleted()))
                    .count();
        }

        return ProductionTaskGroupDto.builder()
                .id(entity.getId())
                .productionInstallationId(entity.getProductionInstallation() != null ? entity.getProductionInstallation().getId() : null)
                .groupTitle(entity.getGroupTitle())
                .groupDescription(entity.getGroupDescription())
                .sortOrder(entity.getSortOrder())
                .isExpanded(entity.getIsExpanded())
                .createdByUserId(entity.getCreatedByUser() != null ? entity.getCreatedByUser().getId() : null)
                .createdByUserName(entity.getCreatedByUser() != null ? entity.getCreatedByUser().getName() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .tasks(taskDtos)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .build();
    }
}
