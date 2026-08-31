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
    /** Null when this group IS a stage; set when it is a sub-stage. */
    private Long parentGroupId;
    /** Sub-stages nested beneath this stage, each with their own tasks and counts. */
    private List<ProductionTaskGroupDto> subGroups;
    /**
     * Counts INCLUDE everything in the sub-stages, so "Stage 2 — 4/12" stays the honest total for
     * the whole stage rather than only the tasks pinned directly to it.
     */
    private Integer totalTasks;
    private Integer completedTasks;
    /** Just this group's own tasks, so a stage can show its direct work separately if wanted. */
    private Integer ownTotalTasks;
    private Integer ownCompletedTasks;

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

        // Sub-stages are mapped first so their totals can roll up into this group's.
        List<ProductionTaskGroupDto> subGroupDtos = null;
        if (entity.getSubGroups() != null && !entity.getSubGroups().isEmpty()) {
            subGroupDtos = entity.getSubGroups().stream()
                    .map(ProductionTaskGroupDto::fromEntity)
                    .collect(Collectors.toList());
        }

        int ownTotal = totalTasks;
        int ownCompleted = completedTasks;
        if (subGroupDtos != null) {
            for (ProductionTaskGroupDto sub : subGroupDtos) {
                totalTasks += sub.getTotalTasks() != null ? sub.getTotalTasks() : 0;
                completedTasks += sub.getCompletedTasks() != null ? sub.getCompletedTasks() : 0;
            }
        }

        return ProductionTaskGroupDto.builder()
                .id(entity.getId())
                .parentGroupId(entity.getParentGroup() != null ? entity.getParentGroup().getId() : null)
                .subGroups(subGroupDtos)
                .ownTotalTasks(ownTotal)
                .ownCompletedTasks(ownCompleted)
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
