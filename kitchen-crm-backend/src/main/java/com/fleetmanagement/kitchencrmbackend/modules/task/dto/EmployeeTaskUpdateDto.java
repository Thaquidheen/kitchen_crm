package com.fleetmanagement.kitchencrmbackend.modules.task.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTaskUpdateDto {

    private String taskTitle;

    private String taskDescription;

    private LocalDate taskDate;

    private String notes;

    private String priority;

    private String status;
}




