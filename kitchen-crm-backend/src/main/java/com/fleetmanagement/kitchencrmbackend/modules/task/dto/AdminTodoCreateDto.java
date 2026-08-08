package com.fleetmanagement.kitchencrmbackend.modules.task.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminTodoCreateDto {

    @NotBlank(message = "Todo title is required")
    private String todoTitle;

    private String todoDescription;

    // Optional: an undated to-do is a plain checklist item and never reaches the bell.
    private LocalDate todoDate;

    private String notes;

    private String priority = "MEDIUM";

    private String category;
}




