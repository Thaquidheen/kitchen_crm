package com.fleetmanagement.kitchencrmbackend.modules.project.dto;

import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSummaryDto {

    private Long id;
    private String projectName;
    private Long customerId;
    private String customerName;
    private BigDecimal totalAmount;
    private BigDecimal balanceAmount;
    private CustomerProject.ProjectStatus status;
    private LocalDate startDate;
    private LocalDate expectedCompletionDate;
    private String createdBy;
}