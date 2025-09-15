package com.fleetmanagement.kitchencrmbackend.modules.project.dto;

import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDto {

    private Long id;

    @NotNull(message = "Customer ID is required")
    private Long customerId;
    private String customerName;

    private Long quotationId;
    private String quotationNumber;

    @NotBlank(message = "Project name is required")
    private String projectName;

    private BigDecimal totalAmount;
    private BigDecimal totalTaxAmount;
    private BigDecimal cashInHand;
    private BigDecimal cashInAccount;
    private BigDecimal balanceAmount;
    private BigDecimal receivedAmountTotal;
    private BigDecimal totalExpense;

    @NotNull(message = "Project status is required")
    private CustomerProject.ProjectStatus status;

    private LocalDate startDate;
    private LocalDate expectedCompletionDate;
    private LocalDate actualCompletionDate;
    private String projectDescription;
    private String createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}