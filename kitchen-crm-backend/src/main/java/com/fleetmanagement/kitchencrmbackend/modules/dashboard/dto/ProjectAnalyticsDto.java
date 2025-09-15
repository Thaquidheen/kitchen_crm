package com.fleetmanagement.kitchencrmbackend.modules.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectAnalyticsDto {

    // Project Status Distribution
    private Map<String, Long> projectStatusDistribution;

    // Project Timeline Analysis
    private List<ProjectTimelineDto> projectTimelines;

    // Installation Progress
    private Map<String, Long> installationStatusDistribution;

    // Team Performance
    private List<TeamPerformanceDto> teamPerformance;

    // Project Size Analysis
    private Map<String, Object> projectSizeAnalysis;

    // Bottleneck Analysis
    private List<BottleneckDto> bottlenecks;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectTimelineDto {
        private String projectName;
        private String customerName;
        private Integer estimatedDays;
        private Integer actualDays;
        private String status;
        private BigDecimal projectValue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamPerformanceDto {
        private String teamMember;
        private String role;
        private Integer activeProjects;
        private Integer completedProjects;
        private Double averageCompletionTime;
        private Double efficiency;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BottleneckDto {
        private String stage;
        private Long projectsStuck;
        private Double averageStuckTime; // Days
        private String recommendation;
    }
}