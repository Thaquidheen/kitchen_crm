package com.fleetmanagement.kitchencrmbackend.modules.task.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaskCompletionStatsDto {
    private LocalDate fromDate;
    private LocalDate toDate;
    private Long totalTasks;
    private Long completedTasks;
    private Long pendingTasks;
    private Double completionRate;
    private Map<String, Long> tasksByEmployee;
    private Map<String, Long> tasksByDate;
    private Map<String, Long> tasksByPriority;
    private Map<String, Long> tasksByStatus;
    private List<EmployeeTaskStatsDto> employeeStats;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeTaskStatsDto {
        private Long employeeId;
        private String employeeName;
        private Long totalTasks;
        private Long completedTasks;
        private Long pendingTasks;
        private Double completionRate;
    }
}




