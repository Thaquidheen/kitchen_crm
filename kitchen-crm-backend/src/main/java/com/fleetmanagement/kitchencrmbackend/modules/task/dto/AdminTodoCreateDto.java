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
public class AdminTodoCreateDto {

    @NotBlank(message = "Todo title is required")
    private String todoTitle;

    private String todoDescription;

    @NotNull(message = "Todo date is required")
    private LocalDate todoDate;

    private String notes;

    private String priority = "MEDIUM";

    private String category;
}




