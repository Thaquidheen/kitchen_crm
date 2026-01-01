package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionIssue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionIssueCreateDto {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Category is required")
    private ProductionIssue.IssueCategory category;

    @NotNull(message = "Priority is required")
    private ProductionIssue.IssuePriority priority;

    private String assignedTo;
}
