package com.fleetmanagement.kitchencrmbackend.modules.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class ProjectCreateDto {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private Long quotationId;

    @NotBlank(message = "Project name is required")
    private String projectName;

    private BigDecimal totalAmount;
    private BigDecimal totalTaxAmount;
    private LocalDate startDate;
    private LocalDate expectedCompletionDate;
    private String projectDescription;
}