package com.fleetmanagement.kitchencrmbackend.modules.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

/** One task for several staff - the service creates one EmployeeTask row per id. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTaskBulkCreateDto {

    @NotEmpty(message = "Pick at least one staff member")
    private List<Long> employeeIds;

    @NotBlank(message = "Task title is required")
    private String taskTitle;

    private String taskDescription;

    @NotNull(message = "Due date is required")
    private LocalDate taskDate;

    private String notes;

    private String priority = "MEDIUM";
}
