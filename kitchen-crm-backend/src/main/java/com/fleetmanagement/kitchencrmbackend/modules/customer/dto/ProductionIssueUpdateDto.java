package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionIssue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionIssueUpdateDto {
    private String title;
    private String description;
    private ProductionIssue.IssueCategory category;
    private ProductionIssue.IssuePriority priority;
    private ProductionIssue.IssueStatus status;
    private String assignedTo;
    private String resolution;
}
