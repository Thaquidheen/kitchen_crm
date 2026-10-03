package com.fleetmanagement.kitchencrmbackend.modules.task.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTaskReplyDto {
    private Long id;
    private Long authorUserId;
    private String authorName;
    /** true = the assignee (staff) wrote it, false = the assigner (admin). */
    private Boolean fromAssignee;
    private String message;
    private LocalDateTime createdAt;
}
