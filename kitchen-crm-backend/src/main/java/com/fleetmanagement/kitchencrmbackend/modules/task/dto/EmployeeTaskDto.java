package com.fleetmanagement.kitchencrmbackend.modules.task.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTaskDto {
    private Long id;
    private Long assignedToUserId;
    private String assignedToUserName;
    private Long assignedByUserId;
    private String assignedByName;
    private String taskTitle;
    private String taskDescription;
    private LocalDate taskDate;
    private Boolean completed;
    private LocalDateTime completedAt;
    private String notes;
    private String priority;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}




