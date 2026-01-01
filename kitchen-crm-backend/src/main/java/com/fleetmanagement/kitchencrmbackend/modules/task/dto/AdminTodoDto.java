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
public class AdminTodoDto {
    private Long id;
    private Long userId;
    private String userName;
    private String todoTitle;
    private String todoDescription;
    private LocalDate todoDate;
    private Boolean completed;
    private LocalDateTime completedAt;
    private String notes;
    private String priority;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}




