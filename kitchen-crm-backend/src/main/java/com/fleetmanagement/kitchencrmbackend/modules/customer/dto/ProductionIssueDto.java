package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionIssue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionIssueDto {
    private Long id;
    private Long productionInstallationId;
    private Long customerId;
    private String customerName;
    private String title;
    private String description;
    private ProductionIssue.IssueCategory category;
    private ProductionIssue.IssuePriority priority;
    private ProductionIssue.IssueStatus status;
    private String reportedBy;
    private String assignedTo;
    private String resolution;
    private LocalDateTime resolvedAt;
    private String resolvedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
