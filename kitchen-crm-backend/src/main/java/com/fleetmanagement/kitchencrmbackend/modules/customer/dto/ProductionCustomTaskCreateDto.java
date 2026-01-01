package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductionCustomTaskCreateDto {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotBlank(message = "Task title is required")
    private String taskTitle;

    private String taskDescription;

    private String phase; // PRODUCTION, SITE_PREPARATION, DELIVERY, INSTALLATION, COMPLETION, CUSTOM

    private String priority; // LOW, MEDIUM, HIGH, URGENT

    private Integer sortOrder;

    private String notes;

    private Long taskGroupId;
}
