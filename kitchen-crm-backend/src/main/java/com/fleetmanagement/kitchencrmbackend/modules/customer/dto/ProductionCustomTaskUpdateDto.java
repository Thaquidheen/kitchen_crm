package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductionCustomTaskUpdateDto {

    private String taskTitle;

    private String taskDescription;

    private String phase;

    private Boolean completed;

    private LocalDate completionDate;

    private String priority;

    private Integer sortOrder;

    private String notes;
}
