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
public class AdminTodoUpdateDto {

    private String todoTitle;

    private String todoDescription;

    private LocalDate todoDate;

    private String notes;

    private String priority;

    private String category;
}




