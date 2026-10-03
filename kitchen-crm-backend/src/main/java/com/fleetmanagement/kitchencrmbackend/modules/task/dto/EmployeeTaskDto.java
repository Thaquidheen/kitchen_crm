package com.fleetmanagement.kitchencrmbackend.modules.task.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
    private LocalDateTime acknowledgedAt;
    private LocalDateTime completionSeenAt;
    /** Open and past its date (business timezone). */
    private Boolean overdue;
    /** Open and not yet acknowledged by the assignee - shows as "New" in their list and bell. */
    private Boolean newForAssignee;
    /** The reply thread, oldest first. */
    private List<EmployeeTaskReplyDto> replies;
    private Integer replyCount;
    /** Assignee replies the assigner has not read yet. */
    private Integer unreadForAssigner;
    /** Assigner replies the assignee has not read yet. */
    private Integer unreadForAssignee;
    private LocalDateTime lastReplyAt;
}




