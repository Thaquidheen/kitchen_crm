package com.fleetmanagement.kitchencrmbackend.modules.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTaskCreateDto {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotBlank(message = "Task title is required")
    private String taskTitle;

    private String taskDescription;

    @NotNull(message = "Task date is required")
    private LocalDate taskDate;

    private String notes;

    private String priority = "MEDIUM";

    private String status = "PENDING";
}




