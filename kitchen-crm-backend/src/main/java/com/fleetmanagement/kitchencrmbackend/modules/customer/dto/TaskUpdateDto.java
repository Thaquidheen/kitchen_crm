package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

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
public class TaskUpdateDto {

    @NotBlank(message = "Task name is required")
    private String taskName;

    @NotNull(message = "Completion status is required")
    private Boolean completed;

    private LocalDate completionDate;
    private String notes;
}